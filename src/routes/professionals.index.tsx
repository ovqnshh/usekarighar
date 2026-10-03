import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Star, SlidersHorizontal, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';

export const Route = createFileRoute('/professionals/')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search['category'] === 'string' ? search['category'] : undefined,
    location: typeof search['location'] === 'string' ? search['location'] : undefined,
    minPrice: typeof search['minPrice'] === 'number' ? search['minPrice'] : (typeof search['minPrice'] === 'string' && !isNaN(parseInt(search['minPrice'])) ? parseInt(search['minPrice']) : undefined),
    maxPrice: typeof search['maxPrice'] === 'number' ? search['maxPrice'] : (typeof search['maxPrice'] === 'string' && !isNaN(parseInt(search['maxPrice'])) ? parseInt(search['maxPrice']) : undefined),
    rating: typeof search['rating'] === 'number' ? search['rating'] : (typeof search['rating'] === 'string' && !isNaN(parseFloat(search['rating'])) ? parseFloat(search['rating']) : undefined),
    sort: typeof search['sort'] === 'string' ? search['sort'] : undefined,
  }),
  head: () => ({ meta: [
    { title: 'Matched Karighars — Karighar' },
  ]}),
  component: ProfessionalsPage,
});

import { Plug, Droplet, Fan, Hammer, PaintRoller, BrickWall, Umbrella, LayoutGrid, Box, Lock, Bug, Users, Home } from 'lucide-react';

const TRADES = [
  { label: 'All', icon: Home },
  { label: 'Electrical repair & installation', icon: Plug },
  { label: 'Plumbing repair & installation', icon: Droplet },
  { label: 'AC & appliance repair/installation', icon: Fan },
  { label: 'Carpentry & custom furniture', icon: Hammer },
  { label: 'Painting & wall finishing', icon: PaintRoller },
  { label: 'Masonry & plastering', icon: BrickWall },
  { label: 'Waterproofing', icon: Umbrella },
  { label: 'Tiling & flooring', icon: LayoutGrid },
  { label: 'False ceiling & POP work', icon: Box },
  { label: 'Home automation & smart locks', icon: Lock },
  { label: 'Pest control', icon: Bug },
  { label: 'General labour / helper', icon: Users },
];

const CATEGORY_TRADES: Record<string, string[]> = {
  build: ['Carpentry & custom furniture', 'Masonry & plastering', 'False ceiling & POP work'],
  renovate: ['Painting & wall finishing', 'Tiling & flooring', 'Waterproofing'],
  fix: ['Plumbing repair & installation', 'Electrical repair & installation', 'AC & appliance repair/installation'],
};

function ProfessionalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: '/professionals/' });
  const search = Route.useSearch();
  const { category, location, minPrice, maxPrice, rating, sort } = search;
  
  const [filterOpen, setFilterOpen] = useState(false);
  const [minPriceState, setMinPriceState] = useState(minPrice?.toString() || '');
  const [maxPriceState, setMaxPriceState] = useState(maxPrice?.toString() || '');
  const [ratingState, setRatingState] = useState(rating || 0);
  const [locationState, setLocationState] = useState(location || '');
  
  useEffect(() => {
    setMinPriceState(minPrice?.toString() || '');
    setMaxPriceState(maxPrice?.toString() || '');
    setRatingState(rating || 0);
    setLocationState(location || '');
  }, [minPrice, maxPrice, rating, location]);

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals', category, location, minPrice, maxPrice, rating, sort],
    queryFn: async () => {
      let q = supabase.from('professionals').select('*, gigs(*)');
      
      if (category && category !== 'All') {
        if (CATEGORY_TRADES[category]) {
          q = q.in('trade', CATEGORY_TRADES[category]);
        } else {
          q = q.eq('trade', category);
        }
      }
      
      if (location) {
        q = q.ilike('city', `%${location}%`);
      }
      
      if (rating) {
        q = q.gte('rating', rating);
      }

      const { data, error } = await q;
      if (error) throw error;
      
      let filtered = (data || []).map((pro: any) => {
        const computedRating = pro.reviews && pro.reviews.length > 0 
          ? pro.reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / pro.reviews.length
          : pro.rating || 0;
          
        const lowestGigPrice = pro.gigs && pro.gigs.length > 0
          ? Math.min(...pro.gigs.map((g: any) => g.starting_price || 0))
          : Infinity;
          
        return {
          ...pro,
          computedRating,
          lowestGigPrice
        };
      });
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        filtered = filtered.filter((pro: any) => {
          if (pro.lowestGigPrice === Infinity) return false;
          if (minPrice !== undefined && pro.lowestGigPrice < minPrice) return false;
          if (maxPrice !== undefined && pro.lowestGigPrice > maxPrice) return false;
          return true;
        });
      }
      
      if (sort === 'price') {
        filtered.sort((a: any, b: any) => a.lowestGigPrice - b.lowestGigPrice);
      } else {
        filtered.sort((a: any, b: any) => b.computedRating - a.computedRating);
      }

      return filtered;
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
      if (!user) { toast('Please log in to save'); return; }
      const db = supabase as any;
      if (savedIds.includes(proId)) {
        await db.from('saved_karighars').delete().eq('user_id', user.id).eq('professional_id', proId);
      } else {
        await db.from('saved_karighars').insert({ user_id: user.id, professional_id: proId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-karighars', user?.id] }),
  });

  const applyFilters = () => {
    navigate({
      search: (prev: any) => ({
        ...prev,
        minPrice: minPriceState ? parseInt(minPriceState, 10) : undefined,
        maxPrice: maxPriceState ? parseInt(maxPriceState, 10) : undefined,
        rating: ratingState > 0 ? ratingState : undefined,
        location: locationState ? locationState : undefined,
      })
    });
    setFilterOpen(false);
  };
  
  const clearFilters = () => {
    setMinPriceState('');
    setMaxPriceState('');
    setRatingState(0);
    setLocationState('');
    navigate({
      search: (prev: any) => ({
        ...prev,
        minPrice: undefined,
        maxPrice: undefined,
        rating: undefined,
        location: undefined,
      })
    });
  };

  const getEmptyMessage = () => {
    let msg = "No Karighars found";
    const catDisplay = (category && category !== 'All' && !CATEGORY_TRADES[category]) ? category : 'Karighars';
    if (category && location) {
      msg = `No ${catDisplay} found in ${location}`;
    } else if (category && category !== 'All') {
      msg = `No ${catDisplay} found`;
    } else if (location) {
      msg = `No Karighars found in ${location}`;
    }
    return msg;
  };

  return (
    <PageShell>
      {/* Filters Bar */}
      <div className="sticky top-20 z-30 bg-background border-b border-border shadow-sm pt-4">
        <div className="flex items-center gap-6 px-5 pb-3 overflow-x-auto no-scrollbar scroll-smooth">
          {TRADES.map((t) => {
            const Icon = t.icon;
            const isActive = (!category && t.label === 'All') || category === t.label;
            return (
              <button
                key={t.label}
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, category: t.label === 'All' ? undefined : t.label }) })}
                className={`group flex shrink-0 flex-col items-center gap-2 border-b-2 transition-all duration-300 pb-2 hover:border-foreground/30 ${
                  isActive ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
                }`}
              >
                <Icon className={`size-6 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:text-foreground'}`} />
                <span className={`text-xs whitespace-nowrap transition-colors duration-300 ${isActive ? 'font-semibold' : 'font-medium group-hover:text-foreground'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Quick Filters */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full shrink-0 gap-2 font-semibold" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal className="size-4" /> Filters
            </Button>
            <div className="w-px h-6 bg-border shrink-0 mx-2" />
            <button
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, sort: sort === 'price' ? 'rating' : 'price' }) })}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors whitespace-nowrap ${sort === 'price' ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground'}`}
            >
              Sort by lowest price
            </button>
            <button
              onClick={() => navigate({ search: (prev: any) => ({ ...prev, sort: 'rating' }) })}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors whitespace-nowrap ${sort === 'rating' || !sort ? 'border-foreground bg-foreground text-background' : 'border-border hover:border-foreground'}`}
            >
              Top rated
            </button>
          </div>
        </div>
      </div>

      <main className="flex h-[calc(100vh-140px)] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Karighars List */}
        <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Over {professionals.length}+ professionals</h1>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
              </motion.div>
            ) : professionals.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-16 text-center text-muted-foreground">
                <p className="text-lg font-semibold">{getEmptyMessage()}</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {professionals.map((pro: any) => (
                  <article key={pro.id} className="group relative flex flex-col gap-3 transition-all duration-400 ease-out hover:-translate-y-1.5 active:scale-[0.98] p-2 -m-2 rounded-2xl hover:bg-card hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                    <Link to="/professionals/$id" params={{ id: pro.slug || pro.id }} className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl">
                      <span className="sr-only">View profile</span>
                    </Link>
                    
                    <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-xl bg-muted shadow-sm group-hover:shadow-md transition-all duration-400">
                      <img 
                        src={`https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop&sig=${pro.id}`} 
                        alt={pro.business} 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveMutation.mutate(pro.id); }}
                        className="absolute right-3 top-3 z-20 shrink-0 rounded-full p-2.5 transition-all duration-300 bg-background/50 backdrop-blur-md hover:bg-red-50 hover:scale-110 active:scale-95"
                      >
                        <Heart className={`size-4 transition-colors ${savedIds.includes(pro.id) ? 'fill-red-500 text-red-500' : 'text-foreground/80 hover:text-red-500'}`} />
                      </button>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-semibold text-base truncate">{pro.business}</h3>
                        <span className="flex items-center gap-1 text-sm shrink-0">
                          <Star className="size-3.5 fill-foreground text-foreground" />
                          {pro.computedRating ? pro.computedRating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{pro.city || 'Mumbai'}</p>
                      <p className="text-sm text-muted-foreground truncate">{pro.trade}</p>
                      <p className="mt-1 text-sm font-medium border-b border-transparent group-hover:border-foreground max-w-fit transition-colors">
                        <span className="font-semibold text-foreground">₹{pro.lowestGigPrice !== Infinity ? pro.lowestGigPrice.toLocaleString('en-IN') : 'TBD'}</span> starting price
                      </p>
                    </div>
                  </article>
                ))}
              </div>
              
              <div className="mt-12 mb-8 mx-auto max-w-2xl text-center p-8 rounded-2xl bg-muted/30 border border-border">
                <Search className="size-8 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Didn't find what you're looking for?</h3>
                <p className="text-muted-foreground mb-6">Describe your exact needs and we'll match you with the best available Karighars in your area.</p>
                <Button asChild className="rounded-xl px-8">
                  <Link to="/">Post a custom Project</Link>
                </Button>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 flex flex-col h-[85vh] max-h-[800px] rounded-2xl">
          <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-center relative shrink-0">
            <DialogTitle className="text-base font-semibold">Filters</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
            
            {/* Location */}
            <div className="pb-8 border-b border-border">
              <h3 className="text-xl font-medium mb-4">Location</h3>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  value={locationState} 
                  onChange={e => setLocationState(e.target.value)} 
                  placeholder="E.g. Andheri, Mumbai" 
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="py-8 border-b border-border">
              <h3 className="text-xl font-medium">Price range</h3>
              <p className="text-sm text-muted-foreground mb-6 mt-1">Starting prices for Gigs</p>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1 relative">
                  <Label className="text-xs text-muted-foreground absolute top-2 left-4 z-10">Minimum</Label>
                  <Input value={minPriceState} onChange={e => setMinPriceState(e.target.value)} placeholder="₹0" type="number" className="h-14 rounded-2xl border-muted-foreground/30 px-4 pt-5 pb-1 shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground" />
                </div>
                <div className="text-muted-foreground mt-4">-</div>
                <div className="flex-1 space-y-1 relative">
                  <Label className="text-xs text-muted-foreground absolute top-2 left-4 z-10">Maximum</Label>
                  <Input value={maxPriceState} onChange={e => setMaxPriceState(e.target.value)} placeholder="₹50000+" type="number" className="h-14 rounded-2xl border-muted-foreground/30 px-4 pt-5 pb-1 shadow-none focus-visible:ring-1 focus-visible:ring-foreground focus-visible:border-foreground" />
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="py-8">
              <h3 className="text-xl font-medium mb-6">Rating</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-base text-foreground font-light">Minimum Rating</div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setRatingState(Math.max(0, ratingState - 1))} className="size-8 rounded-full border border-muted-foreground/30 flex items-center justify-center hover:border-foreground text-muted-foreground hover:text-foreground transition-colors">-</button>
                    <span className="w-8 text-center text-base">{ratingState === 0 ? 'Any' : `${ratingState}+`}</span>
                    <button onClick={() => setRatingState(Math.min(5, ratingState + 1))} className="size-8 rounded-full border border-muted-foreground/30 flex items-center justify-center hover:border-foreground text-muted-foreground hover:text-foreground transition-colors">+</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="px-6 py-4 border-t border-border flex flex-row items-center justify-between sm:justify-between shrink-0 bg-background">
            <button onClick={clearFilters} className="font-semibold underline text-sm text-foreground hover:opacity-70 transition-opacity">
              Clear all
            </button>
            <Button className="h-12 px-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-base" onClick={applyFilters}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
