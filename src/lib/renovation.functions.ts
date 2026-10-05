import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export type JobPhotoAnalysis = { title: string; description: string; materials: string[] };

const str = { type: "string" };
const PLAN_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["room", "summary", "scope", "materials", "considerations", "trades", "duration", "cost_range"],
  properties: {
    room: str, summary: str, duration: str, cost_range: str,
    scope: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "detail"], properties: { title: str, detail: str } } },
    materials: { type: "array", items: { type: "object", additionalProperties: false, required: ["item", "suggestion", "estimate"], properties: { item: str, suggestion: str, estimate: str } } },
    considerations: { type: "array", items: str },
    trades: { type: "array", items: str },
  },
};
const JOB_SCHEMA = {
  type: "object", additionalProperties: false, required: ["title", "description", "materials"],
  properties: { title: str, description: str, materials: { type: "array", items: str } },
};

/** Streams a Responses call through Lovable AI Gateway and returns parsed JSON output. */
async function callGateway<T>(system: string, text: string, images: string[], name: string, schema: object): Promise<{ data?: T; error?: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { error: "AI is not configured yet." };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text }, ...images.map((image_url) => ({ type: "input_image", image_url }))] }],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (res.status === 402) return { error: "AI credits have run out for this workspace." };
  if (res.status === 429) return { error: "Too many requests right now — try again in a minute." };
  if (!res.ok || !res.body) return { error: "The AI couldn't analyse these photos. Try clearer photos." };
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
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
        const ev = JSON.parse(payload) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
        if (ev.type === "response.refusal.delta") return { error: "The AI declined to analyse this photo." };
      } catch { /* ignore partial lines */ }
    }
  }
  try { return { data: JSON.parse(out) as T }; } catch { return { error: "The AI returned an unreadable answer. Please try again." }; }
}

const Images = z.array(z.string().startsWith("data:image/").max(3_000_000));

export const suggestRenovationPlan = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ images: Images.min(1).max(4), notes: z.string().max(1000).default("") }).parse(d))
  .handler(async ({ data }): Promise<{ plan?: RenovationPlan; error?: string }> => {
    const r = await callGateway<RenovationPlan>(
      "You are a senior Indian home renovation consultant. Study the room photos and propose a practical, tailored renovation plan for an Indian home. Use ₹ for all costs, realistic Indian material options, and mention local considerations (monsoon damp, society permissions, water pressure, wiring age). Costs are rough estimates. Keep each field concise.",
      `Customer notes: ${data.notes || "none"}`, data.images, "renovation_plan", PLAN_SCHEMA);
    return r.data ? { plan: r.data } : { error: r.error ?? "Something went wrong." };
  });

export const analyzeJobPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ image: z.string().startsWith("data:image/").max(3_000_000) }).parse(d))
  .handler(async ({ data }): Promise<{ result?: JobPhotoAnalysis; error?: string }> => {
    const r = await callGateway<JobPhotoAnalysis>(
      "You look at photos of household problems in Indian homes. Return a short 3-5 word job title, a clear description of what seems wrong, and specific spare parts/materials likely needed (empty list if none are obvious).",
      "Analyse this problem photo.", [data.image], "job_photo", JOB_SCHEMA);
    return r.data ? { result: r.data } : { error: r.error ?? "Something went wrong." };
  });
