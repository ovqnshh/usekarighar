import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Search, Star, SlidersHorizontal, MapPin, Sparkles,
  CheckCircle2, Wrench, Clock, ShieldCheck, X, ArrowRight,
  Plug, Droplet, Fan, Hammer, PaintRoller, BrickWall,
  Umbrella, LayoutGrid, Box, Lock, Bug, Users, Home,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/karighar-shell";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/karighar-api";
import { professionals as dummyProfessionals } from "@/lib/karighar-data";
import {
  askKarigharEngine,
  DetailedProjectBrief,
  StepAClassification,
} from "@/lib/ask-karighar.functions";
import { AskKarigharAutocomplete } from "@/components/ask-karighar-autocomplete";
import { ProjectBriefCard } from "@/components/project-brief-card";
import { SafetyHazardRule } from "@/lib/search-dictionary";

const TRADES = [
  { label: "All", icon: Home },
  { label: "AC & appliance repair/installation", icon: Fan },
  { label: "Plumbing repair & installation", icon: Droplet },
  { label: "Electrical repair & installation", icon: Plug },
  { label: "Carpentry & custom furniture", icon: Hammer },
  { label: "Painting & wall finishing", icon: PaintRoller },
  { label: "Waterproofing", icon: Umbrella },
  { label: "Tiling & flooring", icon: LayoutGrid },
  { label: "Pest control", icon: Bug },
  { label: "Masonry & plastering", icon: BrickWall },
  { label: "False ceiling & POP work", icon: Box },
  { label: "Home automation & smart locks", icon: Lock },
  { label: "General labour / helper", icon: Users },
];

const CATEGORY_TRADES: Record<string, string[]> = {
  build: ["Carpentry & custom furniture", "Masonry & plastering", "False ceiling & POP work"],
  renovate: ["Painting & wall finishing", "Tiling & flooring", "Waterproofing"],
  fix: ["Plumbing repair & installation", "Electrical repair & installation", "AC & appliance repair/installation"],
};

export const Route = createFileRoute("/professionals/")({
  validateSearch: (search: Record<string, unknown>): {
    category?: string;
    location?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
    q?: string;
    service?: string;
  } => {
    const num = (v: unknown) =>
      typeof v === "number" ? v : typeof v === "string" && v !== "" && !isNaN(Number(v)) ? Number(v) : undefined;
    const out: any = {};
    if (typeof search["category"] === "string") out.category = search["category"];
    if (typeof search["location"] === "string") out.location = search["location"];
    if (typeof search["q"] === "string") out.q = search["q"];
    if (typeof search["service"] === "string") out.service = search["service"];
    const mn = num(search["minPrice"]); if (mn !== undefined) out.minPrice = mn;
    const mx = num(search["maxPrice"]); if (mx !== undefined) out.maxPrice = mx;
    const r = num(search["rating"]); if (r !== undefined) out.rating = r;
    if (typeof search["sort"] === "string") out.sort = search["sort"];
    return out;
  },
  head: () => ({ meta: [{ title: "Karighar" }] }),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/professionals/" });
  const search = Route.useSearch();
  const { category, location, minPrice, maxPrice, rating, sort, q } = search;

  const [filterOpen, setFilterOpen] = useState(false);
  const [minPriceState, setMinPriceState] = useState(minPrice?.toString() || "");
  const [maxPriceState, setMaxPriceState] = useState(maxPrice?.toString() || "");
  const [ratingState, setRatingState] = useState(rating || 0);
  const [locationState, setLocationState] = useState(location || "");

  // AI Brief & Classification State
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [brief, setBrief] = useState<DetailedProjectBrief | null>(null);
  const [classification, setClassification] = useState<StepAClassification | undefined>();
  const [safetyHazard, setSafetyHazard] = useState<SafetyHazardRule | undefined>();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const executedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    setMinPriceState(minPrice?.toString() || "");
    setMaxPriceState(maxPrice?.toString() || "");
    setRatingState(rating || 0);
    setLocationState(location || "");
  }, [minPrice, maxPrice, rating, location]);

  // Synchronize on search param `q` change (including initial mount with `?q=...`)
  useEffect(() => {
    if (q && q !== executedQueryRef.current) {
      executedQueryRef.current = q;
      setSearchQuery(q);
      executeSearch(q);
    }
  }, [q]);

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsDiagnosing(true);
    try {
      const res = await askKarigharEngine({
        data: { text: queryText, location: location || "Mumbai" },
      });
      if (res.ok) {
        setBrief(res.brief);
        setClassification(res.classification);
        setSafetyHazard(res.safetyHazard);

        // Update URL query parameters with interpreted category
        navigate({
          search: (prev: any) => ({
            ...prev,
            q: queryText,
            category: res.brief.tradeCategory,
          }),
        });
      }
    } catch (e) {
      console.warn("AI search error:", e);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAutocompleteSubmit = (submittedQuery: string) => {
    setSearchQuery(submittedQuery);
    executeSearch(submittedQuery);
  };

  const handleClearBrief = () => {
    setBrief(null);
    setClassification(undefined);
    setSafetyHazard(undefined);
    setSearchQuery("");
    navigate({
      search: (prev: any) => ({
        ...prev,
        q: undefined,
        category: undefined,
      }),
    });
  };

  // Query matching professionals
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", category, location, minPrice, maxPrice, rating, sort, q],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*, gigs(*)");
      if (error && error.code !== "PGRST116") throw error;

      // Merge Supabase records with verified seed pool
      const combined = [...(data || [])];
      for (const dummy of dummyProfessionals) {
        if (!combined.some((p: any) => p.slug === dummy.id || p.id === dummy.id)) {
          combined.push({
            id: dummy.id,
            slug: dummy.id,
            name: dummy.name,
            business: dummy.business,
            trade: dummy.trade,
            city: dummy.city,
            bio: `${dummy.experience} specialist in ${dummy.trade}. Verified with SafePay protection in Mumbai.`,
            experience: dummy.experience,
            rating: dummy.rating,
            reviews: dummy.reviews,
            projects_count: dummy.projects,
            image: dummy.image,
            portfolio: dummy.portfolio,
            badges: dummy.badges,
            availability: dummy.availability,
            price: dummy.price,
            gigs: [
              {
                id: `${dummy.id}-gig-1`,
                name: "Diagnostic Doorstep Visit",
                starting_price: dummy.price,
              } as any,
            ],
          } as any);
        }
      }

      let filtered = combined.map((pro: any) => {
        const dummy = dummyProfessionals.find((d) => d.id === pro.slug || d.id === pro.id);
        const computedRating =
          pro.reviews && Array.isArray(pro.reviews) && pro.reviews.length > 0
            ? pro.reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / pro.reviews.length
            : dummy?.rating || pro.rating || 4.85;
        const lowestGigPrice =
          pro.gigs && pro.gigs.length > 0
            ? Math.min(...pro.gigs.map((g: any) => g.starting_price || 0))
            : dummy?.price || pro.price || 499;

        // "Why matched" summary line generator
        const whyMatched = `${pro.trade.split("&")[0].trim()} specialist · serves ${
          pro.city.split(",")[0]
        } · ${pro.availability || "available today"} · verified credentials`;

        return {
          ...pro,
          trade: pro.trade || dummy?.trade,
          image: pro.image || (pro as any)?.avatar_url || dummy?.image,
          portfolio: (pro.portfolio?.length ? pro.portfolio : dummy?.portfolio) || [],
          badges: pro.badges?.length ? pro.badges : (dummy?.badges || ["Identity verified", "Skills verified"]),
          availability: pro.availability || dummy?.availability || "Available today",
          computedRating,
          lowestGigPrice,
          whyMatched,
        };
      });

      // Filter by category
      if (category && category !== "All") {
        if (CATEGORY_TRADES[category]) {
          filtered = filtered.filter((p: any) => CATEGORY_TRADES[category].includes(p.trade));
        } else {
          filtered = filtered.filter(
            (p: any) =>
              p.trade === category || p.trade.toLowerCase().includes(category.toLowerCase())
          );
        }
      }

      // Filter by location
      if (location) {
        filtered = filtered.filter((p: any) => p.city.toLowerCase().includes(location.toLowerCase()));
      }

      // Filter by rating
      if (rating) {
        filtered = filtered.filter((p: any) => (p.computedRating || 0) >= rating);
      }

      // Filter by price
      if (minPrice !== undefined || maxPrice !== undefined) {
        filtered = filtered.filter((pro: any) => {
          if (pro.lowestGigPrice === Infinity) return false;
          if (minPrice !== undefined && pro.lowestGigPrice < minPrice) return false;
          if (maxPrice !== undefined && pro.lowestGigPrice > maxPrice) return false;
          return true;
        });
      }

      // Sort
      if (sort === "price") {
        filtered.sort((a: any, b: any) => a.lowestGigPrice - b.lowestGigPrice);
      } else if (sort === "available") {
        filtered.sort((a: any, b: any) => (a.availability?.includes("mins") ? -1 : 1));
      } else {
        filtered.sort((a: any, b: any) => b.computedRating - a.computedRating);
      }

      return filtered;
    },
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ["saved-karighars", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const db = supabase as any;
      const { data } = await db.from("saved_karighars").select("professional_id").eq("user_id", user.id);
      return (data || []).map((d: any) => d.professional_id);
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (proId: string) => {
      if (!user) {
        toast("Please sign in to save professionals to your shortlist");
        return;
      }
      const db = supabase as any;
      if (savedIds.includes(proId)) {
        await db.from("saved_karighars").delete().eq("user_id", user.id).eq("professional_id", proId);
      } else {
        await db.from("saved_karighars").insert({ user_id: user.id, professional_id: proId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["saved-karighars", user?.id] }),
  });

  // Removable filter chip handlers
  const removeFilter = (filterKey: string) => {
    navigate({
      search: (prev: any) => {
        const next = { ...prev };
        delete next[filterKey];
        return next;
      },
    });
  };

  const hasActiveFilters = !!(minPrice || maxPrice || rating || location || category || q);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      {/* ── Top Bar: Ask Karighar Search & Autocomplete ── */}
      <section className="border-b border-border bg-gradient-to-b from-surface-subtle to-background px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] uppercase font-semibold">
                  Ask Karighar Engine
                </Badge>
                <span className="text-xs text-muted-foreground">Natural Language AI Search</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground mt-1">
                Find the Right Home Specialist
              </h1>
            </div>

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="size-4 text-primary" />
              Transparent Price Books • SafePay Protection
            </span>
          </div>

          {/* Autocomplete Input Combobox */}
          <AskKarigharAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleAutocompleteSubmit}
            placeholder="Type your home issue (e.g. 'my ac is not working', 'kitchen tap leaking', 'switchboard sparking')..."
          />
        </div>
      </section>

      {/* ── Active AI Project Brief Section ── */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-6">
        <AnimatePresence>
          {isDiagnosing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-primary/20 bg-card p-8 text-center space-y-3 shadow-warm-xs"
            >
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <h3 className="font-display text-xl font-semibold">
                Analyzing your issue & searching specialists…
              </h3>
              <p className="text-xs text-muted-foreground">
                Classifying trade scope, retrieving price-book standards, and verifying nearby availability.
              </p>
            </motion.div>
          ) : brief ? (
            <ProjectBriefCard
              brief={brief}
              classification={classification}
              safetyHazard={safetyHazard}
              onClearBrief={handleClearBrief}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Removable Filter Chips Bar ── */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-sm mt-4">
        {/* Trade Category Navigation Icons */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between overflow-x-auto pt-3 pb-1 no-scrollbar gap-1 sm:gap-2">
            {TRADES.map((t) => {
              const Icon = t.icon;
              const isActive = (!category && t.label === "All") || category === t.label;
              return (
                <button
                  key={t.label}
                  onClick={() =>
                    navigate({
                      search: (prev: any) => ({
                        ...prev,
                        category: t.label === "All" ? undefined : t.label,
                      }),
                    })
                  }
                  className={`group relative flex flex-1 min-w-[70px] max-w-[96px] shrink-0 flex-col items-center gap-1.5 px-1 pb-3 pt-2 text-center transition-colors ${
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5 transition-transform group-hover:scale-110" strokeWidth={1.5} />
                  <span className="truncate w-full text-[11px] leading-tight">
                    {t.label === "AC & appliance repair/installation"
                      ? "AC & Repair"
                      : t.label.split(" ")[0]}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="trade-indicator"
                      className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Removable Chips & Sorting Controls */}
        <div className="border-t border-border bg-surface-subtle/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 h-8 text-xs font-semibold shadow-warm-xs"
                onClick={() => setFilterOpen(true)}
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
                Filters
                {hasActiveFilters && (
                  <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                    {[minPrice, maxPrice, rating, location, category, q].filter(Boolean).length}
                  </span>
                )}
              </Button>

              <div className="h-4 w-px bg-border shrink-0" />

              {/* Active Applied Filter Chips (Clicking ✕ removes) */}
              {category && category !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-primary font-medium shrink-0">
                  Trade: {category}
                  <button onClick={() => removeFilter("category")} className="ml-1 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              )}

              {location && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground font-medium shrink-0 shadow-warm-xs">
                  <MapPin className="size-3 text-muted-foreground" /> {location}
                  <button onClick={() => removeFilter("location")} className="ml-1 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              )}

              {rating && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground font-medium shrink-0 shadow-warm-xs">
                  ★ {rating}+ Rating
                  <button onClick={() => removeFilter("rating")} className="ml-1 hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              )}

              {(minPrice !== undefined || maxPrice !== undefined) && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground font-medium shrink-0 shadow-warm-xs">
                  ₹{minPrice || 0} – ₹{maxPrice || "Max"}
                  <button
                    onClick={() => {
                      removeFilter("minPrice");
                      removeFilter("maxPrice");
                    }}
                    className="ml-1 hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground hidden sm:inline">Sort:</span>
              {[
                { id: undefined, label: "Best match" },
                { id: "rating", label: "Top rated" },
                { id: "price", label: "Lowest price" },
                { id: "available", label: "Available soonest" },
              ].map((s) => {
                const isSelected = sort === s.id;
                return (
                  <button
                    key={s.label}
                    onClick={() =>
                      navigate({
                        search: (prev: any) => ({ ...prev, sort: s.id }),
                      })
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-warm-xs"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Professionals Result List with "Why Matched" ── */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full py-6 pb-24 md:pb-16">
        <div>
          {!isLoading && (
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <p>
                Showing <strong className="text-foreground">{professionals.length} verified pro{professionals.length !== 1 ? "s" : ""}</strong>
                {category && category !== "All" ? ` in ${category}` : " in Mumbai"}
              </p>
              <span>Identity & background checks verified</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-3 rounded-2xl border border-border p-4 bg-card">
                    <Skeleton className="aspect-[4/3] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </motion.div>
            ) : professionals.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-10 max-w-lg mx-auto text-center p-8 rounded-2xl border border-border bg-card shadow-warm-xs space-y-4"
              >
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-semibold">No specialists match all filters</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Try clearing your location or price filters to see verified specialists in adjoining Mumbai neighborhoods.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate({ search: () => ({}) });
                      setBrief(null);
                      setSearchQuery("");
                    }}
                  >
                    Reset All Filters
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                {professionals.map((pro: any) => (
                  <article
                    key={pro.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 shadow-warm-xs transition-all hover:border-primary/40 hover:shadow-warm"
                  >
                    {/* Photo, Shortlist & Availability */}
                    <div>
                      <div className="relative overflow-hidden rounded-xl">
                        <Link
                          to="/professionals/$id"
                          params={{ id: pro.slug || pro.id }}
                          className="block"
                        >
                          <img
                            src={
                              pro.image ||
                              `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop&sig=${pro.id}`
                            }
                            alt={pro.business}
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </Link>

                        {/* Shortlist Heart Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveMutation.mutate(pro.id);
                          }}
                          aria-label={savedIds.includes(pro.id) ? "Remove from shortlist" : "Save to shortlist"}
                          className="absolute right-2.5 top-2.5 z-20 grid size-8 place-items-center rounded-full bg-background/85 shadow-warm-xs backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                        >
                          <Heart
                            className={`size-3.5 transition-colors ${
                              savedIds.includes(pro.id)
                                ? "fill-primary text-primary stroke-primary"
                                : "fill-transparent text-foreground/70"
                            }`}
                            strokeWidth={1.8}
                          />
                        </button>

                        {/* Availability Pill */}
                        <div className="absolute left-2.5 bottom-2.5 z-20">
                          <span className="rounded-full bg-black/75 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-white flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-success animate-pulse" />
                            {pro.availability || "Available today"}
                          </span>
                        </div>
                      </div>

                      {/* Info & Rating */}
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            to="/professionals/$id"
                            params={{ id: pro.slug || pro.id }}
                            className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate"
                          >
                            {pro.business}
                          </Link>
                          <span className="flex shrink-0 items-center gap-1 rounded-md bg-surface-subtle px-1.5 py-0.5 text-xs font-semibold">
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                            {pro.computedRating ? pro.computedRating.toFixed(2) : "4.90"}
                          </span>
                        </div>

                        <p className="text-xs text-foreground/80 font-medium">
                          {pro.name} • {pro.trade}
                        </p>

                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          {pro.city || "Mumbai"}
                        </p>

                        {/* Verified Badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {(pro.badges || ["Identity verified", "Skills verified"]).slice(0, 2).map((b: string, i: number) => (
                            <span
                              key={i}
                              className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                            >
                              ✓ {b}
                            </span>
                          ))}
                        </div>

                        {/* ── "Why Matched" Explainability Line (Requirement 4) ── */}
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-[11px] text-primary/90 font-medium leading-tight">
                            ⚡ {pro.whyMatched}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & Actions */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block leading-tight">
                          Visit Fee
                        </span>
                        <span className="font-display text-base font-bold text-foreground">
                          ₹{pro.lowestGigPrice !== Infinity ? pro.lowestGigPrice.toLocaleString("en-IN") : "499"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          asChild
                          size="sm"
                          className="text-xs px-3 font-semibold shadow-warm-xs"
                        >
                          <Link to="/professionals/$id" params={{ id: pro.slug || pro.id }}>
                            View Storefront
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Filter Modal Dialog ── */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold">Filter Professionals</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <Label className="text-xs font-semibold block mb-1.5">Area / Neighborhood</Label>
              <Input
                value={locationState}
                onChange={(e) => setLocationState(e.target.value)}
                placeholder="e.g. Andheri, Bandra, Powai, Thane"
                className="h-10 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold block mb-1.5">Starting Visit Fee</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={minPriceState}
                  onChange={(e) => setMinPriceState(e.target.value)}
                  placeholder="Min ₹"
                  type="number"
                  className="h-10 text-xs"
                />
                <Input
                  value={maxPriceState}
                  onChange={(e) => setMaxPriceState(e.target.value)}
                  placeholder="Max ₹"
                  type="number"
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold block mb-1.5">Minimum Rating</Label>
              <div className="grid grid-cols-4 gap-2">
                {[4.5, 4.8, 4.9, 5.0].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRatingState(ratingState === r ? 0 : r)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition-colors ${
                      ratingState === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:border-foreground/30"
                    }`}
                  >
                    ★ {r}+
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center pt-2">
            <button
              onClick={() => {
                setMinPriceState("");
                setMaxPriceState("");
                setRatingState(0);
                setLocationState("");
              }}
              className="text-xs text-muted-foreground underline"
            >
              Clear all
            </button>
            <Button
              size="default"
              onClick={() => {
                navigate({
                  search: (prev: any) => ({
                    ...prev,
                    minPrice: minPriceState ? parseInt(minPriceState, 10) : undefined,
                    maxPrice: maxPriceState ? parseInt(maxPriceState, 10) : undefined,
                    rating: ratingState > 0 ? ratingState : undefined,
                    location: locationState || undefined,
                  }),
                });
                setFilterOpen(false);
              }}
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}
