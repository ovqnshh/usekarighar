export interface PpeCheckResult {
  passed: boolean;
  trade: string;
  requiredGear: string[];
  detectedItems: string[];
  missingItems: string[];
  safetyAdvisory: string;
  auditPassCode: string;
}

const TRADE_PPE_REQUIREMENTS: Record<string, string[]> = {
  electrical: [
    "1000V Insulated Rubber Gloves",
    "Digital Multimeter or Neon Tester",
    "Insulated Screwdrivers",
    "Safety Footwear (Rubber Sole)",
  ],
  plumbing: [
    "Pipe Wrench & Teflon Roll",
    "Waterproof Work Gloves",
    "Anti-Slip Safety Shoes",
  ],
  waterproofing: [
    "Polymer Chemical Respirator / Mask",
    "Chemical Resistant Nitrile Gloves",
    "Safety Goggles",
  ],
  carpentry: [
    "Eye Protection Goggles",
    "Dust Mask (N95)",
    "Measuring Tape & Spirit Level",
  ],
  ac_service: [
    "High-Pressure Jet Gun & Foam Cleaner",
    "Manifold Pressure Gauge",
    "Insulated Safety Shoes",
  ],
};

/**
 * Feature 10 Core: Verify technician safety equipment & PPE compliance before job start
 */
export function verifyPpeComplianceCore(params: {
  trade: string;
  declaredItems: string[];
}): PpeCheckResult {
  const normTrade = params.trade.toLowerCase().replace(/[^a-z]/g, "");
  const tradeKey = Object.keys(TRADE_PPE_REQUIREMENTS).find((k) => normTrade.includes(k)) || "electrical";
  const required = TRADE_PPE_REQUIREMENTS[tradeKey];

  const declared = params.declaredItems.map((i) => i.toLowerCase());
  const detected: string[] = [];
  const missing: string[] = [];

  for (const item of required) {
    const itemTokens = item.toLowerCase().split(" ");
    const isDeclared = declared.some((d) => itemTokens.some((t) => t.length > 3 && d.includes(t)));
    if (isDeclared) {
      detected.push(item);
    } else {
      missing.push(item);
    }
  }

  // Pass if at least 50% of required critical safety equipment is present
  const passed = missing.length <= Math.floor(required.length / 2);

  return {
    passed,
    trade: params.trade,
    requiredGear: required,
    detectedItems: detected,
    missingItems: missing,
    safetyAdvisory: passed
      ? "Safety compliance verified. Technician cleared to proceed with Start-OTP."
      : `Safety alert: Critical gear missing (${missing.join(", ")}). Must equip required safety tools before working on live services.`,
    auditPassCode: `PPE-${Date.now().toString(36).toUpperCase()}`,
  };
}
