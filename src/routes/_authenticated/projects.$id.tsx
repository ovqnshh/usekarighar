import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inr, materialsLabel, statusLabel } from "@/lib/karighar-api";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [
    { title: "Your project — Karighar" },
    { name: "description", content: "Compare quotes and track your Karighar project." },
    { property: "og:title", content: "Your project — Karighar" },
    { property: "og:description", content: "Compare quotes and track your project." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const project = useQuery({ queryKey: ["project", id], queryFn: async () => (await supabase.from("projects").select("*").eq("id", id).maybeSingle()).data });
  const quotes = useQuery({ queryKey: ["quotes", id], queryFn: async () => (await supabase.from("quotes").select("*, professionals(name, business)").eq("project_id", id)).data ?? [] });
  async function accept(qid: string) {
    const { error } = await supabase.rpc("accept_quote", { _quote_id: qid });
    if (error) { toast.error(error.message); return; }
    toast.success("Quote accepted"); qc.invalidateQueries();
  }
  const p = project.data;
  if (!p) return <PageShell><main className="mx-auto max-w-6xl px-5 py-10">{project.isLoading ? "Loading…" : "Project not found."}</main></PageShell>;
  const rows: [string, (q: NonNullable<typeof quotes.data>[number]) => string][] = [
    ["Labour", (q) => inr(q.labour)], ["Materials", (q) => inr(q.materials_cost)], ["Transport", (q) => inr(q.transport)], ["Other", (q) => inr(q.other)],
    ["Platform fee", (q) => inr(q.platform_fee)], ["Tax", (q) => inr(q.tax)], ["Duration", (q) => q.duration], ["Workers", (q) => String(q.workers)],
    ["Materials by", (q) => materialsLabel[q.materials] ?? q.materials], ["Warranty", (q) => q.warranty || "—"],
  ];
  return (
    <PageShell><main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <p className="text-sm font-semibold text-primary">{statusLabel[p.status]}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold">{p.title}</h1>
      <p className="mt-2 text-muted-foreground">{[p.location, p.timing, p.budget].filter(Boolean).join(" · ")}</p>
      
      {p.status === "in_progress" || p.status === "scheduled" || p.status === "completed" ? (
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10">
              <ShieldCheck className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Karighar SafePay Escrow</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your money is held safely in escrow. Release funds only when milestones are met.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { id: '1', title: 'Arrival & Inspection', percentage: 20, status: 'funded' },
              { id: '2', title: 'Work Completion', percentage: 80, status: 'pending' }
            ].map((m: any, idx: number) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background rounded-xl border border-border shadow-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className={`grid size-8 place-items-center rounded-full text-xs font-bold ${m.status === 'released' ? 'bg-green-100 text-green-700' : m.status === 'funded' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{m.title}</h3>
                    <p className="text-xs text-muted-foreground">{m.percentage}% of total</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${m.status === 'released' ? 'bg-green-50 text-green-700' : m.status === 'funded' ? 'bg-blue-50 text-blue-700' : 'bg-muted text-muted-foreground'}`}>
                    {m.status.toUpperCase()}
                  </span>
                  {m.status === 'pending' && (
                    <Button size="sm" onClick={() => toast.success('Escrow funded via Stripe!')} className="h-8">Fund Escrow</Button>
                  )}
                  {m.status === 'funded' && (
                    <Button size="sm" onClick={() => toast.success('Funds released to professional!')} className="h-8 bg-green-600 hover:bg-green-700">Release Funds</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mt-10 font-display text-2xl font-semibold">Quotes</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {quotes.data?.map((q) => (
          <article key={q.id} className={`rounded-lg border bg-card p-5 ${q.status === "accepted" ? "border-primary" : "border-border"}`}>
            <h3 className="font-semibold">{q.professionals?.name}</h3><p className="text-sm text-muted-foreground">{q.professionals?.business}</p>
            {q.status === "requested" ? <p className="mt-4 text-sm text-muted-foreground">Waiting for quote…</p> : <>
              <dl className="mt-4 space-y-2 text-sm">{rows.map(([label, fn]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd>{fn(q)}</dd></div>)}</dl>
              <p className="mt-3 flex justify-between border-t border-border pt-3 text-lg"><span>Total</span><strong>{inr(q.total)}</strong></p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{q.scope}</p>
              {q.status === "submitted" && p.status === "requested" ? <Button className="mt-4 w-full" onClick={() => accept(q.id)}>Accept</Button> : <p className="mt-4 text-sm font-semibold capitalize">{q.status}</p>}
            </>}
          </article>
        ))}
      </div>
    </main></PageShell>
  );
}
