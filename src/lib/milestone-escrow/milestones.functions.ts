import {
  createEscrowDepositPostings,
  createEscrowReleasePostings,
  validateBalancedTransaction,
} from "../ledger/ledger-engine";

export interface RenovationMilestone {
  id: string;
  projectId: string;
  stageOrder: number;
  title: string;
  scopeDescription: string;
  amountPaise: number;
  status:
    | "PENDING_FUNDING"
    | "FUNDED_ESCROW"
    | "IN_PROGRESS"
    | "SUBMITTED_FOR_APPROVAL"
    | "APPROVED_RELEASED"
    | "DISPUTED";
  escrowFundedAt?: string;
  workCompletedPhotoUrl?: string;
  releaseOtp?: string;
  releasedAt?: string;
}

export const STANDARD_RENOVATION_STAGES = [
  {
    stageOrder: 1,
    title: "Stage 1: Demolition & Concealed Plumbing Routing",
    scopeDescription: "Removal of old tiles, wall grooving, laying Astral CPVC SDR-11 hot/cold pressure pipelines.",
    pct: 30,
  },
  {
    stageOrder: 2,
    title: "Stage 2: Double-Coat Waterproofing & Slab Curing",
    scopeDescription: "2-coat Dr. Fixit Fastflex application, 48-hour flood ponding test, zero dampness signoff.",
    pct: 25,
  },
  {
    stageOrder: 3,
    title: "Stage 3: Vitrified Floor/Wall Tiling & Laser Grouting",
    scopeDescription: "Precision spirit-level tiling with Roff epoxy non-porous grout joints.",
    pct: 25,
  },
  {
    stageOrder: 4,
    title: "Stage 4: Concealed Diverters, Sanitary Ware & Final Snag List",
    scopeDescription: "Fitting chrome diverters, basin, wall-hung WC, lighting, and final cleanup.",
    pct: 20,
  },
];

/**
 * Feature 8 Core: Split a high-ticket renovation budget into structured escrow milestones
 */
export function createRenovationMilestonesCore(
  projectId: string,
  totalBudgetPaise: number
): RenovationMilestone[] {
  if (totalBudgetPaise < 2500000) {
    throw new Error("Milestone Escrow requires a contract value of at least ₹25,000 (2,500,000 paise).");
  }

  return STANDARD_RENOVATION_STAGES.map((s) => ({
    id: `ms-${projectId}-${s.stageOrder}`,
    projectId,
    stageOrder: s.stageOrder,
    title: s.title,
    scopeDescription: s.scopeDescription,
    amountPaise: Math.round((totalBudgetPaise * s.pct) / 100),
    status: s.stageOrder === 1 ? "FUNDED_ESCROW" : "PENDING_FUNDING",
    escrowFundedAt: s.stageOrder === 1 ? new Date().toISOString() : undefined,
    releaseOtp: s.stageOrder === 1 ? "849201" : undefined,
  }));
}

/**
 * Feature 8: Release a completed milestone after customer OTP verification & ledger accounting
 */
export function releaseMilestoneEscrowCore(params: {
  milestone: RenovationMilestone;
  enteredOtp: string;
  proWalletId: string;
  customerId: string;
}): {
  success: boolean;
  updatedMilestone: RenovationMilestone;
  ledgerPostings: ReturnType<typeof createEscrowReleasePostings>;
} {
  if (params.milestone.status === "APPROVED_RELEASED") {
    throw new Error("Milestone has already been released.");
  }

  if (params.milestone.status !== "FUNDED_ESCROW" && params.milestone.status !== "SUBMITTED_FOR_APPROVAL") {
    throw new Error(`Cannot release milestone in '${params.milestone.status}' state. Must be funded in escrow first.`);
  }

  if (params.milestone.releaseOtp && params.milestone.releaseOtp !== params.enteredOtp.trim()) {
    throw new Error("Invalid release OTP. Customer must approve with verified 6-digit code.");
  }

  // 1. Calculate double-entry ledger postings via Phase 0 Ledger Engine
  const ledgerPostings = createEscrowReleasePostings({
    projectId: params.milestone.projectId,
    totalPaise: params.milestone.amountPaise,
    proCommissionPct: 0.1, // 10% fee
  });

  // Verify balanced transaction: debits == credits
  validateBalancedTransaction(ledgerPostings);

  const updatedMilestone: RenovationMilestone = {
    ...params.milestone,
    status: "APPROVED_RELEASED",
    releasedAt: new Date().toISOString(),
  };

  return {
    success: true,
    updatedMilestone,
    ledgerPostings,
  };
}
