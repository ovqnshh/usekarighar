import {
  validateStateTransition,
  IllegalStateTransitionError,
  type ProjectLifecycleStatus,
} from "./project-lifecycle";
import {
  createEscrowDepositPostings,
  createEscrowReleasePostings,
  createCodCommissionDebitPostings,
  validateBalancedTransaction,
  UnbalancedLedgerError,
} from "../ledger/ledger-engine";

export function runPhase0FoundationTests() {
  const results: { test: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ test: name, passed: true });
    } catch (err: any) {
      results.push({ test: name, passed: false, error: err.message });
    }
  }

  // --- STATE MACHINE TESTS ---
  test("State Machine: Valid DRAFT -> SEARCHING succeeds", () => {
    validateStateTransition({
      fromStatus: "DRAFT",
      toStatus: "SEARCHING",
      actorRole: "customer",
    });
  });

  test("State Machine: Illegal jump DRAFT -> IN_PROGRESS is blocked", () => {
    let threw = false;
    try {
      validateStateTransition({
        fromStatus: "DRAFT",
        toStatus: "IN_PROGRESS",
        actorRole: "customer",
      });
    } catch (e) {
      if (e instanceof IllegalStateTransitionError) threw = true;
    }
    if (!threw) throw new Error("Expected IllegalStateTransitionError was not thrown");
  });

  test("State Machine: IN_PROGRESS strictly requires Start-OTP and BEFORE photo", () => {
    let threw = false;
    try {
      validateStateTransition({
        fromStatus: "ARRIVED",
        toStatus: "IN_PROGRESS",
        actorRole: "karigar",
        hasStartOtpVerified: false,
        hasBeforePhoto: true,
      });
    } catch (e: any) {
      if (e.message.includes("Start-OTP verification is mandatory")) threw = true;
    }
    if (!threw) throw new Error("Transition allowed without Start-OTP");
  });

  test("State Machine: COMPLETED strictly requires End-OTP and AFTER photo", () => {
    let threw = false;
    try {
      validateStateTransition({
        fromStatus: "IN_PROGRESS",
        toStatus: "COMPLETED",
        actorRole: "karigar",
        hasEndOtpVerified: true,
        hasAfterPhoto: false,
      });
    } catch (e: any) {
      if (e.message.includes("AFTER photo is strictly mandatory")) threw = true;
    }
    if (!threw) throw new Error("Transition allowed without AFTER photo");
  });

  // --- DOUBLE-ENTRY LEDGER TESTS ---
  test("Ledger: Online Escrow deposit is perfectly balanced", () => {
    const tx = createEscrowDepositPostings({
      projectId: "proj-123",
      amountPaise: 49900, // ₹499.00
    });
    validateBalancedTransaction(tx);
  });

  test("Ledger: Escrow Release correctly balances Debits and Credits", () => {
    const tx = createEscrowReleasePostings({
      projectId: "proj-123",
      totalPaise: 100000, // ₹1,000.00
      proCommissionPct: 0.15, // 15% platform fee
    });
    validateBalancedTransaction(tx);
    // Escrow debited 100000, Platform credited 15000, Karigar credited 85000
    const platformRev = tx.postings.find((p) => p.account === "PLATFORM_REVENUE")?.amountPaise;
    const workerWallet = tx.postings.find((p) => p.account === "KARIGAR_WALLET")?.amountPaise;
    if (platformRev !== 15000 || workerWallet !== 85000) {
      throw new Error(`Incorrect ledger split: Rev=${platformRev}, Wallet=${workerWallet}`);
    }
  });

  test("Ledger: COD Commission Debit is perfectly balanced", () => {
    const tx = createCodCommissionDebitPostings({
      projectId: "proj-456",
      totalCashPaise: 50000, // ₹500.00 cash
      proCommissionPct: 0.15,
    });
    validateBalancedTransaction(tx);
    // Worker wallet debited 7500, Platform credited 7500
    const debited = tx.postings.find((p) => p.direction === "DEBIT")?.amountPaise;
    const credited = tx.postings.find((p) => p.direction === "CREDIT")?.amountPaise;
    if (debited !== 7500 || credited !== 7500) {
      throw new Error("COD ledger did not match 15% commission balance");
    }
  });

  test("Ledger: Unbalanced transactions are strictly rejected", () => {
    let threw = false;
    try {
      validateBalancedTransaction({
        ref: "CORRUPT_TX",
        postings: [
          { account: "CUSTOMER", direction: "DEBIT", amountPaise: 5000, reason: "Deposit" },
          { account: "ESCROW", direction: "CREDIT", amountPaise: 4000, reason: "Leak" },
        ],
      });
    } catch (e) {
      if (e instanceof UnbalancedLedgerError) threw = true;
    }
    if (!threw) throw new Error("Unbalanced transaction was permitted");
  });

  return results;
}
