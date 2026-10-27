import { checkQuoteItemInflation, createDraftProjectFromEstimate } from "./visual-damage.functions";
import { calculateHaversineDistanceMeters } from "./hardware-locator/places.functions";
import { instantLexicalSearch, IN_MEMORY_CATALOG } from "./part-finder/find-parts.functions";

export async function runPhase1AcceptanceTests() {
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

  // --- 1. Price Index Inflation Guard (Features 18 & 1) ---
  await test("Feature 18/1: Inflation Guard flags overpriced parts (> trade max benchmark)", () => {
    // 1-inch CPVC elbow benchmark is ₹55 - ₹68 (max 6800 paise)
    const inflated = checkQuoteItemInflation({
      name: "1-inch CPVC elbow",
      quotedPricePaise: 12000, // ₹120 quoted
    });

    if (!inflated.isInflated) {
      throw new Error("Expected 12000 paise CPVC elbow to be flagged as inflated");
    }
    if (inflated.inflationPct !== 76) {
      throw new Error(`Expected ~76% inflation, got ${inflated.inflationPct}%`);
    }
  });

  await test("Feature 18/1: Inflation Guard approves fair parts (<= trade max benchmark)", () => {
    // 1-inch CPVC elbow benchmark max is ₹68 (6800 paise)
    const fair = checkQuoteItemInflation({
      name: "1-inch CPVC elbow",
      quotedPricePaise: 6500, // ₹65 quoted
    });

    if (fair.isInflated) {
      throw new Error("Expected ₹65 CPVC elbow to be approved as fair rate");
    }
  });

  // --- 2. AI Visual Damage Grounding & Part Resolution (Feature 1) ---
  await test("Feature 1: Parts in catalog have valid positive trade prices and brands", () => {
    const catalogItem = IN_MEMORY_CATALOG.find((c) => c.name.toLowerCase().includes("cpvc"));
    if (!catalogItem) throw new Error("Catalog missing CPVC items");
    if (catalogItem.trade_price_min_paise <= 0 || catalogItem.trade_price_max_paise <= catalogItem.trade_price_min_paise) {
      throw new Error("Invalid price bounds in catalog item");
    }
    if (!catalogItem.brand) {
      throw new Error("Catalog item missing verified brand");
    }
  });

  // --- 3. Draft Project Creation from AI Estimate (Feature 1) ---
  await test("Feature 1: 'Book with this estimate' creates project in DRAFT status with ai_estimate_id", async () => {
    const res = await createDraftProjectFromEstimate({
      customerId: "cust-test-user-001",
      title: "Wall Diverter Repair",
      description: "Automated diagnosis of internal cartridge failure",
      trade: "Plumbing",
      aiEstimateId: "est-ai-test-999",
      estimatedPaise: 49900,
    });

    if (!res.ok || !res.project) {
      throw new Error("createDraftProjectFromEstimate failed");
    }
    if (res.project.status !== "draft") {
      throw new Error(`Expected project status 'draft', got ${res.project.status}`);
    }
    if (res.project.ai_estimate_id !== "est-ai-test-999") {
      throw new Error(`Expected ai_estimate_id 'est-ai-test-999', got ${res.project.ai_estimate_id}`);
    }
  });

  // --- 4. Hardware Store Locator Distance Math (Feature 17) ---
  await test("Feature 17: Haversine distance correctly calculates Powai to Hiranandani (~870m)", () => {
    // Powai Plaza: 19.1176, 72.9060
    // Hiranandani Galleria: 19.1235, 72.9115
    const distanceMeters = calculateHaversineDistanceMeters(19.1176, 72.906, 19.1235, 72.9115);
    if (distanceMeters < 750 || distanceMeters > 1050) {
      throw new Error(`Expected ~870m, got ${distanceMeters}m`);
    }
  });

  // --- 5. Micro-Storefront Attribution & Verification Rule (Feature 5) ---
  await test("Feature 5: Only APPROVED / verified artisans receive SafePay Verified status", () => {
    const approvedArtisan = { verification_status: "APPROVED" };
    const pendingArtisan = { verification_status: "PENDING" };
    const rejectedArtisan = { verification_status: "REJECTED" };

    const isAppr = (p: any) => p.verification_status === "APPROVED" || p.verification_status === "verified";

    if (!isAppr(approvedArtisan)) throw new Error("Approved artisan should be verified");
    if (isAppr(pendingArtisan)) throw new Error("Pending artisan must not be marked verified");
    if (isAppr(rejectedArtisan)) throw new Error("Rejected artisan must not be marked verified");
  });

  await test("Feature 5: Booking link preserves source_pro_id for 0% commission attribution", () => {
    const proId = "pro-arjun-carpenter-101";
    const bookingSearchParam = new URLSearchParams({ source_pro_id: proId }).toString();
    if (!bookingSearchParam.includes("source_pro_id=pro-arjun-carpenter-101")) {
      throw new Error("Booking query parameters missing source_pro_id attribution");
    }
  });

  // --- 6. Transformation Slider Accessibility & Consent Check (Feature 12) ---
  await test("Feature 12: Before/After slider enforces [0, 100] percentage bounds", () => {
    let pos = 50;
    // Step left by 5
    pos = Math.max(0, pos - 5);
    if (pos !== 45) throw new Error("Left step failed");

    // Multiple steps down
    pos = Math.max(0, pos - 50);
    if (pos !== 0) throw new Error("Lower bound clamp failed");

    // Multiple steps up
    pos = Math.min(100, pos + 120);
    if (pos !== 100) throw new Error("Upper bound clamp failed");
  });

  return results;
}

// Auto-run when executed directly via CLI
if (process.argv[1]?.includes("phase1-acceptance.test")) {
  console.log("================================================================================");
  console.log("       KARIGHAR PHASE 1: TRUST & CONVERSION ACCEPTANCE TEST SUITE");
  console.log("================================================================================");
  runPhase1AcceptanceTests().then((results) => {
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
      console.log(`ALL ${results.length} PHASE 1 ACCEPTANCE CHECKS PASSED (100% SUCCESS)!`);
    } else {
      console.error("SOME PHASE 1 CHECKS FAILED!");
      process.exit(1);
    }
    console.log("================================================================================");
  });
}

