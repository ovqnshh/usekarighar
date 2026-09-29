import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Hammer, Search, Sparkles, Wrench, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import heroImage from "@/assets/karighar-hero.jpg";
import bathroomImage from "@/assets/bathroom-project.jpg";
import wardrobeImage from "@/assets/wardrobe-project.jpg";
import waterTankImage from "@/assets/water-tank-project.jpg";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { parseProjectRequest } from "@/lib/ask-karighar.functions";

type SearchParams = { intent?: "build" | "renovate" | "fix" };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const value = search["intent"];
    return value === "build" || value === "renovate" || value === "fix" ? { intent: value } : {};
  },
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
  const [date, setDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState<"ask" | "loading" | "brief">("ask");
  const [aiLoading, setAiLoading] = useState(false);
  const [brief, setBrief] = useState<{
    intent: string; summary: string; location: string;
    budget: string; timing: string; trades: string;
    duration: string; cost: string;
  }>({ intent: '', summary: '', location: '', budget: '', timing: '', trades: '', duration: '', cost: '' });

  useEffect(() => { if (intent) askRef.current?.focus(); }, [intent]);

  async function understand() {
    if (!request.trim()) return;
    setStage('loading');
    setAiLoading(true);
    try {
      const result = await parseProjectRequest({
        data: { text: request, ...(date ? { date: format(date, 'PPP') } : {}), ...(location ? { location } : {}) },
      });
      if (result.ok) {
        setBrief(result.brief);
      }
    } catch (e) {
      // fallback: still show brief section even if AI fails
      console.error('AI parse failed', e);
    } finally {
      setAiLoading(false);
      setStage('brief');
    }
  }

  return (
    <PageShell>
      <main>
        <section className="px-5 pt-8 lg:px-10">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl">
            <img src={heroImage} width={1536} height={1024} alt="A craftsperson completing custom cabinetry in a Mumbai home" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-foreground/10" />
            <div className="relative flex min-h-[560px] flex-col items-center justify-end px-5 pb-12 text-center md:min-h-[620px] md:pb-16">
              <h1 className="max-w-4xl text-5xl font-bold leading-[1.02] text-primary-foreground md:text-7xl">Tell Karighar what you want done.</h1>
              <p className="mt-4 max-w-xl text-lg text-primary-foreground/85 md:text-xl">We’ll help you figure out how to get it done.</p>
              <div className="mt-8 w-full max-w-4xl rounded-full bg-background p-2 pl-6 text-left shadow-2xl">
                <div className="flex items-center gap-2 md:divide-x md:divide-border">
                  <div className="min-w-0 flex-[2] pr-4">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><Sparkles className="size-3.5 text-primary" /> What</p>
                    <Textarea ref={askRef} rows={1} value={request} onChange={(event) => setRequest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); understand(); } }} placeholder="Fix my water tank in Andheri..." aria-label="Describe your project" className="min-h-0 resize-none border-0 bg-transparent p-0 text-base text-foreground shadow-none focus-visible:ring-0 md:text-base" />
                  </div>
                  <div className="hidden min-w-0 flex-1 px-4 md:block relative">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><CalendarIcon className="size-3.5 text-primary" /> When</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start text-left font-normal px-0 h-auto py-1 hover:bg-transparent text-base">
                          {date ? format(date, "PPP") : <span className="text-muted-foreground">Add dates</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="hidden min-w-0 flex-1 px-4 md:block relative">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-foreground"><MapPin className="size-3.5 text-primary" /> Where</p>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter street or area" className="h-auto px-0 py-1 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground" />
                  </div>
                  <div className="pl-2">
                    <Button onClick={understand} disabled={!request.trim()} size="lg" className="h-14 shrink-0 rounded-full px-6 text-base" aria-label="Ask Karighar"><Search className="size-5" /><span className="hidden sm:inline ml-2">Search</span></Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-primary-foreground/90"><span className="flex items-center gap-2"><Check className="size-4" /> Clear estimates</span><span className="flex items-center gap-2"><Check className="size-4" /> Verified professionals</span><span className="flex items-center gap-2"><Check className="size-4" /> No booking fee</span></div>
            </div>
          </div>
        </section>

        {stage !== "ask" ? (
          <section className="bg-secondary/70 px-5 py-16 lg:px-8" aria-live="polite">
            <div className="mx-auto max-w-4xl">
              {stage === "loading" ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-6 flex gap-2">{[0, 1, 2].map((item) => <span key={item} className="loading-dot size-3 rounded-full bg-primary" style={{ animationDelay: `${item * 160}ms` }} />)}</div>
                  <h2 className="font-display text-3xl font-semibold">Understanding your request with AI...</h2>
                  <p className="mt-3 text-muted-foreground">Picking out the details that matter…</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-foreground/5 md:p-8">
                  <div className="flex flex-col justify-between gap-3 border-b border-border pb-6 md:flex-row md:items-end">
                    <div><p className="text-sm font-semibold text-primary">Your project brief</p><h2 className="mt-1 font-display text-3xl font-semibold">Here’s what we understood</h2></div>
                    <span className="text-xs text-muted-foreground">Edit anything before you continue</span>
                  </div>
                  <div className="grid gap-x-8 gap-y-5 py-7 md:grid-cols-2">
                    {Object.entries(brief).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        intent: 'Project type', summary: 'Summary', location: 'Location',
                        budget: 'Budget', timing: 'When', trades: 'Trades needed',
                        duration: 'Estimated duration', cost: 'Estimated cost',
                      };
                      return (
                        <label key={key} className={key === 'summary' ? 'md:col-span-2' : ''}>
                          <span className="mb-2 block text-xs font-semibold uppercase text-muted-foreground">{labels[key] ?? key}</span>
                          <Input value={value} onChange={(e) => setBrief((c) => ({ ...c, [key]: e.target.value }))} className="h-11 bg-background" />
                        </label>
                      );
                    })}
                  </div>
                  <p className="mb-5 text-xs leading-5 text-muted-foreground">Durations and costs are early estimates, not guarantees. Your chosen professional will confirm them after reviewing the project.</p>
                  <Button className="h-12 w-full text-base" onClick={() => {
                    sessionStorage.setItem('karighar-brief', JSON.stringify(brief));
                    navigate({ to: '/professionals' });
                  }}><Search /> Find Professionals</Button>
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
                <Button key={item.key} variant="ghost" onClick={() => { setRequest(item.key === "build" ? "I want a custom wardrobe for my bedroom" : item.key === "renovate" ? "I want to renovate my bathroom" : "I need someone to fix a leaking pipe"); askRef.current?.focus(); window.scrollTo({ top: 160, behavior: "smooth" }); }} className="group block h-auto p-0 text-left whitespace-normal hover:bg-transparent">
                  <div className="overflow-hidden rounded-2xl"><img src={item.image} width={1200} height={912} loading="lazy" alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="pt-3"><div className="flex items-center gap-2"><item.icon className="size-4 text-primary" /><span className="font-semibold">{item.title}</span></div><p className="mt-1 text-muted-foreground">{item.copy}</p><p className="mt-1 text-sm"><span className="font-semibold">e.g.</span> {item.example}</p></div>
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}