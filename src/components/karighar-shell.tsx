import { Link, useRouterState } from "@tanstack/react-router";
import { BriefcaseBusiness, Menu, Search, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
  const links = [
    { label: "Build", to: "/", search: { intent: "build" } },
    { label: "Renovate", to: "/", search: { intent: "renovate" } },
    { label: "Fix", to: "/", search: { intent: "fix" } },
  ] as const;

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
          <Link to="/project" className={`border-l border-border px-5 py-1.5 text-sm ${pathname === "/project" ? "font-semibold text-primary" : "text-muted-foreground"}`}>
            My project
          </Link>
          <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground"><Search className="size-4" /></span>
        </nav>
        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" className="rounded-full font-semibold"><BriefcaseBusiness /> Become a pro</Button>
          <Button variant="outline" className="h-11 rounded-full px-3 shadow-sm hover:shadow-float"><Menu /><span className="grid size-7 place-items-center rounded-full bg-muted-foreground text-background"><UserRound className="size-4" /></span></Button>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" onClick={() => setOpen((value) => !value)}><Menu /></Button>
      </div>
      {open ? (
        <nav className="border-t border-border bg-background px-5 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="grid gap-1">
            {links.map((link) => <Link key={link.label} to={link.to} search={link.search} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">{link.label}</Link>)}
            <Link to="/project" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-muted">My project</Link>
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