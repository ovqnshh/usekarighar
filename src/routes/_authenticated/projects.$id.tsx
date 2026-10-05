import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { inr, materialsLabel, statusLabel } from "@/lib/karighar-api";
import { ShieldCheck, Phone, FileCheck } from "lucide-react";

import { useAuth } from "@/lib/karighar-api";

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
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  
  useEffect(() => {
    // Fetch initial messages
    supabase.from("messages").select("*").eq("project_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []));

    // Subscribe to realtime
    const sub = supabase.channel(`project_${id}_messages`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [id]);

  async function sendMessage(isSpecialOffer = false) {
    if (!newMessage.trim() && !isSpecialOffer) return;
    if (!user) return;
    const { error } = await supabase.from("messages").insert({
      project_id: id,
      sender_id: user.id,
      content: newMessage || `Special offer: ₹${offerAmount}`,
      is_special_offer: isSpecialOffer,
      offer_amount: isSpecialOffer ? Number(offerAmount) : null
    });
    if (error) toast.error("Failed to send message");
    else { setNewMessage(""); setOfferAmount(""); }
  }
  const project = useQuery({ queryKey: ["project", id], queryFn: async () => (await supabase.from("projects").select("*, professionals(*)").eq("id", id).maybeSingle()).data });
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
    ["Karighar Platform Fee (15%)", (q) => inr(Math.round((q.labour + q.materials_cost + q.transport + q.other) * 0.15))], 
    ["Tax", (q) => inr(q.tax)], ["Duration", (q) => q.duration], ["Workers", (q) => String(q.workers)],
    ["Materials by", (q) => materialsLabel[q.materials] ?? q.materials], ["Warranty", (q) => q.warranty || "—"],
  ];
  return (
    <PageShell><main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <p className="text-sm font-semibold text-primary">{statusLabel[p.status]}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold">{p.title}</h1>
      <p className="mt-2 text-muted-foreground">{[p.location, p.timing, p.budget].filter(Boolean).join(" · ")}</p>

      {/* Booking Status & Contact Details */}
      {(p.status === "scheduled" || p.status === "in_progress" || p.status === "completed") && p.professionals && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm">
            <h2 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Phone className="size-4" /> Contact Shared
            </h2>
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-xl">
                {p.professionals.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-blue-950">{p.professionals.name}</p>
                <p className="text-sm text-blue-800">{p.professionals.business}</p>
                <p className="text-sm font-medium mt-1 text-blue-900">{(p.professionals as any).phone || "Phone shared after booking"}</p>
              </div>
            </div>
            <p className="text-xs text-blue-700/80 mt-4 leading-relaxed">
              These contact details are only shared because you have an active booking. Please communicate via the platform chat for safety.
            </p>
          </div>

          {p.status === "completed" && (
            <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <FileCheck className="size-4" /> 14-Day Warranty Active
                </h2>
                <p className="text-sm text-green-800 leading-relaxed mb-4">
                  This service is covered by the Karighar Quality Guarantee until {new Date(new Date(p.created_at).getTime() + 14*24*60*60*1000).toLocaleDateString()}.
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="sm" variant="outline" className="bg-white hover:bg-green-100 hover:text-green-800 border-green-200 flex-1">
                  Download Invoice
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => toast.success("Claim filed. Support will contact you.")}>
                  Claim Warranty
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
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
              <p className="mt-3 flex justify-between border-t border-border pt-3 text-lg"><span>Total</span><strong>{inr(q.labour + q.materials_cost + q.transport + q.other + Math.round((q.labour + q.materials_cost + q.transport + q.other) * 0.15) + q.tax)}</strong></p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{q.scope}</p>
              {q.status === "submitted" && p.status === "requested" ? <Button className="mt-4 w-full" onClick={() => accept(q.id)}>Accept</Button> : <p className="mt-4 text-sm font-semibold capitalize">{q.status}</p>}
            </>}
          </article>
        ))}
      </div>
      <h2 className="mt-10 font-display text-2xl font-semibold">Live Negotiation & Chat</h2>
      <div className="mt-4 flex flex-col h-[500px] border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">No messages yet. Send a message to negotiate or ask questions.</div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMine ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"} ${m.is_special_offer ? "border-2 border-yellow-400 !bg-yellow-50 text-yellow-900" : ""}`}>
                    {m.is_special_offer ? (
                      <div className="flex flex-col gap-2">
                        <span className="font-bold text-xs uppercase tracking-wider text-yellow-700">⚡ Special Offer</span>
                        <span className="text-xl font-bold">{inr(m.offer_amount)}</span>
                        <span className="text-sm opacity-90">{m.content}</span>
                        {!isMine && p.status === "requested" && (
                           <Button size="sm" className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white w-full" onClick={() => toast.success("Offer accepted! Escrow will be initialized.")}>Accept Offer</Button>
                        )}
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="p-3 border-t border-border bg-muted/30">
           {/* If user is the professional, show special offer input */}
           {user?.id !== p.customer_id && (
              <div className="flex gap-2 mb-3 px-1">
                <Input type="number" placeholder="Offer price (₹)" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} className="h-9 w-36 bg-background" />
                <Button size="sm" variant="secondary" onClick={() => sendMessage(true)} disabled={!offerAmount} className="h-9 text-xs">⚡ Send Special Offer</Button>
              </div>
           )}
           <div className="flex gap-2">
             <Input 
               value={newMessage} 
               onChange={e => setNewMessage(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && sendMessage()}
               placeholder="Type a message..." 
               className="bg-background"
             />
             <Button onClick={() => sendMessage(false)}>Send</Button>
           </div>
        </div>
      </div>
    </main></PageShell>
  );
}
