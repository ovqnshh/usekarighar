import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { inr, materialsLabel, statusLabel } from "@/lib/karighar-api";

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
      {p.price != null ? <p className="mt-4 text-lg">Agreed price <strong>{inr(p.price)}</strong> <span className="text-sm text-muted-foreground">(pay after work is confirmed)</span></p> : null}
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
