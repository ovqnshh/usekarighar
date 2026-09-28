import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { PageShell, TrustBadge } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { professionals } from "@/lib/karighar-data";
import { useShortlist } from "@/lib/shortlist";

export const Route = createFileRoute("/shortlist")({
  head: () => ({ meta: [
    { title: "Your shortlist — Karighar" },
    { name: "description", content: "Compare saved professionals side by side: ratings, services, pricing and availability." },
    { property: "og:title", content: "Your shortlist — Karighar" },
    { property: "og:description", content: "Compare saved professionals side by side." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: Shortlist,
});

function Shortlist() {
  const { ids, toggle } = useShortlist();
  const saved = professionals.filter((p) => ids.includes(p.id));
  const best = { rating: Math.max(...saved.map((p) => p.rating)), price: Math.min(...saved.map((p) => p.price)) };
  const rows: [string, (p: (typeof saved)[number]) => React.ReactNode][] = [
    ["Rating", (p) => <span className={`flex items-center gap-1 ${p.rating === best.rating && saved.length > 1 ? "font-bold text-primary" : ""}`}><Star className="size-3.5 fill-current" /> {p.rating} <span className="font-normal text-muted-foreground">({p.reviews})</span></span>],
    ["Services", (p) => p.trade],
    ["Starting price", (p) => <span className={p.price === best.price && saved.length > 1 ? "font-bold text-primary" : "font-semibold"}>₹{p.price}</span>],
    ["Availability", (p) => <span className="font-semibold text-success">{p.availability}</span>],
    ["Experience", (p) => p.experience],
    ["Projects done", (p) => p.projects],
    ["Area", (p) => p.city],
    ["Verification", (p) => <div className="flex flex-wrap gap-1">{p.badges.map((b) => <TrustBadge key={b}>{b}</TrustBadge>)}</div>],
  ];
  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-10">
        <h1 className="text-4xl font-bold">Your shortlist</h1>
        <p className="mt-2 text-muted-foreground">Compare saved professionals side by side. Best rating and lowest price are highlighted.</p>
        {!saved.length ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center">
            <Heart className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No saved professionals yet</p><p className="mt-1 text-sm text-muted-foreground">Tap the heart on any professional to save them here.</p>
            <Button asChild className="mt-5 rounded-xl"><Link to="/professionals">Browse professionals</Link></Button>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-3xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="border-b border-border">
                <th className="w-40 p-4" />
                {saved.map((p) => (
                  <th key={p.id} className="p-4 align-top font-normal">
                    <img src={p.image} alt={p.name} className="aspect-square w-full max-w-40 rounded-2xl object-cover" />
                    <p className="mt-3 font-semibold">{p.name}</p><p className="text-muted-foreground">{p.business}</p>
                    <div className="mt-3 flex gap-2"><Button asChild size="sm" className="rounded-lg"><Link to="/professionals/$id" params={{ id: p.id }}>View</Link></Button><Button size="sm" variant="outline" className="rounded-lg" onClick={() => toggle(p.id)}>Remove</Button></div>
                  </th>
                ))}
              </tr></thead>
              <tbody>{rows.map(([label, fn]) => (
                <tr key={label} className="border-b border-border last:border-0"><th className="p-4 font-medium text-muted-foreground">{label}</th>{saved.map((p) => <td key={p.id} className="p-4 align-top">{fn(p)}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>
    </PageShell>
  );
}
