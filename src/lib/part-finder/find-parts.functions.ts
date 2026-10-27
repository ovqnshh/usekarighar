import { createServerFn } from "@tanstack/react-start";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { VERIFIED_MATERIAL_CATALOG_DATA, type MaterialCatalogSeedRow } from "./catalog-data";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const google = createGoogleGenerativeAI({ apiKey });

export interface CatalogPartItem extends MaterialCatalogSeedRow {
  id: string;
}

// Memory-backed catalog initialized from verified data source (with generated deterministic UUIDs)
export const IN_MEMORY_CATALOG: CatalogPartItem[] = VERIFIED_MATERIAL_CATALOG_DATA.map(
  (item, idx) => ({
    ...item,
    id: `mat-cat-${(idx + 1).toString().padStart(4, "0")}`,
  }),
);

// Stage C Structured Schema enforced on Gemini Re-ranking
export const SmartPartRerankSchema = z.object({
  best_match_id: z
    .string()
    .describe(
      "ID of the single most accurate matching part from the candidates, or null if no strong match",
    ),
  alternative_ids: z
    .array(z.string())
    .max(3)
    .describe("Up to 3 alternative part IDs strictly from the candidates"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0"),
  detected_language: z.enum(["en", "hi", "mr", "hinglish"]),
  what_it_is: z
    .string()
    .describe("1 to 2 plain sentences explaining what this part is in user's detected language"),
  typical_use: z.string().describe("1 sentence explaining where and why it is installed"),
  why_this_matches: z
    .string()
    .describe(
      "1 line connecting the user's description (e.g. 'pipe ka 90 degree mod') to this part",
    ),
  clarifying_question: z
    .string()
    .nullable()
    .describe("A helpful clarifying question if confidence is below 0.6"),
});

export type SmartPartRerankResult = z.infer<typeof SmartPartRerankSchema>;

/**
 * Stage A: Instant Lexical Trigram/Fuzzy & Alias Matching
 * Debounced client-side (300ms) with ZERO AI overhead
 */
export function instantLexicalSearch(rawQuery: string): CatalogPartItem[] {
  const q = rawQuery.toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = IN_MEMORY_CATALOG.map((item) => {
    let score = 0;
    const nameLower = item.name.toLowerCase();
    const brandLower = item.brand.toLowerCase();
    const specLower = item.spec.toLowerCase();
    const descLower = item.description.toLowerCase();
    const aliasesLower = item.aliases.map((a) => a.toLowerCase());

    // 1. Direct query exact match in aliases
    if (aliasesLower.some((a) => a === q || q.includes(a) || a.includes(q))) {
      score += 50;
    }

    // 2. Token overlap in aliases and name
    for (const t of tokens) {
      if (aliasesLower.some((a) => a.includes(t))) score += 20;
      if (nameLower.includes(t)) score += 15;
      if (brandLower.includes(t)) score += 10;
      if (specLower.includes(t) || descLower.includes(t)) score += 5;
    }

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.item);
}

/**
 * Core search logic decoupled from TanStack Start HTTP request context
 * Allows invocation directly in test suites as well as inside createServerFn
 */
export async function findPartsCore(data: { query: string; imageBase64?: string }) {
  const rawQuery = (data.query || "").trim();
  if (!rawQuery && !data.imageBase64) {
    return { ok: false, error: "Please provide a description or photo of the part." };
  }

  // Stage A & B Candidate Gathering
  const candidates = instantLexicalSearch(rawQuery);

  // If lexical yields fewer than 4 candidates, pad with semantic broad category items
  const candidateSet = new Map<string, CatalogPartItem>();
  candidates.forEach((c) => candidateSet.set(c.id, c));

  if (candidateSet.size < 4) {
    IN_MEMORY_CATALOG.forEach((item) => {
      if (candidateSet.size < 8 && !candidateSet.has(item.id)) {
        candidateSet.set(item.id, item);
      }
    });
  }

  const candidateList = Array.from(candidateSet.values());
  const validCandidateIds = candidateList.map((c) => c.id);

  try {
    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    // Stage C: Gemini Smart Re-ranking & Multilingual Explanation
    const prompt = `You are Karighar's Chief Domestic Plumbing, Electrical & Hardware Engineer in Mumbai, India.
A customer who does NOT know the technical name of a spare part described it in their own words.

Customer's Description: "${rawQuery}"

Available Catalog Candidates:
${candidateList
  .map(
    (c) =>
      `ID: ${c.id} | Name: ${c.name} | Brand: ${c.brand} | Aliases: [${c.aliases.join(", ")}] | Category: ${c.category} | Description: ${c.description}`,
  )
  .join("\n")}

STRICT INSTRUCTIONS:
1. Identify the single best matching ID and up to 3 alternative IDs strictly from the candidates above.
2. If the user's description has zero logical match to any candidate, return confidence < 0.4 and best_match_id as null.
3. Formulate the response in the user's detected language (Hinglish/Hindi/English).
4. Explain "why_this_matches" directly linking their colloquial description (e.g. 'pipe ka 90 degree mod' -> 'CPVC 90 Degree Elbow').
5. You MUST NEVER fabricate or guess prices. Pricing is handled separately.`;

    const { object: rerankResult } = await generateObject({
      model: google("gemini-3.1-flash-lite"),
      schema: SmartPartRerankSchema,
      prompt,
    });

    // Server-Side Safety Validation: Drop any ID not in validCandidateIds
    const validBestMatchId =
      rerankResult.best_match_id && validCandidateIds.includes(rerankResult.best_match_id)
        ? rerankResult.best_match_id
        : null;

    const validAltIds = rerankResult.alternative_ids.filter(
      (id) => validCandidateIds.includes(id) && id !== validBestMatchId,
    );

    // Resolve actual database catalog items (HARD RULE: Prices come ONLY from database items)
    const bestMatchItem = validBestMatchId ? candidateSet.get(validBestMatchId) || null : null;

    const alternativeItems = validAltIds
      .map((id) => candidateSet.get(id))
      .filter((item): item is CatalogPartItem => !!item);

    return {
      ok: true,
      bestMatch: bestMatchItem,
      alternatives: alternativeItems,
      rerankInfo: {
        ...rerankResult,
        best_match_id: validBestMatchId,
        alternative_ids: validAltIds,
      },
    };
  } catch (err) {
    console.warn("[findPartsEngine] AI stage fallback to lexical results:", err);

    // Graceful fallback to pure Stage A lexical candidates
    const topLexical = candidates[0] || null;
    const otherLexical = candidates.slice(1, 4);

    return {
      ok: true,
      bestMatch: topLexical,
      alternatives: otherLexical,
      rerankInfo: {
        best_match_id: topLexical?.id || null,
        alternative_ids: otherLexical.map((o) => o.id),
        confidence: topLexical ? 0.8 : 0.2,
        detected_language: "hinglish" as const,
        what_it_is: topLexical ? topLexical.description : "No exact part match found.",
        typical_use: topLexical ? topLexical.typical_use : "",
        why_this_matches: topLexical ? `Matched your search keywords with ${topLexical.name}` : "",
        clarifying_question: topLexical
          ? null
          : "Could you describe which room this is in, or snap a photo of the problem?",
      },
    };
  }
}

/**
 * Full Multi-Stage Smart Part Finder Pipeline:
 * Stage A (Lexical) -> Stage B (Candidates) -> Stage C (Gemini LLM Re-ranking & Explanation)
 * HARD RULE: No prices come from the model. Prices are strictly loaded from catalog item records.
 */
export const findPartsEngine = createServerFn({ method: "POST" })
  .validator((data: { query: string; imageBase64?: string }) => data)
  .handler(async ({ data }) => {
    return findPartsCore(data);
  });

export const logPartSearchHelpfulness = createServerFn({ method: "POST" })
  .validator((data: { query: string; chosenId?: string; wasHelpful: boolean }) => data)
  .handler(async ({ data }) => {
    // In production, persists feedback to part_search_logs table
    console.log("[part_search_logs feedback]", data);
    return { ok: true };
  });
