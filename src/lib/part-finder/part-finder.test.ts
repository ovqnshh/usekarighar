import { findPartsCore, instantLexicalSearch, IN_MEMORY_CATALOG } from "./find-parts.functions";

interface TestCase {
  query: string;
  expectedKeyword: string;
  expectedCategory?: string;
}

const TEST_CASES: TestCase[] = [
  // Core 6 Required Hinglish Queries
  { query: "pipe ka 90 degree mod", expectedKeyword: "Elbow", expectedCategory: "Plumbing" },
  { query: "white tape jo pipe leak rokne ke liye lagate hain", expectedKeyword: "Teflon", expectedCategory: "Plumbing" },
  { query: "bijli ka switch jo overload pe khud band ho jata hai", expectedKeyword: "MCB", expectedCategory: "Electrical" },
  { query: "tap ke neeche wali flexible pipe", expectedKeyword: "Connection Hose", expectedCategory: "Plumbing" },
  { query: "door band hone pe dheere se band hone wala hinge", expectedKeyword: "Soft-Close", expectedCategory: "Carpentry" },
  { query: "wall pe seelan ka paint jo pani rokta hai", expectedKeyword: "Waterproof", expectedCategory: "Civil & Waterproofing" },

  // Additional 9 Colloquial Real-World Variations
  { query: "pipe jodane wala t shape connection", expectedKeyword: "Tee", expectedCategory: "Plumbing" },
  { query: "pani rokne wala valve ball jaisa", expectedKeyword: "Ball Valve", expectedCategory: "Plumbing" },
  { query: "bathroom me smell rokne wali jali", expectedKeyword: "Floor Drain", expectedCategory: "Plumbing" },
  { query: "taar jodane wala tape black", expectedKeyword: "PVC Insulation Tape", expectedCategory: "Electrical" },
  { query: "current lagne se bachane wala RCCB", expectedKeyword: "RCCB", expectedCategory: "Electrical" },
  { query: "light dim ya control karne wala regulator", expectedKeyword: "Regulator", expectedCategory: "Electrical" },
  { query: "cabinet darwaza lock karne wala magnetic catch", expectedKeyword: "Magnetic", expectedCategory: "Carpentry" },
  { query: "tiles ke beech me bharne wala cement", expectedKeyword: "Epoxy", expectedCategory: "Civil & Waterproofing" },
  { query: "wood chipkane wala strong fevicol", expectedKeyword: "Fevicol", expectedCategory: "Carpentry" },
];

async function runAcceptanceTests() {
  console.log("================================================================================");
  console.log("       KARIGHAR PROMPT 1: SMART PART FINDER ACCEPTANCE BENCHMARK TEST");
  console.log("================================================================================");
  console.log("Catalog size:", IN_MEMORY_CATALOG.length, "verified parts.");
  console.log("Running 15 colloquial / Hinglish queries...\n");

  let correctMatches = 0;
  let allCandidateIdsValid = true;
  const resultsTable: any[] = [];

  for (const tc of TEST_CASES) {
    try {
      const res = await findPartsCore({ query: tc.query });
      
      const bestMatch = res.bestMatch;
      const rerank = res.rerankInfo;
      const matched =
        bestMatch &&
        (bestMatch.name.toLowerCase().includes(tc.expectedKeyword.toLowerCase()) ||
         bestMatch.aliases.some((a: string) => a.toLowerCase().includes(tc.expectedKeyword.toLowerCase())));

      if (matched) correctMatches++;

      // Verify ID validity
      const allCatalogIds = new Set(IN_MEMORY_CATALOG.map((c) => c.id));
      if (bestMatch && !allCatalogIds.has(bestMatch.id)) {
        allCandidateIdsValid = false;
      }
      if (rerank?.alternative_ids) {
        for (const aid of rerank.alternative_ids) {
          if (!allCatalogIds.has(aid)) allCandidateIdsValid = false;
        }
      }

      resultsTable.push({
        Query: tc.query.length > 35 ? tc.query.slice(0, 32) + "..." : tc.query,
        Expected: tc.expectedKeyword,
        "Best Match": bestMatch?.name ? (bestMatch.name.length > 25 ? bestMatch.name.slice(0, 22) + "..." : bestMatch.name) : "None",
        Confidence: rerank?.confidence?.toFixed(2) || "N/A",
        Language: rerank?.detected_language || "N/A",
        Result: matched ? "PASS [OK]" : "FAIL [X]",
      });
    } catch (e: any) {
      resultsTable.push({
        Query: tc.query,
        Expected: tc.expectedKeyword,
        "Best Match": "ERROR",
        Confidence: "0.00",
        Language: "err",
        Result: `ERROR: ${e.message}`,
      });
    }
  }

  console.table(resultsTable);

  const accuracy = (correctMatches / TEST_CASES.length) * 100;
  console.log("\n--------------------------------------------------------------------------------");
  console.log(`Accuracy: ${correctMatches}/${TEST_CASES.length} (${accuracy.toFixed(1)}%) — Target: >= 80%`);
  console.log(`100% IDs valid from candidate list: ${allCandidateIdsValid ? "YES [PASSED]" : "NO [FAILED]"}`);
  console.log("--------------------------------------------------------------------------------\n");

  if (accuracy >= 80 && allCandidateIdsValid) {
    console.log(">>> ACCEPTANCE TEST 1 PASSED WITH FLYING COLORS! <<<");
  } else {
    console.error(">>> ACCEPTANCE TEST 1 FAILED <<<");
    process.exit(1);
  }
}

runAcceptanceTests();
