import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import bathroomProject from "@/assets/bathroom-project.jpg";
import { PageShell, TrustBadge } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { getProfessional } from "@/lib/karighar-data";

export const Route = createFileRoute("/professionals/$id")({
  head: () => ({ meta: [
    { title: "Professional storefront — Karighar" },
    { name: "description", content: "View services, verified skills, portfolio, pricing, and customer reviews on Karighar." },
    { property: "og:title", content: "Professional storefront — Karighar" },
    { property: "og:description", content: "View services, verified skills, portfolio, pricing, and customer reviews." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const professional = getProfessional(id);
  const [requested, setRequested] = useState(false);
  const gigs = [
    { name: "Home plumbing visit", detail: "Diagnosis and minor repairs", price: professional.price },
    { name: "Water tank repair", detail: "Leaks, valves and pipe connections", price: 1299 },
    { name: "Bathroom plumbing refresh", detail: "Fixtures, drainage and pressure check", price: 2499 },
  ];
  return (
    <PageShell><main>
      <section className="relative h-[330px] overflow-hidden md:h-[440px]"><img src={professional.portfolio[0] ?? bathroomProject} width={1200} height={912} alt={`${professional.business} featured project`} className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-transparent to-transparent" /><Link to="/professionals" className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm font-semibold shadow"><ArrowLeft className="size-4" /> Results</Link></section>
      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="relative -mt-20 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section><div className="rounded-lg border border-border bg-card p-5 shadow-xl shadow-foreground/5 md:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-end"><img src={professional.image} width={1024} height={1024} alt={professional.name} className="size-28 rounded-lg border-4 border-card object-cover" /><div className="flex-1"><p className="text-sm font-semibold text-primary">{professional.trade}</p><h1 className="mt-1 font-display text-4xl font-semibold">{professional.name}</h1><p className="mt-1 text-muted-foreground">{professional.business}</p></div><div><p className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-primary text-primary" /> {professional.rating} <span className="font-normal text-muted-foreground">({professional.reviews})</span></p><p className="mt-1 text-sm text-muted-foreground">{professional.projects} completed projects</p></div></div><div className="mt-6 flex flex-wrap gap-2">{professional.badges.map((badge) => <TrustBadge key={badge}>{badge}</TrustBadge>)}</div></div>
          <div className="py-9"><h2 className="font-display text-3xl font-semibold">Craft, care, and clear communication</h2><p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{professional.name} runs {professional.business}, helping homeowners solve practical problems without the guesswork. Every project starts with a clear assessment, a written estimate, and an explanation of what needs doing.</p><div className="mt-6 flex flex-wrap gap-3">{["Leak detection", "Water systems", "Fixture installation", "Preventive maintenance"].map((skill) => <span key={skill} className="rounded-full border border-border px-3 py-1.5 text-sm">{skill}</span>)}</div></div>
          <section className="border-t border-border py-9"><h2 className="font-display text-3xl font-semibold">Selected work</h2><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">{professional.portfolio.map((image, index) => <img key={image} src={image} width={1200} height={912} loading="lazy" alt={`Completed project ${index + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />)}</div></section>
          <section className="border-t border-border py-9"><h2 className="font-display text-3xl font-semibold">Services</h2><div className="mt-5 grid gap-3">{gigs.map((gig) => <article key={gig.name} className="flex items-center justify-between gap-5 rounded-lg border border-border p-5"><div><h3 className="font-semibold">{gig.name}</h3><p className="mt-1 text-sm text-muted-foreground">{gig.detail}</p></div><p className="shrink-0 text-sm text-muted-foreground">From <strong className="text-lg text-foreground">₹{gig.price}</strong></p></article>)}</div></section>
          <section className="border-t border-border py-9"><div className="flex items-end justify-between"><div><h2 className="font-display text-3xl font-semibold">What customers say</h2><p className="mt-2 text-muted-foreground">Consistently praised for punctuality and neat work.</p></div><p className="flex items-center gap-1 text-lg font-semibold"><Star className="size-5 fill-primary text-primary" /> {professional.rating}</p></div><div className="mt-5 grid gap-4 md:grid-cols-2"><blockquote className="rounded-lg bg-muted p-5 text-sm leading-6">“Arjun explained the issue before starting and finished within the estimate. The area was spotless afterwards.”<footer className="mt-4 font-semibold">— Neha, Andheri</footer></blockquote><blockquote className="rounded-lg bg-muted p-5 text-sm leading-6">“Quick, respectful, and no surprise costs. Exactly the kind of professional you want at home.”<footer className="mt-4 font-semibold">— Kunal, Juhu</footer></blockquote></div></section>
        </section>
        <aside className="h-fit rounded-lg border border-border bg-card p-5 shadow-xl shadow-foreground/5 lg:sticky lg:top-26"><p className="text-sm text-muted-foreground">Starting at</p><p className="mt-1 text-3xl font-semibold">₹{professional.price} <span className="text-sm font-normal text-muted-foreground">per visit</span></p><div className="mt-6 space-y-4 border-y border-border py-5 text-sm"><p className="flex gap-3"><MapPin className="size-4 text-primary" /> {professional.city} and nearby areas</p><p className="flex gap-3"><Clock3 className="size-4 text-primary" /> {professional.experience} experience</p><p className="flex gap-3"><CalendarDays className="size-4 text-primary" /> {professional.availability}</p></div>{requested ? <div className="mt-5 rounded-lg bg-success-soft p-4 text-sm text-success"><p className="flex items-center gap-2 font-semibold"><Check className="size-4" /> Quote request sent</p><p className="mt-1">{professional.name} usually replies within an hour.</p></div> : <Button className="mt-5 h-12 w-full text-base" onClick={() => setRequested(true)}>Request Quote</Button>}<Button asChild variant="outline" className="mt-3 h-11 w-full"><Link to="/project"><MessageCircle /> View sample project</Link></Button><p className="mt-4 text-center text-xs text-muted-foreground">No payment is taken when you request a quote.</p></aside>
      </div></div>
    </main></PageShell>
  );
}