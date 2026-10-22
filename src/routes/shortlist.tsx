import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { PageShell, TrustBadge } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/karighar-api";
import { toast } from "sonner";
import { Spinner } from "@/components/page-transition";

export const Route = createFileRoute("/shortlist")({
  head: () => ({ meta: [
    { title: "Your shortlist — Karighar" },
    { name: "description", content: "Compare saved professionals side by side: ratings, services, pricing and availability." },
    { property: "og:title", content: "Your shortlist — Karighar" },
    { property: "og:description", content: "Compare saved professionals side by side." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: Shortlist,
});

function Shortlist() {
  const { user, loading } = useAuth();
  const isLoaded = !loading;
  const qc = useQueryClient();

  const { data: savedIds = [], isLoading: isFetchingIds } = useQuery({
    queryKey: ['saved-karighars', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const db = supabase as any;
      const { data } = await db.from('saved_karighars').select('professional_id').eq('user_id', user.id);
      return (data || []).map((d: any) => d.professional_id);
    },
    enabled: !!user,
  });

  const { data: saved = [], isLoading: isFetchingPros } = useQuery({
    queryKey: ['shortlist-pros', savedIds],
    queryFn: async () => {
      if (!savedIds.length) return [];
      const { data } = await supabase.from('professionals').select('*').in('id', savedIds);
      
      return (data || []).map((p: any) => {
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          business: p.business,
          trade: p.trade,
          city: p.city,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
          projects: p.projects_count || 0,
          experience: p.experience || "Verified Artisan",
          image: p.image || `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop&sig=${p.id}`,
          price: p.price || p.hourly_rate || 500,
          availability: p.availability || "Available",
          badges: p.badges || [],
        };
      });
    },
    enabled: savedIds.length > 0,
  });

  const removeMutation = useMutation({
    mutationFn: async (proId: string) => {
      if (!user) return;
      const db = supabase as any;
      await db.from('saved_karighars').delete().eq('user_id', user.id).eq('professional_id', proId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-karighars', user?.id] });
      toast.success("Removed from shortlist");
    }
  });

  const isLoading = !isLoaded || isFetchingIds || isFetchingPros;

  if (isLoading) {
    return (
      <PageShell>
        <main className="mx-auto flex max-w-7xl items-center justify-center px-5 py-32 lg:px-10">
          <Spinner className="text-primary" />
        </main>
      </PageShell>
    );
  }

  const best = saved.length ? {
    rating: Math.max(...saved.map((p) => p.rating || 0)),
    price: Math.min(...saved.map((p) => p.price || 99999)),
  } : { rating: 0, price: 0 };
  
  const rows: [string, (p: (typeof saved)[number]) => React.ReactNode][] = [
    ["Rating", (p) => (
      <span className={`inline-flex items-center gap-1 ${p.rating === best.rating && saved.length > 1 ? "font-semibold text-primary" : ""}`}>
        <Star className="size-3.5 fill-current text-foreground" /> {p.rating}
        <span className="font-normal text-muted-foreground text-xs">({p.reviews})</span>
      </span>
    )],
    ["Services", (p) => <span className="text-foreground">{p.trade}</span>],
    ["Starting price", (p) => (
      <span className={p.price === best.price && saved.length > 1 ? "font-semibold text-primary" : "font-medium"}>
        ₹{p.price}
      </span>
    )],
    ["Availability", (p) => <span className="font-medium text-success">{p.availability}</span>],
    ["Experience", (p) => <span className="text-muted-foreground">{p.experience || "Verified pro"}</span>],
    ["Completed jobs", (p) => <span className="text-muted-foreground">{p.projects || 0}</span>],
    ["Location", (p) => <span className="text-muted-foreground">{p.city}</span>],
    ["Verifications", (p) => (
      <div className="flex flex-wrap gap-1.5">
        {p.badges.map((b: string) => <TrustBadge key={b}>{b}</TrustBadge>)}
      </div>
    )],
  ];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-12 lg:px-10">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">Saved Karighars</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare trusted professionals side by side to pick the right one for your home.
          </p>
        </div>

        {!user ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-card border border-border">
              <Heart className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">Sign in to view your shortlist</p>
            <p className="mt-1 text-xs text-muted-foreground">Your saved professionals will sync across all your devices.</p>
            <Button asChild className="mt-5 rounded-xl px-6" size="default">
              <Link to="/auth" search={{ redirect: '/shortlist' }}>Sign in</Link>
            </Button>
          </div>
        ) : !saved.length ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface-subtle p-12 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-card border border-border">
              <Heart className="size-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">Your shortlist is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap the heart icon on any professional's card to compare them here.</p>
            <Button asChild className="mt-5 rounded-xl px-6" size="default">
              <Link to="/professionals">Browse professionals</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Comparison Table */}
            <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-card shadow-warm-xs hidden md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle">
                    <th className="w-44 p-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attribute
                    </th>
                    {saved.map((p) => (
                      <th key={p.id} className="p-5 align-top font-normal min-w-[220px]">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="aspect-square w-full max-w-40 rounded-xl object-cover shadow-warm-xs"
                        />
                        <p className="mt-3 font-semibold text-foreground text-base leading-snug">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.business}</p>
                        <div className="mt-3 flex gap-2">
                          <Button asChild size="sm" className="rounded-lg">
                            <Link to="/professionals/$id" params={{ id: p.slug }}>View</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg text-xs"
                            disabled={removeMutation.isPending}
                            onClick={() => removeMutation.mutate(p.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map(([label, fn]) => (
                    <tr key={label} className="transition-colors hover:bg-surface-subtle/50">
                      <th className="p-5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                        {label}
                      </th>
                      {saved.map((p) => (
                        <td key={p.id} className="p-5 align-top text-sm">
                          {fn(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 md:hidden">
              {saved.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-warm-xs">
                  <div className="flex gap-4">
                    <img src={p.image} alt={p.name} className="size-20 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.business}</p>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" className="h-8 rounded-lg text-xs">
                          <Link to="/professionals/$id" params={{ id: p.slug }}>View</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(p.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2.5 border-t border-border pt-4">
                    {rows.map(([label, fn]) => (
                      <div key={label} className="flex justify-between items-start gap-4 text-xs">
                        <span className="text-muted-foreground font-medium shrink-0">{label}</span>
                        <span className="text-right flex-1">{fn(p)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </PageShell>
  );
}
