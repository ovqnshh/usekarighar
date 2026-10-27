import {
  getOrCreateHomePassportCore,
  appendPassportRecordOnCompletionCore,
  computeWarrantyStatus,
} from "./passport/home-passport.functions";
import { parseVoiceDispatchCore } from "./voice-dispatch/voice-dispatch.functions";
import {
  getOrCreateGatePassCore,
  verifyGatePassCode,
} from "./gate-pass/gate-pass.functions";
import { verifyMaterialBarcodeCore } from "./anti-piracy/material-scanner.functions";
import { arbitrateWarrantyDisputeCore } from "./warranty-arbitrator/arbitrator.functions";
import { verifyPpeComplianceCore } from "./safety/ppe-verification.functions";

export async function runPhase2AcceptanceTests() {
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

  // --- 1. Feature 4: Digital Home Health Passport (Flat DigiLocker) ---
  await test("Feature 4: Home Passport compiles address and manages active warranty countdowns", async () => {
    const passportRes = await getOrCreateHomePassportCore({
      flatNumber: "1202",
      buildingSociety: "Hiranandani Heritage",
      locality: "Powai",
      city: "Mumbai",
      pincode: "400076",
    });

    if (!passportRes.ok || !passportRes.passport) {
      throw new Error("Failed to create or retrieve Home Passport");
    }

    // Append completed job record
    const appendRes = await appendPassportRecordOnCompletionCore({
      passportId: passportRes.passport.id,
      trade: "Plumbing",
      title: "Concealed Shower Diverter Replacement",
      summary: "Replaced calcified Jaquar ceramic cartridge spindle and tested water pressure.",
      partsReplaced: [{ name: "Jaquar Ceramic Cartridge", brand: "Jaquar Genuine", costPaise: 42000 }],
      totalPaidPaise: 89900,
      warrantyDays: 30,
    });

    if (!appendRes.ok) throw new Error("Failed to append passport record");

    // Test warranty countdown calculations
    const activeWarranty = computeWarrantyStatus(new Date(Date.now() + 15 * 86400000).toISOString());
    if (!activeWarranty.isActive || activeWarranty.daysRemaining !== 15) {
      throw new Error(`Expected active 15 days, got ${activeWarranty.daysRemaining}`);
    }

    const expiredWarranty = computeWarrantyStatus(new Date(Date.now() - 5 * 86400000).toISOString());
    if (expiredWarranty.isActive) {
      throw new Error("Expected expired warranty to be inactive");
    }
  });

  // --- 2. Feature 3: Voice-First Hinglish AI Dispatch ---
  await test("Feature 3: Hinglish Voice Dispatch detects plumbing & electrical trades with safety actions", async () => {
    // Plumbing test
    const plumbRes = await parseVoiceDispatchCore({
      transcript: "Bhaiya master bedroom ke bathroom ka pipe bohot tezi se leak ho raha hai",
    });

    if (!plumbRes.ok || plumbRes.result.primaryTrade !== "Plumbing") {
      throw new Error(`Expected Plumbing trade, got ${plumbRes.result.primaryTrade}`);
    }

    // Electrical urgency test
    const elecRes = await parseVoiceDispatchCore({
      transcript: "Kitchen ka switchboard jal gaya aur spark ho raha hai turant aao",
    });

    if (!elecRes.ok || elecRes.result.primaryTrade !== "Electrical") {
      throw new Error(`Expected Electrical trade, got ${elecRes.result.primaryTrade}`);
    }
    if (elecRes.result.urgency !== "emergency" && elecRes.result.urgency !== "same_day") {
      throw new Error(`Expected high urgency, got ${elecRes.result.urgency}`);
    }
  });

  // --- 3. Feature 14: Society Gate Pre-Pass (MyGate / NoBrokerHood) ---
  await test("Feature 14: Gate Pre-Pass generates 6-digit pass code and enforces guard entry verification", async () => {
    const gateRes = await getOrCreateGatePassCore({
      projectId: "proj-test-gate-101",
      proName: "Rohan Sharma",
      proTrade: "Master Electrician",
      societyName: "Oberoi Springs",
      flatWing: "Wing B, Flat 804",
      residentName: "Aarav Mehta",
    });

    if (!gateRes.ok || !gateRes.pass) throw new Error("Failed to generate gate pass");
    const pass = gateRes.pass;

    if (pass.passCode.length !== 6 || isNaN(Number(pass.passCode))) {
      throw new Error(`Pass code must be 6 digits, got ${pass.passCode}`);
    }
    if (!pass.whatsappShareText.includes("Oberoi Springs") || !pass.whatsappShareText.includes(pass.passCode)) {
      throw new Error("WhatsApp share text missing required society credentials");
    }

    // Test guard verification
    const correctCheck = verifyGatePassCode(pass, pass.passCode);
    if (!correctCheck.verified) throw new Error("Guard verification failed for correct pass code");

    const wrongCheck = verifyGatePassCode(pass, "000000");
    if (wrongCheck.verified) throw new Error("Guard verification allowed invalid pass code");
  });

  // --- 4. Feature 7: Material Anti-Piracy Scanner ---
  await test("Feature 7: Anti-Piracy Scanner verifies genuine brands & flags counterfeit wires", () => {
    // 1. Genuine Havells Wire
    const havells = verifyMaterialBarcodeCore("HVL982341", "Havells");
    if (!havells.isAuthentic || !havells.detectedStandard.includes("IS:694")) {
      throw new Error("Havells wire failed authenticity check");
    }

    // 2. Genuine Astral CPVC
    const astral = verifyMaterialBarcodeCore("ASTCPVC7721", "Astral");
    if (!astral.isAuthentic || !astral.detectedStandard.includes("ASTM D2846")) {
      throw new Error("Astral CPVC failed authenticity check");
    }

    // 3. Counterfeit Wire
    const fake = verifyMaterialBarcodeCore("FAKE-CHINESE-WIRE-999");
    if (fake.isAuthentic) {
      throw new Error("Counterfeit wire was falsely approved as authentic");
    }
    if (!fake.safetyAdvisory || !fake.safetyAdvisory.includes("WARNING")) {
      throw new Error("Missing critical safety advisory for counterfeit wire");
    }
  });

  // --- 5. Feature 15: Warranty AI Dispute Arbitrator ---
  await test("Feature 15: AI Ombudsman approves free rework for same fixture & flags new issues", async () => {
    // Case A: Exact same tap leaking within warranty window -> APPROVE REWORK
    const sameClaim = await arbitrateWarrantyDisputeCore({
      complaintDescription: "The diverter tap cartridge you replaced 4 days ago is dripping again from the stem joint",
      originalTrade: "Plumbing",
      originalScope: "Bathroom wall diverter cartridge replacement",
      partsReplacedList: ["Jaquar Ceramic Cartridge"],
      daysSinceCompletion: 4,
    });

    if (!sameClaim.ok || sameClaim.verdict.aiVerdict !== "WARRANTY_APPROVED_REWORK") {
      throw new Error(`Expected WARRANTY_APPROVED_REWORK, got ${sameClaim.verdict.aiVerdict}`);
    }

    // Case B: Completely separate fixture in kitchen -> NEW ISSUE DISCOUNT
    const separateClaim = await arbitrateWarrantyDisputeCore({
      complaintDescription: "Now my kitchen sink drain is blocked completely",
      originalTrade: "Plumbing",
      originalScope: "Bathroom shower diverter repair",
      partsReplacedList: ["Jaquar Ceramic Cartridge"],
      daysSinceCompletion: 4,
    });

    if (!separateClaim.ok || separateClaim.verdict.aiVerdict !== "NEW_ISSUE_DISCOUNTED_VISIT") {
      throw new Error(`Expected NEW_ISSUE_DISCOUNTED_VISIT, got ${separateClaim.verdict.aiVerdict}`);
    }

    // Case C: 45 days elapsed (> 30 days) -> NEW ISSUE DISCOUNT
    const expiredClaim = await arbitrateWarrantyDisputeCore({
      complaintDescription: "The diverter tap is leaking again",
      originalTrade: "Plumbing",
      originalScope: "Bathroom wall diverter repair",
      daysSinceCompletion: 45,
    });

    if (expiredClaim.verdict.aiVerdict !== "NEW_ISSUE_DISCOUNTED_VISIT") {
      throw new Error("Expired warranty should be resolved as new discounted visit");
    }
  });

  // --- 6. Feature 10: PPE and Safety Tool Verification ---
  await test("Feature 10: PPE checker enforces 1000V insulated gloves & safety gear for electrical jobs", () => {
    // Compliant electrical technician
    const compliant = verifyPpeComplianceCore({
      trade: "Electrical",
      declaredItems: ["1000V Insulated Rubber Gloves", "Digital Multimeter", "Rubber Sole Shoes"],
    });

    if (!compliant.passed) {
      throw new Error("Compliant technician should pass PPE verification");
    }

    // Non-compliant technician missing critical gear
    const nonCompliant = verifyPpeComplianceCore({
      trade: "Electrical",
      declaredItems: ["Normal Kitchen Scissors", "Cotton cloth"],
    });

    if (nonCompliant.passed) {
      throw new Error("Technician missing PPE must fail verification");
    }
    if (!nonCompliant.safetyAdvisory.includes("Safety alert")) {
      throw new Error("Missing safety advisory on failed PPE check");
    }
  });

  return results;
}

// Auto-run when executed directly via CLI
if (process.argv[1]?.includes("phase2-acceptance.test")) {
  console.log("================================================================================");
  console.log("       KARIGHAR PHASE 2: OPERATIONS, RETENTION & ACCESSIBILITY TEST SUITE");
  console.log("================================================================================");
  runPhase2AcceptanceTests().then((results) => {
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
      console.log(`ALL ${results.length} PHASE 2 ACCEPTANCE CHECKS PASSED (100% SUCCESS)!`);
    } else {
      console.error("SOME PHASE 2 CHECKS FAILED!");
      process.exit(1);
    }
    console.log("================================================================================");
  });
}
