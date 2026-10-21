import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/karighar-shell";
import { ShieldCheck, Heart, Wrench, Sparkles, Award } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Karighar Works — Handcrafted Trust for Indian Homes" },
      { name: "description", content: "Learn how Karighar connects households with verified local service professionals with transparent pricing and SafePay escrow protection." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-5 py-12 md:px-10">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Our Mission & Standards
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            Home services, crafted with honesty and care.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            "Karighar" represents craftsmanship and home. We are building India's most trusted managed marketplace for skilled home professionals—where workers earn fairly and households get verified, guaranteed results.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 mt-12">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Verified Specialists</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Every Karighar undergoes DigiLocker identity matching, skill assessments, and police background clearance.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
              <Award className="size-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">SafePay Escrow</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Your funds are held securely. Karighars are paid only after you inspect and sign off on completed work milestones.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
              <Sparkles className="size-5" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground">Transparent Price Books</h2>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              No surprise markups. Consumable spare parts are priced transparently with written approvals before work starts.
            </p>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
