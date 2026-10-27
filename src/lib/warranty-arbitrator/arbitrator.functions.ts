import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const apiKey =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  "";

const google = createGoogleGenerativeAI({ apiKey });

export const WarrantyVerdictSchema = z.object({
  aiMatchScore: z.number().min(0).max(1).describe("Score representing whether the new failure is directly related to original repaired work"),
  aiVerdict: z.enum([
    "WARRANTY_APPROVED_REWORK",
    "NEW_ISSUE_DISCOUNTED_VISIT",
    "MANUAL_REVIEW_REQUIRED",
  ]),
  engineeringReasoning: z.string().describe("Clear architectural breakdown comparing original work with reported failure"),
  recommendedAction: z.string().describe("Next operational step for customer and technician"),
  customerSummary: z.string().describe("Plain English message shown to customer"),
});

export type WarrantyVerdict = z.infer<typeof WarrantyVerdictSchema>;

/**
 * Feature 15 Core: Arbitrate a warranty dispute between customer claim and original job record
 */
export async function arbitrateWarrantyDisputeCore(data: {
  complaintDescription: string;
  originalTrade: string;
  originalScope: string;
  partsReplacedList?: string[];
  daysSinceCompletion: number;
}): Promise<{ ok: boolean; verdict: WarrantyVerdict; error?: string }> {
  const days = data.daysSinceCompletion;

  // Rule: Beyond 30 days (or 180 for waterproofing), standard warranty has elapsed
  const maxWarrantyDays = data.originalTrade.toLowerCase().includes("waterproof") ? 180 : 30;

  if (days > maxWarrantyDays) {
    return {
      ok: true,
      verdict: {
        aiMatchScore: 0.1,
        aiVerdict: "NEW_ISSUE_DISCOUNTED_VISIT",
        engineeringReasoning: `Job completed ${days} days ago, exceeding the ${maxWarrantyDays}-day SafePay rework warranty window.`,
        recommendedAction: "Offer customer 15% loyalty discount on fresh diagnostic visit.",
        customerSummary: `Your ${maxWarrantyDays}-day rework warranty ended ${days - maxWarrantyDays} days ago. As a valued Karighar member, we have unlocked a 15% discount for a fresh inspection.`,
      },
    };
  }

  try {
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const prompt = `You are Karighar's Chief Warranty & Quality Ombudsman in Mumbai, India.
A homeowner has raised a warranty re-work dispute:
- Original Trade Serviced: "${data.originalTrade}"
- Original Scope of Repair: "${data.originalScope}"
- Original Replaced Parts: "${(data.partsReplacedList || []).join(", ") || "Standard fittings"}"
- Days Since Completion: ${days} days (within ${maxWarrantyDays}-day active warranty)
- Customer New Complaint: "${data.complaintDescription}"

Determine:
1. Is the customer's complaint about the EXACT SAME fixture / pipe / circuit that was repaired, or a completely different fixture in another area?
2. Verdict:
   - "WARRANTY_APPROVED_REWORK" if the repaired joint, tap cartridge, or switch failed again.
   - "NEW_ISSUE_DISCOUNTED_VISIT" if it is a completely separate failure (e.g. kitchen sink was repaired, now balcony tap is leaking).
   - "MANUAL_REVIEW_REQUIRED" if ambiguous.`;

    const { object } = await generateObject({
      model: google("gemini-3.1-flash-lite"),
      schema: WarrantyVerdictSchema,
      prompt,
    });

    return { ok: true, verdict: object };
  } catch (err: unknown) {
    // Deterministic fallback based on keyword overlap
    const complaint = data.complaintDescription.toLowerCase();
    const original = (data.originalScope + " " + data.originalTrade).toLowerCase();

    // Check if complaint relates to same component
    const hasSameComponent =
      (complaint.includes("pipe") && original.includes("pipe")) ||
      (complaint.includes("tap") && original.includes("tap")) ||
      (complaint.includes("diverter") && original.includes("diverter")) ||
      (complaint.includes("switch") && original.includes("switch")) ||
      (complaint.includes("mcb") && original.includes("mcb")) ||
      (complaint.includes("leak") && original.includes("leak"));

    const isDifferentLocation =
      (complaint.includes("other") || complaint.includes("another") || complaint.includes("kitchen")) &&
      original.includes("bathroom");

    if (hasSameComponent && !isDifferentLocation) {
      return {
        ok: true,
        verdict: {
          aiMatchScore: 0.92,
          aiVerdict: "WARRANTY_APPROVED_REWORK",
          engineeringReasoning: "Customer complaint matches the same physical assembly and trade serviced within the 30-day warranty window.",
          recommendedAction: "Auto-dispatch original verified technician for free on-site rework. Escrow penalty applied if pro refuses.",
          customerSummary: "Warranty Approved: A free rework visit has been booked with your technician under Karighar SafePay Warranty protection.",
        },
      };
    }

    return {
      ok: true,
      verdict: {
        aiMatchScore: 0.35,
        aiVerdict: "NEW_ISSUE_DISCOUNTED_VISIT",
        engineeringReasoning: "The reported issue involves a distinct fixture or location from the originally itemized invoice scope.",
        recommendedAction: "Dispatch technician with 15% goodwill customer voucher.",
        customerSummary: "New Issue Detected: This appears to be a separate fixture from your previous repair. We've applied a 15% discount for a verified inspection.",
      },
    };
  }
}
