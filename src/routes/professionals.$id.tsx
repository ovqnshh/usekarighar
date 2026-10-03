import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CalendarDays, ChevronRight, Check, Clock3, Heart, MapPin, Star, ShieldCheck, Wrench, Share, Award, Camera } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { LiveMap } from '@/components/live-map';

const professionalQueryOptions = (slug: string) => queryOptions({
  queryKey: ['professional', slug],
  queryFn: async () => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    const { data, error } = await supabase
      .from('professionals')
      .select('*, gigs(*)')
      .or(isUuid ? `id.eq.${slug},slug.eq.${slug}` : `slug.eq.${slug}`)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
      
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, body, created_at')
        .eq('professional_id', data.id)
        .order('created_at', { ascending: false });
        
      const { count: projectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', data.id)
        .eq('status', 'completed');

      const { data: verifications } = await supabase
        .from('karighar_verifications')
        .select('type, status')
        .eq('professional_id', data.id)
        .eq('status', 'verified');

      // fetch blocked or available dates
      const { data: availability } = await supabase
        .from('karighar_availability')
        .select('date, status')
        .eq('professional_id', data.id)
        .eq('status', 'blocked');

      // fetch already scheduled projects
      const { data: scheduledProjects } = await supabase
        .from('projects')
        .select('timing')
        .eq('professional_id', data.id)
        .in('status', ['scheduled', 'in_progress']);

      return { 
        ...data, 
        reviews: reviews || [],
        completed_projects_count: projectsCount || 0,
        verifications: verifications || [],
        availability: availability || [],
        scheduled_projects: scheduledProjects || []
      };
  },
});

export const Route = createFileRoute('/professionals/$id')({
  loader: ({ context: { queryClient }, params: { id } }) => 
    queryClient.ensureQueryData(professionalQueryOptions(id)),
  component: ProfilePage 
});

function ProfilePage() {
  const { id: slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [jobTitle, setJobTitle] = useState('');
  const [jobDetails, setJobDetails] = useState('');
  const [jobDate, setJobDate] = useState<Date>();
  const [isAILoading, setIsAILoading] = useState(false);

  const { data: pro, isLoading } = useQuery(professionalQueryOptions(slug));

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
      
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          customer_id: user.id,
          title: jobTitle || `Project with ${pro.name}`,
          summary: jobDetails,
          timing: jobDate ? format(jobDate, 'yyyy-MM-dd') : null,
          professional_id: pro.id,
          status: 'requesting_quotes',
          source: 'quote',
        })
        .select('id')
        .single();
      if (projectError) throw projectError;
      
      const { error: quoteError } = await supabase
        .from('quotes')
        .insert({ project_id: project.id, professional_id: pro.id, status: 'requested' });
      if (quoteError) throw quoteError;
      return project.id;
    },
    onSuccess: () => {
      toast.success('Request sent!', { description: `${pro?.name} has been notified.` });
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

  const { data: portfolioImages = [] } = useQuery({
    queryKey: ['portfolio', pro?.id],
    queryFn: async (): Promise<any[]> => {
      if (!pro) return [];
      const { data } = await (supabase as any).from('portfolio_images').select('*').eq('professional_id', pro.id).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!pro,
  });

  if (isLoading) {
    return <PageShell><main className="mx-auto max-w-7xl px-5 py-20"><div className="h-96 rounded-2xl bg-muted animate-pulse" /></main></PageShell>;
  }

  if (!pro) {
    return <PageShell><main className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl font-bold">Professional not found</h1><Button asChild className="mt-6"><Link to="/professionals">Browse Karighars</Link></Button></main></PageShell>;
  }

  const avgRating = pro.reviews?.length > 0 ? (pro.reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / pro.reviews.length).toFixed(1) : 'New';

  return (
    <PageShell>
      <main className="mx-auto max-w-[1120px] px-5 py-6 md:px-10 lg:px-10 pb-32">
        {/* Top Header / Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/professionals" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline">
            <ArrowLeft className="size-4" /> Back to results
          </Link>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm font-semibold hover:bg-muted px-3 py-1.5 rounded-lg transition-colors">
              <Share className="size-4" /> Share
            </button>
            <button onClick={() => saveMutation.mutate()} className="flex items-center gap-2 text-sm font-semibold hover:bg-muted px-3 py-1.5 rounded-lg transition-colors">
              <Heart className={`size-4 ${isSaved ? 'fill-destructive text-destructive' : ''}`} /> Save
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-[2rem] leading-tight font-semibold">{pro.business}</h1>
        <div className="flex items-center gap-2 text-sm font-medium mt-1 mb-6">
          <Star className="size-4 fill-foreground text-foreground" />
          <span>{avgRating}</span>
          <span className="text-muted-foreground">·</span>
          <span className="underline font-semibold cursor-pointer">{pro.reviews?.length ?? 0} reviews</span>
          <span className="text-muted-foreground">·</span>
          <span className="underline font-semibold cursor-pointer">{pro.city || 'Mumbai, Maharashtra'}</span>
        </div>

        {/* Hero Image Grid */}
        <div className="rounded-xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-2 h-[45vh] min-h-[300px] max-h-[500px]">
          {portfolioImages.length > 0 ? (
            <>
              <div className="col-span-2 row-span-2 relative hover:opacity-90 transition-opacity cursor-pointer">
                <img src={portfolioImages[0]?.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative hover:opacity-90 transition-opacity cursor-pointer">
                <img src={portfolioImages[1]?.image_url || portfolioImages[0]?.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative hover:opacity-90 transition-opacity cursor-pointer hidden md:block">
                <img src={portfolioImages[2]?.image_url || portfolioImages[0]?.image_url} alt="" className="w-full h-full object-cover rounded-tr-xl" />
              </div>
              <div className="relative hover:opacity-90 transition-opacity cursor-pointer">
                <img src={portfolioImages[3]?.image_url || portfolioImages[0]?.image_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative hover:opacity-90 transition-opacity cursor-pointer hidden md:block">
                <img src={portfolioImages[4]?.image_url || portfolioImages[0]?.image_url} alt="" className="w-full h-full object-cover rounded-br-xl" />
                <Button variant="secondary" className="absolute bottom-4 right-4 bg-background border border-border shadow-md text-sm px-4">
                  Show all photos
                </Button>
              </div>
            </>
          ) : (
            <div className="col-span-4 row-span-2 bg-muted flex items-center justify-center relative">
               <img src={`https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80&auto=format&fit=crop`} alt="" className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <h2 className="text-2xl font-bold bg-background/80 px-4 py-2 rounded-lg">{pro.business}</h2>
               </div>
            </div>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] mt-12">
          
          <section className="space-y-8">
            
            {/* Professional info */}
            <div className="flex items-center justify-between pb-8 border-b border-border">
              <div>
                <h2 className="text-2xl font-semibold">{pro.name}</h2>
                <p className="text-muted-foreground mt-1 text-base">
                  {pro.trade} · {pro.completed_projects_count} jobs completed · Member since {new Date(pro.created_at).getFullYear()}
                </p>
              </div>
              <div className="relative shrink-0 ml-4">
                <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-border overflow-hidden">
                   {pro.name.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <Award className="size-6 text-rose-500 fill-rose-500" />
                </div>
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-6 pb-8 border-b border-border">
              {pro.verifications?.some((v: any) => v.type === 'top_rated') && (
                <div className="flex gap-5 items-start">
                  <Award className="size-6 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Top Rated Karighar</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Highly rated for quality work and reliability.</p>
                  </div>
                </div>
              )}
              {pro.verifications?.some((v: any) => v.type === 'background_check') && (
                <div className="flex gap-5 items-start">
                  <ShieldCheck className="size-6 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">Background verified</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Identity and qualifications have been verified.</p>
                  </div>
                </div>
              )}
              <div className="flex gap-5 items-start">
                <CalendarDays className="size-6 text-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Flexible booking</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">Easily reschedule if your plans change.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pb-8 border-b border-border">
              <p className="leading-7 text-foreground whitespace-pre-wrap line-clamp-6 text-base">
                {pro.bio || `${pro.name} is a highly skilled ${pro.trade.toLowerCase()} serving the ${pro.city || 'Mumbai'} area. With a commitment to quality and customer satisfaction, they handle projects of all sizes.`}
              </p>
              <button className="text-foreground font-semibold underline mt-4 flex items-center gap-1 hover:text-foreground/80">
                Show more <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Gigs / Services */}
            <div className="pb-8 border-b border-border">
              <h2 className="font-display text-[1.35rem] font-semibold mb-6">What this Karighar offers</h2>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                {pro.gigs && pro.gigs.filter((g: any) => g.is_published !== false).length > 0 ? pro.gigs.filter((g: any) => g.is_published !== false).map((gig: any) => (
                  <div key={gig.id} className="flex items-center gap-4">
                    <Wrench className="size-6 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    <span className="text-foreground text-base">{gig.name}</span>
                  </div>
                )) : (
                   <p className="text-muted-foreground">Contact for detailed services.</p>
                )}
              </div>
              <Button variant="outline" className="mt-8 rounded-lg font-semibold px-6 border-foreground py-6 text-base">
                Show all services
              </Button>
            </div>
            
            <div className="py-8 border-t border-border mt-8">
              <h2 className="font-display text-[1.35rem] font-semibold mb-6">Live Location</h2>
              <LiveMap professionalId={pro.id} />
              <p className="text-sm text-muted-foreground mt-2">Track the professional's current location in real-time.</p>
            </div>
          </section>

          {/* Sticky Sidebar Form */}
          <aside className="relative">
            <div className="sticky top-28 rounded-2xl border border-border bg-background p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)] mb-10">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-xl font-bold">Request a Quote</span>
              </div>

              <div className="rounded-xl border border-muted-foreground/30 overflow-hidden mb-4">
                <div className="border-b border-muted-foreground/30">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left p-3 focus-within:bg-muted/30 transition-colors flex items-center justify-between">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-foreground block cursor-pointer">Date</label>
                          <span className={`text-sm block mt-1 ${!jobDate ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {jobDate ? format(jobDate, 'dd-MM-yyyy') : 'Select a date'}
                          </span>
                        </div>
                        <CalendarDays className="size-4 text-foreground/80 mr-2" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={jobDate}
                        onSelect={setJobDate}
                        disabled={(date) => {
                          if (date < new Date(new Date().setHours(0,0,0,0))) return true;
                          const dateStr = format(date, 'yyyy-MM-dd');
                          if (pro.scheduled_projects?.some((p: any) => p.timing === dateStr)) return true;
                          if (pro.availability?.some((a: any) => a.date === dateStr && a.status === 'blocked')) return true;
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="p-3 border-b border-muted-foreground/30 focus-within:bg-muted/30 transition-colors relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase text-foreground block">Job Title</label>
                    <label className="text-[10px] font-bold uppercase text-[#E51D53] cursor-pointer flex items-center gap-1 hover:underline">
                      <Camera className="size-3" />
                      {isAILoading ? 'Analyzing...' : 'AI Auto-fill with Photo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsAILoading(true);
                          try {
                            const base64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            });
                            const base64Data = base64.split(',')[1];
                            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                contents: [{
                                  parts: [
                                    { text: 'Analyze this household problem image. Return ONLY a raw JSON object (no markdown) with two keys: "title" (a short 3-5 word job title) and "description" (a detailed description of what seems to be wrong).' },
                                    { inline_data: { mime_type: file.type, data: base64Data } }
                                  ]
                                }]
                              })
                            });
                            const data = await response.json();
                            const text = data.candidates[0].content.parts[0].text;
                            const parsed = JSON.parse(text.replace(/```json/g, '').replace(/```/g, ''));
                            if (parsed.title) setJobTitle(parsed.title);
                            if (parsed.description) setJobDetails(parsed.description);
                            toast.success("AI successfully analyzed the image!");
                          } catch (err) {
                            console.error(err);
                            toast.error("AI Analysis failed. Check API key.");
                          } finally {
                            setIsAILoading(false);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input type="text" placeholder="e.g. Kitchen tap repair" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground mt-1" />
                </div>
                <div className="p-3 focus-within:bg-muted/30 transition-colors">
                  <label className="text-[10px] font-bold uppercase text-foreground block">Details</label>
                  <textarea placeholder="Describe the issue..." value={jobDetails} onChange={(e) => setJobDetails(e.target.value)} className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground resize-none h-16 mt-1" />
                </div>
              </div>

              <Button 
                className="w-full py-6 text-base font-semibold bg-[#E51D53] hover:bg-[#d4174a] text-white rounded-lg shadow-md transition-all active:scale-[0.98]"
                disabled={!jobTitle || requestQuoteMutation.isPending}
                onClick={() => {
                   if (!user) { navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } }); return; }
                   requestQuoteMutation.mutate();
                }}
              >
                {requestQuoteMutation.isPending ? 'Sending request...' : 'Check availability'}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">You won't be charged yet</p>
            </div>
          </aside>
        </div>

        {/* Full width reviews section */}
        <section className="py-12 border-t border-border mt-6">
          <div className="flex items-center gap-2 text-2xl font-semibold mb-8">
            <Star className="size-5 fill-foreground text-foreground" />
            <span>{avgRating} · {pro.reviews?.length ?? 0} reviews</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-x-20 gap-y-10">
            {pro.reviews && pro.reviews.length > 0 ? (
              pro.reviews.map((r: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold">
                       {['A','B','C','D','M','S','R'][i % 7]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Customer</h4>
                      <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                     {[1,2,3,4,5].map(s => <Star key={s} className={`size-3 ${s <= r.rating ? 'fill-foreground text-foreground' : 'text-muted-foreground'}`} />)}
                  </div>
                  <p className="text-base text-foreground/90 leading-relaxed">{r.body}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-2">No reviews yet.</p>
            )}
          </div>
          {pro.reviews && pro.reviews.length > 0 && (
             <Button variant="outline" className="mt-10 rounded-lg font-semibold px-6 py-6 text-base border-foreground">
               Show all {pro.reviews.length} reviews
             </Button>
          )}
        </section>

      </main>
    </PageShell>
  );
}

