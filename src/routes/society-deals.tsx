import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/karighar-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building, Users, Sparkles, CheckCircle2, ArrowRight,
  ShieldCheck, MapPin, Calendar, Clock, Tag, Percent
} from "lucide-react";
import {
  getSocietyClusterDealsCore,
  joinSocietyClusterDealCore,
  type SocietyClusterDeal
} from "@/lib/society-deals/society-deals.functions";
import { inr } from "@/lib/karighar-api";
import { toast } from "sonner";

export const Route = createFileRoute("/society-deals")({
  head: () => ({
    meta: [
      { title: "Society 'Karighar Day' Cluster Deals — Karighar" },
      { name: "description", content: "Join neighbor cluster bookings in your apartment complex for up to 25% bulk discounts on verified AC service and electrical audits." },
    ],
  }),
  component: SocietyDealsPage,
});

export function SocietyDealsPage() {
  const [selectedSociety, setSelectedSociety] = useState("");
  const [joinedDeals, setJoinedDeals] = useState<Record<string, boolean>>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [flatNumber, setFlatNumber] = useState("");

  const { data, isLoading, refetch } = useQuery<{ ok: boolean; deals: SocietyClusterDeal[] }>({
    queryKey: ["society-cluster-deals", selectedSociety],
    queryFn: () => getSocietyClusterDealsCore(selectedSociety),
  });

  const deals = data?.deals || [];

  const handleJoinDeal = async (deal: SocietyClusterDeal) => {
    if (!flatNumber.trim()) {
      toast.error("Please enter your flat or wing number first");
      return;
    }

    setJoiningId(deal.id);
    try {
      const res = await joinSocietyClusterDealCore({
        dealId: deal.id,
        flatNumber: flatNumber.trim(),
        contactPhone: "+91 98201 54321",
      });

      if (res.ok) {
        setJoinedDeals((prev) => ({ ...prev, [deal.id]: true }));
        toast.success(res.message);
        refetch();
      }
    } catch (e: any) {
      toast.error("Failed to join deal", { description: e.message });
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <PageShell>
      <main className="min-h-screen pb-20 space-y-8">
        {/* Hero Banner */}
        <section className="border-b border-border bg-gradient-to-b from-primary/10 via-background to-background pt-10 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center space-y-4">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1.5 py-1">
              <Sparkles className="size-3.5" /> Karighar Day Community Savings
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Book with Neighbors, Save up to 25%
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              When 3 or more flats in the same residential society book for the same Saturday, technicians save travel time and pass 100% of the fuel & deadhead savings back to you.
            </p>

            {/* Flat number entry bar */}
            <div className="pt-2 max-w-md mx-auto flex gap-2">
              <Input
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="Enter your Flat & Wing (e.g. A-1202, Somerset)..."
                className="text-xs h-11 rounded-xl bg-card border-border"
              />
            </div>
          </div>
        </section>

        {/* Active Cluster Deals Grid */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Active Mumbai Society Clusters
              </h2>
              <p className="text-xs text-muted-foreground">
                Live building booking counters in Powai, Andheri & Bandra.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {deals.map((deal) => {
              const isJoined = joinedDeals[deal.id];
              const pctComplete = Math.min(100, Math.round((deal.current_flats / deal.target_flats) * 100));
              const isUnlocked = deal.current_flats >= deal.target_flats || isJoined;

              return (
                <div
                  key={deal.id}
                  className="rounded-3xl border border-border bg-card p-6 shadow-warm-sm flex flex-col justify-between space-y-5 transition-all hover:border-primary/40"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building className="size-3.5 text-primary" />
                          <span className="font-semibold text-foreground">{deal.society_name}</span>
                          <span>•</span>
                          <span>{deal.locality}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground mt-1.5">
                          {deal.title}
                        </h3>
                      </div>

                      <Badge className="bg-emerald-600 text-white font-bold text-xs gap-1 py-1 shrink-0">
                        <Percent className="size-3" /> {deal.discount_pct}% OFF
                      </Badge>
                    </div>

                    {/* Pricing Box */}
                    <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground line-through block text-[11px]">
                          Standard Rate: ₹{(deal.standardPricePaise / 100).toFixed(0)}
                        </span>
                        <div className="text-base font-bold text-foreground">
                          ₹{(deal.discountedPricePaise / 100).toFixed(0)} / flat
                        </div>
                      </div>
                      <div className="text-right text-emerald-600 font-semibold">
                        Saves ₹{(deal.savingsPaise / 100).toFixed(0)} per home
                      </div>
                    </div>

                    {/* Progress Bar & Counter */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-foreground flex items-center gap-1">
                          <Users className="size-3.5 text-primary" />
                          <strong>{deal.current_flats + (isJoined ? 1 : 0)}</strong> of {deal.target_flats} neighbors joined
                        </span>
                        <span className="text-primary font-semibold">
                          {isUnlocked ? "Discount Unlocked!" : `${Math.max(1, deal.target_flats - deal.current_flats)} more needed`}
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-surface-subtle overflow-hidden border border-border">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pctComplete}%` }}
                        />
                      </div>
                    </div>

                    {/* Joined Neighbors List */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Participating Homes in this Cluster:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {deal.participants?.map((p, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-card border border-border/80 px-2.5 py-0.5 rounded-lg text-foreground font-medium"
                          >
                            ✓ {p.flat_number}
                          </span>
                        ))}
                        {isJoined && (
                          <span className="text-[11px] bg-primary/10 border border-primary/30 text-primary px-2.5 py-0.5 rounded-lg font-bold">
                            ✓ Your Flat ({flatNumber})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center gap-3">
                    {isJoined ? (
                      <div className="w-full p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        Joined! Slot Reserved for Saturday Dispatch
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleJoinDeal(deal)}
                        disabled={joiningId === deal.id}
                        className="w-full text-xs font-semibold py-5 shadow-warm-xs gap-1.5"
                      >
                        Join My Building Deal (Save {deal.discount_pct}%) <ArrowRight className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
