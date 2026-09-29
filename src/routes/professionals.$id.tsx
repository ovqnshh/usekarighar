import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, Check, Clock3, Heart, MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell, TrustBadge } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { toast } from 'sonner';

export const Route = createFileRoute('/professionals/$id')({ component: ProfilePage });

function ProfilePage() {
  const { id: slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDetails, setJobDetails] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobBudget, setJobBudget] = useState('');
  const [jobDate, setJobDate] = useState('');

  const { data: pro, isLoading, error: proError } = useQuery<any>({
    queryKey: ['professional', slug],
    queryFn: async () => {
      // Fetch professional and gigs
      const { data, error } = await supabase
        .from('professionals')
        .select('*, gigs(*)')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      // Fetch reviews separately to avoid PostgREST schema cache join issues
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, body, created_at')
        .eq('professional_id', data.id)
        .order('created_at', { ascending: false });
        
      return { ...data, reviews: reviews || [] };
    },
  });

  const { data: isSaved } = useQuery({
    queryKey: ['is-saved', slug, user?.id],
    queryFn: async () => {
      if (!user || !pro) return false;
      const { data } = await (supabase as any).from('saved_karighars').select('id').eq('user_id', user.id).eq('professional_id', pro.id).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!pro,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) { toast.error('Please log in to save'); return; }
      if (!pro) return;
      if (isSaved) {
        await (supabase as any).from('saved_karighars').delete().eq('user_id', user.id).eq('professional_id', pro.id);
      } else {
        await (supabase as any).from('saved_karighars').insert({ user_id: user.id, professional_id: pro.id });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['is-saved', slug, user?.id] }); qc.invalidateQueries({ queryKey: ['saved-karighars'] }); },
  });

  const requestQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not logged in');
      if (!pro) throw new Error('Professional not found');
      // 1. Create a project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          customer_id: user.id,
          title: jobTitle || `Project with ${pro.name}`,
          summary: jobDetails,
          location: jobLocation,
          budget: jobBudget,
          timing: jobDate,
          professional_id: pro.id,
          status: 'requesting_quotes',
          source: 'quote',
        })
        .select('id')
        .single();
      if (projectError) throw projectError;
      // 2. Create a quote request for this professional
      const { error: quoteError } = await supabase
        .from('quotes')
        .insert({ project_id: project.id, professional_id: pro.id, status: 'requested' });
      if (quoteError) throw quoteError;
      return project.id;
    },
    onSuccess: () => {
      toast.success('Quote requested!', { description: `${pro?.name} has been notified and will respond soon.` });
      setQuoteOpen(false);
      navigate({ to: '/my-projects' });
    },
    onError: (e: Error) => {
      if (e.message === 'Not logged in') {
        toast.error('Please log in to request a quote');
        navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
      } else {
        toast.error(e.message);
      }
    },
  });

  if (isLoading) {
    return <PageShell><main className="mx-auto max-w-7xl px-5 py-20"><div className="h-96 rounded-2xl bg-muted animate-pulse" /></main></PageShell>;
  }

  if (!pro) {
    return <PageShell><main className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-bold">Professional not found</h1><Button asChild className="mt-6"><Link to="/professionals">Browse Karighars</Link></Button></main></PageShell>;
  }

  const avgRating = pro.reviews?.length > 0 ? (pro.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / pro.reviews.length).toFixed(1) : pro.rating;

  return (
    <PageShell>
      <main>
        {/* Hero */}
        <section className="relative h-72 overflow-hidden bg-gradient-to-br from-primary/20 to-muted md:h-96">
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
          <Link to="/professionals" className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm font-semibold shadow">
            <ArrowLeft className="size-4" /> Results
          </Link>
        </section>

        <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="relative -mt-20 grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Main content */}
            <section>
              {/* Identity card */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-xl">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary border-4 border-card">
                    {pro.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">{pro.trade}</p>
                    <h1 className="mt-1 font-display text-4xl font-semibold">{pro.name}</h1>
                    <p className="mt-1 text-muted-foreground">{pro.business}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => saveMutation.mutate()} className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted transition-colors">
                      <Heart className={`size-5 ${isSaved ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                    </button>
                    <div className="text-right">
                      <p className="flex items-center gap-1 font-semibold"><Star className="size-4 fill-primary text-primary" /> {avgRating}</p>
                      <p className="text-xs text-muted-foreground">{pro.reviews_count ?? pro.reviews?.length ?? 0} reviews · {pro.projects_count ?? 0} jobs</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {pro.bio && (
                <div className="py-8">
                  <h2 className="font-display text-2xl font-semibold">About {pro.name}</h2>
                  <p className="mt-4 leading-7 text-muted-foreground">{pro.bio}</p>
                </div>
              )}

              {/* Gigs */}
              {pro.gigs && pro.gigs.length > 0 && (
                <section className="border-t border-border py-8">
                  <h2 className="font-display text-2xl font-semibold">Services offered</h2>
                  <div className="mt-5 grid gap-3">
                    {pro.gigs.map((gig: { id: string; name: string; description?: string; starting_price: number }) => (
                      <article key={gig.id} className="flex items-center justify-between gap-5 rounded-xl border border-border p-5 hover:bg-muted/50 transition-colors">
                        <div>
                          <h3 className="font-semibold">{gig.name}</h3>
                          {gig.description && <p className="mt-1 text-sm text-muted-foreground">{gig.description}</p>}
                        </div>
                        <p className="shrink-0 text-sm text-muted-foreground">From <strong className="text-lg text-foreground">₹{gig.starting_price.toLocaleString('en-IN')}</strong></p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              {pro.reviews && pro.reviews.length > 0 && (
                <section className="border-t border-border py-8">
                  <div className="flex items-end justify-between">
                    <h2 className="font-display text-2xl font-semibold">Customer reviews</h2>
                    <p className="flex items-center gap-1 text-lg font-semibold"><Star className="size-5 fill-primary text-primary" /> {avgRating}</p>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {pro.reviews.map((review: { rating: number; body: string; created_at: string }, i: number) => (
                      <blockquote key={i} className="rounded-xl bg-muted p-5 text-sm leading-6">
                        <div className="flex gap-1 mb-3">{[1,2,3,4,5].map((s) => <Star key={s} className={`size-3.5 ${s <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />)}</div>
                        <p>{review.body}</p>
                      </blockquote>
                    ))}
                  </div>
                </section>
              )}
            </section>

            {/* Sidebar */}
            <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-xl lg:sticky lg:top-24">
              <div className="space-y-3 text-sm">
                <p className="flex gap-3"><MapPin className="size-4 text-primary shrink-0" /> {pro.city || 'Mumbai'}</p>
                {pro.experience && <p className="flex gap-3"><Clock3 className="size-4 text-primary shrink-0" /> {pro.experience} experience</p>}
              </div>
              <Button className="mt-6 h-12 w-full text-base rounded-full" onClick={() => {
                if (!user) { navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } }); return; }
                setQuoteOpen(true);
              }}>
                Request Quote
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">No payment taken at this stage</p>
            </aside>
          </div>
        </div>
      </main>

      {/* Request Quote Dialog */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request a quote from {pro.name}</DialogTitle>
            <DialogDescription>Describe your project so {pro.name} can give you an accurate quote.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project title</Label>
              <Input placeholder="e.g. Fix leaking kitchen sink" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Describe the work needed</Label>
              <Textarea placeholder="Tell them what needs to be done, current condition, any specific requirements..." value={jobDetails} onChange={(e) => setJobDetails(e.target.value)} className="min-h-24" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="e.g. Andheri West" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Preferred date</Label>
                <Input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Budget (optional)</Label>
              <Input placeholder="e.g. ₹2,000" value={jobBudget} onChange={(e) => setJobBudget(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setQuoteOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!jobTitle || requestQuoteMutation.isPending} onClick={() => requestQuoteMutation.mutate()}>
              {requestQuoteMutation.isPending ? 'Sending...' : 'Send request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}