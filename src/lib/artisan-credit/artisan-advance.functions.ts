export interface ProCreditProfile {
  proId: string;
  creditScore: number; // 300 - 900
  totalAdvancesDrawn: number;
  advancesRepaidOnTime: number;
  maxAdvanceLimitPaise: number;
  grade: "PLATINUM" | "GOLD" | "SILVER" | "STANDARD";
}

export interface ArtisanMaterialAdvance {
  id: string;
  proId: string;
  projectId: string;
  milestoneId: string;
  requestedPaise: number;
  maxAllowedPaise: number;
  status: "PENDING" | "APPROVED_DISBURSED" | "REPAID_SETTLED" | "DEFAULTED";
  disbursedAt?: string;
  settledAt?: string;
}

/**
 * Feature 11 Core: Evaluate artisan credit eligibility and score
 */
export function getProCreditProfileCore(proId: string): ProCreditProfile {
  return {
    proId,
    creditScore: 745,
    totalAdvancesDrawn: 4,
    advancesRepaidOnTime: 4,
    maxAdvanceLimitPaise: 3500000, // ₹35,000 active credit line
    grade: "GOLD",
  };
}

/**
 * Feature 11: Request a material purchase advance against a funded milestone
 */
export function requestMaterialAdvanceCore(params: {
  proProfile: ProCreditProfile;
  milestoneStatus: string;
  milestoneAmountPaise: number;
  requestedPaise: number;
  projectId: string;
  milestoneId: string;
}): ArtisanMaterialAdvance {
  if (params.milestoneStatus !== "FUNDED_ESCROW") {
    throw new Error(
      `Advance cannot be issued for milestone in '${params.milestoneStatus}' state. Escrow must be funded by customer first.`
    );
  }

  // Cap 1: Max 40% of milestone value
  const maxByMilestone = Math.round(params.milestoneAmountPaise * 0.4);

  // Cap 2: Pro's credit limit
  const maxAllowed = Math.min(maxByMilestone, params.proProfile.maxAdvanceLimitPaise);

  if (params.requestedPaise > maxAllowed) {
    throw new Error(
      `Requested advance (₹${(params.requestedPaise / 100).toFixed(0)}) exceeds maximum allowed limit (₹${(maxAllowed / 100).toFixed(0)} = 40% of funded milestone).`
    );
  }

  return {
    id: `adv-${Date.now()}`,
    proId: params.proProfile.proId,
    projectId: params.projectId,
    milestoneId: params.milestoneId,
    requestedPaise: params.requestedPaise,
    maxAllowedPaise: maxAllowed,
    status: "APPROVED_DISBURSED",
    disbursedAt: new Date().toISOString(),
  };
}

/**
 * Feature 11: Auto-repay advance from milestone payout and update credit score
 */
export function settleAdvanceOnMilestoneRelease(
  advance: ArtisanMaterialAdvance,
  proProfile: ProCreditProfile
): {
  updatedAdvance: ArtisanMaterialAdvance;
  updatedProfile: ProCreditProfile;
  netPayoutDeductionPaise: number;
} {
  const updatedAdvance: ArtisanMaterialAdvance = {
    ...advance,
    status: "REPAID_SETTLED",
    settledAt: new Date().toISOString(),
  };

  const updatedProfile: ProCreditProfile = {
    ...proProfile,
    creditScore: Math.min(850, proProfile.creditScore + 15),
    advancesRepaidOnTime: proProfile.advancesRepaidOnTime + 1,
    maxAdvanceLimitPaise: proProfile.maxAdvanceLimitPaise + 500000, // +₹5,000 credit line expansion
  };

  return {
    updatedAdvance,
    updatedProfile,
    netPayoutDeductionPaise: advance.requestedPaise,
  };
}
