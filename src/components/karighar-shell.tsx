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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.label} to={link.to} search={link.search} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <Link to="/project" className={pathname === "/project" ? "text-sm font-semibold text-primary" : "text-sm font-medium text-muted-foreground hover:text-foreground"}>
            My project
          </Link>
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="icon" aria-label="Search"><Search /></Button>
          <Button variant="outline" className="rounded-full"><UserRound /> Sign in</Button>
          <Button className="rounded-full"><BriefcaseBusiness /> Join as a professional</Button>
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