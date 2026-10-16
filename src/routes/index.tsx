import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Hammer, Search, Sparkles, Wrench, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import bathroomImage from "@/assets/bathroom-project.jpg";
import wardrobeImage from "@/assets/wardrobe-project.jpg";
import waterTankImage from "@/assets/water-tank-project.jpg";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { professionals } from "@/lib/karighar-data";
import { useShortlist } from "@/lib/shortlist";
import { Link } from "@tanstack/react-router";
import { Heart, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ProjectBrief } from "@/components/project-brief";
import type { AskBrief } from "@/lib/project-brief";
import { services } from "@/lib/services";
import { parseProjectRequest, suggestProjectIdeas } from "@/lib/ask-karighar.functions";

type SearchParams = { intent?: "build" | "renovate" | "fix" };

import { Plug, Droplet, Fan, PaintRoller, BrickWall, Umbrella, LayoutGrid, Box, Lock, Bug, Users, Home } from 'lucide-react';

const TRADES = services.filter(s => s.id);

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
  const [brief, setBrief] = useState<AskBrief | null>(null);
  const parseRequest = useServerFn(parseProjectRequest);
  const getIdeas = useServerFn(suggestProjectIdeas);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  useEffect(() => { if (intent) askRef.current?.focus(); }, [intent]);
  async function loadIdeas() {
    if(aiPrompt.trim().length<3) return;
    setIdeasLoading(true); setIdeasOpen(true); setAiError('');
    try { const r=await getIdeas({data:{text:aiPrompt}});setIdeas(r.ideas); }
    catch(e){setAiError(e instanceof Error?e.message:'Ideas are unavailable right now.');}
    finally{setIdeasLoading(false);}
  }
  async function understand() {
    if(aiPrompt.trim().length<3 || aiLoading) return;
    setStage('loading');setAiLoading(true);setAiError('');setIdeasOpen(false);
    try {
      const r=await parseRequest({data:{text:aiPrompt,...(date?{date:format(date,'yyyy-MM-dd')}:{}),...(location?{location}:{})}});
      setBrief(r.brief);setStage('brief');
    } catch(e){setAiError(e instanceof Error?e.message:'Unable to prepare your brief.');setStage('ask');}
    finally{setAiLoading(false);}
  }

  const searchBar = (
    <div className="flex flex-col items-center gap-6 pb-4">
      <div className="mx-auto mt-2 w-full max-w-4xl rounded-full border border-border bg-background p-2 pl-8 shadow-float">
        <div className="flex items-center md:divide-x md:divide-border">
          <div className="min-w-0 flex-[2] pr-4 flex flex-col justify-center">
            <p className="text-xs font-semibold pl-1 mb-0.5">What</p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="w-full text-left text-base text-foreground focus:outline-none flex items-center gap-2 pl-1">
                  {request ? (
                    <>
                      {(() => {
                        const Icon = TRADES.find(t => t.id === request)?.icon;
                        return Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null;
                      })()}
                      <span className="truncate">{TRADES.find(t=>t.id===request)?.label ?? request}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Select a service</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-3xl p-2" align="start">
                <div className="max-h-72 overflow-y-auto no-scrollbar">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Services</p>
                  {TRADES.map((t) => (
                    <PopoverClose asChild key={t.label}>
                      <button onClick={() => setRequest(t.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted">
                        <t.icon className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    </PopoverClose>
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
                  <button 
                    onClick={() => {
                      toast.loading("Detecting location...", { id: "gps" });
                      navigator.geolocation.getCurrentPosition(async (pos) => {
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                          const data = await res.json();
                          if (data.address) {
                            setLocation(data.address.suburb || data.address.neighbourhood || data.address.city || data.address.state_district || 'My Location');
                            toast.success("Location updated!", { id: "gps" });
                          }
                        } catch (e) {
                          toast.error("Failed to detect location", { id: "gps" });
                        }
                      }, () => toast.error("Location permission denied", { id: "gps" }));
                    }} 
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted mb-2 text-primary"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10"><MapPin className="size-5" /></span>
                    <span className="block text-sm font-semibold">Use my current location</span>
                  </button>
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
    </div>
  );

  return (
    <PageShell headerExtra={searchBar}>
      <main className="animate-in fade-in duration-500">
        
        <section className="mx-auto max-w-6xl px-5 pt-8 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5"><div><p className="text-sm font-medium text-primary mb-2">ASK KARIGHAR</p><h1 className="text-3xl font-semibold">What does your home need?</h1><p className="mt-2 text-muted-foreground">A small fix or a fresh start. Tell us what you have in mind.</p></div><Button asChild variant="ghost" className="rounded-full"><Link to="/renovation-planner">Plan from a room photo <ArrowRight className="size-4"/></Link></Button></div>
          <div className="relative rounded-2xl border border-border bg-background shadow-float p-4">
            <Textarea ref={askRef} aria-label="Describe your project" value={aiPrompt} onChange={e=>{setAiPrompt(e.target.value);setIdeasOpen(false);}} placeholder="For example, my bathroom has damp walls and I’d like to replace the tiles…" rows={2} className="border-0 shadow-none resize-none focus-visible:ring-0 text-base"/>
            <div className="flex flex-wrap justify-between items-center gap-3 mt-3"><Button variant="ghost" onClick={loadIdeas} disabled={aiPrompt.trim().length<3||ideasLoading||aiLoading} className="rounded-full"><Sparkles className="size-4"/>{ideasLoading?'Finding ideas…':'Suggest ideas'}</Button><Button onClick={understand} disabled={aiPrompt.trim().length<3||aiLoading} className="rounded-full px-6">{aiLoading?'Preparing brief…':'Create project brief'}<ArrowRight className="size-4"/></Button></div>
            {ideasOpen&&<div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-border bg-popover p-2 shadow-float" aria-label="AI project ideas">{ideasLoading?<p className="p-4 text-sm text-muted-foreground">Finding ideas for your home…</p>:ideas.map((idea,i)=><Button key={i} variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-xl py-3 text-left" onClick={()=>{setAiPrompt(idea);setIdeasOpen(false);}}><ArrowRight className="size-4 shrink-0"/>{idea}</Button>)}</div>}
          </div>
          {aiError&&<p role="alert" className="mt-4 text-sm text-destructive">{aiError}</p>}
          {stage==='loading'&&<div aria-live="polite" className="py-14 text-center"><div className="mx-auto mb-4 size-7 animate-spin rounded-full border-2 border-primary border-t-transparent"/><h2 className="text-xl font-semibold">Preparing your project brief</h2><p className="mt-2 text-muted-foreground">Scope, materials, estimates and the details to confirm.</p></div>}
        </section>
        {stage==='brief'&&brief&&<ProjectBrief brief={brief} onChange={setBrief} onContinue={()=>{sessionStorage.setItem('karighar-brief',JSON.stringify(brief));navigate({to:'/professionals',search:{category:brief.trades,...(brief.location?{location:brief.location}:{})}});}}/>}

        <Row title="Top-rated Karighars in Mumbai">
          {professionals.map((p) => (
            <Card key={p.id} to={p.id} img={p.portfolio[0]} saved={has(p.id)} onSave={() => toggle(p.id)} tag="Featured storefront" title={p.business} sub={`${p.trade} · ★ ${p.rating}`} />
          ))}
          {professionals.map((p) => (
            <Card key={p.id + "b"} to={p.id} img={p.image} saved={has(p.id)} onSave={() => toggle(p.id)} title={p.name} sub={`From ₹${p.price} · ★ ${p.rating}`} />
          ))}
        </Row>
        <Row title="Start with your goal">
          {intentions.map((item) => (
            <button key={item.key} onClick={() => { setAiPrompt(item.key === "build" ? "I want a custom wardrobe for my bedroom" : item.key === "renovate" ? "I want to renovate my bathroom" : "I need someone to fix a leaking pipe"); window.scrollTo({ top: 0, behavior: "smooth" }); askRef.current?.focus(); }} className="group w-[72vw] shrink-0 snap-start text-left sm:w-auto">
              <div className="overflow-hidden rounded-2xl"><img src={item.image} loading="lazy" alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <p className="mt-2 flex items-center gap-1.5 font-semibold"><item.icon className="size-4 text-primary" />{item.title}</p>
              <p className="text-sm text-muted-foreground">e.g. {item.example}</p>
            </button>
          ))}
        </Row>
        <Row title="Explore local Karighar storefronts">
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
    <div className="group relative w-[44vw] shrink-0 snap-start sm:w-auto p-2 -m-2 transition-all duration-400 ease-out hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:bg-card active:scale-[0.98] rounded-2xl">
      <Link to="/professionals/$id" params={{ id: to }} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl block">
        <div className="overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-all duration-400"><img src={img} loading="lazy" alt={title} className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" /></div>
        {tag ? <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold shadow-float">{tag}</span> : null}
        <p className="mt-3 truncate font-semibold px-1">{title}</p>
        <p className="truncate text-sm text-muted-foreground px-1">{sub}</p>
      </Link>
      <button onClick={onSave} aria-label={saved ? "Remove from shortlist" : "Save to shortlist"} className="absolute right-4 top-4 transition-all duration-300 hover:scale-110 active:scale-95 bg-background/50 hover:bg-destructive/10 backdrop-blur-md rounded-full p-2.5">
        <Heart className={`size-4 transition-colors ${saved ? "fill-destructive text-destructive stroke-destructive" : "fill-foreground/40 stroke-foreground/40 hover:fill-destructive hover:stroke-destructive"}`} />
      </button>
    </div>
  );
}

