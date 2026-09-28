import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

const str = { type: "string" };
const schema = {
  type: "object",
  additionalProperties: false,
  required: ["room", "summary", "scope", "materials", "considerations", "trades", "duration", "cost_range"],
  properties: {
    room: str, summary: str, duration: str, cost_range: str,
    scope: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "detail"], properties: { title: str, detail: str } } },
    materials: { type: "array", items: { type: "object", additionalProperties: false, required: ["item", "suggestion", "estimate"], properties: { item: str, suggestion: str, estimate: str } } },
    considerations: { type: "array", items: str },
    trades: { type: "array", items: str },
  },
};

export const suggestRenovationPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ plan?: RenovationPlan; error?: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI is not configured." };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: "You are a senior Indian home renovation consultant. Study the room photos and propose a practical, tailored renovation plan for an Indian home. Use ₹ for all costs, realistic Indian material brands/options, and mention local considerations (monsoon damp, society permissions, water pressure, wiring age). Costs are rough estimates. Keep each field concise.",
        input: [{ role: "user", content: [
          { type: "input_text", text: `Customer notes: ${data.notes || "none"}` },
          ...data.images.map((image_url) => ({ type: "input_image", image_url })),
        ] }],
        text: { format: { type: "json_schema", name: "renovation_plan", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429) return { error: "Too many requests right now — please try again in a minute." };
      if (res.status === 402) return { error: "AI credits have run out for this workspace." };
      return { error: `Couldn't create a plan (error ${res.status}).` };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "", refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as { type: string; delta?: string };
          if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
          if (ev.type === "response.refusal.delta") refused = true;
        } catch { /* partial */ }
      }
    }
    if (refused || !out) return { error: "The AI couldn't analyse these photos. Try clearer room photos." };
    try { return { plan: JSON.parse(out) as RenovationPlan }; } catch { return { error: "The AI returned an incomplete plan. Please try again." }; }
  });
