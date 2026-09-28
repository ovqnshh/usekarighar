import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestRenovationPlan, type RenovationPlan } from "@/lib/renovation.functions";

export const Route = createFileRoute("/renovation-planner")({
  head: () => ({ meta: [
    { title: "AI Renovation Planner — Karighar" },
    { name: "description", content: "Upload room photos and get a tailored renovation plan with scope, materials and costs." },
    { property: "og:title", content: "AI Renovation Planner — Karighar" },
    { property: "og:description", content: "Upload room photos and get a tailored renovation plan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: Planner,
});

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Planner() {
  const suggest = useServerFn(suggestRenovationPlan);
  const [images, setImages] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<RenovationPlan | null>(null);

  async function add(files: FileList | null) {
    if (!files) return;
    const next = await Promise.all([...files].filter((f) => f.type.startsWith("image/")).map(resize));
    setImages((cur) => [...cur, ...next].slice(0, 4));
  }
  async function run() {
    setLoading(true); setError(""); setPlan(null);
    try {
      const r = await suggest({ data: { images, notes } });
      if (r.plan) setPlan(r.plan); else setError(r.error ?? "Something went wrong.");
    } catch { setError("Something went wrong. Please try again."); }
    setLoading(false);
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-10 lg:px-10">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="size-4" /> AI Renovation Planner</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Show us your room.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Upload up to 4 photos and we’ll suggest a tailored plan — scope, materials and things to watch out for.</p>

        <div className="mt-8 rounded-3xl border border-border p-5 shadow-float md:p-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl">
                <img src={src} alt={`Room photo ${i + 1}`} className="aspect-square w-full object-cover" />
                <button onClick={() => setImages((c) => c.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background shadow-float"><X className="size-4" /></button>
              </div>
            ))}
            {images.length < 4 ? (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-border text-center text-sm text-muted-foreground hover:bg-muted">
                <span><ImagePlus className="mx-auto mb-2 size-6" />Add photos</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
              </label>
            ) : null}
          </div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know? e.g. ‘Want a modern look, budget ₹3 lakh, 2BHK in Pune’" className="mt-5 min-h-20 rounded-xl" />
          <Button onClick={run} disabled={!images.length || loading} className="mt-5 h-12 w-full rounded-xl text-base">
            {loading ? <><Loader2 className="animate-spin" /> Studying your room…</> : <><Sparkles /> Suggest a renovation plan</>}
          </Button>
          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        </div>

        {plan ? (
          <section className="mt-10 space-y-8" aria-live="polite">
            <div><p className="text-sm font-semibold text-primary">{plan.room}</p><h2 className="mt-1 text-3xl font-bold">Your renovation plan</h2><p className="mt-3 text-muted-foreground">{plan.summary}</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[["Estimated cost", plan.cost_range], ["Estimated duration", plan.duration], ["Likely trades", plan.trades.join(", ")]].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-secondary p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">{l}</p><p className="mt-1 font-semibold">{v}</p></div>
              ))}
            </div>
            <div><h3 className="text-xl font-semibold">Scope of work</h3><ol className="mt-3 space-y-3">{plan.scope.map((s, i) => <li key={i} className="rounded-2xl border border-border p-4"><p className="font-semibold">{i + 1}. {s.title}</p><p className="mt-1 text-sm text-muted-foreground">{s.detail}</p></li>)}</ol></div>
            <div><h3 className="text-xl font-semibold">Materials</h3><div className="mt-3 overflow-hidden rounded-2xl border border-border">{plan.materials.map((m, i) => <div key={i} className="grid gap-1 border-b border-border p-4 last:border-0 sm:grid-cols-[1fr_2fr_auto] sm:gap-4"><p className="font-semibold">{m.item}</p><p className="text-sm text-muted-foreground">{m.suggestion}</p><p className="text-sm font-semibold">{m.estimate}</p></div>)}</div></div>
            <div><h3 className="text-xl font-semibold">Things to consider</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">{plan.considerations.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
            <p className="text-xs text-muted-foreground">These are AI estimates, not guarantees. A professional will confirm scope and cost after a site visit.</p>
            <Button asChild className="h-12 rounded-xl px-6"><Link to="/professionals">Find professionals for this</Link></Button>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
