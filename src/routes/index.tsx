import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Hammer, Search, Sparkles, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroImage from "@/assets/karighar-hero.jpg";
import bathroomImage from "@/assets/bathroom-project.jpg";
import wardrobeImage from "@/assets/wardrobe-project.jpg";
import waterTankImage from "@/assets/water-tank-project.jpg";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = { intent?: "build" | "renovate" | "fix" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    intent: search.intent === "build" || search.intent === "renovate" || search.intent === "fix" ? search.intent : undefined,
  }),
  head: () => ({ meta: [
    { title: "Karighar — Tell us what your home needs" },
    { name: "description", content: "Turn any home idea or repair into a clear brief and meet trusted professionals near you." },
    { property: "og:title", content: "Karighar — Tell us what your home needs" },
    { property: "og:description", content: "Turn any home idea or repair into a clear brief and meet trusted professionals near you." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Index,
});

const intentions = [
  { key: "build", title: "Build", example: "Custom wardrobe", copy: "Create something new for your space", icon: Hammer, image: wardrobeImage },
  { key: "renovate", title: "Renovate", example: "Bathroom renovation", copy: "Improve what you already have", icon: Sparkles, image: bathroomImage },
  { key: "fix", title: "Fix", example: "Leaking pipe", copy: "Repair or restore what isn't working", icon: Wrench, image: waterTankImage },
] as const;

function Index() {
  const { intent } = Route.useSearch();
  const navigate = useNavigate();
  const askRef = useRef<HTMLTextAreaElement>(null);
  const [request, setRequest] = useState(intent === "build" ? "I want a custom wardrobe for my bedroom" : intent === "renovate" ? "I want to renovate my bathroom" : intent === "fix" ? "I need someone to fix a leaking pipe" : "");
  const [stage, setStage] = useState<"ask" | "loading" | "brief">("ask");
  const [brief, setBrief] = useState({
    intent: "Fix",
    summary: "Inspect and repair the water tank connection and stop the leak",
    location: "Andheri West, Mumbai",
    budget: "Around ₹2,000",
    timing: "Tomorrow morning",
    trades: "Plumber · Water tank specialist",
    duration: "1–2 hours",
    cost: "₹1,200–₹2,400",
  });

  useEffect(() => { if (intent) askRef.current?.focus(); }, [intent]);

  function understand() {
    if (!request.trim()) return;
    setStage("loading");
    window.setTimeout(() => setStage("brief"), 1200);
  }

  return (
    <PageShell>
      <main>
        <section className="relative min-h-[650px] overflow-hidden md:min-h-[720px]">
          <img src={heroImage} width={1536} height={1024} alt="A craftsperson completing custom cabinetry in a Mumbai home" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-transparent" />
          <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-5 py-16 md:min-h-[720px] lg:px-8">
            <div className="w-full max-w-3xl text-primary-foreground">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.14em]">Your project starts with a conversation</p>
              <h1 className="font-display text-5xl font-semibold leading-[1.02] md:text-7xl">Tell Karighar what you want done.</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-primary-foreground/85 md:text-xl">We’ll help you figure out how to get it done.</p>
              <div className="mt-9 rounded-lg bg-background p-2 shadow-2xl shadow-foreground/20">
                <div className="flex items-end gap-2">
                  <Textarea ref={askRef} value={request} onChange={(event) => setRequest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); understand(); } }} placeholder="Try “I need someone tomorrow to fix my water tank in Andheri…”" aria-label="Describe your project" className="min-h-20 resize-none border-0 bg-transparent px-4 py-4 text-base text-foreground shadow-none focus-visible:ring-0" />
                  <Button onClick={understand} disabled={!request.trim()} size="lg" className="mb-1 size-13 shrink-0 rounded-md p-0" aria-label="Ask Karighar"><ArrowRight className="size-5" /></Button>
                </div>
                <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> Describe it naturally — no trade names needed</div>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-foreground/90"><span className="flex items-center gap-2"><Check className="size-4" /> Clear estimates</span><span className="flex items-center gap-2"><Check className="size-4" /> Verified professionals</span><span className="flex items-center gap-2"><Check className="size-4" /> No booking fee</span></div>
            </div>
          </div>
        </section>

        {stage !== "ask" ? (
          <section className="bg-secondary/70 px-5 py-16 lg:px-8" aria-live="polite">
            <div className="mx-auto max-w-4xl">
              {stage === "loading" ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-6 flex gap-2">{[0, 1, 2].map((item) => <span key={item} className="loading-dot size-3 rounded-full bg-primary" style={{ animationDelay: `${item * 160}ms` }} />)}</div>
                  <h2 className="font-display text-3xl font-semibold">Understanding your request</h2>
                  <p className="mt-3 text-muted-foreground">Picking out the details that matter…</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-foreground/5 md:p-8">
                  <div className="flex flex-col justify-between gap-3 border-b border-border pb-6 md:flex-row md:items-end">
                    <div><p className="text-sm font-semibold text-primary">Your project brief</p><h2 className="mt-1 font-display text-3xl font-semibold">Here’s what we understood</h2></div>
                    <span className="text-xs text-muted-foreground">Edit anything before you continue</span>
                  </div>
                  <div className="grid gap-x-8 gap-y-5 py-7 md:grid-cols-2">
                    {Object.entries(brief).map(([key, value]) => (
                      <label key={key} className={key === "summary" ? "md:col-span-2" : ""}>
                        <span className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">{key === "trades" ? "Likely trades · estimate" : key === "duration" || key === "cost" ? `Estimated ${key}` : key}</span>
                        <Input value={value} onChange={(event) => setBrief((current) => ({ ...current, [key]: event.target.value }))} className="h-11 bg-background" />
                      </label>
                    ))}
                  </div>
                  <p className="mb-5 text-xs leading-5 text-muted-foreground">Durations and costs are early estimates, not guarantees. Your chosen professional will confirm them after reviewing the project.</p>
                  <Button className="h-12 w-full text-base" onClick={() => navigate({ to: "/professionals" })}><Search /> Find Professionals</Button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="px-5 py-18 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-xl"><p className="text-sm font-semibold text-primary">Start with your goal</p><h2 className="mt-2 font-display text-4xl font-semibold">What would you like to do?</h2></div>
            <div className="grid gap-5 md:grid-cols-3">
              {intentions.map((item) => (
                <button key={item.key} onClick={() => { setRequest(item.key === "build" ? "I want a custom wardrobe for my bedroom" : item.key === "renovate" ? "I want to renovate my bathroom" : "I need someone to fix a leaking pipe"); askRef.current?.focus(); window.scrollTo({ top: 160, behavior: "smooth" }); }} className="group overflow-hidden rounded-lg border border-border bg-card text-left transition hover:-translate-y-1 hover:shadow-xl">
                  <img src={item.image} width={1200} height={912} loading="lazy" alt="" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  <div className="p-5"><div className="flex items-center gap-2 text-primary"><item.icon className="size-5" /><span className="text-sm font-semibold">{item.title}</span></div><p className="mt-3 text-xl font-semibold">{item.copy}</p><p className="mt-3 text-sm text-muted-foreground">For example: {item.example}</p></div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}