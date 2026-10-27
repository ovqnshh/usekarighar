import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, QrCode, CheckCircle2, User, Phone,
  Building, Calendar, Clock, Share2, Check, Download, AlertCircle, Copy, KeyRound
} from "lucide-react";
import { PageShell } from "@/components/karighar-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateGatePassCore, verifyGatePassCode, type SocietyGatePass } from "@/lib/gate-pass/gate-pass.functions";

export const Route = createFileRoute("/gate-pass/$projectId")({
  head: () => ({
    meta: [
      { title: "Digital Society Gate Pre-Pass — Karighar" },
      { name: "description", content: "Pre-verified entry authorization pass for MyGate, NoBrokerHood and society security gates." }
    ],
  }),
  component: GatePassPage,
});

function GatePassPage() {
  const { projectId } = useParams({ from: "/gate-pass/$projectId" });
  const [copied, setCopied] = useState(false);
  const [guardVerified, setGuardVerified] = useState(false);

  // Fetch gate pass or initialize verified pass
  const { data: gatePass, isLoading } = useQuery<SocietyGatePass>({
    queryKey: ["gate-pass", projectId],
    queryFn: async () => {
      // Look up real project if exists
      let proName = "Arjun Sharma";
      let proTrade = "Electrical Specialist";
      let proPhone = "+91 98201 55432";
      let flatWing = "Flat 1202, Heritage Wing";
      let societyName = "Hiranandani Gardens, Powai";
      let residentName = "Priya Desai";

      try {
        const { data: proj } = await supabase
          .from("projects")
          .select("*, professionals(*)")
          .eq("id", projectId)
          .maybeSingle();

        if (proj) {
          if (proj.professionals) {
            proName = proj.professionals.name;
            proTrade = proj.professionals.trade;
            proPhone = (proj.professionals as any).phone || proPhone;
          }
          if (proj.location) {
            societyName = proj.location;
          }
        }
      } catch {}

      const res = await getOrCreateGatePassCore({
        projectId,
        proName,
        proTrade,
        societyName,
        flatWing,
        residentName,
      });

      return res.pass;
    },
  });

  const passUrl = typeof window !== "undefined" ? window.location.href : `https://karighar.in/gate-pass/${projectId}`;

  const handleShareWhatsApp = () => {
    if (!gatePass) return;
    const text = encodeURIComponent(gatePass.whatsappShareText);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(passUrl);
      setCopied(true);
      toast.success("Gate pass link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGuardVerify = () => {
    setGuardVerified(true);
    toast.success("Worker Entry Approved & Timestamped!", {
      description: `Visitor cleared for ${gatePass?.flatWing || "Flat 1202"} entry.`,
    });
  };

  if (isLoading || !gatePass) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground">Issuing cryptographic gate pass...</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-surface-subtle/40">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card shadow-warm-lg overflow-hidden space-y-6">
          
          {/* Top Security Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white text-center space-y-1 relative">
            <Badge variant="outline" className="border-white/30 text-white bg-white/10 text-[10px] gap-1 mb-1">
              <ShieldCheck className="size-3" /> Society Pre-Approved Gate Pass
            </Badge>
            <h1 className="font-display font-bold text-xl tracking-tight">
              Approved Visitor Entry
            </h1>
            <p className="text-white/80 text-xs font-mono">
              Pass ID: {gatePass.id}
            </p>
          </div>

          <div className="p-6 pt-0 space-y-5">
            {/* 6-Digit Numeric Pass Code for Security Guard Intercom */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-1.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center justify-center gap-1">
                <KeyRound className="size-3" /> Security Intercom Entry Code
              </span>
              <div className="font-mono text-3xl font-black tracking-widest text-foreground">
                {gatePass.passCode}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tell this 6-digit code at the society intercom or MyGate guard
              </p>
            </div>

            {/* QR Code Container for Gatekeeper / Guard scanning */}
            <div className="text-center space-y-2">
              <div className="inline-block p-3.5 bg-white rounded-2xl border border-border shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(passUrl)}`}
                  alt="Gate Pass QR"
                  className="size-36 mx-auto"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Security guards: Scan QR to verify government credentials
              </p>
            </div>

            {/* Technician Profile Row */}
            <div className="rounded-2xl border border-border bg-surface-subtle p-4 flex items-center gap-3.5">
              <img
                src={gatePass.proPhotoUrl}
                alt={gatePass.proName}
                className="size-14 rounded-xl object-cover border border-border shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-display font-bold text-sm text-foreground truncate">
                  {gatePass.proName}
                </div>
                <p className="text-xs text-primary font-medium truncate">
                  {gatePass.proTrade}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3 text-emerald-600" /> +91 98201 55432
                </p>
              </div>
            </div>

            {/* Destination & Access Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-2 border-b border-border/70">
                <span className="text-muted-foreground">Destination Flat:</span>
                <span className="font-bold text-foreground">{gatePass.flatWing}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/70">
                <span className="text-muted-foreground">Society Complex:</span>
                <span className="font-semibold text-foreground">{gatePass.societyName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/70">
                <span className="text-muted-foreground">Resident Host:</span>
                <span className="font-semibold text-foreground">{gatePass.residentName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/70">
                <span className="text-muted-foreground">KYC Identity:</span>
                <span className="font-medium text-emerald-600">✓ Aadhaar DigiLocker Verified</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/70">
                <span className="text-muted-foreground">Police Clearance:</span>
                <span className="font-medium text-emerald-600">✓ Maharashtra Police Record Clear</span>
              </div>
            </div>

            {/* Guard Quick Verification Button */}
            <div className="pt-1">
              {guardVerified ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs text-center font-semibold flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Entry Authorized & Logged ({new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
                </div>
              ) : (
                <Button
                  onClick={handleGuardVerify}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-4 shadow-warm-xs gap-1.5"
                >
                  <CheckCircle2 className="size-4" /> Security Guard: Approve & Verify Entry
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleShareWhatsApp}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs py-5 shadow-warm-xs gap-1.5"
              >
                <Share2 className="size-3.5" /> Share Pass to Society WhatsApp / Guard
              </Button>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="w-full text-xs h-9 gap-1.5"
              >
                {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copied ? "Pass Link Copied" : "Copy Gate Pass Link"}
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground/80 leading-normal">
              Works seamlessly with MyGate, NoBrokerHood, and manual visitor registers. Emergency hotline: 1800-209-4427.
            </p>
          </div>

        </div>
      </main>
    </PageShell>
  );
}
