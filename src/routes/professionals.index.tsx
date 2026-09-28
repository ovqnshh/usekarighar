import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Heart, MapPin, SlidersHorizontal, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { PageShell, TrustBadge } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { professionals } from "@/lib/karighar-data";

export const Route = createFileRoute("/professionals/")({
  head: () => ({ meta: [
    { title: "Matched professionals — Karighar" },
    { name: "description", content: "Compare trusted home professionals matched to your Karighar project brief." },
    { property: "og:title", content: "Matched professionals — Karighar" },
    { property: "og:description", content: "Compare trusted home professionals matched to your project brief." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  const [sort, setSort] = useState("recommended");
  const [available, setAvailable] = useState(false);
  const matched = useMemo(() => {
    const list = [...professionals];
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "price") list.sort((a, b) => a.price - b.price);
    return available ? list.filter((item) => item.availability.includes("today") || item.availability.includes("tomorrow")) : list;
  }, [sort, available]);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to brief</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-lg border border-border bg-card p-5 lg:sticky lg:top-26">
            <p className="text-xs font-semibold uppercase text-primary">Your project</p><h2 className="mt-2 font-display text-2xl font-semibold">Fix a leaking water tank</h2>
            <dl className="mt-5 space-y-4 text-sm"><div><dt className="text-muted-foreground">Where</dt><dd className="mt-1 font-medium">Andheri West, Mumbai</dd></div><div><dt className="text-muted-foreground">When</dt><dd className="mt-1 font-medium">Tomorrow morning</dd></div><div><dt className="text-muted-foreground">Budget</dt><dd className="mt-1 font-medium">Around ₹2,000</dd></div></dl>
            <Button asChild variant="outline" className="mt-6 w-full"><Link to="/">Edit brief</Link></Button>
          </aside>
          <section>
            <p className="text-sm font-semibold text-primary">3 strong matches</p><h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Professionals who fit your brief</h1><p className="mt-3 max-w-2xl text-muted-foreground">Ranked by relevant experience, trust checks, availability, and customer feedback.</p>
            <div className="mt-7 flex flex-wrap gap-3 border-y border-border py-4">
              <Button variant="outline"><SlidersHorizontal /> Filters</Button>
              <Button variant={available ? "secondary" : "outline"} onClick={() => setAvailable((value) => !value)}>Available soon</Button>
              <label className="relative ml-auto"><span className="sr-only">Sort professionals</span><select value={sort} onChange={(event) => setSort(event.target.value)} className="h-9 appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm font-medium"><option value="recommended">Recommended</option><option value="rating">Highest rated</option><option value="price">Lowest starting price</option></select><ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" /></label>
            </div>
            <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {matched.map((professional) => (
                <Link key={professional.id} to="/professionals/$id" params={{ id: professional.id }} className="group block">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img src={professional.image} width={1024} height={1024} loading="lazy" alt={professional.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold shadow-float">{professional.availability}</span>
                    <Heart className="absolute right-3 top-3 size-6 fill-foreground/40 text-background" />
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="truncate font-semibold">{professional.name} · {professional.business}</h2><p className="text-sm text-muted-foreground">{professional.trade}</p><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {professional.city}</p></div>
                    <p className="flex shrink-0 items-center gap-1 text-sm"><Star className="size-3.5 fill-foreground" /> {professional.rating}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">{professional.badges.slice(0, 2).map((badge) => <TrustBadge key={badge}>{badge}</TrustBadge>)}</div>
                  <p className="mt-2 text-sm"><strong>₹{professional.price}</strong> <span className="text-muted-foreground">starting · {professional.projects} projects</span></p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}