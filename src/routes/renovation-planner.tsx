import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Sparkles, X, ChevronRight, Check } from "lucide-react";
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
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        {/* Header */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" strokeWidth={1.5} />
            AI Project Scoping
          </span>
          <h1 className="mt-3 font-display text-3xl md:text-5xl font-semibold text-foreground">
            Plan your room renovation
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-xl leading-relaxed">
            Upload up to 4 photos of your room. Our assistant will identify trades, draft a work scope, and estimate material costs.
          </p>
        </div>

        {/* Upload Card */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-warm-xs">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-border aspect-square">
                <img src={src} alt={`Room photo ${i + 1}`} className="size-full object-cover" />
                <button
                  onClick={() => setImages((c) => c.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 shadow-warm-xs backdrop-blur-sm transition-transform hover:scale-110"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-4 text-center transition-all hover:border-primary/40 hover:bg-primary/5">
                <ImagePlus className="size-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" strokeWidth={1.5} />
                <span className="text-xs font-medium text-foreground">Add photo</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{4 - images.length} remaining</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => { void add(e.target.files); e.target.value = ""; }}
                />
              </label>
            )}
          </div>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us any specifics: e.g. ‘Modern kitchen cabinets, budget ₹2.5 lakh, 2BHK in Thane’"
            className="mt-5 min-h-[90px] rounded-xl"
          />

          <Button
            onClick={run}
            disabled={!images.length || loading}
            className="mt-5 h-12 w-full rounded-xl text-sm font-semibold shadow-warm transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Analysing room details…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" strokeWidth={1.5} />
                Generate Renovation Plan
              </>
            )}
          </Button>

          {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        </div>

        {/* Resulting Plan */}
        {plan && (
          <section className="mt-12 space-y-8 animate-in fade-in duration-300" aria-live="polite">
            <div className="border-b border-border pb-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">{plan.room}</span>
              <h2 className="mt-1 font-display text-2xl md:text-3xl font-semibold text-foreground">Your Tailored Plan</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{plan.summary}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Estimated Cost", plan.cost_range],
                ["Estimated Duration", plan.duration],
                ["Required Trades", plan.trades.join(", ")],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-border bg-surface-subtle p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{l}</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>

            {/* Scope of Work */}
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">Recommended Scope</h3>
              <div className="space-y-3">
                {plan.scope.map((s, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-warm-xs">
                    <p className="text-sm font-semibold text-foreground">
                      {i + 1}. {s.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Breakdown */}
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-4">Materials & Finishes</h3>
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-warm-xs">
                {plan.materials.map((m, i) => (
                  <div
                    key={i}
                    className="grid gap-2 border-b border-border p-4 last:border-0 sm:grid-cols-[1.5fr_2fr_1fr] sm:items-center sm:gap-4 text-xs"
                  >
                    <p className="font-medium text-foreground">{m.item}</p>
                    <p className="text-muted-foreground">{m.suggestion}</p>
                    <p className="font-semibold text-foreground sm:text-right">{m.estimate}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Things to Consider */}
            <div className="rounded-xl border border-border bg-surface-subtle p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">Key Considerations</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {plan.considerations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Estimates are generated by AI and may vary based on exact room dimensions and materials chosen.
              </p>
              <Button asChild className="rounded-xl shrink-0" size="lg">
                <Link to="/professionals">
                  Find professionals for this
                  <ChevronRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
