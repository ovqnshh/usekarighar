import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Hammer, LogOut, Menu, Paintbrush, Wrench, LayoutGrid,
  Heart, Sparkles, LayoutDashboard, X, Home as HomeIcon,
  ChevronRight, Search, Globe, FolderOpen, User, MapPin, ChevronDown, Check,
  Crosshair, Navigation, Loader2, Building, ShieldCheck, MessageSquare,
  Tag, Building2, Users, Gift, HelpCircle
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
import karigharLogo from "@/assets/karighar-logo.png";

export function Brand({ size = "default" }: { size?: "default" | "sm" }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 text-foreground group" aria-label="Karighar home">
      <img
        src={karigharLogo}
        alt="Karighar"
        className={`${
          size === "sm" ? "size-6" : "size-7.5"
        } object-contain dark:invert transition-transform group-hover:scale-105 shrink-0`}
      />
      <div className="flex flex-col">
        <span
          className={`font-display font-bold tracking-tight transition-colors group-hover:text-primary ${
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
            className="hidden sm:inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-xs font-semibold text-foreground bg-surface-subtle border border-border hover:border-rose-500/40 hover:bg-rose-500/5 transition-all shadow-warm-xs group"
            title="Select or detect your Mumbai doorstep service location"
          >
            <span className="size-5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <MapPin className="size-3 fill-rose-500/25 text-rose-600 dark:text-rose-400" />
            </span>
            <span className="truncate max-w-[130px]">{locality}</span>
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Mumbai Coverage" />
            <ChevronDown className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl border-border bg-card shadow-warm-lg">
          {/* GPS Live Location Trigger Button */}
          <div className="p-1">
            <button
              onClick={handleUseGPS}
              disabled={isDetecting}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 border border-emerald-500/20 transition-all text-xs font-semibold text-left group"
            >
              <span className="size-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
                {isDetecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Crosshair className="size-4 group-hover:scale-110 transition-transform" />
                )}
              </span>
              <div className="flex-1">
                <span>{isDetecting ? "Detecting GPS..." : "Use Current Location"}</span>
                <span className="block text-[10px] text-emerald-600/80 font-normal">
                  Auto-detect via GPS coordinates
                </span>
              </div>
            </button>
          </div>

          {/* Edit Full Doorstep Address option */}
          <div className="p-1 pt-0">
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-subtle transition-all text-xs font-medium text-left group"
            >
              <span className="size-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/25">
                <Building className="size-3.5" />
              </span>
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
    {
      label: t.all,
      category: "",
      icon: LayoutGrid,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      badgeBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25",
    },
    {
      label: t.build,
      category: "build",
      icon: Hammer,
      iconColor: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    },
    {
      label: t.renovate,
      category: "renovate",
      icon: Paintbrush,
      iconColor: "text-purple-600 dark:text-purple-400",
      badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25",
    },
    {
      label: t.fix,
      category: "fix",
      icon: Wrench,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    },
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand & Zepto/Uber Location Selector */}
        <div className="flex shrink-0 items-center gap-3">
          <Brand />
          <CustomerLocationSelector />
        </div>

        {/* Centre nav tabs — only on home / professionals */}
        {active !== null && (
          <nav
            className="hidden shrink-0 items-center gap-1 lg:flex"
            aria-label="Browse by type"
          >
            {TABS.map((tItem) => {
              const isActive = active === tItem.category;
              const inner = (
                <span
                  className={`relative flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs lg:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "text-foreground bg-surface-subtle shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-subtle/80"
                  }`}
                >
                  <span
                    className={`size-5 rounded-md flex items-center justify-center border transition-all ${tItem.badgeBg} ${
                      isActive ? "scale-110 shadow-2xs" : "opacity-85"
                    }`}
                  >
                    <tItem.icon className="size-3" strokeWidth={2.2} />
                  </span>
                  <span>{tItem.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-xl bg-surface-subtle border border-border"
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
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <Link
            to="/pricing"
            className="hidden sm:block rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground shrink-0 whitespace-nowrap"
          >
            {t.pricing}
          </Link>

          <Link
            to={isPro ? "/dashboard" : "/become-a-pro"}
            className="hidden sm:inline-flex items-center rounded-lg border border-border/70 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle shrink-0 whitespace-nowrap"
          >
            {isPro ? t.proDashboard : t.becomeAPro}
          </Link>

          {/* Avatar initials */}
          {user && (
            <span className="hidden size-8 place-items-center rounded-full bg-primary/12 text-xs font-semibold text-primary sm:grid shrink-0">
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
              className="mt-2 w-72 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain no-scrollbar rounded-xl border border-border bg-background p-1.5 shadow-warm"
            >
              {user ? (
                <>
                  <div className="mb-1 px-3 py-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Signed in</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">{user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold">
                    <Link to="/shortlist" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                        <Heart className="size-3.5 fill-rose-500/20" />
                      </span>
                      <span>{t.shortlist}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/my-projects" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <FolderOpen className="size-3.5" />
                      </span>
                      <span>{t.myProjects}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/my-projects" search={{ tab: "messages" }} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-md bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare className="size-3.5" />
                        </span>
                        <span>Messages & Chats</span>
                      </div>
                      <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/account" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <User className="size-3.5" />
                      </span>
                      <span>{t.account}</span>
                    </Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  {/* Tools & Services Section */}
                  <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tools & Services
                  </div>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/price-index" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <Tag className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Price Index</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Part finder & standard rates</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/hardware-locator" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Hardware Stores</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Verified local supply shops</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/home-passport" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Home Passport</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">DigiLocker & warranties</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/society-deals" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Users className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Society Deals</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Group cluster bookings (25% off)</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/renovation-planner" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">AI Room Planner</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Renovation & cost estimates</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/pricing" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="size-3.5" />
                      </span>
                      <span>Pricing & Prime Membership</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/help" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                        <HelpCircle className="size-3.5" />
                      </span>
                      <span>{t.helpCentre}</span>
                    </Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      to="/refer"
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Gift className="size-3.5" />
                        </span>
                        <div className="flex flex-col items-start gap-0.5 whitespace-normal">
                          <span className="text-sm font-semibold text-foreground">
                            Refer an Artisan
                          </span>
                          <span className="text-xs text-muted-foreground leading-snug">
                            Earn ₹500 when they complete their 1st job
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        Earn ₹500
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      to={isPro ? "/dashboard" : "/become-a-pro"}
                      className="flex items-center gap-2.5 whitespace-normal"
                    >
                      <span className="size-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Hammer className="size-3.5" />
                      </span>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold">
                          {isPro ? t.proDashboard : t.becomeAPro}
                        </span>
                        {!isPro && (
                          <span className="text-xs text-muted-foreground leading-snug">
                            Offer your services and earn on Karighar.
                          </span>
                        )}
                      </div>
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
                    <span className="size-6 rounded-md bg-destructive/15 text-destructive border border-destructive/20 flex items-center justify-center shrink-0 mr-2.5">
                      <LogOut className="size-3.5" strokeWidth={1.8} />
                    </span>
                    {t.logout}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold">
                    <Link to="/auth" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-primary/15 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                        <User className="size-3.5" />
                      </span>
                      <span>{t.loginOrSignup}</span>
                    </Link>
                  </DropdownMenuItem>
                  <div className="my-1 h-px bg-border" />

                  {/* Tools & Services Section */}
                  <div className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tools & Services
                  </div>

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/price-index" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20 flex items-center justify-center shrink-0">
                        <Tag className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Price Index</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Part finder & standard rates</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/hardware-locator" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Hardware Stores</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Verified local supply shops</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/home-passport" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Home Passport</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">DigiLocker & warranties</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/society-deals" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Users className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">Society Deals</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Group cluster bookings (25% off)</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/renovation-planner" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="size-3.5" />
                      </span>
                      <div className="flex flex-col">
                        <span className="font-medium leading-none">AI Room Planner</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5">Renovation & cost estimates</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <div className="my-1 h-px bg-border" />

                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/pricing" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="size-3.5" />
                      </span>
                      <span>{t.pricing}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2">
                    <Link
                      to="/refer"
                      className="flex items-center justify-between w-full"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="size-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <Gift className="size-3.5" />
                        </span>
                        <div className="flex flex-col items-start gap-0.5 whitespace-normal">
                          <span className="text-sm font-semibold text-foreground">
                            Refer an Artisan
                          </span>
                          <span className="text-xs text-muted-foreground leading-snug">
                            Earn ₹500 when they complete their 1st job
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        Earn ₹500
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/become-a-pro" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <Hammer className="size-3.5" />
                      </span>
                      <span>{t.becomeAPro}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-sm">
                    <Link to="/help" className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                        <HelpCircle className="size-3.5" />
                      </span>
                      <span>{t.helpCentre}</span>
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
    { label: "Home", to: "/", icon: HomeIcon, active: path === "/", color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Explore", to: "/professionals", icon: Search, active: path.startsWith("/professionals"), color: "text-amber-600 dark:text-amber-400" },
    { label: "Projects", to: "/my-projects", icon: FolderOpen, active: path.startsWith("/projects") || path === "/my-projects", color: "text-blue-600 dark:text-blue-400" },
    { label: "Saved", to: "/shortlist", icon: Heart, active: path === "/shortlist", color: "text-rose-500" },
    { label: user ? "Account" : "Sign In", to: user ? "/account" : "/auth", icon: User, active: path === "/account" || path === "/auth", color: "text-purple-600 dark:text-purple-400" },
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
              item.active ? "font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <Icon
                className={`size-5 transition-transform active:scale-90 ${
                  item.active ? item.color : "text-muted-foreground"
                }`}
                strokeWidth={item.active ? 2.2 : 1.6}
              />
              {item.active && (
                <motion.div
                  layoutId="mobile-nav-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </div>
            <span className={`text-[10px] tracking-tight mt-1 ${item.active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {item.label}
            </span>
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
