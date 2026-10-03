import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Hammer, LogOut, Menu, Paintbrush, Wrench, LayoutGrid, Heart, Sparkles, LayoutDashboard, BriefcaseBusiness } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteFooter } from "./site-footer";
import { motion } from "framer-motion";

export function Brand() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 text-primary" aria-label="Karighar home">
      <svg viewBox="0 0 32 32" className="size-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
        <path d="M4 15 16 5l12 10" /><path d="M8 12v14h16V12" /><path d="M13 26v-7h6v7" />
      </svg>
      <span className="hidden text-[1.6rem] font-bold tracking-tight sm:inline">karighar</span>
    </Link>
  );
}

const TABS = [
  { label: "All", category: "", icon: LayoutGrid },
  { label: "Build", category: "build", icon: Hammer },
  { label: "Renovate", category: "renovate", icon: Paintbrush },
  { label: "Fix", category: "fix", icon: Wrench },
] as const;

export function SiteHeader({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const loc = useRouterState({ select: (s) => s.location });
  const active = loc.pathname === "/professionals" ? String((loc.search as Record<string, unknown>)["category"] ?? "") : loc.pathname === "/" ? "" : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proData } = useQuery({
    queryKey: ["professional-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("professionals").select("id").eq("user_id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const isPro = !!proData;
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out", { description: "See you again soon." });
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-gradient-to-b from-background to-muted/60 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1760px] items-center px-5 md:px-10 xl:px-20">
        <div className="flex flex-1 items-center justify-start min-w-0">
          <Brand />
        </div>
        <nav className="flex shrink-0 justify-center gap-1 overflow-x-auto no-scrollbar sm:gap-6 relative" aria-label="Main navigation">
          {TABS.map((t) => {
            const isActive = active === t.category;
            const inner = (
              <span className={`group relative flex items-center gap-2 px-1 py-3 text-sm font-medium transition-colors md:text-base ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className={`size-6 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`} strokeWidth={1.6} />
                <span className="hidden sm:inline">{t.label}</span>
                {isActive && (
                  <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-0 right-0 h-[3px] bg-foreground" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </span>
            );
            return t.category ? (
              <Link key={t.label} to="/professionals" search={{ category: t.category }}>{inner}</Link>
            ) : (
              <Link key={t.label} to="/">{inner}</Link>
            );
          })}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <Link to={isPro ? "/dashboard" : "/become-a-pro"} className="hidden rounded-full px-4 py-3 text-sm font-medium hover:bg-muted lg:block">
            {isPro ? "Switch to professional" : "Become a pro"}
          </Link>
          {user ? (
            <span className="hidden size-11 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary md:grid">{initial}</span>
          ) : null}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="grid size-11 place-items-center rounded-full bg-muted transition-colors hover:bg-border" aria-label="Open menu"><Menu className="size-5" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-0 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border-0 overflow-hidden mt-2">
              {user ? (
                <div className="flex flex-col py-2">
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 hover:bg-muted font-semibold"><Link to="/shortlist">Shortlist</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 hover:bg-muted"><Link to="/my-projects">My projects</Link></DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Messages</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Profile</DropdownMenuItem>
                  
                  <div className="h-px bg-border my-2" />
                  
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Notifications</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Account settings</DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 hover:bg-muted"><Link to="/renovation-planner">AI room planner</Link></DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Help Centre</DropdownMenuItem>
                  
                  <div className="h-px bg-border my-2" />
                  
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-3 hover:bg-muted h-auto">
                    <Link to={isPro ? "/dashboard" : "/become-a-pro"} className="flex flex-col gap-1 items-start whitespace-normal">
                      <span className="font-semibold text-sm">{isPro ? "Professional Dashboard" : "Become a professional"}</span>
                      {!isPro && <span className="text-xs text-muted-foreground leading-snug">It's easy to start offering your services and earn extra income.</span>}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Refer a Karighar</DropdownMenuItem>
                  
                  <div className="h-px bg-border my-2" />
                  
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted" onClick={handleLogout}>Log out</DropdownMenuItem>
                </div>
              ) : (
                <div className="flex flex-col py-2">
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-3 hover:bg-muted font-semibold"><Link to="/auth">Log in or sign up</Link></DropdownMenuItem>
                  <div className="h-px bg-border my-2" />
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 hover:bg-muted"><Link to="/become-a-pro">Become a professional</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer px-4 py-2.5 hover:bg-muted"><Link to="/renovation-planner">AI room planner</Link></DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer px-4 py-2.5 hover:bg-muted">Help Centre</DropdownMenuItem>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {children ? <div className="px-5 pb-6 md:px-10">{children}</div> : null}
    </header>
  );
}

export function PageShell({ children, headerExtra }: { children: ReactNode; headerExtra?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader>{headerExtra}</SiteHeader>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function TrustBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">✓ {children}</span>;
}
