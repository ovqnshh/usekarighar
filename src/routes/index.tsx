import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Hammer, Search, Sparkles, Wrench, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { professionals } from "@/lib/karighar-data";
import { useShortlist } from "@/lib/shortlist";
import { Link } from "@tanstack/react-router";
import { Heart, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { parseProjectRequest } from "@/lib/ask-karighar.functions";

type SearchParams = { intent?: "build" | "renovate" | "fix" };

import { Plug, Droplet, Fan, PaintRoller, BrickWall, Umbrella, LayoutGrid, Box, Lock, Bug, Users, Home } from 'lucide-react';

const TRADES = [
  { label: 'Electrical repair & installation', icon: Plug },
  { label: 'Plumbing repair & installation', icon: Droplet },
  { label: 'AC & appliance repair/installation', icon: Fan },
  { label: 'Carpentry & custom furniture', icon: Hammer },
  { label: 'Painting & wall finishing', icon: PaintRoller },
  { label: 'Masonry & plastering', icon: BrickWall },
  { label: 'Waterproofing', icon: Umbrella },
  { label: 'Tiling & flooring', icon: LayoutGrid },
  { label: 'False ceiling & POP work', icon: Box },
  { label: 'Home automation & smart locks', icon: Lock },
  { label: 'Pest control', icon: Bug },
  { label: 'General labour / helper', icon: Users },
];

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
  const { has, toggle } = useShortlist();
  const { intent } = Route.useSearch();
  const navigate = useNavigate();
  const askRef = useRef<HTMLTextAreaElement>(null);
  const [request, setRequest] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
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
    if (!aiPrompt.trim()) return;
    setStage('loading');
    setAiLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const result = await parseProjectRequest({
        data: { text: aiPrompt, ...(date ? { date: format(date, 'PPP') } : {}), ...(location ? { location } : {}) },
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

  const searchBar = (
    <div className="flex flex-col items-center gap-6 pb-4">
      <div className="mx-auto mt-2 w-full max-w-4xl rounded-full border border-border bg-background p-2 pl-8 shadow-float">
        <div className="flex items-center md:divide-x md:divide-border">
          <div className="min-w-0 flex-[2] pr-4">
            <p className="text-xs font-semibold">What</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full truncate text-left text-base text-foreground focus:outline-none">{request || <span className="text-muted-foreground">Select a service</span>}</button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-3xl p-2" align="start">
                <div className="max-h-72 overflow-y-auto no-scrollbar">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Services</p>
                  {TRADES.map((t) => (
                    <button key={t.label} onClick={() => setRequest(t.label)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted">
                      <t.icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="hidden min-w-0 flex-1 px-6 md:block">
            <p className="text-xs font-semibold">When</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full truncate text-left text-base">{date ? format(date, "PPP") : <span className="text-muted-foreground">Add dates</span>}</button>
              </PopoverTrigger>
              <PopoverContent className="w-auto rounded-3xl p-2" align="center"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
            </Popover>
          </div>
          <div className="hidden min-w-0 flex-1 px-6 md:block">
            <p className="text-xs font-semibold">Where</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full truncate text-left text-base">{location || <span className="text-muted-foreground">Search neighbourhoods</span>}</button>
              </PopoverTrigger>
              <PopoverContent className="mt-4 w-80 overflow-hidden rounded-3xl p-0" align="start">
                <div className="border-b border-border p-2"><Input autoFocus value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search by neighbourhood..." className="h-10 rounded-xl border-0 shadow-none focus-visible:ring-0" /></div>
                <div className="max-h-72 overflow-y-auto p-2">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">Suggested areas</p>
                  {["Andheri West", "Bandra", "Juhu", "Colaba", "Navi Mumbai", "Powai"].map((loc) => (
                    <button key={loc} onClick={() => setLocation(loc)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted"><MapPin className="size-5" /></span>
                      <span><span className="block text-sm font-semibold">{loc}</span><span className="text-xs text-muted-foreground">Mumbai, Maharashtra</span></span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={() => navigate({ to: '/professionals', search: { category: request, location } })} disabled={!request} className="ml-2 size-12 shrink-0 rounded-full p-0 md:size-14" aria-label="Ask Karighar"><Search className="size-5" /></Button>
        </div>
      </div>
      
      {/* Categories Row */}
      <div className="w-full max-w-[1760px] mx-auto flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth px-5 mt-6 pb-2">
        {TRADES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              to="/professionals"
              search={{ category: t.label }}
              className="group flex shrink-0 flex-col items-center gap-2 transition-all duration-300 pb-2 text-muted-foreground hover:text-foreground hover:border-foreground/30 border-b-2 border-transparent"
            >
              <Icon className="size-6 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xs font-medium whitespace-nowrap transition-colors duration-300">
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <PageShell headerExtra={searchBar}>
      <main className="animate-in fade-in duration-500">
        
        {/* AI Assistant Banner */}
        <section className="mx-auto max-w-[1760px] px-5 py-12 md:px-10 xl:px-20">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-secondary/30 p-6 md:p-10 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-display flex items-center gap-2"><Sparkles className="size-6 text-primary" /> Not sure what you need? Let AI help</h2>
              <p className="mt-2 text-muted-foreground">Describe your issue in your own words, or upload a photo of the problem.</p>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <Textarea 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); understand(); } }}
                  placeholder="e.g. My bathroom tile is broken and I don't know who to call..." 
                  className="bg-background h-[60px] rounded-xl flex-1 resize-none py-4 px-4 overflow-hidden" 
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" className="h-[60px] px-6 shrink-0 rounded-xl bg-background hover:bg-muted font-medium text-muted-foreground" aria-label="Upload photo" onClick={() => document.getElementById('photo-upload')?.click()}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    Add photo
                  </Button>
                  <input type="file" id="photo-upload" className="hidden" accept="image/*" />
                  <Button onClick={understand} disabled={!aiPrompt.trim()} className="h-[60px] px-8 rounded-xl shrink-0 font-semibold w-full sm:w-auto">
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="hidden lg:block w-80 shrink-0">
              <div className="rounded-2xl border border-border bg-background p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3"><Sparkles className="size-5 text-primary/40" /></div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">AI Diagnosis</p>
                <p className="text-sm font-medium leading-relaxed">"Based on your description, this looks like a localized tile replacement job."</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[11px] font-semibold bg-muted px-2 py-1 rounded">Tiling & flooring</span>
                  <span className="text-[11px] font-semibold bg-muted px-2 py-1 rounded">₹1,500 - ₹3,000</span>
                </div>
              </div>
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
                    navigate({ to: '/professionals', search: { category: brief.trades, location: brief.location !== 'Location not specified' ? brief.location : undefined } });
                  }}><Search /> Find Professionals</Button>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <Row title="Top-rated Karighars in Mumbai">
          {professionals.map((p) => (
            <Card key={p.id} to={p.id} img={p.portfolio[0]} saved={has(p.id)} onSave={() => toggle(p.id)} tag="Karighar favourite" title={p.business} sub={`${p.trade} · ★ ${p.rating}`} />
          ))}
          {professionals.map((p) => (
            <Card key={p.id + "b"} to={p.id} img={p.image} saved={has(p.id)} onSave={() => toggle(p.id)} title={p.name} sub={`From ₹${p.price} · ★ ${p.rating}`} />
          ))}
        </Row>
        <Row title="Start with your goal">
          {intentions.map((item) => (
            <button key={item.key} onClick={() => { setRequest(item.key === "build" ? "I want a custom wardrobe for my bedroom" : item.key === "renovate" ? "I want to renovate my bathroom" : "I need someone to fix a leaking pipe"); window.scrollTo({ top: 0, behavior: "smooth" }); askRef.current?.focus(); }} className="group w-[72vw] shrink-0 snap-start text-left sm:w-auto">
              <div className="overflow-hidden rounded-2xl"><img src={item.image} loading="lazy" alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <p className="mt-2 flex items-center gap-1.5 font-semibold"><item.icon className="size-4 text-primary" />{item.title}</p>
              <p className="text-sm text-muted-foreground">e.g. {item.example}</p>
            </button>
          ))}
        </Row>
        <Row title="Available today near Powai">
          {[...professionals].reverse().map((p) => (
            <Card key={p.id} to={p.id} img={p.portfolio[1]} saved={has(p.id)} onSave={() => toggle(p.id)} title={p.city.split(",")[0]} sub={`${p.availability} · ★ ${p.rating}`} />
          ))}
        </Row>
      </main>
    </PageShell>
  );
}
function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1760px] px-5 pt-10 md:px-10 xl:px-20">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold">{title}<span className="grid size-7 place-items-center rounded-full bg-muted"><ChevronRight className="size-4" /></span></h2>
      <div className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">{children}</div>
    </section>
  );
}

function Card({ to, img, title, sub, saved, onSave, tag }: { to: string; img: string; title: string; sub: string; saved: boolean; onSave: () => void; tag?: string }) {
  return (
    <div className="group relative w-[44vw] shrink-0 snap-start sm:w-auto">
      <Link to="/professionals/$id" params={{ id: to }}>
        <div className="overflow-hidden rounded-2xl"><img src={img} loading="lazy" alt={title} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /></div>
        {tag ? <span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold shadow-float">{tag}</span> : null}
        <p className="mt-2 truncate font-semibold">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{sub}</p>
      </Link>
      <button onClick={onSave} aria-label={saved ? "Remove from shortlist" : "Save to shortlist"} className="absolute right-3 top-3 transition-transform active:scale-90">
        <Heart className={`size-6 stroke-background stroke-2 drop-shadow ${saved ? "fill-primary" : "fill-foreground/40"}`} />
      </button>
    </div>
  );
}
