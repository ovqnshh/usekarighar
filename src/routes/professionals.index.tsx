import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, Star, SlidersHorizontal, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiteHeader } from '@/components/karighar-shell';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { services, matchesService } from '@/lib/services';
import { professionals as dummyProfessionals } from '@/lib/karighar-data';

export const Route = createFileRoute('/professionals/')({
  validateSearch: (search: Record<string, unknown>): { category?: string; location?: string; minPrice?: number; maxPrice?: number; rating?: number; sort?: string } => {
    const num = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' && v !== '' && !isNaN(Number(v)) ? Number(v) : undefined);
    const out: { category?: string; location?: string; minPrice?: number; maxPrice?: number; rating?: number; sort?: string } = {};
    if (typeof search['category'] === 'string') out.category = search['category'];
    if (typeof search['location'] === 'string') out.location = search['location'];
    const mn = num(search['minPrice']); if (mn !== undefined) out.minPrice = mn;
    const mx = num(search['maxPrice']); if (mx !== undefined) out.maxPrice = mx;
    const r = num(search['rating']); if (r !== undefined) out.rating = r;
    if (typeof search['sort'] === 'string') out.sort = search['sort'];
    return out;
  },
  head: () => ({ meta: [
    { title: 'Matched Karighars — Karighar' },
  ]}),
  component: ProfessionalsPage,
});

import { Plug, Droplet, Fan, Hammer, PaintRoller, BrickWall, Umbrella, LayoutGrid, Box, Lock, Bug, Users, Home } from 'lucide-react';

const TRADES = services;
const CATEGORY_TRADES: Record<string,string[]> = {build:['carpentry','renovation'],renovate:['renovation','painting','flooring'],fix:['plumbing','electrical','appliances']};

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
      // 1. Fetch all professionals from Supabase to get real UUIDs (no DB-side filtering)
      const { data, error } = await supabase.from('professionals').select('*, gigs(*)');
      if (error) throw error;
      
      // 2. Map and merge with rich dummy data (overriding trade strings to perfectly match UI filters)
      let filtered = (data || []).map((pro: any) => {
        const dummy = dummyProfessionals.find(d => d.id === pro.slug);
        
        const computedRating = pro.reviews && pro.reviews.length > 0 
          ? pro.reviews.reduce((acc: number, rev: any) => acc + (rev.rating || 0), 0) / pro.reviews.length
          : dummy?.rating || pro.rating || 0;
          
        const lowestGigPrice = pro.gigs && pro.gigs.filter((g: any)=>g.is_published).length > 0
          ? Math.min(...pro.gigs.filter((g: any)=>g.is_published).map((g: any) => g.starting_price || 0))
          : dummy?.price || Infinity;
          
        return {
          ...pro,
          trade: pro.trade, // Override trade with the perfectly matched dummy trade
          image: dummy?.image,
          portfolio: dummy?.portfolio,
          computedRating,
          lowestGigPrice
        };
      });
      
      // 3. Apply category filter in JS
      filtered = filtered.filter(p => matchesService(p.trade, category));
      // 4. Apply location filter in JS
      if (location) {
        filtered = filtered.filter(p => p.city.toLowerCase().includes(location.toLowerCase()));
      }
      
      // 5. Apply rating filter in JS
      if (rating) {
        filtered = filtered.filter(p => (p.computedRating || 0) >= rating);
      }

      // 6. Apply price filter in JS
      if (minPrice !== undefined || maxPrice !== undefined) {
        filtered = filtered.filter((pro: any) => {
          if (pro.lowestGigPrice === Infinity) return false;
          if (minPrice !== undefined && pro.lowestGigPrice < minPrice) return false;
          if (maxPrice !== undefined && pro.lowestGigPrice > maxPrice) return false;
          return true;
        });
      }
      
      // 7. Sort
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
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <SiteHeader />
      {/* Filters Bar */}
      <div className="shrink-0 z-30 bg-background border-b border-border shadow-sm pt-4">
        <div className="flex items-center gap-2 px-5 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
          {TRADES.map((t) => {
            const Icon = t.icon;
            const isActive = (!category && !t.id) || category === t.id;
            return (
              <button
                key={t.label}
                onClick={() => navigate({ search: (prev: any) => ({ ...prev, category: t.id || undefined }) })}
                className={`group flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 transition-all duration-200 ${
                  isActive ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className={`size-4 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:text-foreground'}`} />
                <span className={`text-sm whitespace-nowrap transition-colors duration-300 ${isActive ? 'font-semibold' : 'font-medium group-hover:text-foreground'}`}>
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

      <main className="flex flex-1 min-h-0 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Karighars List */}
        <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">{professionals.length} Karighar{professionals.length === 1 ? '' : 's'} matching your search</h1>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />)}
              </motion.div>
            ) : professionals.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-16 text-center text-muted-foreground">
                <p className="text-lg font-semibold">{getEmptyMessage()}</p>
                <p className="text-sm mt-2">No exact matches for these filters. Try all services or a wider area.</p><Button variant="outline" className="mt-5" onClick={()=>navigate({search:{}})}>Show all Karighars</Button>
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
                        src={pro.image || dummyProfessionals[0].portfolio[0]} 
                        alt={pro.business} 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                      />
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); saveMutation.mutate(pro.id); }}
                        aria-label={savedIds.includes(pro.id)?"Remove from shortlist":"Save to shortlist"}
                        className="absolute right-3 top-3 z-20 shrink-0 rounded-full p-2.5 transition-all duration-300 bg-background/50 backdrop-blur-md hover:bg-destructive/10 hover:scale-110 active:scale-95"
                      >
                        <Heart className={`size-4 transition-colors ${savedIds.includes(pro.id) ? 'fill-destructive text-destructive' : 'text-foreground/80 hover:text-destructive'}`} />
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
                        <span className="font-semibold text-foreground">{pro.lowestGigPrice !== Infinity ? `₹${pro.lowestGigPrice.toLocaleString('en-IN')} onwards` : 'Request pricing'}</span>
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
    </div>
  );
}
