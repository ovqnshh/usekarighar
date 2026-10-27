import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/karighar-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, Clock, FileText, Printer, ArrowRight,
  Sparkles, Wrench, Calendar, QrCode, Building, MapPin, CheckCircle2
} from "lucide-react";
import {
  getOrCreateHomePassportCore,
  computeWarrantyStatus,
  type HomePassport
} from "@/lib/passport/home-passport.functions";
import { useAuth, inr } from "@/lib/karighar-api";
import { toast } from "sonner";

export const Route = createFileRoute("/home-passport")({
  head: () => ({
    meta: [
      { title: "Digital Home Health Passport — Flat DigiLocker | Karighar" },
      { name: "description", content: "Permanent home repair history, warranty cards, and verified before/after certificates for your Mumbai residence." },
    ],
  }),
  component: HomePassportPage,
});

export function HomePassportPage() {
  const { user } = useAuth();
  const [flatNumber, setFlatNumber] = useState("1202");
  const [society, setSociety] = useState("Hiranandani Gardens, Powai");

  const { data: passport, isLoading, refetch } = useQuery<HomePassport | undefined>({
    queryKey: ["home-passport", flatNumber, society],
    queryFn: async () => {
      const res = await getOrCreateHomePassportCore({
        customerId: user?.id,
        flatNumber,
        buildingSociety: society,
        locality: "Powai",
        city: "Mumbai",
        pincode: "400076",
      });
      return res.passport;
    },
  });

  const handlePrintCertificate = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const records = passport?.records || [];

  return (
    <PageShell>
      <main className="min-h-screen pb-20 space-y-8 print:p-0 print:space-y-4">
        {/* Hero Banner */}
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background pt-8 pb-10 px-4 sm:px-6 lg:px-8 print:hidden">
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1 py-1 mb-2">
                  <ShieldCheck className="size-3.5" /> Digital Property Passport & DigiLocker
                </Badge>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  Digital Home Health Passport
                </h1>
                <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                  Permanent, verified record of every plumbing, electrical, and structural repair in your home. Includes active warranty timers and genuine part serials.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrintCertificate} className="text-xs gap-1.5 h-9">
                  <Printer className="size-3.5" /> Download / Print Certificate
                </Button>
                <Button asChild size="sm" className="text-xs gap-1.5 h-9 shadow-warm-xs">
                  <Link to="/price-index">
                    <Wrench className="size-3.5" /> Price Index
                  </Link>
                </Button>
              </div>
            </div>

            {/* Flat Selector & Search Bar */}
            <div className="p-4 rounded-2xl border border-border bg-card shadow-warm-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Flat {flatNumber || "—"}, {society || "Select Building"}
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 text-primary" /> Mumbai · Verified Property DigiLocker
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <Input
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="Flat No. (e.g. 1202)"
                  className="w-full sm:w-28 text-xs h-9 rounded-lg"
                />
                <Input
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  placeholder="Building / Society Name"
                  className="w-full sm:w-56 text-xs h-9 rounded-lg"
                />
                <Button size="sm" onClick={() => refetch()} className="text-xs h-9 shrink-0">
                  Find Passport
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Printable Certificate View (also rendered on screen) */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Certificate Header Banner */}
          <div className="p-6 sm:p-8 rounded-3xl border border-primary/20 bg-card shadow-warm-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <ShieldCheck className="size-48 text-primary" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                  Official Karighar Residential Dossier
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Home Maintenance & Warranty Certificate
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Property ID: <span className="font-mono text-foreground font-semibold">{passport?.id || "KGH-MUM-7721"}</span> · Timestamped via SafePay Escrow
                </p>
              </div>

              <div className="flex items-center gap-3 bg-surface-subtle p-3 rounded-2xl border border-border shrink-0 self-start sm:self-auto">
                <div className="size-12 bg-white rounded-lg p-1 border shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://karighar.in/home-passport?ref=${passport?.id}`}
                    alt="DigiLocker QR"
                    className="size-full"
                  />
                </div>
                <div className="text-[11px] space-y-0.5">
                  <div className="font-semibold text-foreground">Scannable Verification</div>
                  <div className="text-muted-foreground">Tenant / Buyer Handover</div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Total Repairs</span>
                <div className="text-lg font-bold text-foreground">{records.length} Verified Jobs</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Active Warranties</span>
                <div className="text-lg font-bold text-emerald-600">
                  {records.filter(r => computeWarrantyStatus(r.warranty_expires_at).isActive).length} Active
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Parts Tracked</span>
                <div className="text-lg font-bold text-foreground">
                  {records.reduce((acc, r) => acc + (r.parts_replaced?.length || 0), 0)} Genuine Parts
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Audit Grade</span>
                <div className="text-lg font-bold text-primary">Class A1 Clean</div>
              </div>
            </div>

            {/* Chronological Maintenance Timeline */}
            <div className="space-y-4 pt-2">
              <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-primary" /> Verified Maintenance & Repair History
              </h3>

              {records.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border/60">
                  {records.map((rec, i) => {
                    const warranty = computeWarrantyStatus(rec.warranty_expires_at);
                    return (
                      <div key={rec.id || i} className="relative pl-8 space-y-2">
                        {/* Timeline dot */}
                        <div className="absolute left-1.5 top-2 size-3.5 -translate-x-1/2 rounded-full border-2 border-background bg-primary" />

                        <div className="rounded-2xl border border-border bg-card p-5 shadow-warm-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {rec.trade}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(rec.created_at).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <h4 className="font-semibold text-sm text-foreground mt-1">
                                {rec.title}
                              </h4>
                            </div>

                            <div>
                              {warranty.isActive ? (
                                <Badge className="bg-emerald-600 text-white text-xs gap-1 py-1">
                                  <ShieldCheck className="size-3" /> {warranty.badgeLabel}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs text-muted-foreground">
                                  Warranty Expired
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {rec.summary}
                          </p>

                          {/* Replaced Parts Box */}
                          {rec.parts_replaced && rec.parts_replaced.length > 0 && (
                            <div className="p-3 rounded-xl bg-surface-subtle/80 border border-border/80 space-y-1.5">
                              <span className="text-[10px] font-bold text-foreground uppercase tracking-wider block">
                                Replaced Spare Parts & Materials:
                              </span>
                              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                                {rec.parts_replaced.map((p, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-card p-2 rounded-lg border border-border text-[11px]">
                                    <div>
                                      <span className="font-medium text-foreground">{p.name}</span>
                                      <span className="block text-[10px] text-muted-foreground">Brand: {p.brand}</span>
                                    </div>
                                    {p.costPaise && (
                                      <span className="font-semibold text-foreground">
                                        ₹{(p.costPaise / 100).toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                            <span>Specialist: <strong className="text-foreground">{rec.pro_name || "Verified Karighar Specialist"}</strong></span>
                            <span>Total Settled: <strong className="text-foreground">{inr(Math.round(rec.total_paid_paise / 100))}</strong></span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-surface-subtle text-muted-foreground text-xs space-y-2">
                  <ShieldCheck className="size-8 mx-auto text-muted-foreground/60" />
                  <p className="font-semibold text-foreground">No maintenance records yet</p>
                  <p className="text-[11px]">Completed repairs automatically compile here upon SafePay release.</p>
                </div>
              )}
            </div>

            {/* Footer Seal */}
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" /> Tamper-evident digital passport record
              </span>
              <span>Karighar Trust & Quality Directorate, Mumbai</span>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
