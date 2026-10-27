import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { inr, materialsLabel, statusLabel, useAuth } from "@/lib/karighar-api";
import {
  ShieldCheck, Phone, FileCheck, Send, Sparkles, Check, Clock3, Clock,
  Paperclip, Camera, CheckCheck, Maximize2, Download, X, Building2, AlertTriangle, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { parseMessageContent } from "@/components/karighar-chat-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { checkQuoteItemInflation } from "@/lib/visual-damage.functions";
import {
  arbitrateWarrantyDisputeCore,
  type WarrantyVerdict,
} from "@/lib/warranty-arbitrator/arbitrator.functions";

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
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; url: string } | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeNote, setDisputeNote] = useState("");
  const [disputeVerdict, setDisputeVerdict] = useState<WarrantyVerdict | null>(null);
  const [isArbitrating, setIsArbitrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom("smooth");
    }, 40);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom("auto");
  }, []);

  // Isolate mouse wheel events so scrolling chat never bubbles or scrolls the outer page
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const isAtTop = el.scrollTop <= 0;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;

      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    supabase.from("messages").select("*").eq("project_id", id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages(data || []));

    const sub = supabase.channel(`project_${id}_messages`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${id}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({ name: file.name, url: reader.result as string });
      toast.success(`Attached "${file.name}" — hit send!`);
      textInputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  async function sendMessage(isSpecialOffer = false) {
    if (!newMessage.trim() && !pendingAttachment && !isSpecialOffer) return;
    if (!user) return;
    const proj = project.data;
    const receiverId = user.id === proj?.customer_id ? proj?.professionals?.user_id : proj?.customer_id;

    let content = newMessage.trim();
    if (pendingAttachment) {
      content = `[ATTACHMENT:${pendingAttachment.url}|${pendingAttachment.name}] ${content}`;
    } else if (isSpecialOffer) {
      content = `Special offer: ₹${offerAmount}`;
    }

    const { error } = await supabase.from("messages").insert({
      project_id: id,
      sender_id: user.id,
      receiver_id: receiverId || null,
      content,
      is_special_offer: isSpecialOffer,
      offer_amount: isSpecialOffer ? Number(offerAmount) : null
    });
    if (error) toast.error("Failed to send message: " + error.message);
    else {
      setNewMessage("");
      setOfferAmount("");
      setPendingAttachment(null);
    }
  }

  const project = useQuery({
    queryKey: ["project", id],
    queryFn: async () => (await supabase.from("projects").select("*, professionals(*)").eq("id", id).maybeSingle()).data
  });

  const quotes = useQuery({
    queryKey: ["quotes", id],
    queryFn: async () => (await supabase.from("quotes").select("*, professionals(name, business)").eq("project_id", id)).data ?? []
  });

  async function accept(qid: string) {
    const { error } = await supabase.rpc("accept_quote", { _quote_id: qid });
    if (error) { toast.error(error.message); return; }
    toast.success("Quote accepted");
    qc.invalidateQueries();
  }

  const p = project.data;
  if (!p) {
    return (
      <PageShell>
        <main className="mx-auto max-w-5xl px-5 py-16 text-center">
          <p className="text-muted-foreground">{project.isLoading ? "Loading project details…" : "Project not found."}</p>
        </main>
      </PageShell>
    );
  }

  const rows: [string, (q: NonNullable<typeof quotes.data>[number]) => string][] = [
    ["Labour", (q) => inr(q.labour)],
    ["Materials", (q) => inr(q.materials_cost)],
    ["Transport", (q) => inr(q.transport)],
    ["Other", (q) => inr(q.other)],
    ["Karighar Fee (15%)", (q) => inr(Math.round((q.labour + q.materials_cost + q.transport + q.other) * 0.15))],
    ["Tax", (q) => inr(q.tax)],
    ["Duration", (q) => q.duration],
    ["Workers", (q) => String(q.workers)],
    ["Materials by", (q) => materialsLabel[q.materials] ?? q.materials],
    ["Warranty", (q) => q.warranty || "—"],
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <Badge variant="default" className="mb-2">
            {statusLabel[p.status] || p.status}
          </Badge>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">{p.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{[p.location, p.timing, p.budget].filter(Boolean).join(" · ")}</p>
          
          {/* Technician Shortcut: Quick hardware store and price index lookup */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`/hardware-locator?locality=${encodeURIComponent(p.location || "Mumbai")}&category=${(p as any).category || "all"}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors shadow-2xs"
            >
              <Building2 className="size-3.5" /> Find Nearby Hardware & Spare Parts
            </a>
            <a
              href="/price-index"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-surface-subtle transition-colors"
            >
              <Sparkles className="size-3.5 text-primary" /> Smart Part Finder
            </a>
          </div>
        </div>

        {/* Booking Status & Contact Details */}
        {(p.status === "scheduled" || p.status === "in_progress" || p.status === "completed") && p.professionals && (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface-subtle p-5">
              <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                <Phone className="size-4 text-primary" strokeWidth={1.5} />
                Contact Information
              </h2>
              <div className="flex items-center gap-3">
                <div className="size-11 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-base">
                  {p.professionals.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{p.professionals.name}</p>
                  <p className="text-xs text-muted-foreground">{p.professionals.business}</p>
                  <p className="text-xs font-medium mt-0.5 text-foreground">{(p.professionals as any).phone || "Verified Contact"}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Contact shared for your active booking. Please keep agreements recorded in chat.
              </p>

              {(p.status === "scheduled" || p.status === "in_progress") && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button asChild size="sm" variant="outline" className="w-full text-xs gap-1.5 h-8">
                    <Link to="/gate-pass/$projectId" params={{ projectId: p.id }}>
                      <Building2 className="size-3.5 text-primary" /> Generate Society Gate Pass
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {p.status === "completed" && (
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between shadow-warm-xs">
                <div>
                  <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2 text-sm">
                    <FileCheck className="size-4 text-emerald-600" strokeWidth={1.5} />
                    30-Day SafePay Rework Warranty Active
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Covered by the Karighar Quality Guarantee until {new Date(new Date(p.created_at).getTime() + 30*24*60*60*1000).toLocaleDateString("en-IN")}.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 text-xs gap-1">
                      <Link to="/home-passport">
                        <ShieldCheck className="size-3.5 text-primary" /> Home Passport
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setIsDisputeModalOpen(true)}
                    >
                      AI Dispute & Claim
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SafePay Escrow Milestone Stepper */}
        {(p.status === "in_progress" || p.status === "scheduled" || p.status === "completed") && (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-warm-xs">
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border">
              <div className="flex items-start gap-3.5">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 shrink-0">
                  <ShieldCheck className="size-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-foreground">SafePay Escrow Protection</h2>
                    <Badge variant="success" className="text-[10px]">100% SECURED</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Funds stay locked in escrow. Your Karighar gets paid only after you inspect and approve each stage.
                  </p>
                </div>
              </div>
            </div>

            {/* Stepper with connecting line */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {[
                { id: '1', title: 'Arrival & Initial Inspection', percentage: 20, desc: 'Professional on-site, scope verified.', status: 'funded' },
                { id: '2', title: 'Midway Checkpoint', percentage: 30, desc: 'Rough-in or primary craft completed.', status: 'pending' },
                { id: '3', title: 'Final Handover & Cleanup', percentage: 50, desc: 'Full demo walkthrough and clean site.', status: 'pending' }
              ].map((m: any, idx: number) => {
                const isFunded = m.status === 'funded';
                const isReleased = m.status === 'released';
                const isPending = m.status === 'pending';

                return (
                  <div key={m.id} className="relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-subtle/80 hover:bg-surface-subtle transition-colors rounded-xl border border-border gap-3">
                    {/* Node marker */}
                    <div 
                      className={`absolute -left-6 top-5 -translate-x-1/2 grid size-6 place-items-center rounded-full text-[11px] font-bold border-2 transition-colors ${
                        isReleased 
                          ? 'bg-success text-white border-success' 
                          : isFunded 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-background text-muted-foreground border-border'
                      }`}
                    >
                      {isReleased ? <Check className="size-3" strokeWidth={2.5} /> : (idx + 1)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground text-sm">{m.title}</h3>
                        <span className="text-[11px] font-semibold text-primary">({m.percentage}% escrow)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge 
                        variant={isReleased ? 'success' : isFunded ? 'default' : 'secondary'} 
                        className="text-[10px] uppercase font-semibold"
                      >
                        {m.status}
                      </Badge>
                      {isPending && (
                        <Button size="sm" onClick={() => toast.info('SafePay payment gateway is currently simulated in demo mode.')} className="h-8 text-xs">
                          Fund Stage
                        </Button>
                      )}
                      {isFunded && (
                        <Button size="sm" onClick={() => toast.success('Milestone approved! Funds safely released to professional.')} className="h-8 text-xs bg-success text-white hover:bg-success/90">
                          Release {m.percentage}%
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quotes Section */}
        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-foreground">Quotes Received</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {quotes.data?.map((q) => (
              <article key={q.id} className={`rounded-xl border bg-card p-5 shadow-warm-xs flex flex-col justify-between ${q.status === "accepted" ? "border-primary" : "border-border"}`}>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{q.professionals?.name}</h3>
                  <p className="text-xs text-muted-foreground">{q.professionals?.business}</p>

                  {q.status === "requested" ? (
                    <p className="mt-6 text-xs text-muted-foreground">Waiting for quotation from professional…</p>
                  ) : (
                    <>
                      <dl className="mt-4 space-y-2 text-xs">
                        {rows.map(([label, fn]) => (
                          <div key={label} className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="font-medium text-foreground">{fn(q)}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-4 flex justify-between border-t border-border pt-3 text-base">
                        <span className="font-medium">Total</span>
                        <strong className="text-primary font-semibold">
                          {inr(q.labour + q.materials_cost + q.transport + q.other + Math.round((q.labour + q.materials_cost + q.transport + q.other) * 0.15) + q.tax)}
                        </strong>
                      </div>
                      {q.scope && <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{q.scope}</p>}

                      {(() => {
                        if (!q.materials_cost && !q.scope) return null;
                        const check = checkQuoteItemInflation({
                          name: q.scope || "standard hardware part",
                          quotedPricePaise: (q.materials_cost || 0) * 100,
                        });

                        if (check.isInflated) {
                          return (
                            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 p-2 text-[11px] text-amber-800 dark:text-amber-200">
                              <div className="flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-100">
                                <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                                <span>High Price Alert: {check.inflationPct}% above benchmark</span>
                              </div>
                              <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                                {check.alertMessage}
                              </p>
                            </div>
                          );
                        }

                        if (q.materials_cost > 0) {
                          return (
                            <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                              <span>Price Index Verified: Fair Mumbai Trade Rate</span>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-border">
                  {q.status === "submitted" && p.status === "requesting_quotes" ? (
                    <Button className="w-full text-xs h-9" onClick={() => accept(q.id)}>
                      Accept Quote
                    </Button>
                  ) : (
                    <Badge variant={q.status === "accepted" ? "success" : "secondary"} className="w-full justify-center text-xs py-1">
                      {q.status}
                    </Badge>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Chat & Negotiation */}
        <div className="mt-10">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Project Discussion</h2>
              <p className="text-xs text-muted-foreground">SafePay custodial chat with verified photo sharing</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              End-to-End Escrow Protected
            </span>
          </div>

          <div data-lenis-prevent className="flex flex-col h-[520px] max-h-[75vh] border border-border rounded-2xl bg-card overflow-hidden shadow-warm-xs min-h-0">
            <div ref={messagesContainerRef} data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 space-y-3.5 chat-scroll">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-muted-foreground">
                  <div className="size-12 rounded-2xl bg-surface-subtle flex items-center justify-center text-primary">
                    <Send className="size-6" />
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">No messages yet</h4>
                  <p className="text-xs max-w-sm">
                    Send a note to discuss timings, materials, or share photos of the issue.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === user?.id;
                  const parsed = parseMessageContent(m.content);

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-[82%] sm:max-w-[70%] text-xs sm:text-sm shadow-warm-xs leading-relaxed ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-xs"
                            : "bg-surface-subtle text-foreground rounded-bl-xs border border-border"
                        } ${m.is_special_offer ? "!bg-warning-soft !text-foreground border border-warning/30" : ""}`}
                      >
                        {m.is_special_offer ? (
                          <div className="space-y-1.5">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-warning flex items-center gap-1">
                              <Sparkles className="size-3" /> Special Offer
                            </span>
                            <span className="text-lg font-bold block">{inr(m.offer_amount)}</span>
                            <span className="text-xs opacity-90">{m.content}</span>
                            {!isMine && p.status === "requested" && (
                              <Button size="sm" className="mt-2 w-full text-xs h-8" onClick={() => toast.success("Offer accepted! SafePay escrow initialized.")}>
                                Accept Offer
                              </Button>
                            )}
                          </div>
                        ) : (
                          <>
                            {parsed.hasAttachment && parsed.attachmentUrl && (
                              <div className="mb-2 overflow-hidden rounded-xl border border-black/10 dark:border-white/10 relative group/img bg-black/5">
                                <img
                                  src={parsed.attachmentUrl}
                                  alt={parsed.attachmentName || "Attached photo"}
                                  className="w-full max-h-56 object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                                  onClick={() => setZoomedImage(parsed.attachmentUrl)}
                                />
                                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-full">
                                  <Maximize2 className="size-3" />
                                  <span>Zoom</span>
                                </div>
                              </div>
                            )}
                            {parsed.text && <p className="whitespace-pre-wrap">{parsed.text}</p>}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1">
                        <Clock className="size-2.5" />
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && <CheckCheck className="size-3 text-primary ml-0.5" />}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Fast Reply Suggestions (Populates textbox for edits!) */}
            <div className="px-4 py-2 border-t border-border bg-surface-subtle/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                Fast Replies:
              </span>
              {[
                "Are you available for visit today?",
                "I have attached photos of the issue",
                "What is the cost estimate for spares?",
                "Please confirm your arrival time",
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => {
                    setNewMessage(txt);
                    textInputRef.current?.focus();
                    toast.info("Fast reply inserted — you can edit before sending!");
                  }}
                  className="text-xs font-medium whitespace-nowrap bg-background hover:bg-surface-subtle border border-border text-foreground px-3 py-1 rounded-full transition-colors shadow-warm-xs"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Pending Attachment Chip */}
            {pendingAttachment && (
              <div className="px-4 py-2 border-t border-border bg-primary/5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={pendingAttachment.url} alt={pendingAttachment.name} className="size-8 rounded-lg object-cover border" />
                  <span className="text-xs font-semibold truncate">Ready: {pendingAttachment.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPendingAttachment(null)} className="h-6 w-6 p-0">
                  <X className="size-3.5" />
                </Button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card">
              {user?.id !== p.customer_id && (
                <div className="flex gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder="Offer price (₹)"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    className="h-9 w-36 bg-background text-xs"
                  />
                  <Button size="sm" variant="outline" onClick={() => sendMessage(true)} disabled={!offerAmount} className="h-9 text-xs">
                    Send Special Offer
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground rounded-xl shrink-0"
                  title="Attach photo"
                >
                  <Paperclip className="size-4" />
                </Button>

                <Input
                  ref={textInputRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message or question…"
                  className="bg-surface-subtle border-border text-xs sm:text-sm h-10 flex-1 rounded-xl"
                />
                <Button onClick={() => sendMessage(false)} className="h-10 px-4 rounded-xl gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm shrink-0">
                  <span>Send</span>
                  <Send className="size-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </div>

          {/* Lightbox Zoom Dialog */}
          {zoomedImage && (
            <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
              <DialogContent className="max-w-2xl bg-card border border-border p-3">
                <DialogHeader className="p-2 border-b border-border">
                  <DialogTitle className="text-xs font-semibold">Attached Photo</DialogTitle>
                </DialogHeader>
                <div className="p-2 flex items-center justify-center max-h-[70vh]">
                  <img src={zoomedImage} alt="Zoomed" className="max-h-[65vh] rounded-xl object-contain" />
                </div>
                <DialogFooter className="p-2 border-t border-border flex justify-between">
                  <a href={zoomedImage} download="karighar-photo.jpg" className="text-xs font-semibold inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-subtle border rounded-lg">
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </a>
                  <Button onClick={() => setZoomedImage(null)} size="sm" className="text-xs">Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Feature 15: AI Warranty Dispute Ombudsman Modal */}
          <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
            <DialogContent data-lenis-prevent className="max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain bg-card border border-border p-6 rounded-3xl">
              <DialogHeader className="space-y-1.5 border-b border-border pb-3">
                <Badge variant="outline" className="w-fit text-[10px] bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="size-3 mr-1" /> SafePay Warranty Arbitrator
                </Badge>
                <DialogTitle className="font-display text-lg font-bold">
                  File Warranty Re-work Claim
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Our AI ombudsman compares your reported issue with original before/after photos and invoice scope to approve free rework under SafePay warranty.
                </DialogDescription>
              </DialogHeader>

              {!disputeVerdict ? (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Describe what broke or leaked again:
                    </label>
                    <textarea
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      placeholder="e.g. 'The diverter cartridge replaced 5 days ago has started dripping again from the bottom joint...'"
                      rows={3}
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <Button
                    onClick={async () => {
                      if (!disputeNote.trim()) {
                        toast.error("Please describe the issue");
                        return;
                      }
                      setIsArbitrating(true);
                      try {
                        const res = await arbitrateWarrantyDisputeCore({
                          complaintDescription: disputeNote,
                          originalTrade: (p as any).category || p.intent || "Plumbing",
                          originalScope: p.title,
                          daysSinceCompletion: 5,
                        });
                        setDisputeVerdict(res.verdict);
                        toast.success("AI Dispute Arbitration Complete!");
                      } catch (e: any) {
                        toast.error("Arbitration failed", { description: e.message });
                      } finally {
                        setIsArbitrating(false);
                      }
                    }}
                    disabled={isArbitrating || !disputeNote.trim()}
                    className="w-full text-xs font-semibold py-4 shadow-warm-xs"
                  >
                    {isArbitrating ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Analyzing with Karighar Warranty AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4 mr-1.5" />
                        Run AI Warranty Arbitration
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 ${disputeVerdict.aiVerdict === "WARRANTY_APPROVED_REWORK" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100" : "bg-primary/5 border-primary/20 text-foreground"}`}>
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span>Verdict: {disputeVerdict.aiVerdict.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-[10px]">
                        Match: {Math.round(disputeVerdict.aiMatchScore * 100)}%
                      </Badge>
                    </div>

                    <p className="leading-relaxed">
                      {disputeVerdict.customerSummary}
                    </p>

                    <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <strong>Ombudsman Analysis:</strong> {disputeVerdict.engineeringReasoning}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setDisputeVerdict(null);
                        setDisputeNote("");
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setIsDisputeModalOpen(false);
                        toast.success("Operational dispatch confirmed under warranty.");
                      }}
                    >
                      Confirm Operational Dispatch
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </PageShell>
  );
}
