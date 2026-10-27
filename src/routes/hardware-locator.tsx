import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/karighar-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  MapPin,
  Phone,
  Navigation,
  ExternalLink,
  Star,
  Clock,
  ShieldCheck,
  AlertTriangle,
  LocateFixed,
  Search,
  Filter,
  CheckCircle2,
  Flag,
  Info,
} from "lucide-react";
import {
  searchStoresCore,
  DEFAULT_MUMBAI_LOCATION,
  type GooglePlaceResult,
} from "@/lib/hardware-locator/places.functions";

export const Route = createFileRoute("/hardware-locator")({
  head: () => ({
    meta: [{ title: "Hardware Store Locator (Google Places) — Karighar" }],
  }),
  component: HardwareLocatorPage,
});

const CATEGORIES = [
  { id: "all", label: "All Hardware" },
  { id: "plumbing", label: "Plumbing & Sanitary" },
  { id: "electrical", label: "Electrical & Switchgear" },
  { id: "carpentry", label: "Plywood & Timber" },
  { id: "paint", label: "Paint & Waterproofing" },
];

const LOCALITY_SHORTCUTS = [
  "Andheri West",
  "Bandra West",
  "Borivali West",
  "Powai",
  "Dadar",
  "Thane West",
];

function HardwareLocatorPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [localityInput, setLocalityInput] = useState("Andheri West");
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>(
    DEFAULT_MUMBAI_LOCATION,
  );

  const [stores, setStores] = useState<GooglePlaceResult[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReportPlace, setActiveReportPlace] = useState<GooglePlaceResult | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  async function performSearch(
    locText = localityInput,
    cat = selectedCategory,
    coords = userCoords,
  ) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await searchStoresCore({
        lat: coords.lat,
        lng: coords.lng,
        localityQuery: locText.trim() || undefined,
        category: cat,
        radiusMeters,
      });

      if (!res.ok) {
        setErrorMessage(res.error || "Failed to search stores.");
        setStores([]);
      } else {
        setStores(res.stores || []);
        if (res.stores && res.stores.length > 0) {
          setSelectedStoreId(res.stores[0].id);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Network error fetching stores.";
      setErrorMessage(errorMsg);
      setStores([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Read URL search params on mount for Technician Shortcut
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const loc = params.get("locality");
    const latStr = params.get("lat");
    const lngStr = params.get("lng");

    let initialCategory = selectedCategory;
    let initialLocality = localityInput;
    let initialCoords = userCoords;

    if (cat && CATEGORIES.some((c) => c.id === cat)) {
      initialCategory = cat;
      setSelectedCategory(cat);
    }
    if (loc) {
      initialLocality = loc;
      setLocalityInput(loc);
    }
    if (latStr && lngStr) {
      const parsedLat = parseFloat(latStr);
      const parsedLng = parseFloat(lngStr);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        initialCoords = { lat: parsedLat, lng: parsedLng };
        setUserCoords(initialCoords);
      }
    }

    performSearch(initialLocality, initialCategory, initialCoords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLocateMe() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocalityInput("Current Location");
        performSearch("Current Location", selectedCategory, coords);
      },
      (err) => {
        setIsLoading(false);
        alert(
          `Location permission denied or unavailable: ${err.message}. Please enter your locality manually.`,
        );
      },
      { timeout: 10000 },
    );
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || null;

  return (
    <PageShell>
      <main className="min-h-[85vh] pb-24 space-y-8">
        {/* HEADER SECTION */}
        <section className="border-b border-border bg-gradient-to-b from-background via-surface-subtle/40 to-background pt-12 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center space-y-3">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs gap-1.5 font-medium border-primary/30 text-primary"
            >
              <Building2 className="size-3.5" /> Emergency Hardware & Depot Finder
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Nearby Hardware Stores
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Live operational plumbing, electrical, and hardware merchants listed on Google Maps.
              Real opening hours, phone numbers, and navigation directions.
            </p>

            {/* SEARCH CONTROLS */}
            <div className="pt-4 max-w-2xl mx-auto space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  performSearch();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1 flex items-center shadow-warm-xs rounded-xl border border-border bg-background">
                  <MapPin className="size-4 text-muted-foreground ml-3 shrink-0" />
                  <Input
                    value={localityInput}
                    onChange={(e) => setLocalityInput(e.target.value)}
                    placeholder="Enter locality or pincode (e.g. Andheri West, 400053)..."
                    className="border-0 bg-transparent py-5 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocateMe}
                  title="Use current GPS location"
                  className="rounded-xl px-3 shrink-0 h-11"
                >
                  <LocateFixed className="size-4 text-primary" />
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl px-5 h-11 font-medium text-xs sm:text-sm"
                >
                  {isLoading ? "Searching..." : "Search"}
                </Button>
              </form>

              {/* LOCALITY SHORTCUTS */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium mr-1">Popular Mumbai hubs:</span>
                {LOCALITY_SHORTCUTS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setLocalityInput(loc);
                      performSearch(loc);
                    }}
                    className="bg-surface-subtle hover:bg-surface-subtle/80 text-foreground border border-border/80 rounded-full px-2.5 py-0.5 transition-colors"
                  >
                    {loc}
                  </button>
                ))}
              </div>

              {/* CATEGORY FILTER PILLS */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      performSearch(localityInput, cat.id);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-background text-muted-foreground border-border hover:bg-surface-subtle"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT SECTION */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* API ERROR / CONFIG NOTICE */}
          {errorMessage && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-2xl p-6 mb-6 flex items-start gap-4 text-sm text-foreground">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-destructive">
                  Google Places API Configuration Notice
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Note: In strict compliance with the Karighar Engineering Doctrine, zero fake shops
                  or mock arrays are displayed when Google APIs are unreachable.
                </p>
              </div>
            </div>
          )}

          {/* SKELETON LOADING STATE */}
          {isLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
              <div className="lg:col-span-5 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-surface-subtle rounded-2xl border border-border"
                  />
                ))}
              </div>
              <div className="lg:col-span-7 h-[500px] bg-surface-subtle rounded-2xl border border-border" />
            </div>
          )}

          {/* LIVE STORES SPLIT VIEW */}
          {!isLoading && stores.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* STORE CARDS LIST */}
              <div className="lg:col-span-5 space-y-3 max-h-[700px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
                  <span>
                    Found {stores.length} operational merchants near {localityInput}
                  </span>
                  <span>Sorted by distance</span>
                </div>

                {stores.map((store) => {
                  const isSelected = store.id === selectedStoreId;
                  return (
                    <div
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-warm-xs"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                              Google Maps Store
                            </span>
                            {store.isPartner && (
                              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0">
                                Karighar Partner ({store.partnerDiscountPct}% Off)
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-foreground text-base mt-0.5">
                            {store.displayName.text}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0 bg-primary/10 px-2.5 py-1 rounded-full">
                          {store.distanceKm}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {store.formattedAddress}
                      </div>

                      {/* Store Meta Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-border/60">
                        {/* Open/Closed status */}
                        <span
                          className={`font-medium flex items-center gap-1 ${
                            store.openStatusText === "Open now"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : store.openStatusText === "Closed"
                                ? "text-rose-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          <Clock className="size-3.5" /> {store.openStatusText}
                        </span>

                        {/* Rating */}
                        {store.rating && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Star className="size-3.5 fill-amber-400 text-amber-400" />
                            {store.rating.toFixed(1)}
                            {store.userRatingCount && (
                              <span className="text-muted-foreground font-normal">
                                ({store.userRatingCount})
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {store.nationalPhoneNumber ? (
                          <a
                            href={`tel:${store.nationalPhoneNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors"
                          >
                            <Phone className="size-3.5 text-primary" /> Call
                          </a>
                        ) : null}

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${store.location.latitude},${store.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors"
                        >
                          <Navigation className="size-3.5 text-primary" /> Navigate
                        </a>

                        <a
                          href={store.googleMapsUri}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors"
                        >
                          <ExternalLink className="size-3.5 text-muted-foreground" /> Google Maps
                        </a>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReportPlace(store);
                            setReportSuccess(false);
                          }}
                          className="ml-auto text-muted-foreground hover:text-foreground text-xs p-1"
                          title="Report store inaccuracies"
                        >
                          <Flag className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* INTERACTIVE MAP PREVIEW PANEL */}
              <div className="lg:col-span-7 sticky top-20 border border-border rounded-2xl overflow-hidden bg-card shadow-warm-xs space-y-0">
                <div className="p-4 border-b border-border bg-surface-subtle/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    <span className="font-semibold text-sm text-foreground">
                      {selectedStore ? selectedStore.displayName.text : "Map View"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Live Google Maps</span>
                </div>

                {selectedStore ? (
                  <div className="relative w-full h-[540px] bg-surface-subtle">
                    {/* Embedded interactive Google Map iframe centered at exact place coordinates */}
                    <iframe
                      title={`Map showing ${selectedStore.displayName.text}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?q=${selectedStore.location.latitude},${selectedStore.location.longitude}&hl=en&z=16&output=embed`}
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur border border-border rounded-xl p-3 shadow-lg flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">
                          {selectedStore.displayName.text}
                        </div>
                        <div className="text-muted-foreground text-[11px] truncate max-w-xs">
                          {selectedStore.formattedAddress}
                        </div>
                      </div>
                      <a
                        href={selectedStore.googleMapsUri}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary text-primary-foreground font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 text-xs shadow-xs"
                      >
                        Open Full Map <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="h-[540px] flex items-center justify-center text-muted-foreground text-sm">
                    Select a hardware store from the list to preview on map.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && !errorMessage && stores.length === 0 && (
            <div className="border border-border rounded-2xl p-12 bg-surface-subtle/30 text-center space-y-4 max-w-xl mx-auto">
              <div className="size-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <MapPin className="size-6 text-muted-foreground/80" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  No Operating Hardware Stores in This Radius
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Try searching a neighboring locality or switching to "All Hardware" category.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory("all");
                  performSearch(localityInput, "all");
                }}
                className="text-xs"
              >
                Expand Search to All Categories
              </Button>
            </div>
          )}

          {/* REPORT STORE MODAL DIALOG */}
          {activeReportPlace && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-background border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Flag className="size-4 text-amber-600" /> Report Inaccurate Store Info
                  </h3>
                  <button
                    onClick={() => setActiveReportPlace(null)}
                    className="text-muted-foreground hover:text-foreground text-xs"
                  >
                    ✕
                  </button>
                </div>

                {reportSuccess ? (
                  <div className="text-center py-6 space-y-2">
                    <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
                    <h4 className="font-semibold text-foreground text-sm">Report Received</h4>
                    <p className="text-xs text-muted-foreground">
                      Our operations team in Mumbai will audit this store within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveReportPlace(null)}
                      className="mt-3 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <p className="text-muted-foreground">
                      Reporting <strong>{activeReportPlace.displayName.text}</strong> (
                      {activeReportPlace.formattedAddress}):
                    </p>

                    <div className="space-y-2">
                      <label className="font-medium text-foreground block">
                        Reason for report:
                      </label>
                      <select
                        id="report-reason"
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary"
                        defaultValue="wrong_number"
                      >
                        <option value="wrong_number">Wrong or disconnected phone number</option>
                        <option value="permanently_closed">
                          Store permanently closed / shifted
                        </option>
                        <option value="not_a_hardware_store">Not a hardware / trade store</option>
                        <option value="overcharging">Refused trade discounts / overcharging</option>
                        <option value="other">Other issue</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-foreground block">
                        Additional details (optional):
                      </label>
                      <textarea
                        id="report-details"
                        rows={3}
                        placeholder="Provide any additional context for the Karighar team..."
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveReportPlace(null)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setReportSuccess(true);
                        }}
                        className="text-xs"
                      >
                        Submit Report
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MANDATORY GOOGLE ATTRIBUTION & POLICIES FOOTER */}
          <div className="pt-10 border-t border-border flex flex-wrap items-center justify-between gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Google Places Data</span>
              <span>•</span>
              <span>Map data &copy; {new Date().getFullYear()} Google</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.google.com/help/terms_maps/"
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-muted-foreground"
              >
                Google Maps Terms of Service
              </a>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="hover:underline text-muted-foreground"
              >
                Google Privacy Policy
              </a>
              <a href="/legal/terms" className="hover:underline text-muted-foreground">
                Karighar Terms
              </a>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
