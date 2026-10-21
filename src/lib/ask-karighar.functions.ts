import { createServerFn } from "@tanstack/react-start";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const google = createGoogleGenerativeAI({ apiKey });
import {
  SERVICE_DEFINITIONS,
  detectSafetyHazard,
  SafetyHazardRule,
} from "./search-dictionary";

export const CANONICAL_TRADES = [
  "AC & appliance repair/installation",
  "Plumbing repair & installation",
  "Electrical repair & installation",
  "Carpentry & custom furniture",
  "Painting & wall finishing",
  "Waterproofing",
  "Tiling & flooring",
  "Pest control",
  "Masonry & plastering",
  "False ceiling & POP work",
  "Home automation & smart locks",
  "General labour / helper",
] as const;

export type CanonicalTrade = (typeof CANONICAL_TRADES)[number];

// Schema for Step A: Fast Classification
export const StepAClassificationSchema = z.object({
  language: z.enum(["en", "hi", "mr", "hinglish"]).describe("Language detected in user query"),
  intent: z.enum(["repair", "install", "maintenance", "renovation", "inspection", "unknown"]),
  isMultiIssue: z.boolean().describe("Whether the input contains two or more distinct trade issues"),
  issues: z.array(
    z.object({
      title: z.string(),
      tradeCategory: z.string(),
      serviceSlug: z.string().nullable(),
      urgency: z.enum(["emergency", "today", "this_week", "flexible"]),
    })
  ),
  primaryTrade: z.string().describe("Main canonical trade category for marketplace matching"),
  locationHint: z.string().nullable().describe("Extracted Mumbai area or neighborhood"),
  budgetHint: z.string().nullable(),
  safetyNote: z.string().nullable(),
});

export type StepAClassification = z.infer<typeof StepAClassificationSchema>;

// Schema for Step B: Detailed 14-Section Honest Project Brief
export const DetailedBriefSchema = z.object({
  title: z.string().describe("Short, plain title (e.g. 'Split AC not cooling')"),
  summary: z.string().describe("2-3 plain sentences restating the problem in customer's own terms"),
  categoryPath: z.array(z.string()).describe("Category > Subcategory > Service path"),
  tradeCategory: z.string(),
  serviceSlug: z.string(),
  whatProWillCheck: z.array(z.string()).describe("4-6 concrete scope bullets pro will inspect"),
  possibleCauses: z.array(z.string()).describe("Hedged possible causes, e.g. 'Can be caused by...'"),
  likelyParts: z.array(z.string()).describe("Parts or consumable materials likely required"),
  estimatedDuration: z.string().describe("Estimated time on site range, e.g. '1 to 2 hours'"),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    label: z.string(),
    disclaimer: z.string(),
  }),
  urgency: z.enum(["emergency", "today", "this_week", "flexible"]),
  urgencyReason: z.string(),
  locationAndAccess: z.string(),
  whatToPrepare: z.array(z.string()).describe("Practical doorstep prep tips for customer"),
  safetyNote: z.string().nullable(),
  openQuestions: z.array(z.string()).describe("Clarifying questions that would refine the estimate"),
  assumptionsMade: z.array(z.string()).describe("Explicit assumptions made by the diagnostic engine"),
  tapQuestions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
    })
  ),
});

export type DetailedProjectBrief = z.infer<typeof DetailedBriefSchema>;

export interface AskKarigharResponse {
  ok: boolean;
  classification: StepAClassification;
  brief: DetailedProjectBrief;
  safetyHazard?: SafetyHazardRule;
  isFallback?: boolean;
}

/**
 * Normalizes trade string into one of the canonical trades.
 */
export function mapToCanonicalTrade(raw: string): CanonicalTrade {
  const t = (raw || "").toLowerCase();
  if (
    t.includes("ac") ||
    t.includes("air cond") ||
    t.includes("cooling") ||
    t.includes("fridge") ||
    t.includes("refrigerat") ||
    t.includes("washing") ||
    t.includes("appliance") ||
    t.includes("compressor") ||
    t.includes("chilled")
  ) {
    return "AC & appliance repair/installation";
  }
  if (
    t.includes("plumb") ||
    t.includes("leak") ||
    t.includes("pipe") ||
    t.includes("drain") ||
    t.includes("tap") ||
    t.includes("faucet") ||
    t.includes("flush") ||
    t.includes("sink") ||
    t.includes("toilet") ||
    t.includes("geyser") ||
    t.includes("water tank")
  ) {
    return "Plumbing repair & installation";
  }
  if (
    t.includes("elect") ||
    t.includes("wire") ||
    t.includes("switch") ||
    t.includes("mcb") ||
    t.includes("light") ||
    t.includes("fan") ||
    t.includes("spark") ||
    t.includes("short") ||
    t.includes("socket") ||
    t.includes("power trip")
  ) {
    return "Electrical repair & installation";
  }
  if (
    t.includes("carpent") ||
    t.includes("wood") ||
    t.includes("furniture") ||
    t.includes("wardrobe") ||
    t.includes("door") ||
    t.includes("table") ||
    t.includes("shelf") ||
    t.includes("cabinet") ||
    t.includes("drawer") ||
    t.includes("plywood")
  ) {
    return "Carpentry & custom furniture";
  }
  if (
    t.includes("paint") ||
    t.includes("color") ||
    t.includes("whitewash") ||
    t.includes("distemper") ||
    t.includes("texture") ||
    t.includes("peeling")
  ) {
    return "Painting & wall finishing";
  }
  if (
    t.includes("waterproof") ||
    t.includes("damp") ||
    t.includes("seepage") ||
    t.includes("moisture") ||
    t.includes("terrace crack")
  ) {
    return "Waterproofing";
  }
  if (
    t.includes("tile") ||
    t.includes("floor") ||
    t.includes("marble") ||
    t.includes("granite") ||
    t.includes("grout")
  ) {
    return "Tiling & flooring";
  }
  if (
    t.includes("pest") ||
    t.includes("termite") ||
    t.includes("cockroach") ||
    t.includes("bedbug") ||
    t.includes("rodent")
  ) {
    return "Pest control";
  }
  if (
    t.includes("smart") ||
    t.includes("lock") ||
    t.includes("automation") ||
    t.includes("cctv")
  ) {
    return "Home automation & smart locks";
  }
  if (t.includes("ceiling") || t.includes("pop") || t.includes("gypsum")) {
    return "False ceiling & POP work";
  }
  if (t.includes("mason") || t.includes("brick") || t.includes("cement") || t.includes("plaster")) {
    return "Masonry & plastering";
  }
  return "General labour / helper";
}

/**
 * Builds an authentic, data-grounded fallback brief from SERVICE_DEFINITIONS
 */
export function buildFallbackBrief(
  query: string,
  canonicalTrade: CanonicalTrade,
  safetyHazard?: SafetyHazardRule
): DetailedProjectBrief {
  let matchedService = Object.values(SERVICE_DEFINITIONS).find(
    (s) => s.canonicalTrade === canonicalTrade
  );

  if (!matchedService) {
    matchedService = SERVICE_DEFINITIONS["ac-repair-diagnostic"];
  }

  const isUrgent = !!safetyHazard || query.toLowerCase().includes("urgent") || query.toLowerCase().includes("burst");

  return {
    title: `${matchedService.name}`,
    summary: `Customer reports: "${query}". Diagnostic inspection and repair recommended for ${matchedService.name} under transparent price-book rates.`,
    categoryPath: [matchedService.categoryName, matchedService.subcategoryName, matchedService.name],
    tradeCategory: canonicalTrade,
    serviceSlug: matchedService.slug,
    whatProWillCheck: matchedService.whatProWillCheck,
    possibleCauses: matchedService.possibleCauses,
    likelyParts: matchedService.likelyParts,
    estimatedDuration: matchedService.typicalDuration,
    priceRange: {
      min: matchedService.priceRange.min,
      max: matchedService.priceRange.max,
      label: `₹${matchedService.priceRange.min} – ₹${matchedService.priceRange.max} ${matchedService.priceRange.unitLabel}`,
      disclaimer: "AI estimate, always non-binding. The pro confirms the final price on-site.",
    },
    urgency: safetyHazard ? "emergency" : isUrgent ? "today" : "this_week",
    urgencyReason: safetyHazard
      ? "Immediate attention recommended due to potential safety hazard."
      : isUrgent
      ? "Same-day inspection advised to prevent further household disruption."
      : "Standard scheduled slot this week.",
    locationAndAccess: "Mumbai (Andheri / Bandra / Powai / Thane). Confirm floor and lift access with specialist.",
    whatToPrepare: matchedService.preparationTips,
    safetyNote: safetyHazard ? safetyHazard.instructions.join(" ") : null,
    openQuestions: [
      "When did you first notice this issue?",
      "Has any repair or part replacement been attempted recently?",
    ],
    assumptionsMade: [
      "Standard residential home setup with accessible utility valves or main power breaker.",
      "Work within regular municipal service boundaries in Mumbai.",
    ],
    tapQuestions: matchedService.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.map((o) => o.label),
    })),
  };
}

/**
 * Central Server Function: "Ask Karighar" Two-Step AI Search Pipeline
 */
export const askKarigharEngine = createServerFn({ method: "POST" })
  .validator((data: { text: string; location?: string; language?: string }) => data)
  .handler(async ({ data }): Promise<AskKarigharResponse> => {
    const rawText = data.text || "";
    const safetyHazard = detectSafetyHazard(rawText);
    const canonicalTrade = mapToCanonicalTrade(rawText);

    // Multi-issue split detection: e.g. "ac not working and tap leaking"
    const lower = rawText.toLowerCase();
    const hasMultipleAnd = lower.includes(" and ") || lower.includes(" aur ") || lower.includes(" & ");
    const isMulti = hasMultipleAnd && (
      (lower.includes("ac") && (lower.includes("tap") || lower.includes("pipe") || lower.includes("wire"))) ||
      (lower.includes("leak") && lower.includes("switch"))
    );

    try {
      // Step A: Fast Classification
      const { object: classification } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: StepAClassificationSchema,
        prompt: `You are Karighar's rapid intent classifier for home services in Mumbai, India.
Classify this user request into our standard service taxonomy:
Query: "${rawText}"
Location: "${data.location || "Mumbai"}"

Canonical Trade Categories:
${CANONICAL_TRADES.map((t) => `- "${t}"`).join("\n")}

Respond strictly according to the schema. Keep primaryTrade matching one of the exact canonical options.`,
      });

      // Step B: Generate Full 14-Section Honest Project Brief
      const { object: brief } = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: DetailedBriefSchema,
        prompt: `You are Karighar's senior home diagnostic engineer in Mumbai.
Generate a structured, scannable, honest project brief for:
Query: "${rawText}"
Classified Trade: "${classification.primaryTrade}"

CRITICAL RULES:
1. Honesty: Never fabricate fixed prices or diagnose with certainty. Use hedged phrasing ("can be caused by", "pro will inspect").
2. Price disclaimer MUST state: "AI estimate, always non-binding. The pro confirms the final price."
3. Language: Match customer's language tone (${classification.language}).
4. Mumbai context: Reference typical Mumbai apartment realities (monsoon dampness, high humidity, inverter load, etc.).
5. Provide 1 or 2 tapQuestions with quick answers (e.g. Split vs Window, Not cooling vs Leaking).`,
      });

      return {
        ok: true,
        classification: {
          ...classification,
          primaryTrade: mapToCanonicalTrade(classification.primaryTrade || canonicalTrade),
        },
        brief: {
          ...brief,
          tradeCategory: mapToCanonicalTrade(brief.tradeCategory || canonicalTrade),
        },
        safetyHazard,
      };
    } catch (e) {
      console.warn("[askKarigharEngine] LLM unavailable, using deterministic Layer 1 fallback:", e);

      const fallbackBrief = buildFallbackBrief(rawText, canonicalTrade, safetyHazard);

      return {
        ok: true,
        isFallback: true,
        classification: {
          language: "en",
          intent: "repair",
          isMultiIssue: isMulti,
          issues: isMulti
            ? [
                {
                  title: "Air Conditioning Service",
                  tradeCategory: "AC & appliance repair/installation",
                  serviceSlug: "ac-repair-diagnostic",
                  urgency: "today",
                },
                {
                  title: "Plumbing Leakage Repair",
                  tradeCategory: "Plumbing repair & installation",
                  serviceSlug: "plumbing-leakage-repair",
                  urgency: "today",
                },
              ]
            : [
                {
                  title: fallbackBrief.title,
                  tradeCategory: canonicalTrade,
                  serviceSlug: fallbackBrief.serviceSlug,
                  urgency: fallbackBrief.urgency,
                },
              ],
          primaryTrade: canonicalTrade,
          locationHint: data.location || "Mumbai",
          budgetHint: null,
          safetyNote: safetyHazard ? safetyHazard.title : null,
        },
        brief: fallbackBrief,
        safetyHazard,
      };
    }
  });

// Keep parseProjectRequest for backwards-compatibility with existing routes
export const parseProjectRequest = createServerFn({ method: "POST" })
  .validator((data: { text: string; date?: string; location?: string }) => data)
  .handler(async ({ data }) => {
    const res = await askKarigharEngine({ data: { text: data.text, location: data.location } });
    return {
      ok: true as const,
      brief: {
        intent: res.classification.intent === "renovation" ? "renovate" : res.classification.intent === "install" ? "build" : "fix",
        summary: res.brief.summary,
        tradeCategory: res.brief.tradeCategory,
        trades: res.brief.tradeCategory,
        location: res.brief.locationAndAccess,
        budget: res.brief.priceRange.label,
        timing: res.brief.urgency === "emergency" ? "Immediate Dispatch" : "Available Today",
        materials: res.brief.likelyParts.join(", "),
        duration: res.brief.estimatedDuration,
        cost: res.brief.priceRange.label,
        scope: res.brief.whatProWillCheck,
        path: res.brief.urgency === "emergency" ? ("emergency" as const) : ("book_now" as const),
      },
    };
  });


export type { AskBrief } from "./project-brief";

export const suggestProjectIdeas = createServerFn({ method: "POST" })
  .validator((data: { text: string }) => data)
  .handler(async () => {
    return {
      ideas: [
        "AC servicing & cooling check in Mumbai",
        "Bathroom concealed pipe leakage repair",
        "Full apartment painting & wall waterproofing",
      ],
    };
  });
