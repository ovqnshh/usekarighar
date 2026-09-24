import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, MapPin, SlidersHorizontal, Star } from "lucide-react";
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
            <div className="mt-7 grid gap-6">
              {matched.map((professional) => (
                <article key={professional.id} className="grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[230px_1fr]">
                  <img src={professional.image} width={1024} height={1024} loading="lazy" alt={professional.name} className="aspect-[4/3] size-full object-cover md:aspect-auto" />
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="text-sm font-medium text-primary">{professional.trade}</p><h2 className="mt-1 text-2xl font-semibold">{professional.name}</h2><p className="text-sm text-muted-foreground">{professional.business}</p></div><div className="sm:text-right"><p className="flex items-center gap-1 font-semibold sm:justify-end"><Star className="size-4 fill-primary text-primary" /> {professional.rating} <span className="font-normal text-muted-foreground">({professional.reviews})</span></p><p className="mt-1 text-sm text-muted-foreground">{professional.projects} projects</p></div></div>
                    <div className="mt-4 flex flex-wrap gap-2">{professional.badges.map((badge) => <TrustBadge key={badge}>{badge}</TrustBadge>)}</div>
                    <div className="mt-5 grid grid-cols-3 gap-2">{professional.portfolio.map((image, index) => <img key={image} src={image} width={1200} height={912} loading="lazy" alt={`${professional.name} project ${index + 1}`} className="aspect-[16/10] w-full rounded-md object-cover" />)}</div>
                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {professional.city}</p><p className="mt-2 text-sm font-semibold text-success">{professional.availability}</p></div><div className="flex items-center gap-4"><p className="text-sm text-muted-foreground">Starts at <strong className="text-lg text-foreground">₹{professional.price}</strong></p><Button asChild><Link to="/professionals/$id" params={{ id: professional.id }}>View profile</Link></Button></div></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PageShell>
  );
}