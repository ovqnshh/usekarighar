/**
 * Double-Entry Accounting Ledger Engine (Part A5)
 * Pure money rules:
 * - Stored strictly in integer paise.
 * - Every business event writes balanced entries (Total Debits = Total Credits).
 */

export type LedgerAccount =
  | "CUSTOMER"
  | "ESCROW"
  | "PLATFORM_REVENUE"
  | "KARIGAR_WALLET"
  | "KARIGAR_ADVANCE"
  | "REFUNDS"
  | "PAYOUT_BANK";

export interface LedgerPosting {
  account: LedgerAccount;
  direction: "DEBIT" | "CREDIT";
  amountPaise: number;
  reason: string;
}

export interface BalancedTransaction {
  projectId?: string;
  milestoneId?: string;
  ref: string;
  postings: LedgerPosting[];
}

export class UnbalancedLedgerError extends Error {
  constructor(totalDebits: number, totalCredits: number, ref: string) {
    super(
      `Unbalanced ledger transaction for ref '${ref}': Total Debits (${totalDebits} paise) must equal Total Credits (${totalCredits} paise).`
    );
    this.name = "UnbalancedLedgerError";
  }
}

/**
 * Validates that an array of postings represents a balanced double-entry transaction.
 */
export function validateBalancedTransaction(tx: BalancedTransaction) {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const p of tx.postings) {
    if (!Number.isInteger(p.amountPaise) || p.amountPaise <= 0) {
      throw new Error(`Invalid ledger posting amount: ${p.amountPaise}. Must be a positive integer in paise.`);
    }

    if (p.direction === "DEBIT") {
      totalDebits += p.amountPaise;
    } else if (p.direction === "CREDIT") {
      totalCredits += p.amountPaise;
    } else {
      throw new Error(`Invalid ledger posting direction: ${p.direction}`);
    }
  }

  if (totalDebits !== totalCredits) {
    throw new UnbalancedLedgerError(totalDebits, totalCredits, tx.ref);
  }

  return true;
}

/**
 * Creates balanced double-entry postings for Online Escrow Payment Authorisation.
 * Customer deposits funds into platform Escrow.
 */
export function createEscrowDepositPostings(params: {
  amountPaise: number;
  projectId: string;
}): BalancedTransaction {
  return {
    projectId: params.projectId,
    ref: `ESCROW_DEPOSIT_${params.projectId}`,
    postings: [
      {
        account: "CUSTOMER",
        direction: "DEBIT",
        amountPaise: params.amountPaise,
        reason: "Customer authorised escrow payment",
      },
      {
        account: "ESCROW",
        direction: "CREDIT",
        amountPaise: params.amountPaise,
        reason: "Funds held in safe platform escrow",
      },
    ],
  };
}

/**
 * Creates balanced double-entry postings for Project Completion & Settlement.
 * Escrow is emptied: platform commission credited, remaining sent to Karigar wallet.
 */
export function createEscrowReleasePostings(params: {
  projectId: string;
  totalPaise: number;
  proCommissionPct: number;
}): BalancedTransaction {
  const platformCommissionPaise = Math.round(params.totalPaise * params.proCommissionPct);
  const proEarningsPaise = params.totalPaise - platformCommissionPaise;

  const postings: LedgerPosting[] = [
    {
      account: "ESCROW",
      direction: "DEBIT",
      amountPaise: params.totalPaise,
      reason: "Escrow funds released upon End-OTP job completion",
    },
    {
      account: "PLATFORM_REVENUE",
      direction: "CREDIT",
      amountPaise: platformCommissionPaise,
      reason: `Karighar platform fee (${params.proCommissionPct * 100}%)`,
    },
    {
      account: "KARIGAR_WALLET",
      direction: "CREDIT",
      amountPaise: proEarningsPaise,
      reason: "Net earnings credited to artisan wallet",
    },
  ];

  const tx: BalancedTransaction = {
    projectId: params.projectId,
    ref: `ESCROW_RELEASE_${params.projectId}`,
    postings,
  };

  validateBalancedTransaction(tx);
  return tx;
}

/**
 * Creates balanced postings for Cash On Delivery (COD) job settlement.
 * Customer pays worker directly. Platform commission is debited from Karigar wallet.
 */
export function createCodCommissionDebitPostings(params: {
  projectId: string;
  totalCashPaise: number;
  proCommissionPct: number;
}): BalancedTransaction {
  const commissionPaise = Math.round(params.totalCashPaise * params.proCommissionPct);

  const tx: BalancedTransaction = {
    projectId: params.projectId,
    ref: `COD_COMMISSION_DEBIT_${params.projectId}`,
    postings: [
      {
        account: "KARIGAR_WALLET",
        direction: "DEBIT",
        amountPaise: commissionPaise,
        reason: `Platform commission deducted for cash job (${params.proCommissionPct * 100}%)`,
      },
      {
        account: "PLATFORM_REVENUE",
        direction: "CREDIT",
        amountPaise: commissionPaise,
        reason: "Platform revenue earned on COD contract",
      },
    ],
  };

  validateBalancedTransaction(tx);
  return tx;
}
