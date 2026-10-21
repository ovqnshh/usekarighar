import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/karighar-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Karighar" },
      { name: "description", content: "Terms of Service for customers and verified professionals on the Karighar platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-4">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: October 2026</p>
        
        <div className="space-y-6 text-sm text-foreground/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">1. Introduction & Role</h2>
            <p>
              Karighar operates as a managed marketplace connecting customers with verified independent service professionals. Karighar provides technology infrastructure, verification protocols, SafePay escrow holding, and customer support.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">2. SafePay & Milestone Releases</h2>
            <p>
              Funds authorized for projects are held securely in customer escrow. Release of funds occurs upon customer confirmation or automated release after 48 hours following job completion if no dispute is raised.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">3. Safety & On-Site Protocols</h2>
            <p>
              All visits require a 4-digit start OTP exchange at the doorstep. Private telephone numbers are masked to safeguard privacy. Abuse or harassment is strictly prohibited and results in immediate account deactivation.
            </p>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
