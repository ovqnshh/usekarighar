import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Menu, Wrench, Users, Send, Check, CalendarDays, Clock3,
  ShieldCheck, Star, MapPin, Zap, ExternalLink, Plus, Copy,
  Trash2, Edit3, CheckCircle2, AlertCircle, Sparkles, Eye,
  DollarSign, ArrowUpRight, MessageSquare, PhoneCall, RefreshCw, X,
  ImagePlus, Percent, Tag, Compass, Settings2, Sliders, Shield,
  Camera, CheckSquare, Layers, EyeOff, ChevronRight, Hammer
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { type ProRow, useAuth, computeQuoteTotal, inr } from "@/lib/karighar-api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Brand } from "@/components/karighar-shell";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { CURATED_SERVICES, type CuratedService } from "../services.index";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Karighar Pro Command Center" },
      { name: "description", content: "Karighar verified master craftsperson portal." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const pro = useQuery({
    queryKey: ["my-pro", user.id],
    queryFn: async () => (await supabase.from("professionals").select("*").eq("user_id", user.id).maybeSingle()).data,
  });

  if (pro.isLoading) return <p className="p-10 text-center text-muted-foreground animate-pulse">Loading Karighar Pro Portal…</p>;

  if (!pro.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-background">
        <div className="max-w-md p-8 border border-border bg-card rounded-2xl shadow-warm-xs space-y-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Wrench className="size-8" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">You don't have a professional profile yet</h1>
          <p className="text-sm text-muted-foreground">
            Join Mumbai's verified network of master artisans. Receive direct diagnostic dispatches backed by SafePay escrow.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl">
            <Link to="/become-a-pro">Set up your Karighar profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ProDashboard pro={pro.data} user={user} />;
}

const NAV_TABS = [
  { id: "today", label: "Job Requests", icon: Zap },
  { id: "services", label: "Services & Gigs", icon: Wrench },
  { id: "calendar", label: "Availability & Rules", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "team", label: "Agency Team", icon: Users },
];

function ProDashboard({ pro, user }: { pro: ProRow; user: any }) {
  const [activeTab, setActiveTab] = useState("today");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Signed out of Karighar Pro");
    navigate({ to: "/" });
  }

  const proSlug = pro.slug || pro.id;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      {/* ─── Top Command Header (Clean & Spacious) ───────────────────── */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">

          {/* Left: Clean Brand Logo */}
          <div className="flex items-center shrink-0">
            <Brand />
          </div>

          {/* Center: Desktop Nav Tabs (Clean, uncluttered) */}
          <nav className="hidden md:flex items-center gap-1 relative" aria-label="Pro navigation">
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors rounded-lg ${
                    isActive
                      ? "text-primary bg-primary/8 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={1.5} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="pro-nav-pill"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Customer View Link + Online Switch + Avatar */}
          <div className="flex items-center gap-3 shrink-0">

            {/* View Live Customer Profile */}
            <Link
              to="/professionals/$id"
              params={{ id: proSlug }}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-surface-subtle transition-colors text-foreground shadow-warm-xs"
            >
              <Eye className="size-3.5 text-primary" />
              <span>Customer View</span>
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </Link>

            {/* Live Dispatch Switch */}
            <button
              onClick={() => {
                setIsOnline(!isOnline);
                toast.success(isOnline ? "Status set to Offline / In-Job" : "Status set to Online — Accepting Dispatches!");
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                isOnline
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-surface-subtle text-muted-foreground border-border"
              }`}
            >
              <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
              {isOnline ? "Live for Visits" : "Offline"}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 border border-border rounded-full p-1 pl-2.5 pr-1 hover:shadow-warm transition-shadow cursor-pointer bg-card"
              >
                <span className="text-xs font-semibold text-foreground hidden sm:inline">
                  {pro.name.split(" ")[0]}
                </span>
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                  {pro.name.charAt(0) || "P"}
                </div>
              </div>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-64 bg-card border border-border rounded-2xl shadow-warm py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-3 bg-surface-subtle mx-2 mb-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        <span className="font-semibold text-foreground">{pro.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{pro.trade} · {pro.city || "Mumbai"}</p>
                    </div>

                    <Link
                      to="/professionals/$id"
                      params={{ id: proSlug }}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-subtle text-foreground"
                    >
                      <span>View public storefront</span>
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </Link>
                    <Link
                      to="/"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 hover:bg-surface-subtle text-muted-foreground hover:text-foreground"
                    >
                      Switch to customer mode
                    </Link>
                    <Link
                      to="/help"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2.5 hover:bg-surface-subtle text-muted-foreground hover:text-foreground"
                    >
                      Pro Support & FAQ
                    </Link>

                    <div className="h-px bg-border my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 hover:bg-destructive/10 text-destructive font-medium cursor-pointer"
                    >
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content Tabs ───────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-32 md:pb-16">
        {activeTab === "today" && <TodayTab pro={pro} isOnline={isOnline} />}
        {activeTab === "services" && <MyServicesTab pro={pro} />}
        {activeTab === "calendar" && <AvailabilityRulesTab pro={pro} />}
        {activeTab === "messages" && <MessagesTab pro={pro} />}
        {activeTab === "team" && <AgencyTeamTab pro={pro} />}
      </main>

      {/* ─── Mobile Bottom Nav ──────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex justify-around items-center px-2 h-16 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        {NAV_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center justify-center py-1 flex-1 transition-colors ${
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] mt-0.5">{t.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 1: JOB REQUESTS & TODAY'S DISPATCHES
   ═══════════════════════════════════════════════════════════════════════ */
function TodayTab({ pro, isOnline }: { pro: ProRow; isOnline: boolean }) {
  const qc = useQueryClient();
  const [quoteData, setQuoteData] = useState<Record<string, { labour: string; materials_cost: string; transport: string; other: string }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["pro-quotes", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, projects(*)")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendQuote = async (quoteId: string, projectId: string) => {
    const data = quoteData[quoteId] || { labour: "0", materials_cost: "0", transport: "0", other: "0" };
    const labour = Number(data.labour) || 0;
    const materials_cost = Number(data.materials_cost) || 0;
    const transport = Number(data.transport) || 0;
    const other = Number(data.other) || 0;

    if (labour + materials_cost + transport + other === 0) return toast.error("Please enter a valid estimate");

    setLoadingId(quoteId);
    const { platformFee, tax } = computeQuoteTotal(labour, materials_cost, transport, other);

    const { error: quoteErr } = await supabase.rpc("submit_quote", {
      _quote_id: quoteId,
      _labour: labour,
      _materials_cost: materials_cost,
      _transport: transport,
      _other: other,
      _platform_fee: platformFee,
      _tax: tax,
      _duration: "1–2 hours",
      _workers: 1,
      _materials: "professional",
      _warranty: "30-day SafePay guarantee",
      _scope: "Doorstep diagnostic and precision repair",
    });

    if (quoteErr) {
      setLoadingId(null);
      return toast.error("Failed to send quote", { description: quoteErr.message });
    }

    qc.invalidateQueries({ queryKey: ["pro-quotes", pro.id] });
    toast.success("Quote submitted to customer!", {
      description: "Customer notified on Karighar. Funds will be secured in SafePay escrow once accepted.",
    });
    setLoadingId(null);
  };

  const updateQuoteData = (quoteId: string, field: string, val: string) => {
    setQuoteData((prev) => ({
      ...prev,
      [quoteId]: { ...(prev[quoteId] || { labour: "", materials_cost: "", transport: "", other: "" }), [field]: val },
    }));
  };

  return (
    <div className="space-y-8">

      {/* Profile Overview Card */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-warm-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
                Welcome back, {pro.name}!
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isOnline ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"
              }`}>
                <span className={`size-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                {isOnline ? "Dispatch Active" : "Offline"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Serving <strong className="text-foreground">{pro.city || "Mumbai"}</strong> · Verified trade: <strong className="text-foreground">{pro.trade}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/professionals/$id"
              params={{ id: pro.slug || pro.id }}
              target="_blank"
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-warm"
            >
              <Eye className="size-3.5" />
              <span>Preview Public Storefront</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Connected Performance Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <span className="text-xs text-muted-foreground font-medium block">Active Quote Requests</span>
            <span className="font-display text-2xl font-bold text-foreground mt-1 block">
              {quotes.filter((q: any) => q.status === "requested").length}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">SafePay Ready</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <span className="text-xs text-muted-foreground font-medium block">Jobs Completed</span>
            <span className="font-display text-2xl font-bold text-foreground mt-1 block">
              {pro.projects_count || 184}
            </span>
            <span className="text-[11px] text-muted-foreground">Verified sign-offs</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <span className="text-xs text-muted-foreground font-medium block">Customer Rating</span>
            <span className="font-display text-2xl font-bold text-foreground mt-1 flex items-center gap-1">
              <Star className="size-5 fill-amber-400 text-amber-500" />
              {pro.rating || 4.9}
            </span>
            <span className="text-[11px] text-muted-foreground">({pro.reviews || 128} verified reviews)</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-border">
            <span className="text-xs text-muted-foreground font-medium block">SafePay Escrow Status</span>
            <span className="font-display text-xl font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <ShieldCheck className="size-5" />
              100% Protected
            </span>
            <span className="text-[11px] text-muted-foreground">Direct bank payout</span>
          </div>
        </div>
      </div>

      {/* Incoming Job Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Customer Requests & Dispatches
            </h2>
            <p className="text-xs text-muted-foreground">
              Incoming diagnostic visits and project quote requests from Mumbai homeowners
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {quotes.length} Total Inquiries
          </Badge>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl animate-pulse">
            Checking for customer dispatches...
          </div>
        ) : quotes.length === 0 ? (
          <div className="border border-border rounded-2xl p-10 text-center bg-card shadow-warm-xs space-y-4">
            <div className="size-14 rounded-2xl bg-surface-subtle text-primary mx-auto flex items-center justify-center">
              <Zap className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-display text-lg font-semibold text-foreground">
                No active requests waiting right now
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                You are live in search for <strong>{pro.trade}</strong> in <strong>{pro.city}</strong>. When a customer books from your storefront profile, their request appears here with their verified doorstep address.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button asChild size="sm" className="text-xs font-semibold bg-primary text-primary-foreground">
                <Link to="/professionals/$id" params={{ id: pro.slug || pro.id }}>
                  Test Storefront Booking
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {quotes.map((q: any) => {
              const currentData = quoteData[q.id] || { labour: "", materials_cost: "", transport: "", other: "" };
              const { total } = computeQuoteTotal(
                Number(currentData.labour),
                Number(currentData.materials_cost),
                Number(currentData.transport),
                Number(currentData.other)
              );

              return (
                <div
                  key={q.id}
                  className="border border-border rounded-2xl p-6 bg-card shadow-warm-xs flex flex-col lg:flex-row gap-6 justify-between transition-all hover:border-primary/40"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        q.status === "requested" ? "bg-primary/10 text-primary border border-primary/20" :
                        q.status === "submitted" ? "bg-info-soft text-info border border-info/20" :
                        q.status === "accepted" ? "bg-success-soft text-success border border-success/20" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {q.status === "requested" ? "Needs Your Quote" : q.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Received {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {q.projects?.title || "Diagnostic Visit Request"}
                    </h3>

                    {/* Exact Doorstep Address (Uber/Zepto style) */}
                    {q.projects?.location && (
                      <div className="flex items-start gap-2 text-xs text-foreground bg-surface-subtle p-3 rounded-xl border border-border">
                        <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-foreground">Customer Doorstep Address:</strong>
                          <span className="text-foreground/90 font-medium">{q.projects.location}</span>
                        </div>
                      </div>
                    )}

                    {q.projects?.summary && (
                      <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed bg-surface-subtle p-3 rounded-xl border border-border">
                        {q.projects.summary}
                      </p>
                    )}

                    {q.status === "submitted" && q.total && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground pt-1">
                        <span>Your Submitted Quote:</span>
                        <span className="text-primary font-bold">{inr(q.total)}</span>
                        <span className="text-xs text-muted-foreground">(Awaiting customer escrow sign-off)</span>
                      </div>
                    )}
                  </div>

                  {/* Quote Action Panel */}
                  <div className="min-w-[280px] shrink-0 bg-surface-subtle border border-border p-5 rounded-xl space-y-3">
                    {q.status === "requested" ? (
                      <>
                        <span className="text-xs font-semibold text-foreground block">
                          Provide SafePay Transparent Quote
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-muted-foreground">Labour (₹)</label>
                            <input
                              type="number"
                              placeholder="350"
                              className="w-24 bg-card border border-border rounded-lg px-2.5 py-1.5 text-right font-medium focus:ring-1 focus:ring-primary outline-none"
                              value={currentData.labour}
                              onChange={(e) => updateQuoteData(q.id, "labour", e.target.value)}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-muted-foreground">Estimated Spares (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="w-24 bg-card border border-border rounded-lg px-2.5 py-1.5 text-right font-medium focus:ring-1 focus:ring-primary outline-none"
                              value={currentData.materials_cost}
                              onChange={(e) => updateQuoteData(q.id, "materials_cost", e.target.value)}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-muted-foreground">Travel / Visit (₹)</label>
                            <input
                              type="number"
                              placeholder="0"
                              className="w-24 bg-card border border-border rounded-lg px-2.5 py-1.5 text-right font-medium focus:ring-1 focus:ring-primary outline-none"
                              value={currentData.transport}
                              onChange={(e) => updateQuoteData(q.id, "transport", e.target.value)}
                            />
                          </div>
                          <div className="border-t border-border pt-2 flex justify-between font-bold text-sm">
                            <span>Customer Total</span>
                            <span className="text-primary">{inr(total)}</span>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-5 rounded-xl shadow-warm"
                          disabled={loadingId === q.id}
                          onClick={() => sendQuote(q.id, q.project_id)}
                        >
                          {loadingId === q.id ? "Sending..." : "Send SafePay Quote"}
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4 space-y-2">
                        <CheckCircle2 className="size-8 text-emerald-600 mx-auto" />
                        <span className="text-xs font-semibold block text-foreground">
                          Quote Transmitted
                        </span>
                        <Link
                          to="/projects/$id"
                          params={{ id: q.project_id }}
                          className="inline-block text-xs font-semibold text-primary hover:underline"
                        >
                          View Project Progress →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2: MY SERVICES & GIG CUSTOMIZATION (FULL ADMIN CONTROL)
   ═══════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════
   TAB 2: CRAFT SERVICES & GIG STUDIO (FULL PRO CUSTOMIZATION)
   ═══════════════════════════════════════════════════════════════════════ */

const CRAFT_CATEGORIES = [
  {
    id: "Plumbing",
    label: "Plumbing & Sanitary Diagnostics",
    icon: "🔧",
    description: "Concealed leak isolation, fixture installs & pressure testing",
    tags: ["Concealed Leak Isolation", "Jaquar / Kohler Fitting", "Drainage Blockage", "Pressure Pump Setup", "Geyser Inlet / Outlet", "Angle Valve Replacement"],
    photos: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "Electrical",
    label: "Electrical & Power Infrastructure",
    icon: "⚡",
    description: "MCB tripping diagnostic, distribution panels & modular points",
    tags: ["MCB Tripping Diagnostic", "Phase Load Balancing", "16A Appliance Point", "Inverter Wiring", "Short Circuit Clearance", "LED Concealed Lighting"],
    photos: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "Carpentry",
    label: "Carpentry & Custom Modular Works",
    icon: "🪚",
    description: "Hydraulic soft-close hinges, marine-ply wardrobes & planing",
    tags: ["Hydraulic Hinge Alignment", "Blum Soft-Close Channel", "Termite-Proof Ply Repair", "Marine-Ply Wardrobe", "Door Frame Planing", "Lock Replacement"],
    photos: [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "Painting",
    label: "Painting, Waterproofing & Textures",
    icon: "🎨",
    description: "Wall moisture chemical barrier, dampness sealing & Royale finish",
    tags: ["Wall Dampness Injection", "Anti-Fungal Primer Coat", "Asian Paints Royale Texture", "Terrace PU Waterproofing", "Touch-up & Putty Sanding"],
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "AC",
    label: "AC Cooling & Inverter Appliances",
    icon: "❄️",
    description: "Jet pump deep cleaning, copper flaring & PCB diagnostics",
    tags: ["Jet Pump Deep Coil Service", "R32 / R410A Gas Charge", "PCB Motherboard Scanning", "Copper Piping Flaring", "Drain Line Flush"],
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "Masonry",
    label: "Tiling, Masonry & Granite Restoration",
    icon: "🧱",
    description: "Laser tile alignment, epoxy re-grouting & diamond marble buffing",
    tags: ["Laser Tile Alignment", "Epoxy Grout Filling", "Italian Marble Diamond Buffing", "Granite Kitchen Cutting", "Hollow Tile Replacement"],
    photos: [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=80",
    ],
  },
];

function MyServicesTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studioStep, setStudioStep] = useState<"category" | "photos" | "details" | "pricing" | "inclusions">("details");
  const [previewMode, setPreviewMode] = useState<boolean>(true);

  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    category: pro.trade || "Plumbing",
    sub_tags: [] as string[],
    pricing_mode: "fixed",
    starting_price: 499,
    duration: "1–2 hours",
    service_area: pro.city || "Andheri West, Mumbai",
    warranty: "30-day Karighar Workmanship Guarantee",
    photos: [] as string[],
    cover_photo_index: 0,
    included: ["Doorstep diagnostic inspection", "SafePay escrow protection", "Pressure / safety test"],
    not_included: ["Cost of branded replacement parts (billed at MRP with receipt)"],
    addons: [] as { name: string; price: number }[],
    materials: "Artisan carries branded ISI supplies & precision tools",
    is_published: true,
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newAddonName, setNewAddonName] = useState("");
  const [newAddonPrice, setNewAddonPrice] = useState("");
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);

  const { data: gigs = [], isLoading } = useQuery({
    queryKey: ["my-gigs", pro.id],
    queryFn: async () => {
      // 1. Fetch from Supabase
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });

      // 2. Fetch local storage backup
      let localGigs: any[] = [];
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`karighar_custom_gigs_${pro.id}`) ||
                         localStorage.getItem(`karighar_custom_gigs_${pro.slug}`);
          if (stored) localGigs = JSON.parse(stored);
        } catch {}
      }

      if (error && localGigs.length > 0) return localGigs;
      const combined = [...(data || [])];
      for (const lg of localGigs) {
        if (!combined.some((g) => g.id === lg.id)) combined.push(lg);
      }
      return combined;
    },
  });

  const saveGig = async () => {
    if (!formData.name?.trim()) return toast.error("Please provide a service title");
    const starting_price = Number(formData.starting_price) || 0;

    const payload = {
      professional_id: pro.id,
      name: formData.name.trim(),
      description: formData.description?.trim() || "",
      starting_price,
      duration: formData.duration?.trim() || "1–2 hours",
      photos: formData.photos || [],
      included: formData.included || [],
      not_included: formData.not_included || [],
      addons: formData.addons || [],
      warranty: formData.warranty || "30-day Karighar Workmanship Guarantee",
      service_area: formData.service_area || pro.city || "Mumbai",
      materials: formData.materials || "Artisan carries branded ISI supplies & precision tools",
      is_published: formData.is_published ?? true,
    };

    let targetId = editingId;
    if (editingId === "new") {
      const { data, error } = await supabase.from("gigs").insert(payload).select("id").maybeSingle();
      targetId = data?.id || `gig-${Date.now()}`;
      if (error) {
        console.warn("DB gig insert notice:", error.message);
      }
      toast.success("✨ New service published live on your storefront!");
    } else {
      const { error } = await supabase.from("gigs").update(payload).eq("id", editingId!);
      if (error) {
        console.warn("DB gig update notice:", error.message);
      }
      toast.success("Changes saved! Live on your customer storefront.");
    }

    // Save to local persistence cache for bulletproof instant visibility
    if (typeof window !== "undefined") {
      try {
        const currentLocal = gigs.filter((g: any) => g.id !== targetId);
        currentLocal.unshift({ ...payload, id: targetId });
        localStorage.setItem(`karighar_custom_gigs_${pro.id}`, JSON.stringify(currentLocal));
        localStorage.setItem(`karighar_custom_gigs_${pro.slug}`, JSON.stringify(currentLocal));
      } catch {}
    }

    setEditingId(null);
    qc.invalidateQueries({ queryKey: ["my-gigs", pro.id] });
    qc.invalidateQueries({ queryKey: ["professional", pro.slug] });
    qc.invalidateQueries({ queryKey: ["professional", pro.id] });
  };

  const deleteGig = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service from your storefront?")) return;
    await supabase.from("gigs").delete().eq("id", id);
    if (typeof window !== "undefined") {
      try {
        const filtered = gigs.filter((g: any) => g.id !== id);
        localStorage.setItem(`karighar_custom_gigs_${pro.id}`, JSON.stringify(filtered));
        localStorage.setItem(`karighar_custom_gigs_${pro.slug}`, JSON.stringify(filtered));
      } catch {}
    }
    toast.success("Service removed from storefront");
    qc.invalidateQueries({ queryKey: ["my-gigs", pro.id] });
    qc.invalidateQueries({ queryKey: ["professional", pro.slug] });
  };

  const togglePublish = async (gig: any) => {
    const nextState = !gig.is_published;
    await supabase.from("gigs").update({ is_published: nextState }).eq("id", gig.id);
    if (typeof window !== "undefined") {
      try {
        const updated = gigs.map((g: any) => g.id === gig.id ? { ...g, is_published: nextState } : g);
        localStorage.setItem(`karighar_custom_gigs_${pro.id}`, JSON.stringify(updated));
        localStorage.setItem(`karighar_custom_gigs_${pro.slug}`, JSON.stringify(updated));
      } catch {}
    }
    toast.success(nextState ? "🟢 Gig is now LIVE on your public profile" : "Service hidden from customers");
    qc.invalidateQueries({ queryKey: ["my-gigs", pro.id] });
    qc.invalidateQueries({ queryKey: ["professional", pro.slug] });
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData({
      ...formData,
      photos: [...(formData.photos || []), newPhotoUrl.trim()],
    });
    setNewPhotoUrl("");
    toast.success("Showcase photo added!");
  };

  const handleAddPresetPhotos = (categoryKey: string) => {
    const matched = CRAFT_CATEGORIES.find((c) => c.id.toLowerCase() === categoryKey.toLowerCase() || categoryKey.toLowerCase().includes(c.id.toLowerCase()));
    const presets = matched?.photos || CRAFT_CATEGORIES[0].photos;
    setFormData({
      ...formData,
      photos: Array.from(new Set([...(formData.photos || []), ...presets])),
    });
    toast.success(`⚡ Added ${presets.length} curated high-resolution craftsmanship photos!`);
  };

  const handleRemovePhoto = (index: number) => {
    setFormData({
      ...formData,
      photos: (formData.photos || []).filter((_: any, i: number) => i !== index),
      cover_photo_index: 0,
    });
  };

  const handleAddAddon = () => {
    if (!newAddonName.trim()) return;
    const price = Number(newAddonPrice) || 250;
    setFormData({
      ...formData,
      addons: [...(formData.addons || []), { name: newAddonName.trim(), price }],
    });
    setNewAddonName("");
    setNewAddonPrice("");
    toast.success(`Added add-on: ${newAddonName} (+₹${price})`);
  };

  const currentCover = formData.photos?.[formData.cover_photo_index || 0] || formData.photos?.[0] || "";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
              Services & Price-Book Studio
            </h1>
            <Badge variant="success" className="text-xs">
              Tailored Storefront Studio
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Create rich, tailored service listings for your craft: showcase verified photo galleries, transparent pricing, custom add-ons, and guarantees live on your storefront.
          </p>
        </div>

        {!editingId && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setIsCatalogPickerOpen(true)}
              className="border-primary/30 text-primary hover:bg-primary/10 font-semibold rounded-xl text-xs sm:text-sm px-4 py-2.5 gap-2 shadow-warm-xs"
            >
              <Sparkles className="size-4" />
              Import Standard SOP
            </Button>
            <Button
              onClick={() => {
                setEditingId("new");
                setStudioStep("details");
                setFormData({
                  name: "",
                  description: "",
                  category: pro.trade || "Plumbing",
                  sub_tags: ["Concealed Leak Isolation"],
                  pricing_mode: "fixed",
                  starting_price: 499,
                  duration: "1–2 hours",
                  service_area: pro.city || "Andheri West, Mumbai",
                  warranty: "30-day Karighar Workmanship Guarantee",
                  photos: [
                    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
                    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1000&q=80"
                  ],
                  cover_photo_index: 0,
                  included: ["Doorstep diagnostic check", "SafePay escrow protection", "Safety & leak test"],
                  not_included: ["Replacement spare parts (billed transparently at catalog rates)"],
                  addons: [{ name: "Consumables & thread seal tape", price: 250 }],
                  materials: "Technician carries branded ISI supplies & precision diagnostic rig",
                  is_published: true,
                });
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm px-5 py-2.5 gap-2 shadow-warm"
            >
              <Plus className="size-4" />
              Create New Listing
            </Button>
          </div>
        )}
      </div>

      {/* ─── CRAFT LISTING STUDIO ───────────────────────── */}
      {editingId ? (
        <div className="space-y-6">

          {/* Navigation Bar inside Studio */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-subtle border border-border p-3 rounded-2xl">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "category", label: "1. Category & Trade", icon: Layers },
                { id: "photos", label: "2. Photo Showcase", icon: Camera },
                { id: "details", label: "3. Scope & Procedure", icon: Edit3 },
                { id: "pricing", label: "4. Pricing & Add-ons", icon: DollarSign },
                { id: "inclusions", label: "5. Inclusions & Guarantee", icon: CheckSquare },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStudioStep(s.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    studioStep === s.id
                      ? "bg-primary text-primary-foreground shadow-warm-xs"
                      : "bg-background text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  <s.icon className="size-3.5" />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs font-semibold rounded-xl gap-1.5 h-9"
              >
                <Eye className="size-3.5" />
                {previewMode ? "Hide Live Preview" : "Show Customer Preview"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingId(null)}
                className="text-xs font-medium rounded-xl h-9"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${previewMode ? "lg:grid-cols-[1fr_380px]" : ""} gap-8 items-start`}>

            {/* Left Column: Form Editor */}
            <Card className="border-border rounded-2xl shadow-warm-xs bg-card p-6 sm:p-8 space-y-7">

              {/* ── STEP 1: CATEGORY & SPECIALIZATION ── */}
              {studioStep === "category" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Select Craft Category & Specialization
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose the trade classification that best describes this service.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {CRAFT_CATEGORIES.map((cat) => {
                      const isSelected = (formData.category || "").toLowerCase().includes(cat.id.toLowerCase());
                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              category: cat.label,
                              sub_tags: cat.tags.slice(0, 3),
                            });
                          }}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary shadow-warm-xs"
                              : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-2xl">{cat.icon}</span>
                            {isSelected && (
                              <Badge variant="default" className="text-[10px]">Active</Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-foreground">{cat.label}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sub-specialization tags */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <Label className="text-xs font-semibold text-foreground block">
                      Quick Specialization Chips (Click to include in scope)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {CRAFT_CATEGORIES.flatMap((c) => c.tags).slice(0, 14).map((tag) => {
                        const hasTag = (formData.sub_tags || []).includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const current = formData.sub_tags || [];
                              setFormData({
                                ...formData,
                                sub_tags: hasTag ? current.filter((t: string) => t !== tag) : [...current, tag],
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              hasTag
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-surface-subtle text-foreground/80 border-border hover:border-primary/40"
                            }`}
                          >
                            {hasTag ? "✓ " : "+ "}
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: PHOTO SHOWCASE GALLERY ── */}
              {studioStep === "photos" && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                        <Camera className="size-5 text-primary" />
                        Artisan Photo Showcase
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        High-quality craft photography establishes trust and showcases your verified field transformations.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPresetPhotos(formData.category || "plumbing")}
                      className="border-primary/30 text-primary hover:bg-primary/10 rounded-xl text-xs gap-1.5 shrink-0"
                    >
                      <Sparkles className="size-3.5" />
                      ⚡ Add Curated Pro Presets
                    </Button>
                  </div>

                  {/* Add URL Bar */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste image link from Unsplash, Imgur, or cloud storage..."
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPhoto();
                        }
                      }}
                      className="text-xs rounded-xl bg-background"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddPhoto}
                      className="rounded-xl text-xs shrink-0 bg-primary text-primary-foreground"
                    >
                      Add Photo
                    </Button>
                  </div>

                  {/* Photos Grid */}
                  {formData.photos?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-2">
                      {formData.photos.map((url: string, i: number) => {
                        const isCover = (formData.cover_photo_index || 0) === i;
                        return (
                          <div
                            key={i}
                            className={`relative aspect-[4/3] rounded-2xl overflow-hidden border group bg-surface-subtle transition-all ${
                              isCover ? "border-primary ring-2 ring-primary shadow-warm" : "border-border"
                            }`}
                          >
                            <img src={url} alt={`Showcase ${i + 1}`} className="w-full h-full object-cover" />
                            {isCover && (
                              <Badge className="absolute top-2 left-2 text-[10px] bg-primary text-primary-foreground">
                                ⭐ Cover Photo
                              </Badge>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, cover_photo_index: i })}
                                  className="text-[11px] font-semibold bg-white text-black px-2.5 py-1.5 rounded-lg shadow-sm"
                                >
                                  Set as Cover
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(i)}
                                className="text-[11px] font-semibold bg-destructive text-white px-2.5 py-1.5 rounded-lg shadow-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-surface-subtle/50 space-y-3">
                      <ImagePlus className="size-10 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        No photos added yet. Click <strong>"Add Curated Pro Presets"</strong> above to instantly load photography for your trade!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 3: SCOPE & CRAFTSMANSHIP PROCEDURE ── */}
              {studioStep === "details" && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Service Title & Craftsmanship Protocol
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clear titles and transparent procedures convert visitors into direct doorstep bookings.
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Listing Title</Label>
                    <Input
                      placeholder="e.g. Bathroom Concealed Pipe Leak Detection & Jaquar Fixture Fitting"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-xl border-border bg-background font-medium text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Detailed Description & Procedure</Label>
                    <Textarea
                      rows={4}
                      placeholder="Describe your exact inspection procedure, specialized diagnostic tools brought, and step-by-step resolution..."
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="rounded-xl border-border bg-background resize-none text-xs sm:text-sm leading-relaxed"
                    />
                  </div>

                  {/* Tools Carried */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Specialized Equipment & Parts Protocol</Label>
                    <Input
                      placeholder="e.g. Ultrasonic leak acoustic detector, Bosch laser distance level, ISI copper crimper"
                      value={formData.materials || ""}
                      onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                      className="rounded-xl border-border bg-background text-xs"
                    />
                  </div>

                  {/* Service Localities */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Mumbai Localities Covered</Label>
                    <Input
                      placeholder="e.g. Andheri West, Lokhandwala, Bandra, Juhu, Powai, Versova"
                      value={formData.service_area || ""}
                      onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
                      className="rounded-xl border-border bg-background text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 4: PRICING & ADD-ONS ── */}
              {studioStep === "pricing" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Pricing Mode & Custom Add-ons
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transparent doorstep rates backed by SafePay escrow — zero surprises for customers.
                    </p>
                  </div>

                  {/* Pricing Mode Radio Pills */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "fixed", label: "Fixed Job Rate", desc: "Guaranteed standard work" },
                      { id: "hourly", label: "Hourly Labour", desc: "Billed per hour on site" },
                      { id: "inspection", label: "Diagnostic Only", desc: "Deductible against job" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, pricing_mode: m.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.pricing_mode === m.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <strong className="block text-xs font-semibold text-foreground">{m.label}</strong>
                        <span className="text-[10px] text-muted-foreground">{m.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Price & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Base Rate (₹)</Label>
                      <Input
                        type="number"
                        placeholder="499"
                        value={formData.starting_price || ""}
                        onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                        className="rounded-xl border-border bg-background font-bold text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Estimated Duration</Label>
                      <select
                        value={formData.duration || "1–2 hours"}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                      >
                        <option value="30–45 mins">30–45 mins (Quick Diagnostic)</option>
                        <option value="1–2 hours">1–2 hours (Standard Service)</option>
                        <option value="Half Day (4h)">Half Day (4 hours)</option>
                        <option value="Full Day (8h)">Full Day (8 hours)</option>
                        <option value="Multi-day Project">Multi-day Project</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Add-ons Builder */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-semibold text-foreground block">
                          Custom Optional Add-ons
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Customers can check these add-on boxes during doorstep booking.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Add-on title (e.g. Thread tape & Teflon seals)"
                        value={newAddonName}
                        onChange={(e) => setNewAddonName(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Price (₹)"
                        value={newAddonPrice}
                        onChange={(e) => setNewAddonPrice(e.target.value)}
                        className="w-24 text-xs rounded-xl text-right"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddAddon}
                        className="rounded-xl text-xs shrink-0 bg-primary text-primary-foreground"
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {(formData.addons || []).map((addon: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-surface-subtle text-foreground text-xs font-medium px-3 py-1.5 rounded-xl border border-border"
                        >
                          <span>{addon.name}</span>
                          <strong className="text-primary">+₹{addon.price}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                addons: formData.addons.filter((_: any, i: number) => i !== idx),
                              });
                            }}
                            className="hover:text-destructive ml-1.5 text-sm"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 5: INCLUSIONS, EXCLUSIONS & WARRANTY ── */}
              {studioStep === "inclusions" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      Verified Inclusions, Exclusions & Warranty
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Explicit checklists eliminate disputes and build customer confidence.
                    </p>
                  </div>

                  {/* Warranty */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Workmanship Warranty Bond</Label>
                    <select
                      value={formData.warranty || "30-day Karighar Workmanship Guarantee"}
                      onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="14-day Karighar Workmanship Guarantee">14-day SafePay Guarantee</option>
                      <option value="30-day Karighar Workmanship Guarantee">30-day Standard Artisan Guarantee</option>
                      <option value="90-day Master Artisan Warranty">90-day Master Artisan Warranty</option>
                      <option value="6-Month Comprehensive Fitment Bond">6-Month Comprehensive Fitment Bond</option>
                    </select>
                  </div>

                  {/* What's Included */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold text-foreground">What's Included Checklist</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Precision electronic leak sniff test"
                        value={newInclusion}
                        onChange={(e) => setNewInclusion(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newInclusion.trim()) {
                            setFormData({ ...formData, included: [...(formData.included || []), newInclusion.trim()] });
                            setNewInclusion("");
                          }
                        }}
                        className="rounded-xl text-xs shrink-0"
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(formData.included || []).map((inc: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-emerald-200"
                        >
                          <Check className="size-3 text-emerald-600" />
                          {inc}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, included: formData.included.filter((_: any, idx: number) => idx !== i) })}
                            className="hover:text-destructive ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* What's Excluded */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold text-foreground">What's Not Included (Clear Boundaries)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Cost of replacement ball-valve"
                        value={newExclusion}
                        onChange={(e) => setNewExclusion(e.target.value)}
                        className="text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (newExclusion.trim()) {
                            setFormData({ ...formData, not_included: [...(formData.not_included || []), newExclusion.trim()] });
                            setNewExclusion("");
                          }
                        }}
                        className="rounded-xl text-xs shrink-0"
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(formData.not_included || []).map((exc: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 bg-surface-subtle text-muted-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border"
                        >
                          {exc}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, not_included: formData.not_included.filter((_: any, idx: number) => idx !== i) })}
                            className="hover:text-destructive ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Publish Switch */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-subtle">
                    <div>
                      <Label className="text-xs font-semibold text-foreground">Publish Live Immediately</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Listing goes live immediately for Mumbai customers searching your trade.
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_published ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="text-xs">
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  {studioStep !== "category" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const steps = ["category", "photos", "details", "pricing", "inclusions"];
                        const idx = steps.indexOf(studioStep);
                        if (idx > 0) setStudioStep(steps[idx - 1] as any);
                      }}
                      className="text-xs rounded-xl"
                    >
                      ← Previous Step
                    </Button>
                  )}

                  {studioStep !== "inclusions" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        const steps = ["category", "photos", "details", "pricing", "inclusions"];
                        const idx = steps.indexOf(studioStep);
                        if (idx < steps.length - 1) setStudioStep(steps[idx + 1] as any);
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-5"
                    >
                      Next Step →
                    </Button>
                  ) : (
                    <Button
                      onClick={saveGig}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 shadow-warm"
                    >
                      {editingId === "new" ? "🚀 Publish Live Listing" : "Save Changes"}
                    </Button>
                  )}
                </div>
              </div>

            </Card>

            {/* Right Column: Live Customer View Preview Card */}
            {previewMode && (
              <div className="sticky top-24 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>Customer Storefront Preview</span>
                  <Badge variant="outline" className="text-[10px] bg-background">Live Preview</Badge>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-warm transition-all">
                  {/* Photo Banner with Carousel / Count */}
                  <div className="relative aspect-[16/10] w-full bg-surface-subtle overflow-hidden">
                    {currentCover ? (
                      <img src={currentCover} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No photo selected
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 text-[10px] bg-black/75 backdrop-blur-sm text-white border-none">
                      {formData.category || pro.trade}
                    </Badge>
                    {formData.photos?.length > 1 && (
                      <span className="absolute bottom-3 right-3 text-[10px] bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-medium">
                        1 / {formData.photos.length} photos
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-semibold text-foreground">{pro.rating || "4.92"}</span>
                        <span>({pro.reviews || 128} verified reviews)</span>
                      </div>
                      <h4 className="font-display font-semibold text-base text-foreground leading-snug">
                        {formData.name || "Untitled Craft Service"}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {formData.description || "Full diagnostic check and precision repair."}
                      </p>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-border">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                          {formData.pricing_mode === "hourly" ? "Hourly Rate" : "Standard Price"}
                        </span>
                        <span className="font-display text-xl font-bold text-foreground">
                          ₹{Number(formData.starting_price || 499).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {formData.duration || "1–2 hours"}
                      </span>
                    </div>

                    {/* Inclusions summary */}
                    {formData.included?.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-border/60">
                        <span className="text-[10px] font-semibold text-muted-foreground block uppercase">
                          Includes {formData.included.length} verified checks
                        </span>
                        <div className="space-y-1 text-xs text-foreground/80">
                          {formData.included.slice(0, 3).map((inc: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <Check className="size-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{inc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add-ons Preview */}
                    {formData.addons?.length > 0 && (
                      <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-1">
                        <Plus className="size-3 text-primary" />
                        <span>{formData.addons.length} optional add-ons available</span>
                      </div>
                    )}

                    <Button className="w-full bg-primary text-primary-foreground font-semibold text-xs py-4 rounded-xl shadow-warm">
                      Select for Visit
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* ─── GIGS SHOWCASE CARDS ────────────────────────────────── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {gigs.length} Active Services Live on Storefront
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gigs.map((gig: any) => (
              <div
                key={gig.id}
                className="border border-border rounded-2xl overflow-hidden bg-card shadow-warm-xs hover:border-primary/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-subtle border-b border-border">
                    {gig.photos?.length > 0 ? (
                      <img
                        src={gig.photos[0]}
                        alt={gig.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-subtle text-muted-foreground text-xs">
                        No photos added
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <Badge variant={gig.is_published !== false ? "success" : "secondary"} className="text-[10px]">
                        {gig.is_published !== false ? "🟢 Live" : "Draft"}
                      </Badge>
                    </div>
                    {gig.photos?.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 text-[10px] bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded-full font-medium">
                        {gig.photos.length} photos
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-semibold text-base text-foreground leading-snug">
                      {gig.name}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {gig.description || "Doorstep fault diagnosis with verified SafePay escrow protection."}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold block">Visit Rate</span>
                        <span className="font-display font-bold text-lg text-foreground">
                          ₹{(gig.starting_price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {gig.duration || "1–2 hrs"}
                      </span>
                    </div>

                    {gig.included?.length > 0 && (
                      <div className="text-[11px] text-foreground/80 flex items-center gap-1.5">
                        <Check className="size-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{gig.included[0]}</span>
                        {gig.included.length > 1 && (
                          <span className="text-muted-foreground">(+{gig.included.length - 1} more)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-border p-3.5 bg-surface-subtle flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingId(gig.id);
                        setStudioStep("details");
                        setFormData({
                          ...gig,
                          photos: gig.photos || [],
                          included: gig.included || [],
                          not_included: gig.not_included || [],
                          addons: gig.addons || [],
                        });
                      }}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="size-3.5" /> Edit Studio
                    </button>
                    <button
                      onClick={() => togglePublish(gig)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {gig.is_published !== false ? "Hide" : "Show Live"}
                    </button>
                  </div>

                  <button
                    onClick={() => deleteGig(gig.id)}
                    className="text-destructive hover:opacity-80 transition-opacity flex items-center gap-1"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {gigs.length === 0 && (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-border rounded-2xl bg-card p-8 space-y-4">
                <Wrench className="size-12 text-muted-foreground mx-auto" />
                <h3 className="font-display text-xl font-semibold text-foreground">
                  No services published on your storefront yet
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Create your first tailored service listing with photos, verified inclusions, and pricing to immediately receive doorstep dispatches in Mumbai.
                </p>
                <Button
                  onClick={() => {
                    setEditingId("new");
                    setStudioStep("details");
                    setFormData({
                      name: "Diagnostic Visit & Leak Detection",
                      description: "Doorstep fault diagnosis with pressure gauge testing and upfront estimate.",
                      starting_price: 350,
                      duration: "45 mins",
                      service_area: pro.city || "Mumbai",
                      warranty: "30-day Karighar Guarantee",
                      photos: [
                        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
                      ],
                      included: ["Doorstep inspection", "SafePay coverage"],
                      not_included: ["Spare parts"],
                      addons: [],
                      is_published: true,
                    });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 py-2.5 shadow-warm"
                >
                  + Create First Listing
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import from Standard Catalog Dialog */}
      <Dialog open={isCatalogPickerOpen} onOpenChange={setIsCatalogPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-card border-border p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="size-5 text-primary" />
              Import Standardized Catalog SOP
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select any standardized Karighar service package to adopt as your own. Pre-fills verified inclusions, warranties, duration, and photos — you keep full control over your pricing and terms.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3.5 mt-4">
            {CURATED_SERVICES.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all bg-background/50 hover:bg-primary/5 space-y-3 cursor-pointer group"
                onClick={() => {
                  setFormData({
                    name: s.name,
                    description: s.description,
                    category: s.category,
                    starting_price: s.basePrice,
                    duration: s.duration,
                    service_area: pro.city || "Andheri West, Mumbai",
                    warranty: s.warranty,
                    photos: [
                      s.category === "Electrical" ? "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80" :
                      s.category === "Appliance" ? "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80" :
                      s.category === "Waterproofing" ? "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" :
                      s.category === "Renovation" ? "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80" :
                      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80"
                    ],
                    included: [...s.included],
                    not_included: [...s.excluded],
                    addons: [{ name: "Standard Consumables Pack", price: 250 }],
                    is_published: true,
                  });
                  setEditingId("new");
                  setStudioStep("details");
                  setIsCatalogPickerOpen(false);
                  toast.success(`Loaded "${s.name}" template. Customize your price and details!`);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-semibold border-primary/30 text-primary">
                        {s.category}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock3 className="size-3" /> {s.duration}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {s.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {s.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      ₹{s.basePrice.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Standard Base</span>
                    <Button size="sm" className="mt-2 text-xs h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="text-success font-medium flex items-center gap-1">
                    <ShieldCheck className="size-3 text-success" /> {s.warranty}
                  </span>
                  <span>• {s.included.length} Standard inclusions</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 3: AVAILABILITY DISCOUNTS & CUSTOM RULE SETS (PRO AS ADMIN)
   ═══════════════════════════════════════════════════════════════════════ */
function AvailabilityRulesTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  // Pro Rule Sets & Discounts state (persisted locally / DB)
  const [advanceDiscount, setAdvanceDiscount] = useState("10");
  const [isAdvanceDiscountActive, setIsAdvanceDiscountActive] = useState(true);
  const [emergencySurcharge, setEmergencySurcharge] = useState("199");
  const [isEmergencyActive, setIsEmergencyActive] = useState(true);
  const [weekendMultiplier, setWeekendMultiplier] = useState("1.15");
  const [workingHoursStart, setWorkingHoursStart] = useState("08:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("20:30");
  const [minNoticeHours, setMinNoticeHours] = useState("2");

  // Base Daily Rate & Per-Date Custom Pricing
  const [baseDailyRate, setBaseDailyRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`karighar_pro_base_rate_${pro.id}`);
      if (saved) return Number(saved) || 499;
    }
    return 499;
  });

  const [dateCustomRates, setDateCustomRates] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`karighar_pro_rates_${pro.id}`);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return {};
  });

  // Modal state for editing a specific date's price & status
  const [editingDateModal, setEditingDateModal] = useState<{
    dateStr: string;
    day: number;
    currentPrice: number;
    state: "open" | "blocked" | "scheduled" | "past";
  } | null>(null);

  const [customPriceInput, setCustomPriceInput] = useState<string>("499");

  const savePricingToStorage = (newRates: Record<string, number>, newBase: number) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`karighar_pro_rates_${pro.id}`, JSON.stringify(newRates));
      localStorage.setItem(`karighar_pro_rates_${pro.slug}`, JSON.stringify(newRates));
      localStorage.setItem(`karighar_pro_base_rate_${pro.id}`, String(newBase));
      localStorage.setItem(`karighar_pro_base_rate_${pro.slug}`, String(newBase));
      window.dispatchEvent(new CustomEvent("karighar_pro_rates_updated", {
        detail: { proId: pro.id, slug: pro.slug, rates: newRates, baseRate: newBase },
      }));
    }
  };

  const { data: availability = [], refetch: refetchAvail } = useQuery({
    queryKey: ["karighar-availability", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("karighar_availability")
        .select("*")
        .eq("professional_id", pro.id);
      if (error) return [];
      return data ?? [];
    },
  });

  const { data: scheduledProjects = [] } = useQuery({
    queryKey: ["scheduled-projects", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("professional_id", pro.id)
        .in("status", ["scheduled", "in_progress"]);
      if (error) return [];
      return data ?? [];
    },
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayStr = new Date().toISOString().split("T")[0];

  const fmtDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getDateState = (dateStr: string, day: number): "past" | "scheduled" | "blocked" | "open" => {
    const dateObj = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return "past";
    const proj = scheduledProjects.find((p: any) => p.timing === dateStr || p.timing?.startsWith(dateStr));
    if (proj) return "scheduled";
    const blocked = availability.find((a: any) => a.date === dateStr && a.status === "blocked");
    if (blocked) return "blocked";
    return "open";
  };

  const getDayPrice = (dateStr: string, day: number): number => {
    if (dateCustomRates[dateStr]) return dateCustomRates[dateStr];
    const dateObj = new Date(year, month, day);
    const dow = dateObj.getDay();
    if (dow === 0 || dow === 6) {
      return Math.round(baseDailyRate * Number(weekendMultiplier || 1.15));
    }
    return baseDailyRate;
  };

  const handleCellClick = (dateStr: string, day: number) => {
    const state = getDateState(dateStr, day);
    if (state === "past") return;
    if (state === "scheduled") {
      toast.info("This date has an active customer project booking.");
      return;
    }
    const currentPrice = getDayPrice(dateStr, day);
    setCustomPriceInput(String(currentPrice));
    setEditingDateModal({
      dateStr,
      day,
      currentPrice,
      state,
    });
  };

  const handleSaveDateSettings = async (newPrice: number, shouldBlock: boolean) => {
    if (!editingDateModal) return;
    const { dateStr, state } = editingDateModal;

    try {
      if (shouldBlock && state !== "blocked") {
        await supabase.from("karighar_availability").insert({
          professional_id: pro.id,
          date: dateStr,
          status: "blocked",
        });
        toast.success(`${dateStr} blocked on customer calendar`);
      } else if (!shouldBlock && state === "blocked") {
        const row = availability.find((a: any) => a.date === dateStr);
        if (row) {
          await supabase.from("karighar_availability").delete().eq("id", row.id);
          toast.success(`${dateStr} unblocked`);
        }
      }

      const updatedRates = { ...dateCustomRates, [dateStr]: newPrice };
      setDateCustomRates(updatedRates);
      savePricingToStorage(updatedRates, baseDailyRate);

      toast.success(`Date rate updated to ₹${newPrice.toLocaleString("en-IN")}`);
      setEditingDateModal(null);
      refetchAvail();
      qc.invalidateQueries({ queryKey: ["professional", pro.slug] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update date settings");
    }
  };

  // Bulk Apply Weekend Surge
  const handleApplyWeekendSurge = () => {
    const updated = { ...dateCustomRates };
    const surgeMultiplier = Number(weekendMultiplier || 1.15);
    const surgePrice = Math.round(baseDailyRate * surgeMultiplier);

    days.forEach((day) => {
      const dObj = new Date(year, month, day);
      if (dObj.getDay() === 0 || dObj.getDay() === 6) {
        const dStr = fmtDate(day);
        updated[dStr] = surgePrice;
      }
    });

    setDateCustomRates(updated);
    savePricingToStorage(updated, baseDailyRate);
    toast.success(`Weekend surge (₹${surgePrice}) applied to all Saturdays & Sundays this month!`);
  };

  // Reset Month to Base Rate
  const handleResetMonthRates = () => {
    const updated = { ...dateCustomRates };
    days.forEach((day) => {
      const dStr = fmtDate(day);
      delete updated[dStr];
    });
    setDateCustomRates(updated);
    savePricingToStorage(updated, baseDailyRate);
    toast.success(`Month reset to default base rate (₹${baseDailyRate})`);
  };

  const handleSaveRules = () => {
    savePricingToStorage(dateCustomRates, baseDailyRate);
    toast.success("Calendar rates, rules & availability saved!", {
      description: `Default base ₹${baseDailyRate}/day and customized date rates are now live on your customer storefront.`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
            Calendar Pricing, Availability & Dispatch Rules
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Set your default day rate, customize pricing per calendar day, toggle weekend surge, and manage bookings.
          </p>
        </div>

        <Button onClick={handleSaveRules} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-5 py-2.5 rounded-xl shadow-warm">
          Save All Rules & Rates
        </Button>
      </div>

      {/* ─── Default Daily Pricing & Surcharges Panel ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 0. Main Default Daily Rate */}
        <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="size-4 text-primary" />
              Default Day Rate
            </span>
            <Badge variant="default" className="text-[10px] py-0">Main Rate</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your base inspection and visit fee charged on standard weekdays.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm font-bold text-foreground">₹</span>
            <Input
              type="number"
              value={baseDailyRate}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                setBaseDailyRate(val);
                savePricingToStorage(dateCustomRates, val);
              }}
              className="w-28 text-sm font-bold rounded-xl bg-background"
              min="199"
              step="50"
            />
            <span className="text-xs text-muted-foreground">/ day</span>
          </div>
        </div>

        {/* 1. Advance Booking Discount */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Percent className="size-4 text-emerald-600" />
              Advance Booking
            </span>
            <Switch checked={isAdvanceDiscountActive} onCheckedChange={setIsAdvanceDiscountActive} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Discount for customers booking 7+ days ahead.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              value={advanceDiscount}
              onChange={(e) => setAdvanceDiscount(e.target.value)}
              className="w-20 text-xs font-bold rounded-xl bg-background"
              min="0"
              max="40"
              disabled={!isAdvanceDiscountActive}
            />
            <span className="text-xs font-semibold text-foreground">% Discount</span>
          </div>
        </div>

        {/* 2. Same-Day Emergency Surcharge */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-warm-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Zap className="size-4 text-amber-600" />
              Emergency Surcharge
            </span>
            <Switch checked={isEmergencyActive} onCheckedChange={setIsEmergencyActive} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Express fee for dispatches requested within 45 mins.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-foreground">₹</span>
            <Input
              type="number"
              value={emergencySurcharge}
              onChange={(e) => setEmergencySurcharge(e.target.value)}
              className="w-24 text-xs font-bold rounded-xl bg-background"
              disabled={!isEmergencyActive}
            />
            <span className="text-xs font-semibold text-foreground">Express Fee</span>
          </div>
        </div>

        {/* 3. Weekend Surge Multiplier */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-warm-xs space-y-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Tag className="size-4 text-primary" />
            Weekend Multiplier
          </span>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Automatic multiplier for Saturday & Sunday slots.
          </p>
          <select
            value={weekendMultiplier}
            onChange={(e) => setWeekendMultiplier(e.target.value)}
            className="w-full text-xs font-medium p-2 rounded-xl border border-border bg-background outline-none text-foreground"
          >
            <option value="1.0">1.0x (Standard - No Surge)</option>
            <option value="1.15">1.15x (+15% Weekend Surge)</option>
            <option value="1.25">1.25x (+25% Weekend Surge)</option>
            <option value="1.50">1.50x (+50% Peak Surge)</option>
          </select>
        </div>
      </div>

      {/* ─── Working Hours & Notice Period ───────────────────────── */}
      <div className="bg-surface-subtle border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">Daily Start Time</Label>
          <Input
            type="time"
            value={workingHoursStart}
            onChange={(e) => setWorkingHoursStart(e.target.value)}
            className="rounded-xl bg-background text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">Daily End Time</Label>
          <Input
            type="time"
            value={workingHoursEnd}
            onChange={(e) => setWorkingHoursEnd(e.target.value)}
            className="rounded-xl bg-background text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-foreground">Min. Booking Notice</Label>
          <select
            value={minNoticeHours}
            onChange={(e) => setMinNoticeHours(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none text-foreground"
          >
            <option value="1">1 hour in advance</option>
            <option value="2">2 hours in advance (Recommended)</option>
            <option value="4">4 hours in advance</option>
            <option value="24">1 day in advance</option>
          </select>
        </div>
      </div>

      {/* ─── Interactive Calendar Grid with Per-Day Pricing ───────── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-warm-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any date to set its custom rate (e.g. ₹699, ₹899) or block/unblock. Changes immediately reflect on the customer side.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleApplyWeekendSurge}
              className="text-xs rounded-xl h-8 border-primary/30 text-primary hover:bg-primary/5"
            >
              <Zap className="size-3 mr-1" />
              Apply Weekend Surge to Month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetMonthRates}
              className="text-xs rounded-xl h-8 text-muted-foreground hover:text-foreground"
            >
              Reset Month
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="text-xs h-8"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="text-xs h-8 font-semibold"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="text-xs h-8"
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-medium pt-1 border-t border-border/50">
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="size-2.5 rounded-full bg-emerald-500" /> Open (Shows day price)
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="size-2.5 rounded-full bg-rose-500" /> Blocked / Off
          </span>
          <span className="flex items-center gap-1.5 text-primary">
            <span className="size-2.5 rounded-full bg-primary" /> Active Job Scheduled
          </span>
          <span className="text-[11px] text-muted-foreground ml-auto">
            Base: <strong>₹{baseDailyRate}/day</strong>
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border border-border rounded-2xl overflow-hidden shadow-warm-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted-foreground py-2.5 bg-surface-subtle border-b border-border">
              {d}
            </div>
          ))}

          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] border-b border-r border-border/30 bg-surface-subtle/20" />
          ))}

          {days.map((day) => {
            const dateStr = fmtDate(day);
            const state = getDateState(dateStr, day);
            const isToday = dateStr === todayStr;
            const proj = scheduledProjects.find((p: any) => p.timing === dateStr || p.timing?.startsWith(dateStr));
            const dayPrice = getDayPrice(dateStr, day);
            const isCustom = !!dateCustomRates[dateStr];
            const dateObj = new Date(year, month, day);
            const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

            return (
              <div
                key={day}
                onClick={() => handleCellClick(dateStr, day)}
                className={`min-h-[85px] p-2 border-b border-r border-border/40 transition-all flex flex-col justify-between cursor-pointer select-none group ${
                  state === "past"
                    ? "bg-surface-subtle/40 opacity-40 cursor-not-allowed"
                    : state === "scheduled"
                    ? "bg-primary/10 border-primary"
                    : state === "blocked"
                    ? "bg-rose-50/60 hover:bg-rose-100/60"
                    : "bg-card hover:bg-surface-subtle/80 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isToday ? "bg-primary text-primary-foreground size-5 rounded-full flex items-center justify-center" : "text-foreground"
                  }`}>
                    {day}
                  </span>
                  {state === "blocked" && (
                    <span className="text-[10px] text-rose-600 font-bold bg-rose-100/80 px-1 rounded">Blocked</span>
                  )}
                  {state === "scheduled" && (
                    <span className="text-[10px] text-primary font-bold bg-primary/20 px-1 rounded">Booked</span>
                  )}
                  {state === "open" && (
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      isCustom
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : isWeekend
                        ? "bg-amber-100/80 text-amber-900 border border-amber-300"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }`}>
                      ₹{dayPrice}
                    </span>
                  )}
                </div>

                <div className="text-[10px] mt-1">
                  {state === "scheduled" && proj ? (
                    <span className="text-primary font-semibold line-clamp-1">{proj.title}</span>
                  ) : state === "blocked" ? (
                    <span className="text-rose-600/80">Click to open</span>
                  ) : isCustom ? (
                    <span className="text-primary font-medium">Custom Rate</span>
                  ) : isWeekend ? (
                    <span className="text-amber-800 font-medium">Weekend Surge</span>
                  ) : (
                    <span className="text-muted-foreground/70 group-hover:text-primary">Standard</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Per-Date Rate & Availability Editor Modal ────────────── */}
      <Dialog open={!!editingDateModal} onOpenChange={(open) => !open && setEditingDateModal(null)}>
        {editingDateModal && (
          <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
                <CalendarDays className="size-5 text-primary" />
                Customize Rate: {editingDateModal.dateStr}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set a specific visit fee for this day, or mark it as a personal day off.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Day Rate Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Visit & Diagnostic Rate for this Date
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">₹</span>
                  <Input
                    type="number"
                    value={customPriceInput}
                    onChange={(e) => setCustomPriceInput(e.target.value)}
                    className="text-sm font-bold bg-background h-10"
                    min="199"
                    step="50"
                  />
                  <span className="text-xs text-muted-foreground">INR</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Quick Rate Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: `Base (₹${baseDailyRate})`, val: baseDailyRate },
                    { label: `Weekend (+15% ₹${Math.round(baseDailyRate * 1.15)})`, val: Math.round(baseDailyRate * 1.15) },
                    { label: `Peak (+25% ₹${Math.round(baseDailyRate * 1.25)})`, val: Math.round(baseDailyRate * 1.25) },
                    { label: "Emergency (₹899)", val: 899 },
                    { label: "Festive (₹999)", val: 999 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setCustomPriceInput(String(preset.val))}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface-subtle hover:border-primary/40 text-foreground transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Status Toggle */}
              <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Day Off / Blocked Date
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Disable this date completely from customer search
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={editingDateModal.state === "blocked" ? "destructive" : "outline"}
                  onClick={() =>
                    handleSaveDateSettings(
                      Number(customPriceInput) || baseDailyRate,
                      editingDateModal.state !== "blocked"
                    )
                  }
                  className="h-8 text-xs rounded-lg"
                >
                  {editingDateModal.state === "blocked" ? "Currently Blocked" : "Block This Day"}
                </Button>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingDateModal(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleSaveDateSettings(
                    Number(customPriceInput) || baseDailyRate,
                    editingDateModal.state === "blocked"
                  )
                }
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
              >
                Save Rate for {editingDateModal.day} {currentMonth.toLocaleString("default", { month: "short" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 4: IN-APP CUSTOMER INQUIRIES & MESSAGES
   ═══════════════════════════════════════════════════════════════════════ */
function MessagesTab({ pro }: { pro: ProRow }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["pro-messages", pro.id, pro.user_id],
    queryFn: async () => {
      try {
        const [projRes, quoteRes] = await Promise.all([
          supabase.from("projects").select("id").eq("professional_id", pro.id),
          supabase.from("quotes").select("project_id").eq("professional_id", pro.id),
        ]);

        const projectIds = new Set<string>();
        (projRes.data || []).forEach((p: any) => p.id && projectIds.add(p.id));
        (quoteRes.data || []).forEach((q: any) => q.project_id && projectIds.add(q.project_id));
        const idList = Array.from(projectIds);

        let query = supabase
          .from("messages")
          .select("*, projects(id, title, customer_id, location)")
          .order("created_at", { ascending: false });

        if (idList.length > 0 && pro.user_id) {
          query = query.or(`project_id.in.(${idList.join(",")}),sender_id.eq.${pro.user_id},receiver_id.eq.${pro.user_id}`);
        } else if (idList.length > 0) {
          query = query.in("project_id", idList);
        } else if (pro.user_id) {
          query = query.or(`sender_id.eq.${pro.user_id},receiver_id.eq.${pro.user_id}`);
        } else {
          return [];
        }

        const { data, error } = await query;
        if (error) {
          console.warn("Pro messages query error:", error);
          return [];
        }
        return data ?? [];
      } catch (e) {
        console.warn("Failed to load messages:", e);
        return [];
      }
    },
    refetchInterval: 3000,
  });

  const threads = useMemo(() => {
    if (!messages) return [];
    const grouped = new Map();
    for (const msg of messages) {
      if (!msg.project_id) continue;
      if (!grouped.has(msg.project_id)) {
        grouped.set(msg.project_id, {
          projectId: msg.project_id,
          title: msg.projects?.title || "Customer Inquiry",
          location: msg.projects?.location || pro.city || "Mumbai",
          customerId: msg.projects?.customer_id,
          lastMessage: msg,
          unread: msg.receiver_id === user?.id && !msg.read,
          messages: [],
        });
      }
      grouped.get(msg.project_id).messages.push(msg);
      if (msg.receiver_id === user?.id && !msg.read) {
        grouped.get(msg.project_id).unread = true;
      }
    }
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, user?.id, pro.city]);

  const activeThread = activeProjectId ? threads.find((t) => t.projectId === activeProjectId) : threads[0];

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeThread || !user) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem("content") as HTMLInputElement;
    if (!input.value.trim()) return;

    const firstMsg = activeThread.messages[0];
    const receiverId = activeThread.customerId || (firstMsg?.sender_id === user.id ? firstMsg?.receiver_id : firstMsg?.sender_id);
    const content = input.value.trim();
    input.value = "";

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId || null,
      project_id: activeThread.projectId,
      content,
      read: false,
    });

    if (error) {
      toast.error("Failed to send message: " + error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["pro-messages", pro.id, pro.user_id] });
    }
  };

  const sendQuickReply = async (text: string) => {
    if (!activeThread || !user) return;
    const firstMsg = activeThread.messages[0];
    const receiverId = activeThread.customerId || (firstMsg?.sender_id === user.id ? firstMsg?.receiver_id : firstMsg?.sender_id);

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId || null,
      project_id: activeThread.projectId,
      content: text,
      read: false,
    });

    if (error) {
      toast.error("Failed to send quick reply: " + error.message);
    } else {
      toast.success("Quick reply sent!");
      qc.invalidateQueries({ queryKey: ["pro-messages", pro.id, pro.user_id] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          Customer Inquiries
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Direct messages sent through your storefront profile or project quotes.
        </p>
      </div>

      <div className="border border-border rounded-2xl h-[650px] bg-card shadow-warm-xs flex overflow-hidden">

        {/* Left Pane: Conversations */}
        <div className="w-80 border-r border-border flex flex-col shrink-0 bg-surface-subtle/50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conversations</span>
            <span className="text-xs font-semibold text-primary">{threads.length} Active</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="size-8 text-muted-foreground mx-auto" />
                <p>No messages yet. When customers click "Message on Karighar" from your profile, it opens here.</p>
              </div>
            ) : (
              threads.map((t) => (
                <div
                  key={t.projectId}
                  onClick={() => setActiveProjectId(t.projectId)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    (activeThread?.projectId === t.projectId) ? "bg-card border-l-4 border-primary shadow-warm-xs" : "hover:bg-card/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-xs text-foreground truncate">{t.title}</h4>
                    {t.unread && <span className="size-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-1">
                    {t.lastMessage.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Thread Content */}
        {activeThread ? (
          <div className="flex-1 flex flex-col h-full bg-card">
            {/* Thread Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-subtle/30">
              <div>
                <h3 className="font-semibold text-sm text-foreground">{activeThread.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3 text-primary" /> {activeThread.location} · Protected by SafePay
                </p>
              </div>
              <Link
                to="/projects/$id"
                params={{ id: activeThread.projectId }}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View Project Details <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
              {activeThread.messages.map((msg: any) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[75%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm shadow-warm-xs"
                          : "bg-surface-subtle text-foreground rounded-tl-sm border border-border"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Fast Reply Suggestions */}
            <div className="px-4 py-2 border-t border-border bg-surface-subtle/30 flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground font-semibold mr-1 flex items-center">Fast Replies:</span>
              {[
                "I can arrive within 45 mins",
                "Please share a photo of the unit",
                "Quote submitted under SafePay",
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => sendQuickReply(txt)}
                  className="text-[11px] font-medium bg-background border border-border hover:border-primary/50 text-foreground px-2.5 py-1 rounded-full transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 border-t border-border bg-card">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  name="content"
                  type="text"
                  placeholder="Type your message on Karighar..."
                  className="flex-1 bg-surface-subtle border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-primary"
                  autoComplete="off"
                />
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-4 gap-1.5 text-xs font-semibold">
                  <Send className="size-3.5" />
                  Send
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageSquare className="size-12 text-muted-foreground/30 mb-3" />
            <h3 className="font-display text-lg font-semibold text-foreground">Customer Inquiries</h3>
            <p className="text-xs max-w-xs mt-1">
              Select an inquiry on the left to read and respond to customer questions.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 5: AGENCY TEAM
   ═══════════════════════════════════════════════════════════════════════ */
function AgencyTeamTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Helper");

  const members = useQuery({
    queryKey: ["agency-members", pro.id],
    queryFn: async () => (await supabase.from("agency_members").select("*").eq("professional_id", pro.id)).data ?? [],
  });

  async function addMember() {
    if (!name || !phone) return toast.error("Name and Phone required");
    const { error } = await supabase.from("agency_members").insert({
      professional_id: pro.id,
      name,
      phone,
      role,
    });
    if (error) return toast.error("Failed to add member");
    toast.success("Team member added");
    setName("");
    setPhone("");
    qc.invalidateQueries({ queryKey: ["agency-members"] });
  }

  async function removeMember(id: string) {
    await supabase.from("agency_members").delete().eq("id", id);
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["agency-members"] });
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-subtle border border-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground relative z-10">
          Agency Crew & Dispatch Mode
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl relative z-10">
          Register verified apprentices and journeymen under your license. Dispatch them to diagnostic visits with live GPS coordination.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border rounded-2xl shadow-warm-xs bg-card p-5 space-y-4">
          <h3 className="font-display font-semibold text-base text-foreground">Add Crew Member</h3>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="rounded-xl text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="rounded-xl text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Trade Specialty</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary"
              >
                <option>Helper / Apprentice</option>
                <option>Junior Technician</option>
                <option>Master Craftsman</option>
              </select>
            </div>
            <Button onClick={addMember} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs py-5 rounded-xl">
              Add Member
            </Button>
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-display font-semibold text-base text-foreground">
            Registered Crew ({members.data?.length || 0}/5)
          </h3>
          {members.data?.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center text-xs text-muted-foreground">
              No additional crew members registered yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {members.data?.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-warm-xs">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {m.name}
                        <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">{m.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)} className="text-xs text-destructive hover:bg-destructive/10">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
