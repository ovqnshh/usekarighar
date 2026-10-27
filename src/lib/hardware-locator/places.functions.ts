import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export interface GooglePlaceResult {
  id: string;
  displayName: { text: string; languageCode?: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  googleMapsUri: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  businessStatus: string;
  rating?: number;
  userRatingCount?: number;
  distanceMeters?: number;
  distanceKm?: string;
  openStatusText?: string;
  isPartner?: boolean;
  partnerDiscountPct?: number;
}

export const PLACES_API_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.nationalPhoneNumber",
  "places.regularOpeningHours",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
].join(",");

export const HARDWARE_CATEGORY_QUERIES: Record<string, string> = {
  all: "hardware store",
  plumbing: "plumbing and sanitary hardware shop",
  electrical: "electrical goods shop",
  carpentry: "plywood and hardware store",
  paint: "paint and waterproofing shop",
  waterproofing: "waterproofing chemicals and materials shop",
};

// Default fallback reference coordinates: Mumbai (Andheri West)
export const DEFAULT_MUMBAI_LOCATION = {
  lat: 19.1363,
  lng: 72.8277,
  label: "Andheri West, Mumbai",
};

/**
 * Computes Great-Circle Distance (Haversine formula) in meters between two coordinates
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes human-readable open/closed status in IST
 * If Google doesn't return opening hours, displays "Hours not listed". Never guesses.
 */
export function computeOpenStatus(hours?: { openNow?: boolean }): {
  text: string;
  isOpen: boolean | null;
} {
  if (!hours || hours.openNow === undefined) {
    return { text: "Hours not listed", isOpen: null };
  }
  return hours.openNow ? { text: "Open now", isOpen: true } : { text: "Closed", isOpen: false };
}

// Short in-memory server cache (5 minutes TTL, compliant with Google Maps caching policy)
export interface SearchStoresResponse {
  ok: boolean;
  stores?: GooglePlaceResult[];
  totalCount?: number;
  searchedLocation?: { lat: number; lng: number };
  error?: string;
}

interface CacheEntry {
  timestamp: number;
  data: SearchStoresResponse;
}
const SEARCH_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface SearchStoresInput {
  lat?: number;
  lng?: number;
  localityQuery?: string;
  category?: string;
  radiusMeters?: number;
}

/**
 * Server function to query Google Places API (New) searchText
 * HARD RULE: No mock stores, strict field mask, partner badge only with database row
 */
export async function searchStoresCore(input: SearchStoresInput): Promise<SearchStoresResponse> {
  const serverKey =
    process.env.GOOGLE_PLACES_SERVER_KEY ||
    process.env.GOOGLE_MAPS_SERVER_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  if (!serverKey) {
    return {
      ok: false,
      error:
        "Google Places API key is not configured. Please set GOOGLE_PLACES_SERVER_KEY in your environment variables to view live operational stores.",
    };
  }

  const lat = input.lat || DEFAULT_MUMBAI_LOCATION.lat;
  const lng = input.lng || DEFAULT_MUMBAI_LOCATION.lng;
  const radius = Math.min(input.radiusMeters || 5000, 20000); // 5km default, max 20km

  const categoryKey = input.category || "all";
  const categoryText = HARDWARE_CATEGORY_QUERIES[categoryKey] || HARDWARE_CATEGORY_QUERIES.all;
  const textQuery = input.localityQuery
    ? `${categoryText} near ${input.localityQuery}`
    : categoryText;

  // 1. Cost & Abuse Control: Check short server-side cache
  const cacheKey = `${lat.toFixed(3)}:${lng.toFixed(3)}:${categoryKey}:${radius}:${(input.localityQuery || "").trim().toLowerCase()}`;
  const cached = SEARCH_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": serverKey,
        "X-Goog-FieldMask": PLACES_API_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radius,
          },
        },
        maxResultCount: 20,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[searchStores] Google Places API HTTP error:", response.status, errText);
      return {
        ok: false,
        error: `Google Places API returned status ${response.status}. Please check API permissions and billing.`,
      };
    }

    const data = (await response.json()) as { places?: GooglePlaceResult[] };
    const rawPlaces: GooglePlaceResult[] = data.places || [];

    // Filter out places that are not OPERATIONAL
    const operational = rawPlaces.filter(
      (p) => !p.businessStatus || p.businessStatus === "OPERATIONAL",
    );

    if (operational.length === 0) {
      const emptyResult = { ok: true, stores: [], totalCount: 0 };
      SEARCH_CACHE.set(cacheKey, { timestamp: Date.now(), data: emptyResult });
      return emptyResult;
    }

    // Check store_partners database table for legitimate partners
    const placeIds = operational.map((p) => p.id);
    const partnerMap = new Map<string, { is_partner: boolean; partner_discount_pct: number }>();

    try {
      const dbClient = supabase as unknown as {
        from: (t: string) => {
          select: (cols: string) => {
            in: (
              col: string,
              vals: string[],
            ) => {
              eq: (col: string, val: boolean) => Promise<{ data?: unknown; error?: unknown }>;
            };
          };
        };
      };

      const { data: partnerRows } = await dbClient
        .from("store_partners")
        .select("google_place_id, is_partner, partner_discount_pct")
        .in("google_place_id", placeIds)
        .eq("is_partner", true);

      if (partnerRows && Array.isArray(partnerRows)) {
        (
          partnerRows as Array<{
            google_place_id: string;
            is_partner: boolean;
            partner_discount_pct: number;
          }>
        ).forEach((r) => partnerMap.set(r.google_place_id, r));
      }
    } catch (e) {
      // Table may not have rows yet or offline; partners default to false
      console.warn("[searchStores] Partner check warning:", e);
    }

    // Process and sort stores by distance from user location
    const stores: GooglePlaceResult[] = operational.map((p) => {
      const pLat = p.location?.latitude || lat;
      const pLng = p.location?.longitude || lng;
      const distMeters = calculateHaversineDistanceMeters(lat, lng, pLat, pLng);
      const distKm =
        distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${distMeters} m`;

      const partner = partnerMap.get(p.id);
      const openStatus = computeOpenStatus(p.regularOpeningHours);

      return {
        id: p.id,
        displayName: p.displayName || { text: "Hardware Store" },
        formattedAddress: p.formattedAddress || "",
        location: { latitude: pLat, longitude: pLng },
        googleMapsUri:
          p.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName?.text || "")}&query_place_id=${p.id}`,
        nationalPhoneNumber: p.nationalPhoneNumber,
        regularOpeningHours: p.regularOpeningHours,
        businessStatus: p.businessStatus || "OPERATIONAL",
        rating: p.rating,
        userRatingCount: p.userRatingCount,
        distanceMeters: distMeters,
        distanceKm: distKm,
        openStatusText: openStatus.text,
        isPartner: partner?.is_partner || false,
        partnerDiscountPct: partner?.partner_discount_pct || 0,
      };
    });

    // Sort ascending by distance
    stores.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));

    const finalResult = {
      ok: true,
      stores,
      totalCount: stores.length,
      searchedLocation: { lat, lng },
    };

    // Store in short cache
    SEARCH_CACHE.set(cacheKey, { timestamp: Date.now(), data: finalResult });

    return finalResult;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    console.error("[searchStores] Failed to fetch Google Places:", err);
    return {
      ok: false,
      error: `Failed to connect to Google Places: ${errorMsg}`,
    };
  }
}

export const searchStoresServerFn = createServerFn({ method: "POST" })
  .validator((data: SearchStoresInput) => data)
  .handler(async ({ data }) => {
    return searchStoresCore(data);
  });

/**
 * Server function to report an inaccurate hardware store
 */
export const reportStore = createServerFn({ method: "POST" })
  .validator(
    (data: {
      googlePlaceId: string;
      reason:
        "wrong_number" | "permanently_closed" | "not_a_hardware_store" | "overcharging" | "other";
      details?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    try {
      const { error } = await (
        supabase as unknown as {
          from: (t: string) => { insert: (d: unknown) => Promise<{ error?: { message: string } }> };
        }
      )
        .from("store_reports")
        .insert({
          google_place_id: data.googlePlaceId,
          reason: data.reason,
          details: data.details || "",
        });

      if (error) throw new Error(error.message);
      return { ok: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Reporting error";
      console.error("[reportStore] Error:", err);
      return { ok: false, error: errorMsg };
    }
  });

export const reportStoreListing = reportStore;
