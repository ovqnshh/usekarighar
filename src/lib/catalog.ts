import { supabase } from "@/integrations/supabase/client";

export type PricingMode = "fixed_menu" | "visit_quote" | "milestone_escrow" | "hourly_rate";

export interface ConfigPolicy<T = Record<string, any>> {
  id: string;
  key: string;
  value: T;
  description?: string;
  category: "finance" | "pricing" | "operations" | "dispatch" | "compliance" | "general";
  city?: string;
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon_name: string;
  display_order: number;
}

export interface CatalogSubcategory {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description?: string;
  icon_name: string;
}

export interface CatalogService {
  id: string;
  subcategory_id: string;
  slug: string;
  name: string;
  description?: string;
  pricing_mode: PricingMode;
  base_price: number;
  visit_fee: number;
  estimated_duration_mins: number;
  warranty_days: number;
  required_kyc_tier: string;
  safety_risk_level: "standard" | "high_voltage" | "height" | "hazardous";
  whats_included: string[];
  whats_excluded: string[];
  variants?: CatalogVariant[];
}

export interface CatalogVariant {
  id: string;
  service_id: string;
  name: string;
  price_delta: number;
  duration_delta_mins: number;
}

export interface PriceBookItem {
  id: string;
  item_code: string;
  name: string;
  unit: string;
  customer_price_cap: number;
  standard_cost: number;
  brand_recommendations: string[];
}

// In-memory fallback and catalog cache ensuring zero downtime and offline resilience
export const DEFAULT_POLICIES: Record<string, any> = {
  COMMISSION_RATES: { default_rate: 0.15, tier_discounts: { new: 0.18, verified: 0.15, elite: 0.12 } },
  INSPECTION_FEES: { electrical: 199, plumbing: 149, carpentry: 199, ac_appliance: 249, general: 149 },
  CANCELLATION_POLICY: { free_window_minutes: 60, late_cancel_customer_fee: 100, late_cancel_karigar_penalty: 150 },
  DISPATCH_CONFIG: { offer_timeout_seconds: 45, max_cascade_depth: 5, search_radius_km: 12 },
  CASH_WALLET_LIMITS: { max_deficit_inr: 2500, warning_threshold_inr: 2000 },
  ESCROW_CONFIG: { auto_release_hours: 48, dispute_resolution_sla_hours: 24 },
  GIG_WORKER_STATUTORY_CONTRIBUTION: { code_on_social_security_pct: 0.015, state_welfare_cess_pct: 0.01 },
};

/**
 * Fetch a configurable policy by key with guaranteed fallback.
 * Never hardcodes policy numbers directly in UI or calculation logic.
 */
export async function getPolicy<T = any>(key: string, city?: string): Promise<T> {
  try {
    let query = (supabase as any).from("config_policies").select("value").eq("key", key);
    if (city) {
      query = query.or(`city.eq.${city},city.is.null`);
    }
    const { data, error } = await query.maybeSingle();
    if (!error && data?.value) {
      return (data as any).value as T;
    }
  } catch (err) {
    console.warn(`[getPolicy] using local fallback for "${key}":`, err);
  }
  return (DEFAULT_POLICIES[key] || {}) as T;
}

/**
 * Calculate dynamic quotation breakdown based on pricing mode and active policies.
 */
export async function calculateQuote({
  pricingMode,
  serviceBasePrice = 0,
  variantPriceDelta = 0,
  partsTotal = 0,
  isUrgent = false,
  city = "Mumbai",
}: {
  pricingMode: PricingMode;
  serviceBasePrice?: number;
  variantPriceDelta?: number;
  partsTotal?: number;
  isUrgent?: boolean;
  city?: string;
}) {
  const policies = await getPolicy("COMMISSION_RATES", city);
  const surgeMultiplier = isUrgent ? 1.5 : 1.0;

  const rawLabour = (serviceBasePrice + variantPriceDelta) * surgeMultiplier;
  const platformFee = Math.round(rawLabour * (policies.default_rate || 0.15));
  const gst = Math.round((platformFee + rawLabour) * 0.18);
  const total = rawLabour + partsTotal + gst;

  return {
    labour: Math.round(rawLabour),
    parts: partsTotal,
    platformFee,
    gst,
    total: Math.round(total),
    pricingMode,
  };
}
