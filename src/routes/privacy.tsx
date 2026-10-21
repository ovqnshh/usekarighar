import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/karighar-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy & DPDP Alignment — Karighar" },
      { name: "description", content: "Privacy policy and data governance practices compliant with India's Digital Personal Data Protection Act." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-3xl px-5 py-12 md:px-10">
        <h1 className="font-display text-3xl font-semibold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Aligned with the Digital Personal Data Protection Act (DPDP Act, 2023)</p>
        
        <div className="space-y-6 text-sm text-foreground/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">1. Data Minimization & Security</h2>
            <p>
              We collect only the personal information required to safely facilitate home services. We never sell your personal data. Exact addresses are revealed to Karighars only after a booking is confirmed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">2. Aadhaar & Identity Handling</h2>
            <p>
              In strict accordance with UIDAI regulations, Karighar does not store raw 12-digit Aadhaar numbers. Identity verification is conducted via consented DigiLocker offline XML verification protocols.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-foreground">3. Masked Calling Telephony</h2>
            <p>
              Calls placed between customers and Karighars are routed through virtual numbers. Neither party has direct access to the other's personal mobile number.
            </p>
          </section>
        </div>
      </main>
    </PageShell>
  );
}
