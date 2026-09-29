import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Heart, MapPin, Search, Star } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell, TrustBadge } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { toast } from 'sonner';

export const Route = createFileRoute('/professionals/')({
  head: () => ({ meta: [
    { title: 'Matched professionals — Karighar' },
    { name: 'description', content: 'Compare trusted home professionals matched to your Karighar project brief.' },
    { property: 'og:title', content: 'Matched professionals — Karighar' },
    { property: 'og:description', content: 'Compare trusted home professionals matched to your project brief.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ]}),
  component: ProfessionalsPage,
});

const TRADES = [
  'All',
  'Plumbing & water systems',
  'Electrical & lighting',
  'Renovation & interiors',
  'Carpentry & woodwork',
  'Painting & finishing',
];

function ProfessionalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [trade, setTrade] = useState('All');
  const [sort, setSort] = useState('recommended');

  // Load brief from sessionStorage if available
  const brief = (() => {
    try {
      const v = sessionStorage.getItem('karighar-brief');
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  })();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', trade, sort],
    queryFn: async () => {
      let q = supabase.from('professionals').select('*, gigs(id, name, starting_price)');
      if (trade !== 'All') q = q.eq('trade', trade);
      if (sort === 'rating') q = q.order('rating', { ascending: false });
      else if (sort === 'price') q = q.order('rating', { ascending: true }); // approximate by rating asc
      else q = q.order('rating', { ascending: false });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ['saved-karighars', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('saved_karighars')
        .select('professional_id')
        .eq('user_id', user.id);
      return ((data ?? []) as { professional_id: string }[]).map((r) => r.professional_id);
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (proId: string) => {
      if (!user) {
        toast.error('Please log in to save Karighars');
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const isSaved = savedIds.includes(proId);
      if (isSaved) {
        await db
          .from('saved_karighars')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', proId);
      } else {
        await db
          .from('saved_karighars')
          .insert({ user_id: user.id, professional_id: proId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-karighars', user?.id] }),
  });

  const filtered = professionals.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.trade?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* ── Sidebar ── */}
          <aside className="h-fit rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
            {brief ? (
              <>
                <p className="text-xs font-semibold uppercase text-primary">Your project</p>
                <h2 className="mt-2 font-display text-xl font-semibold">
                  {brief.summary || 'Your project brief'}
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  {brief.location && (
                    <div>
                      <dt className="text-muted-foreground">Where</dt>
                      <dd className="mt-0.5 font-medium">{brief.location}</dd>
                    </div>
                  )}
                  {brief.timing && (
                    <div>
                      <dt className="text-muted-foreground">When</dt>
                      <dd className="mt-0.5 font-medium">{brief.timing}</dd>
                    </div>
                  )}
                  {brief.budget && (
                    <div>
                      <dt className="text-muted-foreground">Budget</dt>
                      <dd className="mt-0.5 font-medium">{brief.budget}</dd>
                    </div>
                  )}
                  {brief.trades && (
                    <div>
                      <dt className="text-muted-foreground">Trade needed</dt>
                      <dd className="mt-0.5 font-medium">{brief.trades}</dd>
                    </div>
                  )}
                </dl>
                <Button asChild variant="outline" className="mt-5 w-full rounded-full" size="sm">
                  <Link to="/">Edit brief</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase text-primary">Karighars</p>
                <h2 className="mt-2 font-display text-xl font-semibold">Browse all professionals</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Filter by trade, city, or rating to find the right match.
                </p>
              </>
            )}

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Filter by trade</p>
              <div className="flex flex-col gap-1.5">
                {TRADES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTrade(t)}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      trade === t
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Listings ── */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, trade, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-48 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="price">Lowest price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="mt-8 grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-16 text-center text-muted-foreground">
                <p className="text-lg font-semibold">No Karighars found</p>
                <p className="text-sm mt-2">Try a different trade or search term</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {filtered.map((pro) => (
                  <article
                    key={pro.id}
                    className="relative flex gap-5 rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Avatar */}
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                      {pro.name?.charAt(0) ?? '?'}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{pro.name}</h3>
                          <p className="text-sm text-muted-foreground">{pro.business}</p>
                        </div>
                        <button
                          onClick={() => saveMutation.mutate(pro.id)}
                          className="shrink-0 rounded-full p-2 hover:bg-muted transition-colors"
                          aria-label={savedIds.includes(pro.id) ? 'Remove from saved' : 'Save Karighar'}
                        >
                          <Heart
                            className={`size-5 transition-colors ${
                              savedIds.includes(pro.id)
                                ? 'fill-destructive text-destructive'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="size-3.5 fill-primary text-primary" />
                          {pro.rating} ({pro.reviews} reviews)
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="size-3.5" /> {pro.city}
                        </span>
                        <span className="text-muted-foreground">{pro.experience}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-primary">{pro.trade}</p>
                      {pro.bio && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{pro.bio}</p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="hidden sm:flex flex-col items-end justify-between shrink-0">
                      <Link
                        to="/professionals/$id"
                        params={{ id: pro.slug || pro.id }}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        View profile
                      </Link>
                      <p className="text-xs text-muted-foreground mt-auto">
                        {pro.projects_count} projects done
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}