import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, Wrench, Clock, FileText, CheckCircle2,
  Calendar, Sliders, AlertCircle, ChevronRight, Calculator,
  Lock, ArrowRight, Sparkles, Star, MapPin, Crosshair, Loader2,
  CalendarDays, Clock3, Navigation, ArrowUpRight
} from "lucide-react";
import { PageShell, MUMBAI_LOCALITIES } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { calculateQuote, type PricingMode } from "@/lib/catalog";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/services/")({
  head: () => ({ meta: [{ title: "Standardized Services Catalog — Karighar" }] }),
  component: ServicesCatalogPage,
});

export interface CuratedService {
  id: string;
  name: string;
  category: string;
  pricingMode: PricingMode;
  visitFee: number;
  basePrice: number;
  duration: string;
  warranty: string;
  riskLevel: string;
  description: string;
  included: string[];
  excluded: string[];
  proSlug: string;
}

export const CURATED_SERVICES: CuratedService[] = [
  {
    id: "electrical-fault-diagnosis",
    name: "Electrical Fault Diagnosis & Wiring Check",
    category: "Electrical",
    pricingMode: "visit_quote" as PricingMode,
    visitFee: 199,
    basePrice: 199,
    duration: "45-60 mins",
    warranty: "30 days on repair",
    riskLevel: "High Voltage (Verified PPE Required)",
    description: "Thorough inspection of short-circuits, trip switches, MCBs, or concealed wiring issues by an A-grade licensed electrician.",
    included: ["Complete MCB & DB box load check", "Concealed wiring continuity test", "Itemized written quotation before any repair"],
    excluded: ["Major re-wiring parts (quoted separately from transparent Price Book)"],
    proSlug: "rohan-patil",
  },
  {
    id: "deep-ac-jet-service",
    name: "Split AC Deep Foam & Jet Cleaning",
    category: "Appliance",
    pricingMode: "fixed_menu" as PricingMode,
    basePrice: 599,
    visitFee: 0,
    duration: "45 mins",
    warranty: "30 days cooling warranty",
    riskLevel: "Standard",
    description: "High-pressure indoor and outdoor coil wash with antibacterial foam shield to restore peak cooling and lower electricity bills.",
    included: ["Indoor unit deep foam cleaning", "Outdoor coil high-pressure water wash", "Drain tray unclogging & gas pressure check"],
    excluded: ["Gas refill (if leaking, quoted as per standard price book)"],
    proSlug: "vikram-sharma",
  },
  {
    id: "waterproof-bathroom-grouting",
    name: "Bathroom Grouting & Tile Joint Waterproofing",
    category: "Waterproofing",
    pricingMode: "fixed_menu" as PricingMode,
    basePrice: 899,
    visitFee: 0,
    duration: "2-3 hours",
    warranty: "90 days leakage warranty",
    riskLevel: "Standard",
    description: "Epoxy and polymer waterproof tile joint seal preventing seepage into walls and lower floor ceilings.",
    included: ["Old damaged grout removal", "Anti-fungal deep sanitization", "High-grade polymer waterproof joint sealing"],
    excluded: ["Broken tile replacement"],
    proSlug: "dinesh-kulkarni",
  },
  {
    id: "full-flat-painting-renovation",
    name: "Complete Home Interior Painting & Wall Renewal",
    category: "Renovation",
    pricingMode: "milestone_escrow" as PricingMode,
    basePrice: 14500,
    visitFee: 0,
    duration: "3-5 days",
    warranty: "1 year peeling & sheen warranty",
    riskLevel: "Height Safety",
    description: "End-to-end flat painting with dustless sanding, wall putty repair, primer coat, and 2 finish coats backed by milestone escrow releases.",
    included: ["Full furniture plastic masking & floor protection", "3-stage SafePay milestone release", "Daily photo updates & cleanup"],
    excluded: ["External facade rendering"],
    proSlug: "sunil-verma",
  },
  {
    id: "daily-skilled-carpentry-helper",
    name: "Skilled Carpenter & Helper (Daily Rate)",
    category: "Carpentry",
    pricingMode: "hourly_rate" as PricingMode,
    basePrice: 1200,
    visitFee: 0,
    duration: "Full Day (8 hrs)",
    warranty: "Satisfaction sign-off",
    riskLevel: "Power Tools",
    description: "Experienced woodworker for custom hinges, door fitting, modular modifications, and furniture repairs.",
    included: ["8 hours focused carpentry labour", "Standard precision cutting & leveling tools"],
    excluded: ["Laminates, screws, and adhesives"],
    proSlug: "meera-shah",
  },
];

function ServicesCatalogPage() {
  const [selectedService, setSelectedService] = useState<CuratedService>(CURATED_SERVICES[0]);
  const [partsEst, setPartsEst] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Multi-step Doorstep Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMode, setPaymentMode] = useState<"upi" | "card" | "escrow">("upi");
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [isGPSDetecting, setIsGPSDetecting] = useState(false);

  // Scheduling & Address State
  const [jobDate, setJobDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("Morning (9 AM – 12 PM)");
  const [doorstepNotes, setDoorstepNotes] = useState("");

  const [customerLocality, setCustomerLocality] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_locality") || "Andheri West";
    }
    return "Andheri West";
  });
  const [doorstepFlat, setDoorstepFlat] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_user_flat") || "";
    }
    return "";
  });
  const [doorstepSociety, setDoorstepSociety] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_user_society") || "";
    }
    return "";
  });
  const [doorstepLandmark, setDoorstepLandmark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_user_landmark") || "";
    }
    return "";
  });
  const [doorstepPincode, setDoorstepPincode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_user_pincode") || "400053";
    }
    return "400053";
  });
  const [doorstepGateInstructions, setDoorstepGateInstructions] = useState("");

  // Query real professionals from Supabase
  const { data: dbPros = [] } = useQuery({
    queryKey: ["services-catalog-professionals"],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("*");
      return data || [];
    },
  });

  // Matched Pro for the Selected Service
  const matchedPro = useMemo(() => {
    const found = dbPros.find((p: any) => p.slug === selectedService.proSlug || p.trade?.toLowerCase().includes(selectedService.category.toLowerCase()));
    return found || dbPros[0] || null;
  }, [selectedService, dbPros]);

  // Saved user addresses from Account
  const savedUserAddresses = useMemo(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("karighar-user-addresses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  }, [isCheckoutModalOpen]);

  const { data: quoteBreakdown } = useQuery({
    queryKey: ["service-quote", selectedService.id, selectedService.basePrice, partsEst, isUrgent],
    queryFn: () =>
      calculateQuote({
        pricingMode: selectedService.pricingMode,
        serviceBasePrice: selectedService.basePrice,
        partsTotal: partsEst,
        isUrgent,
      }),
  });

  // GPS Auto-detect
  const handleUseGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("GPS geolocation is not supported by your browser");
      return;
    }
    setIsGPSDetecting(true);
    toast.loading("Detecting your live GPS location...", { id: "catalog-gps" });

    const MUMBAI_LOCALITY_COORDS = [
      { name: "Andheri West", lat: 19.1363, lng: 72.8277 },
      { name: "Lokhandwala Complex", lat: 19.1438, lng: 72.8258 },
      { name: "Versova", lat: 19.1351, lng: 72.8143 },
      { name: "Juhu Scheme", lat: 19.1075, lng: 72.8263 },
      { name: "Bandra West", lat: 19.0596, lng: 72.8295 },
      { name: "Powai", lat: 19.1176, lng: 72.9060 },
      { name: "Khar West", lat: 19.0700, lng: 72.8338 },
      { name: "Vile Parle West", lat: 19.1022, lng: 72.8398 },
      { name: "Goregaon West", lat: 19.1663, lng: 72.8398 },
      { name: "Worli", lat: 19.0178, lng: 72.8178 },
      { name: "Dadar West", lat: 19.0178, lng: 72.8478 },
      { name: "Lower Parel", lat: 18.9953, lng: 72.8300 },
      { name: "Chembur", lat: 19.0522, lng: 72.8994 },
      { name: "Thane West", lat: 19.2183, lng: 72.9781 },
    ];

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGPSDetecting(false);
        const { latitude, longitude, accuracy } = pos.coords;
        let minD = Infinity;
        let closest = "Andheri West";
        for (const loc of MUMBAI_LOCALITY_COORDS) {
          const d = Math.hypot(loc.lat - latitude, loc.lng - longitude);
          if (d < minD) {
            minD = d;
            closest = loc.name;
          }
        }
        setCustomerLocality(closest);
        if (typeof window !== "undefined") {
          localStorage.setItem("karighar_locality", closest);
        }
        toast.success(`GPS Location Detected: ${closest}, Mumbai`, {
          id: "catalog-gps",
          description: `Accurate within ${Math.round(accuracy)}m • Service area updated`,
        });
      },
      (err) => {
        setIsGPSDetecting(false);
        toast.error("Could not retrieve GPS location", {
          id: "catalog-gps",
          description: "Please select your neighbourhood from the dropdown.",
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Booking Mutation to Supabase
  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");

      const title = `${selectedService.name} (Catalog Standard SOP)`;
      const summary = [
        `Service Package: ${selectedService.name}`,
        `Category: ${selectedService.category}`,
        `Pricing Mode: ${selectedService.pricingMode}`,
        `Scheduled Date: ${jobDate}`,
        `Arrival Window: ${selectedTimeSlot}`,
        `Assigned Karighar: ${matchedPro.name} (${matchedPro.business})`,
        doorstepNotes ? `Notes: ${doorstepNotes}` : null,
        doorstepGateInstructions ? `Gate Instructions: ${doorstepGateInstructions}` : null,
      ].filter(Boolean).join("\n");

      const fullAddress = [
        doorstepFlat ? doorstepFlat.trim() : null,
        doorstepSociety ? doorstepSociety.trim() : null,
        doorstepLandmark ? `Landmark: ${doorstepLandmark.trim()}` : null,
        `${customerLocality}, Mumbai — ${doorstepPincode}`,
      ].filter(Boolean).join(", ");

      const totalAmount = quoteBreakdown?.total || selectedService.basePrice;

      // Look up pro's real UUID from Supabase or fallback
      let proId = "";
      const { data: proRecord } = await supabase
        .from("professionals")
        .select("id")
        .eq("slug", selectedService.proSlug)
        .maybeSingle();

      if (proRecord?.id) {
        proId = proRecord.id;
      } else {
        const { data: fallbackPro } = await supabase
          .from("professionals")
          .select("id")
          .limit(1)
          .maybeSingle();
        proId = fallbackPro?.id || user.id;
      }

      // 1. Insert Project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          customer_id: user.id,
          title,
          summary,
          location: fullAddress,
          timing: jobDate,
          professional_id: proId,
          status: "scheduled",
          source: "quote",
        })
        .select("id")
        .single();

      if (projectError) throw projectError;

      // 2. Insert Quote Request
      const { error: quoteError } = await supabase
        .from("quotes")
        .insert({
          project_id: project.id,
          professional_id: proId,
          status: "requested",
          labour: quoteBreakdown?.labour || selectedService.basePrice,
          platform_fee: quoteBreakdown?.platformFee || 0,
          tax: quoteBreakdown?.gst || 0,
        });

      if (quoteError) throw quoteError;

      // 3. Initialize chat message
      try {
        await supabase.from("messages").insert({
          project_id: project.id,
          sender_id: user.id,
          receiver_id: matchedPro?.user_id || null,
          content: `Doorstep Booking Confirmed for ${selectedService.name}. Scheduled Date: ${jobDate}. Address: ${fullAddress}. SafePay Escrow Authorized.`,
          read: false,
        });
      } catch (mErr) {
        console.warn("Booking message notice:", mErr);
      }

      return project.id;
    },
    onSuccess: () => {
      const genId = `KGH-${Math.floor(10000 + Math.random() * 90000)}`;
      setConfirmedBookingId(genId);
      setCheckoutStep(4);
      toast.success("SafePay Escrow Authorized! Booking Confirmed", {
        description: `${matchedPro.name} assigned for ${jobDate}. Funds secured in escrow.`,
      });
      qc.invalidateQueries({ queryKey: ["my-projects"] });
    },
    onError: (e: Error) => {
      if (e.message === "Not logged in") {
        toast.error("Please log in to hire a Karighar");
        navigate({ to: "/auth", search: { redirect: "/services" } });
      } else {
        toast.error(e.message);
      }
    },
  });

  const handleStartBooking = () => {
    if (!user) {
      toast.info("Please log in to complete your doorstep booking");
      navigate({ to: "/auth", search: { redirect: "/services" } });
      return;
    }
    setCheckoutStep(1);
    setIsCheckoutModalOpen(true);
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-[1760px] px-5 py-8 md:px-10 xl:px-20">
        {/* Header banner */}
        <div className="mb-10 max-w-3xl">
          <Badge variant="default" className="mb-3 text-xs uppercase tracking-wider">
            Standardized SOP Catalog
          </Badge>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Transparent Pricing Modes. Verified Standard SOPs.
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Every service is strictly standardized: fixed-price instant bookings, transparent diagnostic visits, or milestone escrow projects. Zero hidden add-ons without your explicit in-app approval.
          </p>
        </div>

        {/* Catalog layout */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Services list */}
          <div className="space-y-4 lg:col-span-7">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Select a standardized service package
            </h2>
            {CURATED_SERVICES.map((s) => {
              const isSelected = selectedService.id === s.id;
              const proForService = dbPros.find((p: any) => p.slug === s.proSlug || p.trade?.toLowerCase().includes(s.category.toLowerCase())) || dbPros[0];

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-warm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-surface-subtle"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">{s.name}</span>
                    </div>
                    <Badge
                      variant={
                        s.pricingMode === "fixed_menu"
                          ? "success"
                          : s.pricingMode === "visit_quote"
                          ? "info"
                          : s.pricingMode === "milestone_escrow"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] uppercase font-semibold shrink-0"
                    >
                      {s.pricingMode.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {s.description}
                  </p>

                  {/* Matched Verified Pro Pill */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border/80 mb-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={proForService.image}
                        alt={proForService.name}
                        className="size-7 rounded-full object-cover border border-border"
                      />
                      <div>
                        <span className="font-semibold text-foreground block leading-tight">
                          {proForService.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {proForService.business} · ★ {proForService.rating} ({proForService.reviews})
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      {proForService.availability || "Available Today"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-foreground/80 pt-2 border-t border-border/60">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-muted-foreground" /> {s.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-success" /> {s.warranty}
                    </span>
                    <span className="font-bold text-primary ml-auto text-sm">
                      {s.pricingMode === "visit_quote" ? `₹${s.visitFee} visit fee` : `₹${s.basePrice.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Service Detail & Transparent Calculation Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-warm space-y-4">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <Badge variant="secondary" className="text-[10px] mb-1">
                    {selectedService.category}
                  </Badge>
                  <h3 className="font-display text-xl font-semibold text-foreground leading-snug">
                    {selectedService.name}
                  </h3>
                </div>
              </div>

              {/* Matched Pro Summary Card */}
              {matchedPro ? (
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={matchedPro.image || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&q=80&auto=format&fit=crop"}
                      alt={matchedPro.name}
                      className="size-11 rounded-xl object-cover border border-border"
                    />
                    <div>
                      <span className="text-xs font-bold text-foreground block">{matchedPro.name}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {matchedPro.business} · {matchedPro.city || "Mumbai"}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold mt-0.5">
                        <Star className="size-3 fill-amber-400 text-amber-500" />
                        <span>{matchedPro.rating || "0.0"}</span>
                        <span className="text-muted-foreground font-normal">({matchedPro.projects_count || 0} jobs)</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/professionals/$id"
                    params={{ id: matchedPro.id }}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
                    title="View complete artisan profile"
                  >
                    Profile <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground block">Verified Karighar Dispatch</span>
                    <p className="text-[11px] text-muted-foreground">Assigned to an active verified professional upon dispatch</p>
                  </div>
                </div>
              )}

              {/* What's included */}
              <div className="py-2 border-b border-border space-y-2">
                <span className="text-xs font-semibold text-foreground block">What's included in this SOP:</span>
                {selectedService.included.map((inc, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-foreground/85">
                    <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </div>
                ))}
              </div>

              {/* Dynamic Quotation Calculator */}
              <div className="py-2 border-b border-border space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="size-3.5 text-primary" /> Transparent Pricing Breakdown
                  </span>
                  <span className="text-[11px] text-muted-foreground">SafePay Escrow Protected</span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Standard Labour & SOP execution:</span>
                    <span className="font-medium text-foreground">₹{quoteBreakdown?.labour || selectedService.basePrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Managed Guarantee & Support:</span>
                    <span className="font-medium text-foreground">₹{quoteBreakdown?.platformFee || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Applicable GST (18%):</span>
                    <span className="font-medium text-foreground">₹{quoteBreakdown?.gst || 0}</span>
                  </div>
                </div>

                {/* Urgent Emergency Surge Toggle */}
                <label className="flex items-center gap-2 pt-1 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary accent-primary size-3.5"
                  />
                  <span>Need urgent 60-min arrival (1.5× express surge)</span>
                </label>
              </div>

              {/* Total & Action */}
              <div className="pt-2 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total SafePay Escrow</span>
                    <span className="text-2xl font-bold text-foreground">
                      ₹{(quoteBreakdown?.total || selectedService.basePrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="text-[11px] text-success font-medium flex items-center gap-1">
                    <Lock className="size-3" /> SafePay Protected
                  </span>
                </div>

                {/* Direct Booking Button that launches Multi-Step Doorstep Checkout Modal */}
                <Button
                  size="xl"
                  className="w-full text-base font-semibold shadow-warm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                  onClick={handleStartBooking}
                >
                  Book with {matchedPro.name}
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Zero advance release. Funds remain safely in escrow until you inspect and give your PIN.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Multi-Step Doorstep Checkout Modal ────────────────────── */}
        <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
          <DialogContent className="sm:max-w-xl rounded-2xl border-border bg-card p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              {[
                { num: 1, label: "Service & Time" },
                { num: 2, label: "Doorstep (GPS)" },
                { num: 3, label: "SafePay Escrow" },
                { num: 4, label: "Confirmed Pass" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      checkoutStep === s.num
                        ? "bg-primary text-primary-foreground shadow-warm-xs"
                        : checkoutStep > s.num
                        ? "bg-emerald-600 text-white"
                        : "bg-surface-subtle text-muted-foreground"
                    }`}
                  >
                    {checkoutStep > s.num ? <CheckCircle2 className="size-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      checkoutStep === s.num ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: SERVICE & TIMING */}
            {checkoutStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    1. Confirm Service & Visit Slot
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Standardized SOP package with verified technician assignment.
                  </p>
                </div>

                {/* Package details */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Selected Package</span>
                  <h4 className="font-semibold text-sm text-foreground">{selectedService.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedService.description}</p>
                </div>

                {/* Matched artisan */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border">
                  <img
                    src={matchedPro.image}
                    alt={matchedPro.name}
                    className="size-11 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1">
                    <h5 className="font-semibold text-xs text-foreground">{matchedPro.name}</h5>
                    <p className="text-[11px] text-muted-foreground">{matchedPro.business} · ★ {matchedPro.rating}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50 border-emerald-200">
                    Assigned Pro
                  </Badge>
                </div>

                {/* Timing controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Scheduled Visit Date
                    </label>
                    <Input
                      type="date"
                      value={jobDate}
                      onChange={(e) => setJobDate(e.target.value)}
                      className="h-9 text-xs bg-background"
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Arrival Window
                    </label>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="Morning (9 AM – 12 PM)">Morning (9 AM – 12 PM)</option>
                      <option value="Afternoon (12 PM – 4 PM)">Afternoon (12 PM – 4 PM)</option>
                      <option value="Evening (4 PM – 8 PM)">Evening (4 PM – 8 PM)</option>
                      <option value="Urgent (Within 45 Mins)">Urgent (Within 45 Mins)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Any specific symptoms or access notes?
                  </label>
                  <Input
                    placeholder="e.g. Master bedroom split AC, leaking water down wall"
                    value={doorstepNotes}
                    onChange={(e) => setDoorstepNotes(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setCheckoutStep(2)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-10 gap-1.5"
                  >
                    Confirm Doorstep Location <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: DOORSTEP LOCATION (GPS) */}
            {checkoutStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    2. Confirm Doorstep Delivery Address
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your complete flat and society address so {matchedPro.name} arrives without delays.
                  </p>
                </div>

                {/* Live GPS Button */}
                <button
                  type="button"
                  onClick={handleUseGPS}
                  disabled={isGPSDetecting}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-all text-xs font-semibold text-primary group"
                >
                  <div className="flex items-center gap-2.5">
                    {isGPSDetecting ? (
                      <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Crosshair className="size-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="text-left">
                      <span>{isGPSDetecting ? "Detecting GPS coordinates..." : "Use My Live Location (GPS)"}</span>
                      <span className="block text-[10px] text-primary/70 font-normal">
                        Auto-detects closest Mumbai residential neighbourhood
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background text-primary border-primary/30 text-[10px]">
                    Live GPS
                  </Badge>
                </button>

                {/* Quick Select Saved Address from Account */}
                {savedUserAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Saved Addresses:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {savedUserAddresses.map((sa: any) => (
                        <button
                          key={sa.id}
                          type="button"
                          onClick={() => {
                            setDoorstepFlat(sa.flatNo || "");
                            setDoorstepSociety(sa.society || "");
                            setCustomerLocality(sa.locality || customerLocality);
                            setDoorstepLandmark(sa.landmark || "");
                            setDoorstepPincode(sa.pincode || "400053");
                            if (sa.gateInstructions) setDoorstepGateInstructions(sa.gateInstructions);
                            toast.success(`Loaded saved ${sa.tag} address!`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface-subtle hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                        >
                          📍 {sa.tag}: {sa.flatNo?.slice(0, 24)}…
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Address Inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Mumbai Locality
                      </label>
                      <select
                        value={customerLocality}
                        onChange={(e) => setCustomerLocality(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                      >
                        {MUMBAI_LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}, Mumbai
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Pincode
                      </label>
                      <Input
                        required
                        placeholder="e.g. 400053"
                        value={doorstepPincode}
                        onChange={(e) => setDoorstepPincode(e.target.value)}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Flat / Unit / Floor Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Flat 502, B-Wing, 5th Floor"
                      value={doorstepFlat}
                      onChange={(e) => setDoorstepFlat(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Building, Society or Gated Community
                    </label>
                    <Input
                      placeholder="e.g. Oberoi Springs, off New Link Road"
                      value={doorstepSociety}
                      onChange={(e) => setDoorstepSociety(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Nearby Landmark & Gate Entry Instructions
                    </label>
                    <Input
                      placeholder="e.g. Opposite Starbucks. Security intercom 502. Service elevator."
                      value={doorstepLandmark}
                      onChange={(e) => setDoorstepLandmark(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(1)} className="text-xs">
                    ← Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!doorstepFlat.trim()) {
                        toast.error("Please enter your flat or unit number");
                        return;
                      }
                      setCheckoutStep(3);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-10 gap-1.5"
                  >
                    Proceed to SafePay Breakdown <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: SAFEPAY BREAKDOWN & PAYMENT */}
            {checkoutStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    3. SafePay Escrow & Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    100% Escrow Protection. Artisan is NOT paid in advance.
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Transparent Itemized Invoice
                  </span>
                  <div className="flex justify-between text-xs text-foreground/90">
                    <span>
                      {selectedService.name} (SOP Labour)
                    </span>
                    <span className="font-semibold text-foreground">₹{quoteBreakdown?.labour || selectedService.basePrice}</span>
                  </div>

                  <div className="flex justify-between text-xs text-foreground/90">
                    <span>Platform Managed Guarantee & Support</span>
                    <span className="font-semibold text-foreground">₹{quoteBreakdown?.platformFee || 0}</span>
                  </div>

                  <div className="flex justify-between text-xs text-foreground/90">
                    <span className="text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-emerald-600" /> SafePay Escrow Guarantee
                    </span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </div>

                  <div className="h-px bg-border my-1" />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Applicable GST (18%)</span>
                    <span>₹{quoteBreakdown?.gst || 0}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold text-foreground pt-1">
                    <span>Total Escrow Deposit</span>
                    <span className="font-display text-primary">
                      ₹{(quoteBreakdown?.total || selectedService.basePrice).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Payment Mode Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Select Escrow Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "upi", label: "UPI / QR", desc: "Instant GPay, PhonePe" },
                      { id: "card", label: "Cards / NetBanking", desc: "All Indian Banks" },
                      { id: "escrow", label: "SafePay Escrow", desc: "Digital Escrow Vault" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          paymentMode === m.id
                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-warm-xs"
                            : "border-border bg-background text-foreground/80 hover:bg-surface-subtle"
                        }`}
                      >
                        <span className="text-xs font-bold block">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Escrow Guarantee Pledge */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    How SafePay Escrow Protects You
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your deposit is safely locked in escrow. {matchedPro.name} receives payment ONLY after you inspect the completed service and share your 4-digit completion code.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(2)} className="text-xs">
                    ← Back
                  </Button>
                  <Button
                    onClick={() => bookingMutation.mutate()}
                    disabled={bookingMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-11 gap-2 shadow-warm"
                  >
                    <ShieldCheck className="size-4" />
                    {bookingMutation.isPending
                      ? "Securing Escrow Deposit…"
                      : `Authorize SafePay Escrow (₹${(quoteBreakdown?.total || selectedService.basePrice).toLocaleString("en-IN")})`}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: CONFIRMED DOORSTEP PASS */}
            {checkoutStep === 4 && (
              <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95">
                <div className="size-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-warm">
                  <CheckCircle2 className="size-9" />
                </div>

                <div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs mb-2">
                    SafePay Escrow Secured • #{confirmedBookingId}
                  </Badge>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Doorstep Service Confirmed!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {matchedPro.name} has been assigned to your standardized SOP package.
                  </p>
                </div>

                {/* Pass card */}
                <div className="p-5 rounded-2xl bg-surface-subtle border border-border text-left space-y-3.5 max-w-md mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Karighar Doorstep Pass
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      Verified Technician
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Assigned Pro</span>
                      <span className="font-semibold text-foreground">{matchedPro.name}</span>
                      <span className="text-[11px] text-muted-foreground block">{matchedPro.trade}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Arrival Window</span>
                      <span className="font-semibold text-foreground">{jobDate}</span>
                      <span className="text-[11px] text-primary font-medium block">{selectedTimeSlot}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">
                      Service Address
                    </span>
                    <p className="font-medium text-foreground">
                      {doorstepFlat}, {doorstepSociety ? doorstepSociety + ", " : ""}{customerLocality}, Mumbai — {doorstepPincode}
                    </p>
                  </div>

                  {/* 4-Digit Release PIN */}
                  <div className="p-3 rounded-xl bg-background border border-primary/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Milestone Completion PIN
                      </span>
                      <span className="text-[11px] text-muted-foreground">Give to pro ONLY after satisfactory finish</span>
                    </div>
                    <div className="font-mono text-lg font-bold tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-lg">
                      4 8 2 1
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      navigate({ to: "/my-projects" });
                    }}
                    className="text-xs font-semibold rounded-xl h-10 px-6"
                  >
                    View in My Projects
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl h-10 px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </PageShell>
  );
}
