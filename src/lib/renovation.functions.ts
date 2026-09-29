import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

const Input = z.object({
  images: z.array(z.string().startsWith("data:image/").max(3_000_000)).min(1).max(4),
  notes: z.string().max(1000).default(""),
});

export type RenovationPlan = {
  room: string;
  summary: string;
  scope: { title: string; detail: string }[];
  materials: { item: string; suggestion: string; estimate: string }[];
  considerations: string[];
  trades: string[];
  duration: string;
  cost_range: string;
};

const PlanSchema = z.object({
  room: z.string(),
  summary: z.string(),
  scope: z.array(z.object({ title: z.string(), detail: z.string() })),
  materials: z.array(z.object({ item: z.string(), suggestion: z.string(), estimate: z.string() })),
  considerations: z.array(z.string()),
  trades: z.array(z.string()),
  duration: z.string(),
  cost_range: z.string(),
});

export const suggestRenovationPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ plan?: RenovationPlan; error?: string }> => {
    if (!process.env["GOOGLE_GENERATIVE_AI_API_KEY"]) return { error: "AI is not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY." };
    
    try {
      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: PlanSchema,
        system: "You are a senior Indian home renovation consultant. Study the room photos and propose a practical, tailored renovation plan for an Indian home. Use ₹ for all costs, realistic Indian material brands/options, and mention local considerations (monsoon damp, society permissions, water pressure, wiring age). Costs are rough estimates. Keep each field concise.",
        messages: [
          {
            role: "user",
            content: [
              { type: "text" as const, text: `Customer notes: ${data.notes || "none"}` },
              ...data.images.map(image_url => ({ type: "image" as const, image: image_url }))
            ],
          },
        ],
      });

      return { plan: result.object };
    } catch (e) {
      console.error(e);
      return { error: "The AI couldn't analyse these photos. Try clearer room photos or check API quota." };
    }
  });
