import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Hammer, Search, Sparkles, Wrench, MapPin, Check,
  Plug, Droplet, Fan, PaintRoller, BrickWall, Umbrella,
  LayoutGrid, Box, Lock, Bug, Users, ChevronRight, Heart,
  CalendarDays, ImagePlus, ShieldCheck, Award, Star, ArrowRight,
  Clock, ShieldAlert,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import bathroomImage from "@/assets/bathroom-project.jpg";
import wardrobeImage from "@/assets/wardrobe-project.jpg";
import waterTankImage from "@/assets/water-tank-project.jpg";
import electricalImage from "@/assets/electrical-project.jpg";
import arjunPortrait from "@/assets/arjun-portrait.jpg";
import meeraPortrait from "@/assets/meera-portrait.jpg";
import rohanPortrait from "@/assets/rohan-portrait.jpg";

import { PageShell, SectionHeader } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { professionals } from "@/lib/karighar-data";
import { useShortlist } from "@/lib/shortlist";
import { Link } from "@tanstack/react-router";
import { parseProjectRequest, DetailedProjectBrief } from "@/lib/ask-karighar.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/karighar-api";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import { PROBLEM_TILES } from "@/lib/image-system";
import { AskKarigharAutocomplete } from "@/components/ask-karighar-autocomplete";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karighar" },
      { name: "description", content: "Describe what your home needs. Connect with verified local electricians, plumbers, carpenters, and painters backed by SafePay escrow in Mumbai." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { has, toggle } = useShortlist();

  const [aiPrompt, setAiPrompt] = useState("");
  const [stage, setStage] = useState<"ask" | "loading" | "brief">("ask");
  const [postLoading, setPostLoading] = useState(false);
  const [brief, setBrief] = useState<any | null>(null);

  const matchedPros = useMemo(() => {
    if (!brief?.tradeCategory) return [];
    const cat = brief.tradeCategory.toLowerCase();
    const list = professionals.filter((p) => {
      const proTrade = p.trade.toLowerCase();
      return (
        proTrade === cat ||
        proTrade.includes(cat) ||
        cat.includes(proTrade) ||
        (brief.trades && proTrade.includes(brief.trades.toLowerCase()))
      );
    });
    return list.length > 0 ? list : professionals.slice(0, 3);
  }, [brief]);

  // Quick Direct Booking Modal on Home
  const [bookingPro, setBookingPro] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState("Today (Within 2 Hours)");
  const [bookingAddress, setBookingAddress] = useState("Andheri West, Mumbai");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  async function handleConfirmBooking() {
    if (!bookingPro) return;
    setIsSubmittingBooking(true);
    try {
      if (user) {
        await supabase.from("projects").insert({
          customer_id: user.id,
          title: brief?.summary || `Diagnostic Visit with ${bookingPro.business}`,
          summary: brief?.summary || `Doorstep diagnostic visit requested for ${bookingPro.trade}`,
          timing: bookingDate,
          location: bookingAddress,
          status: "scheduled",
          source: "gig",
          price: bookingPro.price,
        });
      }
      toast.success("Diagnostic Visit Confirmed!", {
        description: `${bookingPro.name} from ${bookingPro.business} scheduled for ${bookingDate}. SafePay escrow active.`,
      });
      setBookingPro(null);
    } catch (e: any) {
      toast.error("Booking failed", { description: e.message });
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  async function understand(customText?: string) {
    const textToAnalyze = customText || aiPrompt;
    if (!textToAnalyze.trim()) return;
    setStage("loading");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const result = await parseProjectRequest({
        data: { text: textToAnalyze },
      });
      if (result.ok && result.brief) setBrief(result.brief);
    } catch (e) {
      console.error("AI parse failed", e);
    } finally {
      setStage("brief");
    }
  }

  const handleSelectProblemTile = (tile: typeof PROBLEM_TILES[0]) => {
    navigate({
      to: "/professionals",
      search: {
        q: tile.prompt,
        category: tile.trade,
      },
    });
  };

  return (
    <PageShell>
      <main className="space-y-16 pb-20">
        {/* ── 3A.2 Hero: Asymmetric Problem-First Brief Composer ── */}
        <section className="border-b border-border bg-gradient-to-b from-background to-surface-subtle/50 px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-12 items-center">
            
            {/* Left: Problem-First Brief Composer */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="default" className="text-xs uppercase tracking-wider">
                India's Managed Craftsmanship Marketplace
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.12]">
                What does your home need today?
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Describe the leak, sparking switch, or renovation in plain words. Our engine matches you with verified specialists under transparent price-books and SafePay escrow protection.
              </p>

              {/* Problem Brief Composer Card */}
              <div className="space-y-2.5">
                <AskKarigharAutocomplete
                  value={aiPrompt}
                  onChange={setAiPrompt}
                  onSubmit={(queryText, suggestion) => {
                    navigate({
                      to: "/professionals",
                      search: {
                        q: queryText,
                        ...(suggestion?.matchedTrade
                          ? { category: suggestion.matchedTrade }
                          : {}),
                      },
                    });
                  }}
                  placeholder="e.g. 'my ac is not working', 'bathroom tap leaking', 'bijli switch spark'..."
                  submitLabel="Find the right pro"
                />

                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    AI analyzes your issue, builds an honest 14-section brief & filters pros
                  </span>
                  <span className="text-[10px] text-muted-foreground/80">
                    Non-binding estimate · SafePay escrow
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Asymmetric Service Scene Collage */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
              <div className="space-y-3.5">
                <Link
                  to="/professionals"
                  search={{ q: 'plumbing', category: 'fix' }}
                  className="overflow-hidden rounded-2xl border border-border shadow-warm-xs group relative block cursor-pointer"
                >
                  <img
                    src={waterTankImage}
                    alt="Plumbing maintenance scene"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 text-white">
                    <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/60 px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-md mb-1">
                      Plumbing Care
                    </span>
                    <p className="text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                      Pressure valves & pipe restoration
                    </p>
                  </div>
                </Link>

                <Link
                  to="/professionals"
                  search={{ q: 'electrical', category: 'fix' }}
                  className="overflow-hidden rounded-2xl border border-border shadow-warm-xs group relative block cursor-pointer"
                >
                  <img
                    src={electricalImage}
                    alt="Electrical safety scene"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-white">
                    <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/60 px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-md mb-1">
                      Electrical Safety
                    </span>
                    <p className="text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                      MCB load balance
                    </p>
                  </div>
                </Link>
              </div>

              <div className="space-y-3.5 pt-6">
                <Link
                  to="/professionals"
                  search={{ q: 'carpentry', category: 'build' }}
                  className="overflow-hidden rounded-2xl border border-border shadow-warm-xs group relative block cursor-pointer"
                >
                  <img
                    src={wardrobeImage}
                    alt="Custom woodwork scene"
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 text-white">
                    <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/60 px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-md mb-1">
                      Carpentry
                    </span>
                    <p className="text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                      Marine-ply woodwork
                    </p>
                  </div>
                </Link>

                <Link
                  to="/professionals"
                  search={{ q: 'waterproofing', category: 'renovate' }}
                  className="overflow-hidden rounded-2xl border border-border shadow-warm-xs group relative block cursor-pointer"
                >
                  <img
                    src={bathroomImage}
                    alt="Tile & waterproofing scene"
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3.5 text-white">
                    <span className="inline-flex items-center text-[10px] uppercase font-extrabold tracking-wider text-amber-300 bg-amber-950/80 border border-amber-400/60 px-2.5 py-0.5 rounded-md backdrop-blur-md shadow-md mb-1">
                      Waterproofing
                    </span>
                    <p className="text-xs sm:text-sm font-semibold leading-tight text-white drop-shadow-sm">
                      Joint barrier seal
                    </p>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* ── AI Structured Brief Breakdown Modal/Sheet ──────── */}
        <AnimatePresence>
          {stage !== "ask" && (
            <motion.section
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-5xl px-5 space-y-6"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-card shadow-warm p-6 space-y-6">
                {stage === "loading" ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="loading-dot size-3 rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <h3 className="font-display text-2xl font-semibold">Analyzing your project requirements…</h3>
                    <p className="text-xs text-muted-foreground">Extracting trade category, diagnostic inspection scope, and matching verified specialists.</p>
                  </div>
                ) : brief ? (
                  <>
                    {/* Header */}
                    <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-[10px] uppercase">
                            AI Diagnostic Analysis
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {brief.tradeCategory}
                          </Badge>
                        </div>
                        <h2 className="font-display text-2xl font-semibold mt-1.5">
                          {brief.summary}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Targeted trade: <strong className="text-foreground">{brief.trades}</strong> • Est. Duration: <strong className="text-foreground">{brief.duration}</strong>
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setStage("ask")}>
                        Dismiss
                      </Button>
                    </div>

                    {/* Diagnostic Scope Checklist & Price Guide */}
                    <div className="grid md:grid-cols-3 gap-4">
                      {/* Left: Scope */}
                      <div className="md:col-span-2 space-y-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                          Diagnostic Doorstep Scope
                        </span>
                        {brief.scope && brief.scope.length > 0 ? (
                          <div className="space-y-2">
                            {brief.scope.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90 bg-surface-subtle/60 p-2.5 rounded-lg border border-border/50">
                                <Check className="size-3.5 text-success shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            Complete doorstep diagnostic inspection and safety check.
                          </div>
                        )}

                        {brief.materials && (
                          <p className="text-[11px] text-muted-foreground bg-surface-subtle p-2.5 rounded-lg border border-border/50">
                            <strong className="text-foreground">Consumables / Spares:</strong> {brief.materials} (billed transparently per standard price-book upon your consent)
                          </p>
                        )}
                      </div>

                      {/* Right: Cost & Quick Actions */}
                      <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                            Transparent Fee Guide
                          </span>
                          <div className="font-display text-xl font-bold text-foreground">
                            {brief.cost}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Doorstep diagnostic inspection fee. Replaced parts are itemized upfront. SafePay escrow protected.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                          <Button
                            asChild
                            size="default"
                            className="w-full font-semibold shadow-warm text-xs gap-1.5"
                          >
                            <Link
                              to="/professionals"
                              search={{
                                category: brief.tradeCategory,
                                q: aiPrompt,
                              }}
                            >
                              Explore All {brief.tradeCategory.split(" ")[0]} Pros
                              <ArrowRight className="size-3.5" />
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={postLoading}
                            onClick={async () => {
                              if (!user) {
                                sessionStorage.setItem("karighar-brief", JSON.stringify(brief));
                                navigate({ to: "/auth", search: { redirect: "/" } });
                                return;
                              }
                              setPostLoading(true);
                              try {
                                await supabase.from("projects").insert({
                                  customer_id: user.id,
                                  title: brief.summary?.slice(0, 80) || "Home project",
                                  summary: brief.summary,
                                  timing: "Flexible this week",
                                  status: "requesting_quotes",
                                  source: "quote",
                                });
                                toast.success("Brief posted! 2-3 verified specialists nearby will send itemized quotes.");
                                navigate({ to: "/my-projects" });
                              } catch (err: any) {
                                toast.error(err.message);
                              } finally {
                                setPostLoading(false);
                              }
                            }}
                            className="w-full text-xs"
                          >
                            {postLoading ? "Posting…" : "Request Multiple Contractor Quotes"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* ── Matched Verified Specialists Shelf ── */}
                    <div className="pt-4 border-t border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block">
                            Direct Marketplace Matching
                          </span>
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            Verified Specialists for your {brief.tradeCategory}
                          </h3>
                        </div>
                        <Link
                          to="/professionals"
                          search={{ category: brief.tradeCategory, q: aiPrompt }}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          View all in directory <ArrowRight className="size-3" />
                        </Link>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {matchedPros.map((pro) => (
                          <div
                            key={pro.id}
                            className="rounded-xl border border-border bg-background p-3.5 space-y-3 transition-all hover:border-primary/40 hover:shadow-warm-xs flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-start gap-3">
                                <img
                                  src={pro.image}
                                  alt={pro.name}
                                  className="size-12 rounded-lg object-cover border border-border shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <Link
                                    to="/professionals/$id"
                                    params={{ id: pro.id }}
                                    className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                                  >
                                    {pro.business}
                                  </Link>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {pro.name} • {pro.city}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="size-3 fill-amber-500 text-amber-500" />
                                    <span className="text-[11px] font-semibold">{pro.rating}</span>
                                    <span className="text-[10px] text-muted-foreground">({pro.reviews} reviews)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {pro.badges.slice(0, 2).map((b, i) => (
                                  <span key={i} className="text-[10px] bg-surface-subtle px-1.5 py-0.5 rounded text-muted-foreground">
                                    ✓ {b}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase font-semibold block">
                                  Visit Fee
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                  ₹{pro.price}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => setBookingPro(pro)}
                                  className="text-xs px-2.5 h-8 font-semibold shadow-warm-xs"
                                >
                                  Book Visit
                                </Button>
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="text-xs px-2 h-8"
                                >
                                  <Link to="/professionals/$id" params={{ id: pro.id }}>
                                    Profile
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── 3A.2 Feature 1: "Start With The Problem" Photographic Row ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-baseline justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                Photographic Entry Points
              </span>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl mt-0.5">
                Start with what is broken
              </h2>
            </div>
            <span className="hidden sm:inline text-xs text-muted-foreground">
              Tap any issue to pre-populate an instant diagnostic brief
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
            {PROBLEM_TILES.map((tile) => (
              <div
                key={tile.key}
                onClick={() => handleSelectProblemTile(tile)}
                className="group cursor-pointer rounded-2xl border border-border bg-card p-3 shadow-warm-xs transition-all hover:border-primary/50 hover:shadow-warm flex flex-col justify-between"
              >
                <div>
                  <div className="overflow-hidden rounded-xl mb-3 aspect-[4/3] relative">
                    <img
                      src={tile.image}
                      alt={tile.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {tile.estTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                    {tile.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {tile.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] font-medium text-primary">
                  <span>Draft Brief</span>
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3A.2 Feature 2: Signature "See The Work" Before & After Gallery ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="See the craft: Before & After transformations"
            to="/renovation-planner"
            toLabel="AI room planner"
          />
          <div className="grid md:grid-cols-2 gap-6">
            <BeforeAfterSlider
              beforeImage={waterTankImage}
              afterImage={bathroomImage}
              title="Modern Bath Overhaul"
              subtitle="Full waterproofing, premium wall tiling & concealed plumbing"
              trade="Plumbing & Tiling"
              location="Bandra West, Mumbai"
              cost="₹48,000"
              duration="6 days"
            />
            <BeforeAfterSlider
              beforeImage="https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80&auto=format&fit=crop"
              afterImage={wardrobeImage}
              title="Custom Modular Wardrobe"
              subtitle="Raw marine-ply framing transformed into custom cane-fluted wardrobe"
              trade="Carpentry & Joinery"
              location="Powai, Mumbai"
              cost="₹85,000"
              duration="8 days"
            />
          </div>
        </section>

        {/* ── 3A.2 Feature 5: Craft-First Verified Storefronts ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Verified local specialists near Powai & Andheri"
            to="/professionals"
            toLabel="View all Karighars"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.slice(0, 3).map((p) => (
              <article
                key={p.id}
                onClick={() => navigate({ to: '/professionals/$id', params: { id: p.id } })}
                className="group rounded-2xl border border-border bg-card p-5 shadow-warm-xs hover:border-primary/40 hover:shadow-warm transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Lead with best work photo */}
                  <div className="relative overflow-hidden rounded-xl mb-4 aspect-[16/10]">
                    <img
                      src={p.portfolio[0]}
                      alt={`${p.business} work`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(p.id);
                        }}
                        className="rounded-full bg-background/85 p-2 text-foreground/80 backdrop-blur-sm hover:text-primary transition-colors"
                        title={has(p.id) ? "Remove from Shortlist" : "Save to Shortlist"}
                      >
                        <Heart className={`size-4 ${has(p.id) ? "fill-primary text-primary" : ""}`} />
                      </button>
                    </div>
                    <span className="absolute bottom-2.5 left-2.5 rounded-md bg-black/75 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {p.city}
                    </span>
                  </div>

                  {/* Specialist Face & Credentials */}
                  <div className="flex items-start gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="size-11 rounded-full object-cover border border-border shrink-0"
                    />
                    <div>
                      <h3 className="font-semibold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                        {p.business}
                      </h3>
                      <p className="text-xs text-muted-foreground">{p.name} · {p.experience}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Star className="size-3.5 fill-primary text-primary" /> {p.rating}
                        </span>
                        <span className="text-muted-foreground">({p.reviews} verified jobs)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Starting from</span>
                    <span className="font-bold text-foreground text-sm font-mono">₹{p.price}</span>
                  </div>
                  <Button size="sm" className="font-semibold text-xs shadow-warm-xs pointer-events-none group-hover:bg-primary/90">
                    View Storefront
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── 3A.2 Feature 7: How A Service Visit Works (Educational) ── */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-surface-subtle p-8 md:p-10 space-y-8">
            <div className="max-w-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary block">
                The Managed Protocol
              </span>
              <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl mt-1">
                How every Karighar visit works
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-2 leading-relaxed">
                We eliminate guesswork. Every service adheres to a strictly audited 4-stage doorstep protocol ensuring safety, transparent quotes, and verified sign-off.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Doorstep Start OTP",
                  desc: "Share your 4-digit code at the door. Work begins only after identity is verified on both sides.",
                  icon: ShieldCheck,
                },
                {
                  step: "02",
                  title: "Diagnosis & Itemized Quote",
                  desc: "Specialist checks the issue and issues a written in-app quote with fixed price-book rates before proceeding.",
                  icon: Wrench,
                },
                {
                  step: "03",
                  title: "Photo Proof & Execution",
                  desc: "Mandatory before & after photo evidence uploaded to your project log for warranty records.",
                  icon: ImagePlus,
                },
                {
                  step: "04",
                  title: "SafePay Sign-Off",
                  desc: "Inspect the completed craft. Funds in escrow release only when you confirm satisfaction.",
                  icon: Award,
                },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <span className="font-mono text-xs font-bold text-primary">{item.step}</span>
                  <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Direct Booking Dialog ── */}
      <Dialog open={!!bookingPro} onOpenChange={(open) => !open && setBookingPro(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold">
              Book Diagnostic Doorstep Visit
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmed slot with <strong className="text-foreground">{bookingPro?.business}</strong> ({bookingPro?.name}).
            </p>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            {brief && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-primary">Attached Project Diagnosis</span>
                <p className="font-medium text-foreground">{brief.summary}</p>
                <p className="text-muted-foreground">Category: {brief.tradeCategory}</p>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold block mb-1">Preferred Slot</Label>
              <select
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-xs outline-none"
              >
                <option value="Today (Within 2 Hours)">⚡ Urgent — Today (Within 2 Hours)</option>
                <option value="Today Afternoon (2:00 PM – 5:00 PM)">Today Afternoon (2:00 PM – 5:00 PM)</option>
                <option value="Tomorrow Morning (9:00 AM – 12:00 PM)">Tomorrow Morning (9:00 AM – 12:00 PM)</option>
                <option value="Tomorrow Afternoon (2:00 PM – 6:00 PM)">Tomorrow Afternoon (2:00 PM – 6:00 PM)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold block mb-1">Doorstep Address in Mumbai</Label>
              <Input
                value={bookingAddress}
                onChange={(e) => setBookingAddress(e.target.value)}
                placeholder="Flat / Building, Neighborhood, Mumbai"
                className="h-10 text-xs"
              />
            </div>

            <div className="rounded-xl border border-border bg-surface-subtle p-3 space-y-1.5">
              <div className="flex justify-between font-semibold text-foreground text-xs">
                <span>Inspection & Diagnostic Fee</span>
                <span>₹{bookingPro?.price || 499}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Includes technician travel, full fault diagnosis, and itemized transparent quote before any replacement work begins. Held securely in SafePay escrow.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="ghost" size="default" onClick={() => setBookingPro(null)}>
              Cancel
            </Button>
            <Button
              size="default"
              disabled={isSubmittingBooking}
              onClick={handleConfirmBooking}
              className="font-semibold shadow-warm"
            >
              {isSubmittingBooking ? "Confirming…" : `Confirm Booking (₹${bookingPro?.price || 499})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
