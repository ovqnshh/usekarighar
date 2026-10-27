import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageShell } from "@/components/karighar-shell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tag,
  Search,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Calculator,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Layers,
  Wrench,
  Camera,
  Info,
  Barcode,
  ShieldAlert,
} from "lucide-react";
import {
  findPartsCore,
  instantLexicalSearch,
  logPartSearchHelpfulness,
  type CatalogPartItem,
  type SmartPartRerankResult,
} from "@/lib/part-finder/find-parts.functions";
import {
  verifyMaterialBarcodeCore,
  type MaterialVerificationResult,
} from "@/lib/anti-piracy/material-scanner.functions";

export const Route = createFileRoute("/price-index")({
  head: () => ({
    meta: [{ title: "Smart Spare Part Finder & Price Index — Karighar" }],
  }),
  component: PriceIndexPage,
});

const QUICK_TEST_QUERIES = [
  "pipe ka 90 degree mod",
  "white tape jo pipe leak rokne ke liye lagate hain",
  "bijli ka switch jo overload pe khud band ho jata hai",
  "tap ke neeche wali flexible pipe",
  "door band hone pe dheere se band hone wala hinge",
  "wall pe seelan ka paint jo pani rokta hai",
];

function PriceIndexPage() {
  const [query, setQuery] = useState("");
  const [stageASuggestions, setStageASuggestions] = useState<CatalogPartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search result state
  const [hasSearched, setHasSearched] = useState(false);
  const [bestMatch, setBestMatch] = useState<CatalogPartItem | null>(null);
  const [alternatives, setAlternatives] = useState<CatalogPartItem[]>([]);
  const [rerankInfo, setRerankInfo] = useState<SmartPartRerankResult | null>(null);

  // Quantity estimator state
  const [quantity, setQuantity] = useState<number>(1);
  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);

  // Anti-Piracy scanner state (Feature 7)
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannerResult, setScannerResult] = useState<MaterialVerificationResult | null>(null);

  function handleVerifyBarcode(codeToVerify?: string) {
    const targetCode = codeToVerify || barcodeInput;
    if (!targetCode.trim()) return;
    const res = verifyMaterialBarcodeCore(targetCode);
    setScannerResult(res);
  }

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Stage A: Instant Lexical Search (debounced 300ms, NO AI CALL)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setStageASuggestions([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      const suggestions = instantLexicalSearch(trimmed);
      setStageASuggestions(suggestions);
      setShowSuggestions(true);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  async function handleSearch(searchQuery: string) {
    const q = searchQuery.trim();
    if (!q) return;

    setShowSuggestions(false);
    setIsLoading(true);
    setHasSearched(true);
    setFeedbackSent(null);
    setQuantity(1);

    try {
      const res = await findPartsCore({ query: q });
      if (res.ok) {
        setBestMatch(res.bestMatch || null);
        setAlternatives(res.alternatives || []);
        setRerankInfo(res.rerankInfo as SmartPartRerankResult);
      }
    } catch (err) {
      console.error("Part search error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeedback(helpful: boolean) {
    if (feedbackSent !== null) return;
    setFeedbackSent(helpful);
    try {
      await logPartSearchHelpfulness({
        data: {
          query,
          chosenId: bestMatch?.id,
          wasHelpful: helpful,
        },
      });
    } catch (e) {
      console.warn("Feedback logging failed:", e);
    }
  }

  return (
    <PageShell>
      <main className="min-h-[85vh] pb-24 space-y-10">
        {/* HERO SEARCH SECTION */}
        <section className="border-b border-border bg-gradient-to-b from-background via-surface-subtle/40 to-background pt-12 pb-14 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <Badge
              variant="outline"
              className="px-3 py-1 text-xs gap-1.5 font-medium border-primary/30 text-primary"
            >
              <Sparkles className="size-3.5" /> Karighar Real-Time Price Index
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              Smart Spare Part Finder
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Don't know the exact trade name? Describe it in your own words (English, Hindi,
              Marathi, or Hinglish). Our pipeline matches the right part and surfaces verified
              Mumbai benchmark prices.
            </p>

            {/* SEARCH INPUT BAR */}
            <div className="pt-4 max-w-2xl mx-auto relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(query);
                }}
                className="relative flex items-center shadow-warm-xs rounded-2xl border border-border bg-background transition-shadow focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Search className="size-5 text-muted-foreground ml-4 shrink-0" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => stageASuggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="e.g. 'pipe ka 90 degree mod', 'white tape jo leak roke'..."
                  className="border-0 bg-transparent py-6 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="mr-2 rounded-xl px-5 font-medium text-xs sm:text-sm"
                >
                  {isLoading ? "Finding..." : "Find Part"}
                </Button>
              </form>

              {/* STAGE A INSTANT SUGGESTIONS DROPDOWN */}
              {showSuggestions && stageASuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-background border border-border rounded-xl shadow-lg text-left overflow-hidden">
                  <div className="px-3 py-2 bg-surface-subtle border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Instant Catalog Matches (Debounced)</span>
                    <span className="text-[10px] text-muted-foreground/70">
                      Stage A • No AI Call
                    </span>
                  </div>
                  <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
                    {stageASuggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setQuery(item.name);
                          handleSearch(item.name);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-surface-subtle flex items-center justify-between transition-colors text-sm"
                      >
                        <div>
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-primary">{item.brand}</span>
                            <span>•</span>
                            <span>
                              ₹{(item.trade_price_min_paise / 100).toFixed(0)} - ₹
                              {(item.trade_price_max_paise / 100).toFixed(0)}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK-TEST CHIPS */}
            <div className="pt-3 max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground font-medium mr-1">
                Try colloquial examples:
              </span>
              {QUICK_TEST_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuery(q);
                    handleSearch(q);
                  }}
                  className="text-xs bg-surface-subtle hover:bg-surface-subtle/80 text-foreground border border-border/80 rounded-full px-3 py-1 transition-colors text-left"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* SKELETON LOADER */}
          {isLoading && (
            <div className="border border-border rounded-2xl p-8 bg-surface-subtle/30 animate-pulse space-y-6">
              <div className="h-6 bg-surface-subtle rounded-md w-1/3" />
              <div className="space-y-2">
                <div className="h-4 bg-surface-subtle rounded w-3/4" />
                <div className="h-4 bg-surface-subtle rounded w-1/2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="h-20 bg-surface-subtle rounded-xl" />
                <div className="h-20 bg-surface-subtle rounded-xl" />
                <div className="h-20 bg-surface-subtle rounded-xl" />
              </div>
            </div>
          )}

          {/* BEST MATCH CARD */}
          {!isLoading && hasSearched && bestMatch && (
            <div className="border-2 border-primary/20 rounded-2xl bg-card shadow-warm-sm overflow-hidden space-y-0">
              {/* Header Banner */}
              <div className="bg-primary/5 px-6 py-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground font-semibold px-2.5 py-0.5 text-xs">
                    BEST MATCH
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    Confidence:{" "}
                    <strong className="text-foreground">
                      {Math.round((rerankInfo?.confidence || 0.8) * 100)}%
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" /> {bestMatch.city}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" /> Verified Oct 2026
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    {bestMatch.category} &rsaquo; {bestMatch.subcategory}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground">
                    {bestMatch.name}
                  </h2>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>
                      Brand standard: <strong className="text-foreground">{bestMatch.brand}</strong>
                    </span>
                    <span>•</span>
                    <span>Spec: {bestMatch.spec}</span>
                  </div>
                </div>

                {/* AI Multilingual Match Explanation Callout */}
                {rerankInfo?.why_this_matches && (
                  <div className="bg-surface-subtle/80 border border-border/80 rounded-xl p-4 text-xs sm:text-sm text-foreground flex items-start gap-3">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-primary block mb-0.5">
                        Why this matches your description:
                      </strong>
                      <span className="text-muted-foreground">{rerankInfo.why_this_matches}</span>
                    </div>
                  </div>
                )}

                {/* What it is and Where used */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl border border-border bg-background space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Info className="size-4 text-muted-foreground" /> What it is
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {rerankInfo?.what_it_is || bestMatch.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-background space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <Wrench className="size-4 text-muted-foreground" /> Where and why it is
                      installed
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{bestMatch.typical_use}</p>
                  </div>
                </div>

                {/* PRICE BENCHMARK SECTION (STRICT INTEGERS FROM DB) */}
                <div className="border border-border rounded-xl p-6 bg-gradient-to-br from-surface-subtle/30 to-background space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        Verified Wholesale / Trade Price
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Direct from authentic Mumbai hardware wholesalers. Never estimated by AI.
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-xs"
                    >
                      Karighar Fair Rate
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3 rounded-lg border border-border bg-background">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Standard MRP
                      </div>
                      <div className="text-lg font-bold text-muted-foreground line-through">
                        ₹{(bestMatch.mrp_paise / 100).toFixed(0)}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 sm:col-span-2">
                      <div className="text-[11px] text-primary font-semibold">
                        Fair Trade Price Range (Artisan Bulk Rate)
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        ₹{(bestMatch.trade_price_min_paise / 100).toFixed(0)} – ₹
                        {(bestMatch.trade_price_max_paise / 100).toFixed(0)}
                        <span className="text-xs font-normal text-muted-foreground ml-2">
                          per unit
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Calculator */}
                  <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Calculator className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">Quantity needed:</span>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 h-8 text-center text-xs"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-muted-foreground">Estimated Fair Total:</div>
                      <div className="text-sm font-bold text-foreground">
                        ₹{((bestMatch.trade_price_min_paise * quantity) / 100).toFixed(0)} – ₹
                        {((bestMatch.trade_price_max_paise * quantity) / 100).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Was this helpful feedback */}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                  <span>Was this the exact part you were looking for?</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={feedbackSent === true ? "default" : "outline"}
                      onClick={() => handleFeedback(true)}
                      disabled={feedbackSent !== null}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <ThumbsUp className="size-3.5" /> Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={feedbackSent === false ? "destructive" : "outline"}
                      onClick={() => handleFeedback(false)}
                      disabled={feedbackSent !== null}
                      className="h-8 gap-1.5 text-xs"
                    >
                      <ThumbsDown className="size-3.5" /> No
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALTERNATIVE MATCHES */}
          {!isLoading && hasSearched && alternatives.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Related Alternative Parts ({alternatives.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => {
                      setBestMatch(alt);
                      setAlternatives(alternatives.filter((a) => a.id !== alt.id));
                    }}
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 cursor-pointer transition-all space-y-2 group shadow-warm-xs"
                  >
                    <div className="text-[11px] text-primary font-semibold uppercase">
                      {alt.category}
                    </div>
                    <h5 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {alt.name}
                    </h5>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {alt.description}
                    </div>
                    <div className="text-xs font-bold text-foreground pt-1 border-t border-border/50">
                      ₹{(alt.trade_price_min_paise / 100).toFixed(0)} - ₹
                      {(alt.trade_price_max_paise / 100).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOW CONFIDENCE / NO MATCH CLARIFYING QUESTION */}
          {!isLoading && hasSearched && !bestMatch && (
            <div className="border border-border rounded-2xl p-8 bg-surface-subtle/40 text-center space-y-4 max-w-xl mx-auto">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <HelpCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Need a Little More Detail</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {rerankInfo?.clarifying_question ||
                    "Could you describe which room this is in or snap a quick photo?"}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button variant="outline" className="gap-2 text-xs">
                  <Camera className="size-4" /> Upload a Photo
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    setQuery("");
                    setHasSearched(false);
                  }}
                  className="text-xs"
                >
                  Try Another Description
                </Button>
              </div>
            </div>
          )}

          {/* INITIAL EMPTY STATE */}
          {!hasSearched && (
            <section className="mx-auto max-w-3xl px-4 text-center py-12 space-y-4">
              <div className="size-12 rounded-2xl bg-surface-subtle border border-border flex items-center justify-center mx-auto text-muted-foreground">
                <Tag className="size-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base text-foreground">
                Verified Mumbai Trade Database Active
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                21 authentic hardware catalog items loaded with certified trade pricing. Type any
                descriptive query or click an example above to begin.
              </p>
            </section>
          )}

          {/* FEATURE 7: MATERIAL ANTI-PIRACY SCANNER */}
          <section className="rounded-3xl border border-primary/20 bg-card p-6 sm:p-8 shadow-warm-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 mb-1">
                  <ShieldCheck className="size-3" /> Genuine Materials Guarantee
                </Badge>
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Material Anti-Piracy & ISI Hologram Checker
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verify wire rolls, pipes, or MCBs before technician installation to eliminate counterfeit fire and flood hazards.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter wire or pipe serial (e.g. HVL982341, FNX1100V44, ASTCPVC7721)..."
                    className="pl-10 text-xs sm:text-sm h-11 rounded-xl"
                  />
                </div>
                <Button
                  onClick={() => handleVerifyBarcode()}
                  disabled={!barcodeInput.trim()}
                  className="px-5 text-xs font-semibold h-11 rounded-xl shadow-warm-xs"
                >
                  Verify Authenticity
                </Button>
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>Try verified batch codes:</span>
                {[
                  { label: "Havells Wire", code: "HVL982341" },
                  { label: "Finolex 1100V", code: "FNX1100V44" },
                  { label: "Astral CPVC Pro", code: "ASTCPVC7721" },
                  { label: "Dr. Fixit", code: "DFX89201" },
                ].map((sample) => (
                  <button
                    key={sample.code}
                    type="button"
                    onClick={() => {
                      setBarcodeInput(sample.code);
                      handleVerifyBarcode(sample.code);
                    }}
                    className="px-2 py-0.5 rounded-md border border-border bg-surface-subtle hover:bg-surface-subtle/80 text-foreground transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Result Display */}
            {scannerResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${scannerResult.isAuthentic ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100" : "bg-destructive/10 border-destructive/30 text-destructive-foreground"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {scannerResult.isAuthentic ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span>Genuine Manufacturer Certified: {scannerResult.brand}</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="size-4 text-destructive" />
                        <span>Counterfeit / Unverified Warning</span>
                      </>
                    )}
                  </div>
                  <Badge variant={scannerResult.isAuthentic ? "default" : "destructive"} className="text-[10px]">
                    {scannerResult.detectedStandard}
                  </Badge>
                </div>

                <p className="leading-relaxed text-[11px]">
                  {scannerResult.antiCounterfeitDetails}
                </p>

                {scannerResult.safetyAdvisory && (
                  <div className="p-2.5 rounded-xl bg-destructive/15 border border-destructive/30 font-semibold text-[11px] text-destructive">
                    {scannerResult.safetyAdvisory}
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
      </main>
    </PageShell>
  );
}
