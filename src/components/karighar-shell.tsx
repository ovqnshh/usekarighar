import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Hammer, LogOut, Menu, Paintbrush, Wrench, LayoutGrid,
  Heart, Sparkles, LayoutDashboard, X, Home as HomeIcon,
  ChevronRight, Search, Globe, FolderOpen, User, MapPin, ChevronDown, Check,
  Crosshair, Navigation, Loader2, Building, ShieldCheck
} from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteFooter } from "./site-footer";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n, SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n";
import { SearchOverlay } from "@/components/search-overlay";

/* â”€â”€â”€ Brand â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function Brand({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 text-foreground group" aria-label="Karighar home">
      <svg
        viewBox="0 0 32 32"
        className={size === "sm" ? "size-6" : "size-7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M4 15 16 5l12 10" className="text-primary" stroke="currentColor" />
        <path d="M8 12v13h16V12" />
        <path d="M13 25v-6h6v6" />
      </svg>
      <div className="flex flex-col">
        <span
          className={`font-display font-semibold tracking-tight transition-colors group-hover:text-primary ${
            size === "sm" ? "text-lg" : "text-xl"
          }`}
        >
          karighar
        </span>
      </div>
    </Link>
  );
}

/* â”€â”€â”€ Site Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* ─── Customer Location Selector (Uber / Zepto style + Live GPS) ────── */
export const MUMBAI_LOCALITIES = [
  "Andheri West",
  "Lokhandwala Complex",
  "Versova",
  "Juhu Scheme",
  "Bandra West",
  "Powai",
  "Khar West",
  "Vile Parle West",
  "Goregaon West",
  "Worli",
  "Dadar West",
  "Lower Parel",
  "Chembur",
  "Thane West",
];

const MUMBAI_LOCALITY_COORDS: { name: string; lat: number; lng: number }[] = [
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

function getNearestMumbaiLocality(lat: number, lng: number): string {
  let minDistance = Infinity;
  let closest = "Andheri West";
  for (const loc of MUMBAI_LOCALITY_COORDS) {
    const dist = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc.name;
    }
  }
  return closest;
}

export function CustomerLocationSelector() {
  const [locality, setLocality] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar_locality") || "Andheri West";
    }
    return "Andheri West";
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Full address state for quick edit
  const [doorstepAddress, setDoorstepAddress] = useState(() => {
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

  const handleSelect = (loc: string) => {
    setLocality(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("karighar_locality", loc);
      window.dispatchEvent(new CustomEvent("karighar_locality_changed", { detail: loc }));
    }
    toast.success(`Service area set to ${loc}, Mumbai`);
  };

  const handleUseGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("GPS geolocation is not supported by your browser");
      return;
    }
    setIsDetecting(true);
    toast.loading("Detecting your live location via GPS...", { id: "gps-detect" });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const nearest = getNearestMumbaiLocality(latitude, longitude);
        handleSelect(nearest);
        if (typeof window !== "undefined") {
          localStorage.setItem("karighar_user_coords", JSON.stringify({ latitude, longitude }));
        }
        toast.success(`GPS Location Detected: ${nearest}, Mumbai`, {
          id: "gps-detect",
          description: `Accurate to within ${Math.round(accuracy)}m • Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        });
      },
      (err) => {
        setIsDetecting(false);
        toast.error("Location permission denied or unavailable", {
          id: "gps-detect",
          description: "Please choose your Mumbai neighbourhood manually below.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSaveFullAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("karighar_user_flat", doorstepAddress);
      localStorage.setItem("karighar_user_society", doorstepSociety);
      localStorage.setItem("karighar_user_landmark", doorstepLandmark);
      localStorage.setItem("karighar_user_pincode", doorstepPincode);
      localStorage.setItem("karighar_locality", locality);
      window.dispatchEvent(new CustomEvent("karighar_locality_changed", { detail: locality }));
    }
    setIsAddressModalOpen(false);
    toast.success(`Full doorstep address updated for ${locality}!`, {
      description: `${doorstepAddress ? doorstepAddress + ", " : ""}${doorstepSociety ? doorstepSociety + ", " : ""}${locality}`,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-foreground bg-surface-subtle border border-border hover:border-primary/40 transition-colors shadow-warm-xs"
            title="Select or detect your Mumbai doorstep service location"
          >
            <MapPin className="size-3 text-primary shrink-0" />
            <span className="truncate max-w-[130px]">{locality}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl border-border bg-card shadow-warm-lg">
          {/* GPS Live Location Trigger Button */}
          <div className="p-1">
            <button
              onClick={handleUseGPS}
              disabled={isDetecting}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/15 transition-all text-xs font-semibold text-left group"
            >
              {isDetecting ? (
                <Loader2 className="size-4 animate-spin shrink-0" />
              ) : (
                <Crosshair className="size-4 shrink-0 group-hover:scale-110 transition-transform" />
              )}
              <div className="flex-1">
                <span>{isDetecting ? "Detecting GPS..." : "Use Current Location"}</span>
                <span className="block text-[10px] text-primary/70 font-normal">
                  Auto-detect via GPS coordinates
                </span>
              </div>
            </button>
          </div>

          {/* Edit Full Doorstep Address option */}
          <div className="p-1 pt-0">
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-subtle transition-all text-xs font-medium text-left"
            >
              <Building className="size-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <span>Set Full Doorstep Address</span>
                <span className="block text-[10px] text-muted-foreground">
                  Flat, Society, Landmark & Pincode
                </span>
              </div>
            </button>
          </div>

          <DropdownMenuSeparator className="my-1" />

          <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            Popular Mumbai Localities
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {MUMBAI_LOCALITIES.map((loc) => (
              <DropdownMenuItem
                key={loc}
                onClick={() => handleSelect(loc)}
                className={`flex items-center justify-between text-xs px-2.5 py-2 rounded-lg cursor-pointer ${
                  locality === loc ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-surface-subtle"
                }`}
              >
                <span>{loc}</span>
                {locality === loc && <Check className="size-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Doorstep Address Dialog */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2 text-foreground">
              <MapPin className="size-5 text-primary" />
              Confirm Doorstep Address
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide complete delivery details so your assigned Karighar technician arrives without delays.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFullAddress} className="space-y-4 pt-2">
            {/* Live GPS Quick Fill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-border">
              <div className="flex items-center gap-2 text-xs">
                <Navigation className="size-4 text-primary" />
                <span className="font-medium text-foreground">Have GPS access?</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUseGPS}
                disabled={isDetecting}
                className="h-8 text-xs rounded-lg flex items-center gap-1.5"
              >
                {isDetecting ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3 text-primary" />}
                Detect via GPS
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Mumbai Locality
                </label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  {MUMBAI_LOCALITIES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
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
              <label className="text-xs font-medium text-foreground block mb-1">
                Flat, Floor, House or Unit Number
              </label>
              <Input
                required
                placeholder="e.g. Flat 502, B-Wing, 5th Floor"
                value={doorstepAddress}
                onChange={(e) => setDoorstepAddress(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Building & Society Name
              </label>
              <Input
                placeholder="e.g. Oberoi Springs, off New Link Road"
                value={doorstepSociety}
                onChange={(e) => setDoorstepSociety(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Nearby Landmark & Society Entry Instructions
              </label>
              <Input
                placeholder="e.g. Opposite Starbucks. Security code 502. Service lift available."
                value={doorstepLandmark}
                onChange={(e) => setDoorstepLandmark(e.target.value)}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              <span>SafePay Privacy Shield: Address is encrypted and revealed to technician only 30 mins before arrival.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddressModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-lg">
                Save Doorstep Address
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SiteHeader({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useRouterState({ select: (s) => s.location });
  const active =
    loc.pathname === "/professionals"
      ? String((loc.search as Record<string, unknown>)["category"] ?? "")
      : loc.pathname === "/"
      ? ""
      : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useI18n();

  const TABS = [
    { label: t.all,      category: "",         icon: LayoutGrid },
    { label: t.build,    category: "build",    icon: Hammer     },
    { label: t.renovate, category: "renovate", icon: Paintbrush },
    { label: t.fix,      category: "fix",      icon: Wrench     },
  ] as const;

  const { data: proData } = useQuery({
    queryKey: ["professional-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("professionals").select("id").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const isPro = !!proData;
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out", { description: "See you again soon." });
    navigate({ to: "/", replace: true });
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand & Zepto/Uber Location Selector */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Brand />
          <CustomerLocationSelector />
        </div>

        {/* Centre nav tabs — only on home / professionals */}
        {active !== null && (
          <nav
            className="hidden shrink-0 items-center gap-1 md:flex"
            aria-label="Browse by type"
          >
            {TABS.map((tItem) => {
              const isActive = active === tItem.category;
              const inner = (
                <span
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground bg-surface-subtle"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle"
                  }`}
                >
                  <tItem.icon className="size-4" strokeWidth={1.6} />
                  {tItem.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-surface-subtle"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </span>
              );
              return tItem.category ? (
                <Link key={tItem.label} to="/professionals" search={{ category: tItem.category }}>
                  {inner}
                </Link>
              ) : (
                <Link key={tItem.label} to="/">{inner}</Link>
              );
            })}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <Link
            to="/pricing"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground lg:block"
          >
            {t.pricing}
          </Link>

          <Link
            to={isPro ? "/dashboard" : "/become-a-pro"}
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground lg:block"
          >
            {isPro ? t.proDashboard : t.becomeAPro}
          </Link>

          {/* Avatar initials */}
          {user && (
            <span className="hidden size-8 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary md:grid">
              {initial}
            </span>
          )}

          {/* Hamburger menu */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="grid size-9 place-items-center rounded-lg border border-border bg-background transition-colors hover:bg-surface-subtle active:scale-95"
                aria-label="Open menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {open ? (
                    <motion.span
                      key="x"
                      initial={{ opacity: 0, rotate: -90 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="size-4" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Menu className="size-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="mt-2 w-64 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-warm"
            >
              {user ? (
                <>
                  <div className="mb-1 px-3 py-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Signed in</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold">
                    <Link to="/shortlist">{t.shortlist}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/my-projects">{t.myProjects}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/account">{t.account}</Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/pricing">Upgrade to Prime</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/renovation-planner">AI room planner</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/help">{t.helpCentre}</Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      to={isPro ? "/dashboard" : "/become-a-pro"}
                      className="flex flex-col items-start gap-0.5 whitespace-normal"
                    >
                      <span className="text-sm font-semibold">
                        {isPro ? t.proDashboard : t.becomeAPro}
                      </span>
                      {!isPro && (
                        <span className="text-xs text-muted-foreground leading-snug">
                          List your services and earn on Karighar.
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>


                  <div className="my-1 h-px bg-border" />

                  {/* Languages Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-3 py-2 text-sm flex items-center">
                      <Globe className="mr-2 size-4 text-primary" strokeWidth={1.5} />
                      <span className="flex-1 text-left">Languages</span>
                      <span className="text-xs text-muted-foreground font-medium mr-1">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeLabel || "English"}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 p-1.5 rounded-xl border border-border bg-popover shadow-warm-lg">
                      <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Indian Languages
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            language === lang.code ? "bg-primary/10 text-primary font-medium" : "hover:bg-surface-subtle"
                          }`}
                        >
                          <span className="font-medium">{lang.nativeLabel}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{lang.label}</span>
                            {language === lang.code && <Check className="size-3.5 text-primary" strokeWidth={2} />}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/8 focus:bg-destructive/8"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 size-4" strokeWidth={1.6} />
                    {t.logout}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold">
                    <Link to="/auth">{t.loginOrSignup}</Link>
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-border" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/pricing">{t.pricing}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/become-a-pro">{t.becomeAPro}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/renovation-planner">AI room planner</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/help">{t.helpCentre}</Link>
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-border" />

                  {/* Languages Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-lg px-3 py-2 text-sm flex items-center">
                      <Globe className="mr-2 size-4 text-primary" strokeWidth={1.5} />
                      <span className="flex-1 text-left">Languages</span>
                      <span className="text-xs text-muted-foreground font-medium mr-1">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeLabel || "English"}
                      </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 p-1.5 rounded-xl border border-border bg-popover shadow-warm-lg">
                      <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Indian Languages
                      </div>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                            language === lang.code ? "bg-primary/10 text-primary font-medium" : "hover:bg-surface-subtle"
                          }`}
                        >
                          <span className="font-medium">{lang.nativeLabel}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{lang.label}</span>
                            {language === lang.code && <Check className="size-3.5 text-primary" strokeWidth={2} />}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {children && (
        <div className="border-t border-border px-5 py-3 md:px-10">{children}</div>
      )}
    </header>
    <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/* â”€â”€â”€ Mobile Bottom Navigation Bar (Thumb Friendly) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function MobileBottomBar() {
  const loc = useRouterState({ select: (s) => s.location });
  const path = loc.pathname;
  const { user } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { label: "Home", to: "/", icon: HomeIcon, active: path === "/" },
    { label: "Explore", to: "/professionals", icon: Search, active: path.startsWith("/professionals") },
    { label: "Projects", to: "/my-projects", icon: FolderOpen, active: path.startsWith("/projects") || path === "/my-projects" },
    { label: "Saved", to: "/shortlist", icon: Heart, active: path === "/shortlist" },
    { label: user ? "Account" : "Sign In", to: user ? "/account" : "/auth", icon: User, active: path === "/account" || path === "/auth" },
  ];

  return (
    <nav
      className="fixed bottom-3 left-4 right-4 z-40 flex h-16 items-center justify-around rounded-2xl border border-border bg-card/95 px-2 shadow-warm-lg backdrop-blur-lg md:hidden"
      aria-label="Mobile Navigation Bar"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`relative flex flex-col items-center justify-center py-1 flex-1 transition-all ${
              item.active ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <Icon className="size-5 transition-transform active:scale-90" strokeWidth={item.active ? 2 : 1.5} />
              {item.active && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* â”€â”€â”€ Page Shell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function PageShell({
  children,
  headerExtra,
}: {
  children: ReactNode;
  headerExtra?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground pb-20 md:pb-0">
      <SiteHeader>{headerExtra}</SiteHeader>
      <div className="flex-1">{children}</div>
      <MobileBottomBar />
      <SiteFooter />
    </div>
  );
}

/* â”€â”€â”€ Trust Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
      {children}
    </span>
  );
}

/* â”€â”€â”€ Section Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function SectionHeader({
  title,
  to,
  toLabel = "See all",
}: {
  title: string;
  to?: string;
  toLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline justify-between">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
        {title}
      </h2>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-75"
        >
          {toLabel}
          <ChevronRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
