import {
  getSocietyClusterDealsCore,
  joinSocietyClusterDealCore,
} from "./society-deals/society-deals.functions";
import {
  createRenovationMilestonesCore,
  releaseMilestoneEscrowCore,
} from "./milestone-escrow/milestones.functions";
import {
  initializeMultiTradeCrewCore,
  completeStageAndAdvanceCrewCore,
} from "./contractor-crew/crew-assembly.functions";
import {
  createSosEmergencyDispatchCore,
  acceptEmergencyDispatchCore,
} from "./emergency-sos/sos-dispatch.functions";
import {
  getProCreditProfileCore,
  requestMaterialAdvanceCore,
  settleAdvanceOnMilestoneRelease,
} from "./artisan-credit/artisan-advance.functions";

export async function runPhase3AcceptanceTests() {
  const results: { test: string; passed: boolean; details?: string; error?: string }[] = [];

  function test(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        results.push({ test: name, passed: true });
      })
      .catch((err: any) => {
        results.push({ test: name, passed: false, error: err.message });
      });
  }

  // --- 1. Feature 2: Society "Karighar Day" Cluster Booking ---
  await test("Feature 2: Society Cluster deals compute bulk discounts and unlock on target flat threshold", async () => {
    const dealsRes = await getSocietyClusterDealsCore("Hiranandani");
    if (!dealsRes.ok || dealsRes.deals.length === 0) {
      throw new Error("Failed to retrieve society cluster deals");
    }

    const acDeal = dealsRes.deals[0];
    if (acDeal.discount_pct !== 20 || acDeal.savingsPaise <= 0) {
      throw new Error("Invalid cluster deal discount computation");
    }

    // Joining the deal
    const joinRes = await joinSocietyClusterDealCore({
      dealId: acDeal.id,
      flatNumber: "Flat 1402, Somerset",
      contactPhone: "+91 98201 11223",
    });

    if (!joinRes.ok || !joinRes.isUnlocked) {
      throw new Error("Expected deal to unlock discount upon reaching target threshold");
    }
  });

  // --- 2. Feature 8: Milestone Escrow Renovations (₹25k–₹5L) ---
  await test("Feature 8: High-ticket renovation splits into 4 milestones & releases balanced double-entry ledger", () => {
    // 1. Contract value under ₹25k is rejected
    let threwUnderMin = false;
    try {
      createRenovationMilestonesCore("proj-small", 1500000); // ₹15,000
    } catch {
      threwUnderMin = true;
    }
    if (!threwUnderMin) throw new Error("Expected rejection for contract < ₹25,000");

    // 2. Standard ₹1,00,000 renovation (10,000,000 paise)
    const milestones = createRenovationMilestonesCore("proj-reno-101", 10000000);
    if (milestones.length !== 4) throw new Error(`Expected 4 milestones, got ${milestones.length}`);
    if (milestones[0].amountPaise !== 3000000) throw new Error("Stage 1 must be 30% (₹30,000)");

    // 3. Releasing Stage 1 via OTP
    const releaseRes = releaseMilestoneEscrowCore({
      milestone: milestones[0],
      enteredOtp: "849201",
      proWalletId: "wallet-pro-101",
      customerId: "cust-101",
    });

    if (!releaseRes.success || releaseRes.updatedMilestone.status !== "APPROVED_RELEASED") {
      throw new Error("Milestone release failed");
    }
    // Verify balanced transaction
    const debits = releaseRes.ledgerPostings.postings
      .filter((p) => p.direction === "DEBIT")
      .reduce((s, p) => s + p.amountPaise, 0);
    const credits = releaseRes.ledgerPostings.postings
      .filter((p) => p.direction === "CREDIT")
      .reduce((s, p) => s + p.amountPaise, 0);

    if (debits !== credits) {
      throw new Error(`Unbalanced milestone release ledger: Debits ${debits} != Credits ${credits}`);
    }
  });

  // --- 3. Feature 13: Multi-Trade Contractor Crew Assembly ---
  await test("Feature 13: Multi-Trade crew auto-sequences Plumbing -> Masonry -> Tiling with curing delays", () => {
    const crew = initializeMultiTradeCrewCore("proj-bath-crew-001");
    if (crew.length !== 3) throw new Error("Expected 3-stage crew sequence");
    if (crew[0].status !== "READY_FOR_DISPATCH" || crew[1].status !== "WAITING_PREV_STAGE") {
      throw new Error("Initial crew status sequence invalid");
    }

    // Complete Stage 1 (Plumbing) -> Unlocks Stage 2 (Masonry)
    const stage1Advance = completeStageAndAdvanceCrewCore(crew[0], crew);
    if (stage1Advance.updatedCurrent.status !== "COMPLETED") throw new Error("Stage 1 not completed");
    if (stage1Advance.updatedNextStage?.status !== "READY_FOR_DISPATCH") {
      throw new Error("Stage 2 Masonry did not advance to READY_FOR_DISPATCH");
    }

    // Complete Stage 2 (Masonry & Waterproofing) -> Requires 24-hour curing before Stage 3 (Tiling)
    const stage2 = crew[1];
    const stage2Advance = completeStageAndAdvanceCrewCore(stage2, crew);
    if (stage2Advance.updatedCurrent.status !== "COMPLETED") throw new Error("Stage 2 not completed");
    if (stage2Advance.updatedNextStage?.status !== "READY_FOR_DISPATCH") {
      throw new Error("Stage 3 Tiling did not advance to READY_FOR_DISPATCH");
    }
    if (!stage2Advance.curingNotice || !stage2Advance.curingNotice.includes("24-hour")) {
      throw new Error("Expected 24-hour curing window notice for waterproofing");
    }
  });

  // --- 4. Feature 6: Live SOS Emergency Rapid Dispatch ---
  await test("Feature 6: SOS Rapid Dispatch sets transparent base ₹799 and calculates 15-30m ETA", () => {
    const sos = createSosEmergencyDispatchCore({
      trade: "Plumbing",
      emergencyType: "BURST_PIPE_FLOODING",
      locationAddress: "Hiranandani Gardens, Powai",
      lat: 19.1176,
      lng: 72.906,
    });

    if (sos.fixedBasePaise !== 79900 || sos.status !== "BROADCASTING") {
      throw new Error("SOS base price must be exactly ₹799 (79900 paise)");
    }

    // Pro 1.5 km away accepts
    const accepted = acceptEmergencyDispatchCore({
      sos,
      proId: "pro-emergency-999",
      proName: "Mukesh Plumber",
      proPhone: "+91 98201 99999",
      proLat: 19.1235,
      proLng: 72.9115,
    });

    if (accepted.status !== "ACCEPTED_EN_ROUTE") throw new Error("Expected ACCEPTED_EN_ROUTE status");
    if (!accepted.etaMinutes || accepted.etaMinutes < 12 || accepted.etaMinutes > 30) {
      throw new Error(`Expected ETA 15-30m, got ${accepted.etaMinutes}m`);
    }
  });

  // --- 5. Feature 11: Artisan Material Advances & Pro Credit Score ---
  await test("Feature 11: Material advance caps at 40% of funded milestone and auto-repays to boost credit score", () => {
    const proProfile = getProCreditProfileCore("pro-ramesh-carpenter");

    // 1. Rejects advance for unfunded milestone
    let threwUnfunded = false;
    try {
      requestMaterialAdvanceCore({
        proProfile,
        milestoneStatus: "PENDING_FUNDING",
        milestoneAmountPaise: 4000000,
        requestedPaise: 1000000,
        projectId: "proj-1",
        milestoneId: "ms-1",
      });
    } catch {
      threwUnfunded = true;
    }
    if (!threwUnfunded) throw new Error("Advance must require funded escrow");

    // 2. Rejects advance exceeding 40%
    let threwOver40 = false;
    try {
      requestMaterialAdvanceCore({
        proProfile,
        milestoneStatus: "FUNDED_ESCROW",
        milestoneAmountPaise: 4000000, // ₹40,000 (40% is ₹16,000 = 1,600,000 paise)
        requestedPaise: 2000000, // ₹20,000 requested (> 40%)
        projectId: "proj-1",
        milestoneId: "ms-1",
      });
    } catch {
      threwOver40 = true;
    }
    if (!threwOver40) throw new Error("Advance exceeding 40% must be rejected");

    // 3. Valid advance of ₹15,000 (1,500,000 paise)
    const advance = requestMaterialAdvanceCore({
      proProfile,
      milestoneStatus: "FUNDED_ESCROW",
      milestoneAmountPaise: 4000000,
      requestedPaise: 1500000,
      projectId: "proj-1",
      milestoneId: "ms-1",
    });

    if (advance.status !== "APPROVED_DISBURSED") throw new Error("Valid advance was not disbursed");

    // 4. Milestone released -> Auto-repay advance & boost credit score
    const settleRes = settleAdvanceOnMilestoneRelease(advance, proProfile);
    if (settleRes.updatedAdvance.status !== "REPAID_SETTLED") {
      throw new Error("Advance not marked settled upon milestone release");
    }
    if (settleRes.updatedProfile.creditScore !== 760) {
      throw new Error(`Expected score boost to 760, got ${settleRes.updatedProfile.creditScore}`);
    }
  });

  return results;
}

// Auto-run when executed directly via CLI
if (process.argv[1]?.includes("phase3-acceptance.test")) {
  console.log("================================================================================");
  console.log("       KARIGHAR PHASE 3: HIGH-TICKET MONETIZATION & SCALE TEST SUITE");
  console.log("================================================================================");
  runPhase3AcceptanceTests().then((results) => {
    let allPassed = true;
    for (const r of results) {
      if (r.passed) {
        console.log(`[PASS] ${r.test}`);
      } else {
        allPassed = false;
        console.error(`[FAIL] ${r.test} - Error: ${r.error}`);
      }
    }
    console.log("================================================================================");
    if (allPassed) {
      console.log(`ALL ${results.length} PHASE 3 ACCEPTANCE CHECKS PASSED (100% SUCCESS)!`);
    } else {
      console.error("SOME PHASE 3 CHECKS FAILED!");
      process.exit(1);
    }
    console.log("================================================================================");
  });
}
