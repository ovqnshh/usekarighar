import { createFileRoute, Link } from '@tanstack/react-router';
import { Heart, Search, Star, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';

export const Route = createFileRoute('/professionals/')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === 'string' ? search.category : '',
  }),
  head: () => ({ meta: [
    { title: 'Matched professionals — Karighar' },
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

const QUICK_FILTERS = [
  'Top rated',
  'Available today',
  'Karighar favourite',
  'Verified licenses',
  'Budget friendly',
  'Premium',
];

function ProfessionalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [trade, setTrade] = useState('All');
  
  const { category } = Route.useSearch();

  const CATEGORY_TRADES: Record<string, string[]> = {
    build: ['Carpentry & woodwork', 'Renovation & interiors', 'Carpenter / Builder'],
    renovate: ['Renovation & interiors', 'Painting & finishing', 'Renovation contractor'],
    fix: ['Plumbing & water systems', 'Electrical & lighting', 'Handyman / Plumber'],
  };

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', trade, category],
    queryFn: async () => {
      let q = supabase.from('professionals').select('*, gigs(id, name, starting_price)');
      if (trade !== 'All') {
        q = q.eq('trade', trade);
      } else if (category && CATEGORY_TRADES[category]) {
        q = q.in('trade', CATEGORY_TRADES[category]);
      }
      q = q.order('rating', { ascending: false });
      return (await q).data ?? [];
    },
  });

  const { data: savedIds = [] } = useQuery({
    queryKey: ['saved-karighars', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const db = supabase as any;
      const { data } = await db.from('saved_karighars').select('professional_id').eq('user_id', user.id);
      return (data || []).map((d: any) => d.professional_id);
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (proId: string) => {
      if (!user) { alert('Please log in to save'); return; }
      const db = supabase as any;
      if (savedIds.includes(proId)) {
        await db.from('saved_karighars').delete().eq('user_id', user.id).eq('professional_id', proId);
      } else {
        await db.from('saved_karighars').insert({ user_id: user.id, professional_id: proId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-karighars', user?.id] }),
  });

  return (
    <PageShell>
      {/* Filters Bar */}
      <div className="sticky top-20 z-30 bg-background border-b border-border shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 overflow-x-auto no-scrollbar">
          <Button variant="outline" className="rounded-full shrink-0 gap-2 font-semibold">
            <SlidersHorizontal className="size-4" /> Filters
          </Button>
          <div className="w-px h-6 bg-border shrink-0 mx-2" />
          {TRADES.map((t) => (
            <button
              key={t}
              onClick={() => setTrade(t)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                trade === t ? 'border-foreground bg-foreground font-semibold text-background' : 'border-border hover:border-foreground'
              }`}
            >
              {t}
            </button>
          ))}
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              className="shrink-0 rounded-full border border-border px-4 py-2 text-sm transition-colors whitespace-nowrap hover:border-foreground"
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <main className="flex h-[calc(100vh-140px)] w-full">
        {/* Listings List */}
        <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Over {professionals.length}+ professionals</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : professionals.length === 0 ? (
            <div className="mt-16 text-center text-muted-foreground">
              <p className="text-lg font-semibold">No Karighars found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {professionals.map((pro) => (
                <article key={pro.id} className="group relative flex flex-col gap-3">
                  <Link to="/professionals/$id" params={{ id: pro.slug || pro.id }} className="absolute inset-0 z-10">
                    <span className="sr-only">View profile</span>
                  </Link>
                  
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                    <img 
                      src={`https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop&sig=${pro.id}`} 
                      alt={pro.business} 
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm z-20">
                      Karighar favourite
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveMutation.mutate(pro.id); }}
                      className="absolute right-3 top-3 z-20 shrink-0 rounded-full p-2 hover:bg-background/80 bg-background/50 backdrop-blur-sm transition-colors"
                    >
                      <Heart className={`size-5 transition-colors ${savedIds.includes(pro.id) ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                    </button>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-base truncate">{pro.business}</h3>
                      <span className="flex items-center gap-1 text-sm shrink-0">
                        <Star className="size-3.5 fill-foreground text-foreground" />
                        {pro.rating}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{pro.city || 'Mumbai'}</p>
                    <p className="text-sm text-muted-foreground truncate">{pro.trade}</p>
                    <p className="mt-1 text-sm font-medium border-b border-transparent group-hover:border-foreground max-w-fit transition-colors">
                      <span className="font-semibold text-foreground">₹{(pro.rating * 100).toFixed(0)}</span> starting price
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Map */}
        <div className="hidden lg:block w-[45%] xl:w-[40%] sticky top-0 h-full border-l border-border bg-[#e5e3df] relative overflow-hidden">
          {/* FAKE MAP UI PLACEHOLDER (Google Maps Style) */}
          <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')]" />
          
          <img src="https://static-maps.yandex.ru/1.x/?lang=en-US&ll=72.8777,19.0760&z=11&l=map&size=600,600" className="w-full h-full object-cover opacity-80" alt="Map" />
          
          {/* Render fake markers based on professionals */}
          <div className="absolute inset-0 p-10 flex flex-wrap gap-10 items-center justify-center content-center overflow-hidden">
            {professionals.slice(0, 8).map((pro, idx) => (
              <div key={pro.id} className="relative z-10 bg-background hover:bg-foreground hover:text-background transition-colors text-foreground font-bold px-3 py-1.5 rounded-full shadow-lg text-sm cursor-pointer scale-100 hover:scale-110 hover:z-20 border border-border shadow-black/10 transition-all">
                ₹{(pro.rating * 100).toFixed(0)}
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button variant="secondary" className="rounded-full shadow-lg gap-2 font-semibold">
              <Search className="size-4" /> Search as I move the map
            </Button>
          </div>
        </div>
      </main>
    </PageShell>
  );
}