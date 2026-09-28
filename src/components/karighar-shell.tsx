import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BriefcaseBusiness, LogOut, Menu, Search, UserRound, LayoutDashboard } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "./auth-modal";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Karighar home">
      <span className="grid size-9 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">K</span>
      <span className="font-display text-2xl font-semibold text-foreground">Karighar</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const links = [
    { label: "Build", to: "/", search: { intent: "build" } },
    { label: "Renovate", to: "/", search: { intent: "renovate" } },
    { label: "Fix", to: "/", search: { intent: "fix" } },
  ] as const;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-10">
        <Brand />
        <nav className="hidden items-center rounded-full border border-border bg-background p-1.5 shadow-float transition-shadow hover:shadow-lg md:flex" aria-label="Main navigation">
          {links.map((link, i) => (
            <Link key={link.label} to={link.to} search={link.search} className={`px-5 py-1.5 text-sm font-semibold text-foreground ${i > 0 ? "border-l border-border" : ""}`}>
              {link.label}
            </Link>
          ))}
          <Link to="/renovation-planner" className={`border-l border-border px-5 py-1.5 text-sm ${pathname === "/renovation-planner" ? "font-semibold text-primary" : "text-foreground"}`}>
            Planner
          </Link>
          <Link to="/shortlist" className={`border-l border-border px-5 py-1.5 text-sm ${pathname === "/shortlist" ? "font-semibold text-primary" : "text-foreground"}`}>
            Shortlist
          </Link>
          <Link to="/project" className={`border-l border-border px-5 py-1.5 text-sm ${pathname === "/project" ? "font-semibold text-primary" : "text-muted-foreground"}`}>
            My project
          </Link>
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Search className="size-4" /></span>
        </nav>
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" className="rounded-full font-semibold" asChild>
            <Link to="/become-a-pro"><BriefcaseBusiness className="mr-2 size-4" /> Become a pro</Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full px-3 shadow-sm hover:shadow-float">
                <Menu className="mr-2" />
                <span className={`grid size-7 place-items-center rounded-full ${user ? "bg-primary text-primary-foreground" : "bg-muted-foreground text-background"}`}>
                  <UserRound className="size-4" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              {user ? (
                <>
                  <div className="px-2 py-1.5 text-sm font-medium opacity-70 truncate">{user.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/project"><LayoutDashboard className="mr-2 size-4" /> My Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" /> Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <AuthModal>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="font-semibold cursor-pointer rounded-lg">Sign up</DropdownMenuItem>
                  </AuthModal>
                  <AuthModal>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer rounded-lg">Log in</DropdownMenuItem>
                  </AuthModal>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen((value) => !value)}><Menu /></Button>
      </div>
      {open ? (
        <nav className="border-t border-border bg-background px-5 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="grid gap-1">
            {links.map((link) => <Link key={link.label} to={link.to} search={link.search} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">{link.label}</Link>)}
            <Link to="/renovation-planner" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">Planner</Link>
            <Link to="/shortlist" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">Shortlist</Link>
            
            <div className="my-2 border-t border-border" />
            
            <Link to="/become-a-pro" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted text-primary"><BriefcaseBusiness className="inline mr-2 size-4" />Become a pro</Link>
            
            {user ? (
              <>
                <Link to="/project" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"><LayoutDashboard className="inline mr-2 size-4" />My Dashboard</Link>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted text-left text-destructive"><LogOut className="inline mr-2 size-4" />Log out</button>
              </>
            ) : (
              <>
                <AuthModal>
                  <button className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted text-left w-full">Sign up / Log in</button>
                </AuthModal>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground"><SiteHeader />{children}</div>;
}

export function TrustBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">✓ {children}</span>;
}