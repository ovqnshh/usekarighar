import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft, CalendarDays, Check, Clock3, Heart, MapPin, Star,
  ShieldCheck, Wrench, Share2, Award, Camera, Sparkles,
  MessageSquare, Calculator, CheckCircle2, ChevronRight, Zap,
  UserCheck, ThumbsUp, Shield, HelpCircle, Send,
  Crosshair, Navigation, Loader2, CreditCard, DollarSign, Smartphone,
  ArrowRight, Building, KeyRound, AlertTriangle
} from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { analyzeJobPhoto } from '@/lib/renovation.functions';
import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { PageShell, MUMBAI_LOCALITIES } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { BeforeAfterSlider } from '@/components/before-after-slider';
import { projectImages } from '@/lib/karighar-data';

import arjunPortrait from '@/assets/arjun-portrait.jpg';
import meeraPortrait from '@/assets/meera-portrait.jpg';
import rohanPortrait from '@/assets/rohan-portrait.jpg';
import bathroomProject from '@/assets/bathroom-project.jpg';
import waterTankProject from '@/assets/water-tank-project.jpg';
import wardrobeProject from '@/assets/wardrobe-project.jpg';
import electricalProject from '@/assets/electrical-project.jpg';

/* ─── Trade Catalog Helpers ────────────────────────────────────────── */
interface ServiceGig {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  included: string[];
  notIncluded: string[];
  photos?: string[];
  addons?: { name: string; price: number }[];
  warranty?: string;
  serviceArea?: string;
  category?: string;
}

interface CustomerReview {
  name: string;
  location: string;
  rating: number;
  body: string;
  date: string;
  verifiedJob: string;
  initials: string;
}

const TRADE_SERVICES: Record<string, ServiceGig[]> = {
  plumbing: [
    {
      id: 'p1',
      name: 'Diagnostic Visit & Leak Isolation',
      price: 350,
      duration: '45 mins',
      description: 'Comprehensive doorstep fault diagnosis, water pressure analysis, and clear repair quote before work begins.',
      included: ['Pressure gauge leak test', 'Valve & joint inspection', 'Transparent written quote', 'SafePay escrow protection'],
      notIncluded: ['Replacement spare parts (billed transparently at catalog price)'],
    },
    {
      id: 'p2',
      name: 'Tap, Diverter & Angle Valve Replacement',
      price: 499,
      duration: '1–2 hours',
      description: 'Precision replacement of single-lever mixer, diverter cartridges, or angle stops with high-grade Teflon sealing.',
      included: ['Old fixture unmounting', 'Teflon tape seal', 'Water pressure test', '30-day workmanship guarantee'],
      notIncluded: ['New branded brass fixtures (if not customer supplied)'],
    },
    {
      id: 'p3',
      name: 'Drain Unclogging & Jet Cleaning',
      price: 699,
      duration: '1–2 hours',
      description: 'Motorized auger cable and high-pressure jetting to clear stubborn grease, hair, and scale buildup in washbasins or shower traps.',
      included: ['Auger snake clearance', 'Trap de-greasing', 'Anti-odor drain rinse', 'Discharge flow test'],
      notIncluded: ['Main building sewer line excavation'],
    },
    {
      id: 'p4',
      name: 'Overhead Tank Ball-Cock Overhaul',
      price: 899,
      duration: '2–3 hours',
      description: 'Complete repair of overflowing overhead water tanks, replacing corroded brass float valves and inlet piping.',
      included: ['Inlet line isolation', 'Heavy brass ball valve fitting', 'Water level calibration', 'Zero-leak testing'],
      notIncluded: ['Full tank masonry plastering'],
    },
  ],
  ac: [
    {
      id: 'ac1',
      name: 'Deep Jet-Foam Coil Wash & Service',
      price: 599,
      duration: '1 hour',
      description: 'High-pressure washer coil cleaning with anti-bacterial foam, drain line flush, and condenser fin realignment.',
      included: ['Protective floor sheeting', 'Indoor & outdoor coil jetting', 'Drain tray flush', 'Cooling delta-T test'],
      notIncluded: ['Refrigerant gas refill'],
    },
    {
      id: 'ac2',
      name: 'Gas Leak Diagnostic & Refrigerant Charge',
      price: 1499,
      duration: '1–2 hours',
      description: 'Nitrogen pressure testing to locate micro-leaks, copper brazing joint repair, vacuum purge, and digital weight gas charge.',
      included: ['Electronic leak sniffing', 'Nitrogen pressure hold test', 'Vacuum pump evacuation', 'R32 / R410A precision fill'],
      notIncluded: ['Compressor mechanical replacement'],
    },
    {
      id: 'ac3',
      name: 'Inverter PCB Error Diagnostic & Repair',
      price: 450,
      duration: '45 mins',
      description: 'Component-level motherboard scanning for error codes, communication faults, relay checks, and sensor replacement.',
      included: ['Diagnostic scanner readout', 'Relay & thermistor testing', 'Transparent repair quote', 'SafePay escrow protection'],
      notIncluded: ['Cost of brand new OEM motherboard if unrepairable'],
    },
  ],
  carpentry: [
    {
      id: 'c1',
      name: 'Door & Hydraulic Hinge Realignment',
      price: 450,
      duration: '1 hour',
      description: 'Realignment of sagging shutters, replacement with soft-close hydraulic hinges, and precise magnetic latch fitting.',
      included: ['Hinge mortise adjustment', 'Soft-close tensioning', 'Leveling check', '30-day fit warranty'],
      notIncluded: ['Cost of premium designer hardware'],
    },
    {
      id: 'c2',
      name: 'Custom Furniture Repair & Reinforcement',
      price: 899,
      duration: '2–3 hours',
      description: 'Joint re-gluing with waterproof Fevicol Marine, dowel reinforcement, drawer channel replacement, and touch-up.',
      included: ['Structural clamping', 'Heavy-duty ball bearing runners', 'Smooth slide test'],
      notIncluded: ['Full PU polish refinishing'],
    },
  ],
  electrical: [
    {
      id: 'e1',
      name: 'Distribution Board & MCB Diagnostic',
      price: 399,
      duration: '45 mins',
      description: 'Systematic fault finding for tripping breakers, phase balancing, earth leakage check, and safe terminal torquing.',
      included: ['Insulation resistance test', 'Earth fault isolation', 'Phase load balance', 'Safety inspection sign-off'],
      notIncluded: ['Complete rewiring runs'],
    },
    {
      id: 'e2',
      name: 'Modular Switchboard & Power Point Setup',
      price: 499,
      duration: '1 hour',
      description: 'Wiring 16A/25A dedicated power points for geysers, ACs, or ovens with Havells/Anchor compatible modular plates.',
      included: ['FR concealed wire routing', 'Modular plate fitting', 'Earth continuity test'],
      notIncluded: ['Chiseling new wall conduits over 3 meters'],
    },
  ],
};

function getTradeKey(trade: string = ''): string {
  const t = trade.toLowerCase();
  if (t.includes('plumb') || t.includes('water') || t.includes('leak') || t.includes('drain')) return 'plumbing';
  if (t.includes('ac') || t.includes('cool') || t.includes('hvac') || t.includes('climate') || t.includes('appliance')) return 'ac';
  if (t.includes('carpent') || t.includes('wood') || t.includes('furniture')) return 'carpentry';
  if (t.includes('electr') || t.includes('wire') || t.includes('circuit')) return 'electrical';
  return 'plumbing';
}

/* ─── Query Options ────────────────────────────────────────────────── */
const professionalQueryOptions = (slug: string) => queryOptions({
  queryKey: ['professional', slug],
  queryFn: async () => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    const { data, error } = await supabase
      .from('professionals')
      .select('*, gigs(*)')
      .or(isUuid ? `id.eq.${slug},slug.eq.${slug}` : `slug.eq.${slug}`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    const pro = data;
    if (!pro) return null;

    let dbReviews: any[] = [];
    let projectsCount = pro.projects_count ?? 0;
    let verifications: any[] = [];
    let availability: any[] = [];
    let scheduledProjects: any[] = [];

    if (data?.id) {
      const { data: revs } = await supabase
        .from('reviews')
        .select('rating, body, created_at, customer_name, service_name, location')
        .eq('professional_id', data.id)
        .order('created_at', { ascending: false });
      if (revs && revs.length > 0) dbReviews = revs;

      const { count: dbProjectsCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('professional_id', data.id)
        .eq('status', 'completed');
      if (dbProjectsCount !== null && dbProjectsCount !== undefined) {
        projectsCount = dbProjectsCount;
      }

      const { data: dbVerifications } = await supabase
        .from('karighar_verifications')
        .select('type, status')
        .eq('professional_id', data.id)
        .eq('status', 'verified');
      if (dbVerifications && dbVerifications.length > 0) verifications = dbVerifications;

      const { data: dbAvailability } = await supabase
        .from('karighar_availability')
        .select('date, status')
        .eq('professional_id', data.id)
        .eq('status', 'blocked');
      if (dbAvailability) availability = dbAvailability;

      const { data: dbScheduled } = await supabase
        .from('projects')
        .select('timing')
        .eq('professional_id', data.id)
        .in('status', ['scheduled', 'in_progress']);
      if (dbScheduled) scheduledProjects = dbScheduled;
    }

    const tradeKey = getTradeKey(pro.trade);
    const finalReviews: CustomerReview[] = dbReviews.map((r: any, idx: number) => {
      const reviewerName = r.author?.name || r.customer_name || `Verified Customer #${idx + 1}`;
      const initials = reviewerName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'VC';
      return {
        name: reviewerName,
        location: r.location || pro.city || 'Mumbai',
        rating: Number(r.rating) || 5,
        body: r.body || '',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
        verifiedJob: r.service_name || pro.trade,
        initials,
      };
    });

    const fallbackGigs = TRADE_SERVICES[tradeKey] || TRADE_SERVICES.plumbing;
    
    // Read any custom gigs saved locally or created via dashboard studio
    let localCustomGigs: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        const idKey = data?.id ? `karighar_custom_gigs_${data.id}` : null;
        const slugKey = slug ? `karighar_custom_gigs_${slug}` : null;
        const stored = (idKey && localStorage.getItem(idKey)) || 
                       (slugKey && localStorage.getItem(slugKey));
        if (stored) {
          localCustomGigs = JSON.parse(stored);
        } else {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('karighar_custom_gigs_')) {
              const val = localStorage.getItem(k);
              if (val) {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  if (k.includes(slug) || (data?.id && k.includes(data.id))) {
                    localCustomGigs = parsed;
                    break;
                  }
                }
              }
            }
          }
        }
      } catch {}
    }

    const dbGigs = (data?.gigs || pro.gigs || []).filter((g: any) => g.is_published !== false);
    const combinedList = [...localCustomGigs];
    for (const dg of dbGigs) {
      if (!combinedList.some((g: any) => g.id === dg.id || (g.name && g.name.toLowerCase() === dg.name.toLowerCase()))) {
        combinedList.push(dg);
      }
    }

    // Merge: custom gigs first, followed by default trade gigs
    const allGigs = [...combinedList];
    for (const fg of fallbackGigs) {
      if (!allGigs.some((g: any) => g.name && g.name.toLowerCase() === fg.name.toLowerCase())) {
        allGigs.push(fg);
      }
    }

    const normalizedGigs: ServiceGig[] = allGigs.map((g: any, i: number) => ({
      id: g.id || `gig-${i}`,
      name: g.name,
      price: Number(g.starting_price || g.price || 350),
      duration: g.duration || '1–2 hours',
      description: g.description || '',
      included: Array.isArray(g.included) ? g.included : ['Doorstep inspection', 'SafePay escrow protection'],
      notIncluded: Array.isArray(g.not_included) ? g.not_included : (Array.isArray(g.notIncluded) ? g.notIncluded : []),
      photos: Array.isArray(g.photos) ? g.photos : (g.image ? [g.image] : []),
      addons: Array.isArray(g.addons) ? g.addons : [],
      warranty: g.warranty || '30-day Karighar Workmanship Guarantee',
      serviceArea: g.service_area || pro.city || 'Mumbai',
      category: g.category || pro.trade,
    }));

    return {
      ...pro,
      hourly_rate: Number((pro as any).price || (pro as any).hourly_rate || 350),
      image: (pro as any).image || (data as any)?.avatar_url || dummy?.image || arjunPortrait,
      portfolio: [
        ...(((data as any)?.gigs || []).flatMap((g: any) => g.photos || [])),
        ...localCustomGigs.flatMap((g: any) => g.photos || []),
        ...((pro as any).portfolio?.length > 0 ? (pro as any).portfolio : (dummy?.portfolio || [waterTankProject, bathroomProject, electricalProject]))
      ].filter(Boolean),
      reviews: finalReviews,
      completed_projects_count: projectsCount || 0,
      verifications: verifications.length > 0 ? verifications : [
        { type: 'Aadhaar ID verified', status: 'verified' },
        { type: 'Police background cleared', status: 'verified' },
        { type: 'Trade skill assessed', status: 'verified' },
        { type: 'SafePay insured', status: 'verified' },
      ],
      availability,
      scheduled_projects: scheduledProjects,
      standard_gigs: normalizedGigs,
    };
  },
});

export const Route = createFileRoute('/professionals/$id')({
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.ensureQueryData(professionalQueryOptions(id)),
  component: ProfilePage,
});

/* ─── Profile Page Component ───────────────────────────────────────── */
function ProfilePage() {
  const { id: slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedService, setSelectedService] = useState<ServiceGig | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDetails, setJobDetails] = useState('');
  const [jobDate, setJobDate] = useState<Date>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('Morning (9 AM – 12 PM)');
  const [isAILoading, setIsAILoading] = useState(false);
  const analyzePhoto = useServerFn(analyzeJobPhoto);
  const [jobMaterials, setJobMaterials] = useState<string[]>([]);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [estHours, setEstHours] = useState(2);
  const [includeParts, setIncludeParts] = useState(false);
  const [activeReviewFilter, setActiveReviewFilter] = useState<'all' | '5star' | 'recent'>('all');
  const [activeProfileTab, setActiveProfileTab] = useState<'services' | 'reviews'>('services');
  const [selectedGigCategory, setSelectedGigCategory] = useState<string>('all');

  // In-app message modal state (ZERO LEAKAGE - NO WHATSAPP)
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [inAppMessageText, setInAppMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Multi-Step Doorstep Checkout Modal State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'card' | 'escrow'>('upi');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>('');
  const [isGPSDetecting, setIsGPSDetecting] = useState(false);

  // Doorstep Service Address (Uber / Zepto style with Full Details & Live GPS)
  const [customerLocality, setCustomerLocality] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('karighar_locality') || 'Andheri West';
    }
    return 'Andheri West';
  });
  const [doorstepFlat, setDoorstepFlat] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('karighar_user_flat') || '';
    }
    return '';
  });
  const [doorstepSociety, setDoorstepSociety] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('karighar_user_society') || '';
    }
    return '';
  });
  const [doorstepLandmark, setDoorstepLandmark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('karighar_user_landmark') || '';
    }
    return '';
  });
  const [doorstepPincode, setDoorstepPincode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('karighar_user_pincode') || '400053';
    }
    return '400053';
  });
  const [doorstepGateInstructions, setDoorstepGateInstructions] = useState('');

  const { data: pro, isLoading } = useQuery(professionalQueryOptions(slug));

  // Load Saved Addresses from Account Settings
  const savedUserAddresses = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('karighar-user-addresses');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  }, [isCheckoutModalOpen]);

  // Read Pro Calendar Daily Rates & Base Day Rate
  const proCalendarRates = useMemo<Record<string, number>>(() => {
    if (!pro) return {};
    if (typeof window !== 'undefined') {
      const byId = localStorage.getItem(`karighar_pro_rates_${pro.id}`);
      if (byId) {
        try { return JSON.parse(byId); } catch {}
      }
      const bySlug = localStorage.getItem(`karighar_pro_rates_${pro.slug}`);
      if (bySlug) {
        try { return JSON.parse(bySlug); } catch {}
      }
    }
    return {};
  }, [pro?.id, pro?.slug]);

  const proBaseDayRate = useMemo<number>(() => {
    if (!pro) return 499;
    if (typeof window !== 'undefined') {
      const byId = localStorage.getItem(`karighar_pro_base_rate_${pro.id}`);
      if (byId) return Number(byId) || 499;
      const bySlug = localStorage.getItem(`karighar_pro_base_rate_${pro.slug}`);
      if (bySlug) return Number(bySlug) || 499;
    }
    return selectedService?.price || (pro as any)?.hourly_rate || 499;
  }, [pro?.id, pro?.slug, selectedService]);

  // Dynamic Day Pricing Engine
  const getDayPricing = (date: Date | null | undefined) => {
    if (!date) return { price: proBaseDayRate, label: 'Base Day Rate', isSurge: false };
    const dStr = format(date, 'yyyy-MM-dd');
    if (proCalendarRates[dStr]) {
      const p = proCalendarRates[dStr];
      return {
        price: p,
        label: p > proBaseDayRate ? 'Peak Custom Rate' : 'Special Day Rate',
        isSurge: p > proBaseDayRate,
      };
    }
    const dow = date.getDay();
    if (dow === 0 || dow === 6) {
      const surge = Math.round(proBaseDayRate * 1.15);
      return { price: surge, label: 'Weekend Surge (+15%)', isSurge: true };
    }
    return { price: proBaseDayRate, label: 'Standard Weekday', isSurge: false };
  };

  const activeDayPricing = useMemo(() => getDayPricing(jobDate), [jobDate, proBaseDayRate, proCalendarRates]);

  // Handle GPS Auto-detect
  const handleUseGPS = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('GPS geolocation is not supported by your browser');
      return;
    }
    setIsGPSDetecting(true);
    toast.loading('Acquiring precise GPS location...', { id: 'booking-gps' });

    const MUMBAI_LOCALITY_COORDS = [
      { name: 'Andheri West', lat: 19.1363, lng: 72.8277 },
      { name: 'Lokhandwala Complex', lat: 19.1438, lng: 72.8258 },
      { name: 'Versova', lat: 19.1351, lng: 72.8143 },
      { name: 'Juhu Scheme', lat: 19.1075, lng: 72.8263 },
      { name: 'Bandra West', lat: 19.0596, lng: 72.8295 },
      { name: 'Powai', lat: 19.1176, lng: 72.9060 },
      { name: 'Khar West', lat: 19.0700, lng: 72.8338 },
      { name: 'Vile Parle West', lat: 19.1022, lng: 72.8398 },
      { name: 'Goregaon West', lat: 19.1663, lng: 72.8398 },
      { name: 'Worli', lat: 19.0178, lng: 72.8178 },
      { name: 'Dadar West', lat: 19.0178, lng: 72.8478 },
      { name: 'Lower Parel', lat: 18.9953, lng: 72.8300 },
      { name: 'Chembur', lat: 19.0522, lng: 72.8994 },
      { name: 'Thane West', lat: 19.2183, lng: 72.9781 },
    ];

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGPSDetecting(false);
        const { latitude, longitude, accuracy } = pos.coords;
        let minD = Infinity;
        let closest = 'Andheri West';
        for (const loc of MUMBAI_LOCALITY_COORDS) {
          const d = Math.hypot(loc.lat - latitude, loc.lng - longitude);
          if (d < minD) {
            minD = d;
            closest = loc.name;
          }
        }
        setCustomerLocality(closest);
        if (typeof window !== 'undefined') {
          localStorage.setItem('karighar_locality', closest);
        }
        toast.success(`GPS Location Detected: ${closest}, Mumbai`, {
          id: 'booking-gps',
          description: `Accurate within ${Math.round(accuracy)}m • Area updated for technician dispatch`,
        });
      },
      (err) => {
        setIsGPSDetecting(false);
        toast.error('Could not detect GPS location', {
          id: 'booking-gps',
          description: 'Please select your Mumbai neighbourhood from the dropdown.',
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const { data: isSaved } = useQuery({
    queryKey: ['is-saved', slug, user?.id],
    queryFn: async () => {
      if (!user || !pro) return false;
      const { data } = await (supabase as any)
        .from('saved_karighars')
        .select('id')
        .eq('user_id', user.id)
        .eq('professional_id', pro.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!pro,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        toast.error('Please log in to save this Karighar');
        navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
        return;
      }
      if (!pro) return;
      if (isSaved) {
        await (supabase as any)
          .from('saved_karighars')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', pro.id);
        toast.info('Removed from saved list');
      } else {
        await (supabase as any)
          .from('saved_karighars')
          .insert({ user_id: user.id, professional_id: pro.id });
        toast.success('Saved to your shortlisted Karighars');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['is-saved', slug, user?.id] });
      qc.invalidateQueries({ queryKey: ['saved-karighars'] });
    },
  });

  const requestQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not logged in');
      if (!pro) throw new Error('Professional not found');

      const title = jobTitle || (selectedService ? selectedService.name : `Doorstep visit with ${pro.name}`);
      const summary = [
        jobDetails ? `Description: ${jobDetails}` : null,
        selectedService ? `Selected Service: ${selectedService.name} (₹${selectedService.price})` : null,
        `Preferred Slot: ${selectedTimeSlot}`,
        `Visit Day Rate: ₹${activeDayPricing.price} (${activeDayPricing.label})`,
        jobMaterials.length > 0 ? `Detected Materials: ${jobMaterials.join(', ')}` : null,
        doorstepGateInstructions ? `Gate Instructions: ${doorstepGateInstructions}` : null,
      ].filter(Boolean).join('\n');

      const fullAddress = [
        doorstepFlat ? doorstepFlat.trim() : null,
        doorstepSociety ? doorstepSociety.trim() : null,
        doorstepLandmark ? `Landmark: ${doorstepLandmark.trim()}` : null,
        `${customerLocality}, Mumbai — ${doorstepPincode}`,
      ].filter(Boolean).join(', ');

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          customer_id: user.id,
          title,
          summary,
          location: fullAddress,
          timing: jobDate ? format(jobDate, 'yyyy-MM-dd') : '',
          professional_id: pro.id,
          status: 'scheduled',
          source: 'quote',
        })
        .select('id')
        .single();

      if (projectError) throw projectError;

      const { error: quoteError } = await supabase
        .from('quotes')
        .insert({
          project_id: project.id,
          professional_id: pro.id,
          status: 'requested',
          labour: activeDayPricing.price,
          materials_cost: includeParts ? 450 : 0,
        });

      if (quoteError) throw quoteError;

      // Automatically initialize chat thread with doorstep booking pass
      try {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: (pro as any)?.user_id || null,
          project_id: project.id,
          content: `Doorstep Visit Scheduled for ${jobDate ? format(jobDate, 'd MMM yyyy') : 'selected date'} (${selectedTimeSlot}). Address: ${fullAddress}. SafePay Escrow Authorized.`,
          read: false,
        });
      } catch (msgErr) {
        console.warn('Initial booking message notice:', msgErr);
      }

      return project.id;
    },
    onSuccess: (projectId) => {
      const generatedId = `KGH-${Math.floor(10000 + Math.random() * 90000)}`;
      setConfirmedBookingId(generatedId);
      setCheckoutStep(4);
      toast.success('SafePay Escrow Authorized! Booking Confirmed', {
        description: `${pro?.name} scheduled for ${jobDate ? format(jobDate, 'd MMM yyyy') : 'selected date'}. Funds secured in escrow.`,
      });
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    },
    onError: (e: Error) => {
      if (e.message === 'Not logged in') {
        toast.error('Please log in to request a visit');
        navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
      } else {
        toast.error(e.message);
      }
    },
  });

  const handleSendInAppMessage = async () => {
    if (!user) {
      toast.error('Please log in to send a message');
      navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
      return;
    }
    if (!inAppMessageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingMessage(true);
    try {
      // 1. Create a direct inquiry project record (valid source: 'quote', status: 'requested')
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          customer_id: user.id,
          title: `Direct Inquiry with ${pro?.name}`,
          summary: inAppMessageText.trim(),
          location: `${customerLocality || 'Mumbai'}, Mumbai`,
          professional_id: pro?.id,
          status: 'requested',
          source: 'quote',
        })
        .select('id')
        .single();

      if (projectError) throw projectError;

      // 2. Insert quote request so inquiry displays in Pro's "Job Requests" tab
      if (pro?.id) {
        const { error: quoteError } = await supabase
          .from('quotes')
          .insert({
            project_id: project.id,
            professional_id: pro.id,
            status: 'requested',
          });
        if (quoteError) {
          console.warn('Inquiry quote creation notice:', quoteError.message);
        }
      }

      // 3. Insert initial message into Messages table for live thread
      const receiverUserId = (pro as any)?.user_id || null;
      const { error: messageError } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverUserId,
        project_id: project.id,
        content: inAppMessageText.trim(),
        read: false,
      });

      if (messageError) throw messageError;

      toast.success('Inquiry Transmitted!', {
        description: `${pro?.name} was notified. You can track this thread in your projects.`,
        action: {
          label: 'Open Chat',
          onClick: () => navigate({ to: '/projects/$id', params: { id: project.id } }),
        },
      });

      setIsMessageModalOpen(false);
      setInAppMessageText('');
      qc.invalidateQueries({ queryKey: ['my-projects'] });
    } catch (err: any) {
      console.error('In-app message error:', err);
      toast.error('Could not send inquiry', {
        description: err.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSelectService = (gig: ServiceGig) => {
    setSelectedService(gig);
    setJobTitle(gig.name);
    // Smooth scroll to sidebar booking card
    const aside = document.getElementById('booking-sidebar');
    if (aside) {
      aside.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-72 rounded-2xl bg-surface-subtle animate-pulse border border-border mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 rounded-2xl bg-surface-subtle animate-pulse" />
              <div className="h-64 rounded-2xl bg-surface-subtle animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl bg-surface-subtle animate-pulse" />
          </div>
        </main>
      </PageShell>
    );
  }

  if (!pro) {
    return (
      <PageShell>
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-semibold text-foreground">Karighar Profile Not Found</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            The master craftsman profile you are looking for may have moved or been updated.
          </p>
          <Button asChild className="mt-6 bg-primary text-primary-foreground font-semibold">
            <Link to="/professionals">Browse Verified Karighars</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  const tradeKey = getTradeKey(pro.trade);
  const reviewList = pro.reviews || [];
  const avgRating = reviewList.length > 0
    ? (reviewList.reduce((acc: number, r: CustomerReview) => acc + (r.rating || 5), 0) / reviewList.length).toFixed(1)
    : (pro.rating ? Number(pro.rating).toFixed(1) : null);
  const filteredReviews = reviewList.filter((r: CustomerReview) => {
    if (activeReviewFilter === '5star') return r.rating === 5;
    return true;
  });

  const availableGigCategories = useMemo(() => {
    if (!pro?.standard_gigs) return ['all'];
    const cats = new Set<string>();
    pro.standard_gigs.forEach((g: ServiceGig) => {
      if (g.category) cats.add(g.category);
    });
    return ['all', ...Array.from(cats)];
  }, [pro?.standard_gigs]);

  const displayedGigs = useMemo(() => {
    if (!pro?.standard_gigs) return [];
    if (selectedGigCategory === 'all') return pro.standard_gigs;
    return pro.standard_gigs.filter((g: ServiceGig) => g.category?.toLowerCase() === selectedGigCategory.toLowerCase());
  }, [pro?.standard_gigs, selectedGigCategory]);

  const calculatedEstimate = useMemo(() => {
    const base = selectedService ? selectedService.price : activeDayPricing.price;
    return base + (includeParts ? 450 : 0);
  }, [selectedService, activeDayPricing.price, includeParts]);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pb-32">

        {/* ─── Breadcrumb & Top Bar ───────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <Link
            to="/professionals"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to verified search</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied to clipboard!');
                }
              }}
              className="gap-1.5 text-xs font-semibold rounded-lg"
            >
              <Share2 className="size-3.5" />
              Share
            </Button>
            <Button
              variant={isSaved ? 'default' : 'outline'}
              size="sm"
              onClick={() => saveMutation.mutate()}
              className="gap-1.5 text-xs font-semibold rounded-lg"
            >
              <Heart className={`size-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Shortlisted' : 'Save'}
            </Button>
          </div>
        </div>

        {/* ─── Master Craftsperson Profile Header ─────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-warm-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <img
                  src={pro.image || arjunPortrait}
                  alt={pro.name}
                  className="size-24 sm:size-28 rounded-2xl object-cover border-2 border-border shadow-warm-xs"
                />
                <span className="absolute -bottom-1.5 -right-1.5 size-5 bg-emerald-500 border-2 border-card rounded-full" title="Active on Karighar today" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    {pro.name}
                  </h1>
                  <Badge variant="default" className="text-xs font-semibold">
                    Master Artisan
                  </Badge>
                  <Badge variant="success" className="text-xs">
                    <ShieldCheck className="size-3 mr-1" />
                    SafePay Escrow Protected
                  </Badge>
                </div>
                <p className="text-base font-medium text-foreground">
                  {pro.business}
                </p>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setActiveProfileTab('reviews')}
                    className="flex items-center gap-1 text-foreground font-semibold hover:underline cursor-pointer transition-colors"
                    title="Click to view verified customer reviews"
                  >
                    {avgRating ? (
                      <>
                        <Star className="size-4 fill-amber-400 text-amber-500" />
                        <span>{avgRating}</span>
                        <span className="font-normal text-muted-foreground">({reviewList.length} verified review{reviewList.length === 1 ? '' : 's'})</span>
                      </>
                    ) : (
                      <>
                        <Star className="size-4 text-amber-500" />
                        <span className="font-semibold text-foreground">New Verified Artisan</span>
                        <span className="font-normal text-muted-foreground">(0 reviews)</span>
                      </>
                    )}
                  </button>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    {pro.city || 'Mumbai, Maharashtra'}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Zap className="size-3" />
                    Available today in 45 mins
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-3 gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-border shrink-0">
              <div className="bg-surface-subtle border border-border rounded-xl p-3 text-center">
                <span className="block font-display text-lg sm:text-xl font-bold text-foreground">
                  {pro.completed_projects_count > 0 ? `${pro.completed_projects_count}+` : '0'}
                </span>
                <span className="block text-[11px] text-muted-foreground font-medium">Jobs Completed</span>
              </div>
              <div className="bg-surface-subtle border border-border rounded-xl p-3 text-center">
                <span className="block font-display text-lg sm:text-xl font-bold text-foreground">
                  {pro.experience || '10+ yrs'}
                </span>
                <span className="block text-[11px] text-muted-foreground font-medium">Field Experience</span>
              </div>
              <div className="bg-surface-subtle border border-border rounded-xl p-3 text-center">
                <span className="block font-display text-lg sm:text-xl font-bold text-success">
                  100%
                </span>
                <span className="block text-[11px] text-muted-foreground font-medium">SafePay Sign-off</span>
              </div>
            </div>
          </div>

          {/* Trust Guarantee Pills */}
          <div className="mt-6 pt-5 border-t border-border flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">Trust Badges:</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-surface-subtle border border-border px-3 py-1 rounded-full">
              <UserCheck className="size-3.5 text-primary" />
              Government ID & Aadhaar Verified
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-surface-subtle border border-border px-3 py-1 rounded-full">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Police Background Cleared
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-surface-subtle border border-border px-3 py-1 rounded-full">
              <Award className="size-3.5 text-amber-600" />
              Karighar Trade Skill Assessed
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground bg-surface-subtle border border-border px-3 py-1 rounded-full">
              <Shield className="size-3.5 text-primary" />
              ₹25,000 Property Damage Insurance
            </span>
          </div>
        </div>

        {/* ─── Profile Navigation Tabs ─────────────────────────────────── */}
        <div className="sticky top-16 z-20 mb-8 bg-background/95 backdrop-blur-md border-b border-border py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveProfileTab('services')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeProfileTab === 'services'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-warm-xs'
                  : 'bg-card border border-border text-foreground/80 hover:bg-surface-subtle'
              }`}
            >
              <Wrench className="size-4" />
              <span>Their Works & Other Services</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeProfileTab === 'services' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface-subtle text-muted-foreground'
              }`}>
                {pro.standard_gigs?.length || 0}
              </span>
            </button>

            <button
              onClick={() => setActiveProfileTab('reviews')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                activeProfileTab === 'reviews'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-warm-xs'
                  : 'bg-card border border-border text-foreground/80 hover:bg-surface-subtle'
              }`}
            >
              <Star className="size-4 fill-amber-400 text-amber-500" />
              <span>Verified Customer Reviews</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeProfileTab === 'reviews' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface-subtle text-muted-foreground'
              }`}>
                {reviewList.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── Main Two-Column Layout ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-8 items-start">

          {/* Left Column: Craft Content */}
          <div className="space-y-10">

            {activeProfileTab === 'services' ? (
              <>
                {/* 1. All Services & Standardized Gigs */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                        <Wrench className="size-5 text-primary" />
                        All Services & Gigs by {pro.name} ({displayedGigs.length})
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Standardized pricing with verified inclusions. SafePay escrow protected.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold self-start sm:self-auto">
                      Standardized Price-Book
                    </Badge>
                  </div>

                  {/* Category Filter Chips */}
                  {availableGigCategories.length > 2 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {availableGigCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedGigCategory(cat)}
                          className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                            selectedGigCategory === cat
                              ? 'bg-primary text-primary-foreground font-semibold shadow-warm-xs'
                              : 'bg-surface-subtle text-foreground/80 hover:bg-card border border-border'
                          }`}
                        >
                          {cat === 'all' ? 'All Craft Gigs' : cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gigs List */}
                  <div className="grid grid-cols-1 gap-4">
                    {displayedGigs.map((gig: ServiceGig) => {
                      const isSelected = selectedService?.id === gig.id;
                      return (
                        <div
                          key={gig.id}
                          className={`rounded-2xl border transition-all bg-card overflow-hidden ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/60 shadow-warm'
                              : 'border-border hover:border-primary/40 shadow-warm-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row">
                            {/* Photo Showcase if gig has photos */}
                            {gig.photos && gig.photos.length > 0 && (
                              <div className="sm:w-56 shrink-0 relative bg-surface-subtle">
                                <img
                                  src={gig.photos[0]}
                                  alt={gig.name}
                                  className="w-full h-44 sm:h-full object-cover"
                                />
                                {gig.photos.length > 1 && (
                                  <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                                    <Camera className="size-3" />
                                    +{gig.photos.length - 1} photos
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Gig Content */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {gig.category && (
                                      <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                                        {gig.category}
                                      </Badge>
                                    )}
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                      <ShieldCheck className="size-3 text-emerald-600" />
                                      {gig.warranty || '30-Day Guarantee'}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                      <Clock3 className="size-3" />
                                      {gig.duration}
                                    </span>
                                  </div>

                                  {isSelected && (
                                    <Badge variant="default" className="text-[10px]">
                                      Selected for Visit
                                    </Badge>
                                  )}
                                </div>

                                <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
                                  {gig.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                  {gig.description}
                                </p>

                                {/* Inclusions */}
                                <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/80">
                                  <span className="font-semibold text-muted-foreground">Includes:</span>
                                  {(gig.included || []).map((item, idx) => (
                                    <span key={idx} className="flex items-center gap-1">
                                      <Check className="size-3 text-emerald-600 shrink-0" />
                                      {item}
                                    </span>
                                  ))}
                                </div>

                                {/* Optional Addons */}
                                {gig.addons && gig.addons.length > 0 && (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="text-muted-foreground font-medium">Add-ons:</span>
                                    {gig.addons.map((addon, aIdx) => (
                                      <span
                                        key={aIdx}
                                        className="bg-surface-subtle text-foreground/80 border border-border px-2 py-0.5 rounded text-[11px]"
                                      >
                                        + {addon.name} (₹{addon.price})
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Price and CTA */}
                              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] text-muted-foreground block uppercase font-medium">Standardized Rate</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="font-display text-lg sm:text-xl font-bold text-foreground">
                                      ₹{gig.price.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/ job</span>
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  variant={isSelected ? 'default' : 'outline'}
                                  onClick={() => handleSelectService(gig)}
                                  className="text-xs font-semibold rounded-lg px-4 gap-1.5"
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle2 className="size-3.5" />
                                      Selected
                                    </>
                                  ) : (
                                    'Select for Visit'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Verified Transformation Showcase (Before & After) */}
                <section className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                        Verified Craft Transformation
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Real, inspected jobs completed by {pro.name} in Mumbai
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-semibold">
                      Field Inspected
                    </Badge>
                  </div>

                  {tradeKey === 'carpentry' ? (
                    <BeforeAfterSlider
                      beforeImage={wardrobeProject}
                      afterImage={wardrobeProject}
                      title="Marine-Ply Wardrobe & Blum Hydraulic Alignment"
                      subtitle="Pali Hill, Bandra West · Complete restoration of warped shutters with termite-proof backing"
                      trade="Carpentry & custom cabinetry"
                      location="Bandra West, Mumbai"
                      cost="₹14,200"
                      duration="2 Days"
                    />
                  ) : tradeKey === 'ac' || tradeKey === 'electrical' ? (
                    <BeforeAfterSlider
                      beforeImage={electricalProject}
                      afterImage={electricalProject}
                      title="Distribution Panel Overhaul & Surge Protection"
                      subtitle="Hiranandani Gardens, Powai · Systematic phase balancing and modular RCCB integration"
                      trade="Electrical engineering & safety"
                      location="Powai, Mumbai"
                      cost="₹4,600"
                      duration="4 Hours"
                    />
                  ) : (
                    <BeforeAfterSlider
                      beforeImage={waterTankProject}
                      afterImage={bathroomProject}
                      title="Concealed Pipe Burst & Jaquar Fixture Modernization"
                      subtitle="Lokhandwala Complex, Andheri West · Hairline joint isolation without masonry damage"
                      trade="Plumbing repair & installation"
                      location="Andheri West, Mumbai"
                      cost="₹3,850"
                      duration="4 Hours"
                    />
                  )}
                </section>

                {/* 3. Craft Portfolio & Inspected Projects Gallery */}
                {pro.portfolio && pro.portfolio.length > 0 && (
                  <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-warm-xs">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                          <Camera className="size-5 text-primary" />
                          Inspected Works & Project Portfolio
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          High-resolution photographic records of verified jobs in Mumbai
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        {pro.portfolio.length} Photos
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {pro.portfolio.map((imgUrl: string, idx: number) => (
                        <div key={idx} className="group relative overflow-hidden rounded-xl border border-border aspect-[4/3] bg-surface-subtle">
                          <img
                            src={imgUrl}
                            alt={`${pro.name} project ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                            <span className="text-white text-[11px] font-medium">Job #{idx + 1} Inspected</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 4. Craftsperson Story & Specialization */}
                <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-warm-xs">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Wrench className="size-5 text-primary" />
                    About {pro.name}
                  </h2>
                  <div className="relative">
                    <p className={`text-sm sm:text-base text-foreground/90 leading-relaxed ${bioExpanded ? '' : 'line-clamp-4'}`}>
                      {pro.bio || `${pro.name} is a seasoned master craftsman serving the ${pro.city || 'Mumbai'} area for over a decade. Specializing in precision fault diagnosis, high-durability installations, and clean customer-first execution. Equipped with modern leak detection and diagnostic gear, all work is conducted under transparent standardized price-books and backed by Karighar's SafePay escrow guarantee.`}
                    </p>
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      {bioExpanded ? 'Read less' : 'Read full craftsman bio'}
                      <ChevronRight className={`size-3 transition-transform ${bioExpanded ? '-rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* Verified Tool & Rig Checklist */}
                  <div className="mt-6 pt-5 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5 text-xs text-foreground/80">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Modern Diagnostic Rig:</strong> Pressure gauges, laser thermometers & pipe inspection camera.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-foreground/80">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Zero Dust Protocol:</strong> Uses drop cloths, silicone shoe covers & leaves workspace spotless.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-foreground/80">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Genuine Materials Only:</strong> Works with ISI / Jaquar / Anchor parts backed with genuine vendor receipts.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-foreground/80">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>SafePay Guaranteed:</strong> Funds held in escrow until you personally inspect and sign off on completion.</span>
                    </div>
                  </div>
                </section>

                {/* 5. Mumbai Service Coverage & Local Response Hub */}
                <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-warm-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="size-5 text-primary" />
                        Mumbai Coverage & Response Hub
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Operating base: <strong className="text-foreground">{pro.city || 'Andheri West, Mumbai'}</strong> (15 km response radius)
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0 self-start sm:self-auto">
                      <Clock3 className="size-3.5 text-emerald-600" />
                      30–45 min standard arrival
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs sm:text-sm text-foreground/80">
                      {pro.name} is stationed with a mobile service rig providing rapid diagnostic visits across the following verified Western & Central Mumbai localities:
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        'Andheri West', 'Lokhandwala Complex', 'Versova', 'Juhu Scheme',
                        'Vile Parle West', 'Oshiwara', 'Bandra West', 'Khar West',
                        'Santacruz West', 'Four Bungalows', 'Yari Road', 'DN Nagar'
                      ].map((locality, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-xs font-medium text-foreground bg-surface-subtle border border-border px-3 py-1 rounded-lg"
                        >
                          <MapPin className="size-3 text-primary" />
                          {locality}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-surface-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <strong className="block text-foreground">Standard Service Hours:</strong>
                        <span className="text-muted-foreground">Monday – Sunday: 8:00 AM – 8:30 PM (Emergency slots available 24/7)</span>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Transit Guarantee:</span> Call ahead 15 mins prior to doorstep arrival.
                      </div>
                    </div>
                  </div>
                </section>
              </>
            ) : (
              /* Verified Customer Reviews Section */
              <div className="space-y-8">
                {reviewList.length === 0 ? (
                  <section className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center shadow-warm-xs space-y-4">
                    <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
                      <Star className="size-8 fill-amber-400 text-amber-500" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                        No Customer Reviews Yet
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {pro.name} is a verified artisan on Karighar with identity and trade credentials verified. Genuine customer reviews will be published here once their first SafePay service dispatch is completed.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          setSelectedService(displayedGigs[0] || null);
                          setBookingStep('service');
                          setShowBookingModal(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-warm px-5 py-2.5"
                      >
                        <CalendarDays className="size-3.5 mr-1.5" />
                        Book First Service Visit
                      </Button>
                    </div>
                  </section>
                ) : (
                  <>
                    {/* Rating Overview Card */}
                    <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-warm-xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-6">
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                              {avgRating}
                            </span>
                            <div className="flex flex-col items-start">
                              <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className="size-4 fill-amber-400 text-amber-500" />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground mt-0.5">out of 5.0</span>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-2">
                            {reviewList.length} Verified Customer Rating{reviewList.length === 1 ? '' : 's'}
                          </p>
                          <Badge variant="success" className="text-[10px] mt-2">
                            <ShieldCheck className="size-3 mr-1" />
                            100% SafePay Verified Jobs
                          </Badge>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                            <span className="text-muted-foreground block">Overall Satisfaction</span>
                            <span className="font-display text-base font-bold text-foreground">{avgRating} / 5.0</span>
                          </div>
                          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                            <span className="text-muted-foreground block">Verified Completed Jobs</span>
                            <span className="font-display text-base font-bold text-foreground">{reviewList.length}</span>
                          </div>
                          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                            <span className="text-muted-foreground block">SafePay Escrow Release</span>
                            <span className="font-display text-base font-bold text-foreground">100%</span>
                          </div>
                          <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                            <span className="text-muted-foreground block">Quality Guarantee</span>
                            <span className="font-display text-base font-bold text-foreground">30 Days</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Filter and Reviews List */}
                    <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-warm-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                            <Star className="size-5 fill-amber-400 text-amber-500" />
                            Verified Reviews ({filteredReviews.length})
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Inspected ratings from Mumbai households with signed-off escrow
                          </p>
                        </div>

                        {/* Filter Chips */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={activeReviewFilter === 'all' ? 'default' : 'outline'}
                            onClick={() => setActiveReviewFilter('all')}
                            className="text-xs h-8 px-3 rounded-lg font-medium"
                          >
                            All ({reviewList.length})
                          </Button>
                          <Button
                            size="sm"
                            variant={activeReviewFilter === '5star' ? 'default' : 'outline'}
                            onClick={() => setActiveReviewFilter('5star')}
                            className="text-xs h-8 px-3 rounded-lg font-medium"
                          >
                            5 Stars Only
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-6 divide-y divide-border">
                        {filteredReviews.map((r: CustomerReview, i: number) => (
                          <div key={i} className={i === 0 ? '' : 'pt-6'}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                                  {r.initials}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm text-foreground">{r.name}</h4>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                                      Verified SafePay Job
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{r.location} · {r.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`size-3.5 ${
                                      star <= r.rating ? 'fill-amber-400 text-amber-500' : 'text-border'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="mb-2">
                              <span className="inline-block text-[11px] font-semibold text-foreground bg-surface-subtle px-2 py-0.5 rounded border border-border">
                                {r.verifiedJob}
                              </span>
                            </div>

                            <p className="text-sm text-foreground/90 leading-relaxed">
                              "{r.body}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Sticky Booking & SafePay Quote Widget (NO WHATSAPP) */}
          <aside id="booking-sidebar" className="relative">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-warm space-y-6">

              {/* Header */}
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    Book Diagnostic Visit
                  </h3>
                  <Badge variant="success" className="text-[11px]">
                    SafePay Escrow
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Arrives with diagnostic tools. No advance payment required.
                </p>
              </div>

              {/* Service Selection Summary */}
              {selectedService ? (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">Selected Service</span>
                    <span className="text-sm font-semibold text-foreground block">{selectedService.name}</span>
                  </div>
                  <button
                    onClick={() => { setSelectedService(null); setJobTitle(''); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : null}

              {/* Form Controls */}
              <div className="space-y-4">

                {/* 1. Date Picker */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Preferred Visit Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-full text-left p-3 rounded-xl border border-border bg-background hover:bg-surface-subtle transition-colors flex items-center justify-between text-sm">
                        <span className={jobDate ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {jobDate ? format(jobDate, 'EEEE, d MMMM yyyy') : 'Select visit date'}
                        </span>
                        <CalendarDays className="size-4 text-primary" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-warm" align="start">
                      <Calendar
                        mode="single"
                        selected={jobDate}
                        onSelect={setJobDate}
                        disabled={(date) => {
                          if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                          const dateStr = format(date, 'yyyy-MM-dd');
                          if (pro.scheduled_projects?.some((p: any) => p.timing === dateStr)) return true;
                          if (pro.availability?.some((a: any) => a.date === dateStr && a.status === 'blocked')) return true;
                          return false;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Day Price Tag */}
                  {jobDate && (
                    <div className="mt-2 flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-surface-subtle border border-border">
                      <span className="text-muted-foreground">Rate for {format(jobDate, 'd MMM')}:</span>
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        ₹{activeDayPricing.price}
                        <Badge variant={activeDayPricing.isSurge ? "warning" : "secondary"} className="text-[10px] py-0 px-1.5">
                          {activeDayPricing.label}
                        </Badge>
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Time Slot Selector */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Morning (9 AM – 12 PM)',
                      'Afternoon (12 PM – 4 PM)',
                      'Evening (4 PM – 8 PM)',
                      'Urgent (In 45 Mins)',
                    ].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2 rounded-lg text-xs font-medium text-left border transition-all ${
                          selectedTimeSlot === slot
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-background text-foreground/80 hover:bg-surface-subtle'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Doorstep Address & Society (Uber / Zepto style with SafePay Shield) */}
                <div className="space-y-2.5 p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" />
                      Doorstep Service Address
                    </label>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      SafePay Shield
                    </span>
                  </div>

                  {/* Locality Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Locality / Suburb
                    </label>
                    <select
                      value={customerLocality}
                      onChange={(e) => setCustomerLocality(e.target.value)}
                      className="w-full text-xs font-medium p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      {[
                        'Andheri West',
                        'Lokhandwala Complex',
                        'Versova',
                        'Juhu Scheme',
                        'Bandra West',
                        'Powai',
                        'Khar West',
                        'Vile Parle West',
                        'Goregaon West',
                        'Worli',
                      ].map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}, Mumbai
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flat / Building / Street */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Flat / Building / Wing
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 502, Wing B, Greenfield Heights"
                      value={doorstepFlat}
                      onChange={(e) => setDoorstepFlat(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Landmark & Access */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Landmark & Access Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Infinity Mall, 5th Floor with Lift"
                      value={doorstepLandmark}
                      onChange={(e) => setDoorstepLandmark(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Security & Compliance Notice */}
                  <div className="pt-1 flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
                    <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>SafePay Privacy Shield:</strong> Your full address is encrypted and transmitted directly to {pro.name} <em>only after booking confirmation and escrow security</em>.
                    </span>
                  </div>
                </div>

                {/* 4. Job Description & AI Photo Helper */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Problem Details
                    </label>
                    <label className="text-[11px] font-semibold text-primary cursor-pointer flex items-center gap-1 hover:underline">
                      <Camera className="size-3" />
                      {isAILoading ? 'Scanning...' : 'AI Photo Scan'}
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
                            const r = await analyzePhoto({ data: { image: base64 } });
                            if (!r.result) throw new Error(r.error ?? 'AI analysis failed');
                            const parsed = r.result;
                            if (parsed.title) setJobTitle(parsed.title);
                            if (parsed.description) setJobDetails(parsed.description);
                            if (parsed.materials) setJobMaterials(parsed.materials);
                            toast.success('AI successfully analyzed your photo!');
                          } catch (err) {
                            console.error(err);
                            toast.error('Photo analysis failed', {
                              description: err instanceof Error ? err.message : undefined,
                            });
                          } finally {
                            setIsAILoading(false);
                            if (e.target) e.target.value = '';
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Water dripping under bathroom sink"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary mb-2"
                  />
                  <textarea
                    placeholder="Describe specific symptoms (e.g. occurs when tap turned on, floor tiles getting wet)..."
                    value={jobDetails}
                    onChange={(e) => setJobDetails(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary resize-none h-20"
                  />
                </div>

                {/* AI Detected Parts Banner */}
                {jobMaterials.length > 0 && (
                  <div className="p-3 bg-surface-subtle border border-border rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 mb-2">
                      <Sparkles className="size-3" /> Karighar Parts Pre-Check
                    </span>
                    <div className="space-y-1.5">
                      {jobMaterials.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground/90">
                          <Check className="size-3 text-emerald-600" /> {m}
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {pro.name} carries genuine replacement seals, valves, and spares in the mobile kit.
                    </p>
                  </div>
                )}

                {/* 4. Instant Transparent Cost Calculator */}
                <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Calculator className="size-3.5 text-primary" />
                      Estimated Inspection & Labour
                    </span>
                    <span className="font-display text-base font-bold text-foreground">
                      ₹{calculatedEstimate.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {!selectedService && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Expected time on-site:</span>
                        <span className="font-medium text-foreground">{estHours} hours</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={6}
                        value={estHours}
                        onChange={(e) => setEstHours(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 bg-border rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeParts}
                      onChange={(e) => setIncludeParts(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary accent-primary size-3.5"
                    />
                    Include estimated consumable seals / tape (+₹450)
                  </label>
                </div>

              </div>

              {/* Primary Actions (ZERO LEAKAGE - NO WHATSAPP) */}
              <div className="space-y-2.5 pt-2">
                <Button
                  className="w-full py-6 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-warm transition-all active:scale-[0.99]"
                  disabled={requestQuoteMutation.isPending}
                  onClick={() => {
                    if (!user) {
                      navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
                      return;
                    }
                    setCheckoutStep(1);
                    setIsCheckoutModalOpen(true);
                  }}
                >
                  Proceed to Doorstep Checkout (₹{calculatedEstimate.toLocaleString('en-IN')})
                </Button>

                {/* On-Platform In-App Message (Zero Off-Platform Leakage) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="w-full py-5 text-sm font-semibold rounded-xl border-border bg-card hover:bg-surface-subtle text-foreground flex items-center justify-center gap-2"
                >
                  <MessageSquare className="size-4 text-primary" />
                  Message {pro.name} on Karighar
                </Button>
              </div>

              {/* SafePay Escrow Guarantee Badge */}
              <div className="pt-2 text-center space-y-1">
                <p className="text-[11px] font-semibold text-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  Karighar SafePay Escrow Protection
                </p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Zero advance payments needed. Payment is held in secure escrow and released to the artisan only after your inspection and digital sign-off.
                </p>
              </div>

            </div>
          </aside>

        </div>

        {/* ─── Mobile Sticky Bottom Action Bar ───────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-background border-t border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40 lg:hidden flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-base text-foreground">
                ₹{calculatedEstimate.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-muted-foreground">visit fee</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star className="size-3 fill-amber-400 text-amber-500" />
              <span className="font-semibold text-foreground">{avgRating ? `${avgRating} ★` : 'New Verified'}</span>
              <span>· SafePay</span>
            </div>
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold px-6 py-2.5 text-sm"
            onClick={() => {
              if (!user) {
                navigate({ to: '/auth', search: { redirect: `/professionals/${slug}` } });
                return;
              }
              setCheckoutStep(1);
              setIsCheckoutModalOpen(true);
            }}
          >
            Book Visit
          </Button>
        </div>

        {/* ─── In-App Direct Message Modal (Zero Leakage) ────────── */}
        <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl border-border bg-card">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-semibold flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                Message {pro.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                All communications and quotes are safeguarded within Karighar SafePay. Your phone number is never shared publicly.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border">
                <img
                  src={pro.image || arjunPortrait}
                  alt={pro.name}
                  className="size-12 rounded-xl object-cover border border-border"
                />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{pro.name}</h4>
                  <p className="text-xs text-muted-foreground">{pro.trade} · Usually replies in 15 mins</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">
                  Your Question or Requirement
                </label>
                <textarea
                  value={inAppMessageText}
                  onChange={(e) => setInAppMessageText(e.target.value)}
                  placeholder={`Hi ${pro.name}, I need help diagnosing a leak in Andheri West. Are you available for a visit today?`}
                  className="w-full text-sm p-3 rounded-xl border border-border bg-background outline-none focus:ring-1 focus:ring-primary resize-none h-28 placeholder:text-muted-foreground"
                />
              </div>

              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>On-Platform Protection:</strong> By chatting on Karighar, your diagnostic pricing, timeline, and dispute resolution remain fully protected under SafePay.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMessageModalOpen(false)}
                className="text-xs font-medium rounded-lg"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendInAppMessage}
                disabled={isSendingMessage || !inAppMessageText.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-lg gap-1.5"
              >
                <Send className="size-3.5" />
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Multi-Step Doorstep Checkout Modal (Urban Company / Zepto / Uber Style) ─── */}
        <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
          <DialogContent className="sm:max-w-xl rounded-2xl border-border bg-card p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Step Progress Tracker */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              {[
                { num: 1, label: 'Service & Time' },
                { num: 2, label: 'Doorstep (GPS)' },
                { num: 3, label: 'SafePay Escrow' },
                { num: 4, label: 'Confirmed Pass' },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      checkoutStep === s.num
                        ? 'bg-primary text-primary-foreground shadow-warm-xs'
                        : checkoutStep > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-surface-subtle text-muted-foreground'
                    }`}
                  >
                    {checkoutStep > s.num ? <Check className="size-3.5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      checkoutStep === s.num ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ── STEP 1: SERVICE & SCHEDULE ─────────────────────── */}
            {checkoutStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    1. Review Service & Calendar Timing
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selected professional and service details.
                  </p>
                </div>

                {/* Pro mini card */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border">
                  <img
                    src={pro.image || arjunPortrait}
                    alt={pro.name}
                    className="size-12 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-foreground">{pro.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {pro.trade} · Serving {customerLocality}, Mumbai
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-display font-bold text-sm text-foreground block">
                      ₹{activeDayPricing.price}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{activeDayPricing.label}</span>
                  </div>
                </div>

                {/* Selected Service */}
                {selectedService && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Service Chosen</span>
                        <h5 className="font-semibold text-xs text-foreground mt-0.5">{selectedService.name}</h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{selectedService.duration}</p>
                      </div>
                      <span className="font-bold text-xs text-foreground">₹{selectedService.price}</span>
                    </div>
                  </div>
                )}

                {/* Timing details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border bg-background">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Scheduled Date
                    </span>
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <CalendarDays className="size-3.5 text-primary" />
                      {jobDate ? format(jobDate, 'EEEE, d MMMM yyyy') : 'No date picked (defaults to today)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-background">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                      Arrival Slot
                    </span>
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Clock3 className="size-3.5 text-primary" />
                      {selectedTimeSlot}
                    </span>
                  </div>
                </div>

                {/* Problem details summary */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Job Notes / Symptoms
                  </label>
                  <Input
                    placeholder="e.g. Tap mixer leaking and water pressure low"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setCheckoutStep(2)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-10 gap-1.5"
                  >
                    Confirm Doorstep Location <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 2: CONFIRM DOORSTEP LOCATION (FULL ADDRESS + GPS) ── */}
            {checkoutStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    2. Confirm Doorstep Service Location
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your complete flat and society address is required so {pro.name} arrives directly at your doorstep.
                  </p>
                </div>

                {/* Live GPS Auto-Detection Button */}
                <button
                  type="button"
                  onClick={handleUseGPS}
                  disabled={isGPSDetecting}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/15 transition-all text-xs font-semibold text-primary group"
                >
                  <div className="flex items-center gap-2.5">
                    {isGPSDetecting ? (
                      <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Crosshair className="size-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    )}
                    <div className="text-left">
                      <span>{isGPSDetecting ? 'Detecting GPS coordinates...' : 'Use My Current Live Location (GPS)'}</span>
                      <span className="block text-[10px] text-primary/70 font-normal">
                        Instantly maps to your precise Mumbai building & neighbourhood
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-background text-primary border-primary/30 text-[10px]">
                    Live GPS
                  </Badge>
                </button>

                {/* Quick Select Saved Addresses from Account */}
                {savedUserAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Or Choose a Saved Address:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {savedUserAddresses.map((sa: any) => (
                        <button
                          key={sa.id}
                          type="button"
                          onClick={() => {
                            setDoorstepFlat(sa.flatNo || '');
                            setDoorstepSociety(sa.society || '');
                            setCustomerLocality(sa.locality || customerLocality);
                            setDoorstepLandmark(sa.landmark || '');
                            setDoorstepPincode(sa.pincode || '400053');
                            if (sa.gateInstructions) setDoorstepGateInstructions(sa.gateInstructions);
                            toast.success(`Loaded saved ${sa.tag} address!`);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-border bg-surface-subtle hover:border-primary/40 text-xs font-medium text-foreground transition-colors"
                        >
                          📍 {sa.tag}: {sa.flatNo?.slice(0, 24)}…
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full Address Form */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Mumbai Locality
                      </label>
                      <select
                        value={customerLocality}
                        onChange={(e) => setCustomerLocality(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                      >
                        {MUMBAI_LOCALITIES.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}, Mumbai
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Pincode
                      </label>
                      <Input
                        required
                        placeholder="e.g. 400053"
                        value={doorstepPincode}
                        onChange={(e) => setDoorstepPincode(e.target.value)}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Flat, Floor, House or Unit Number <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. Flat 402, Wing B, 4th Floor"
                      value={doorstepFlat}
                      onChange={(e) => setDoorstepFlat(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Building, Society or Gated Community
                    </label>
                    <Input
                      placeholder="e.g. Oberoi Springs, off New Link Road"
                      value={doorstepSociety}
                      onChange={(e) => setDoorstepSociety(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Nearby Landmark
                    </label>
                    <Input
                      placeholder="e.g. Opposite Starbucks, Behind Infiniti Mall"
                      value={doorstepLandmark}
                      onChange={(e) => setDoorstepLandmark(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Gate / Security Entry Instructions
                    </label>
                    <Input
                      placeholder="e.g. Ring intercom 402. Guard requires OTP. Service elevator available."
                      value={doorstepGateInstructions}
                      onChange={(e) => setDoorstepGateInstructions(e.target.value)}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                </div>

                {/* SafePay Privacy Shield Info */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    <strong>SafePay Privacy Shield Active:</strong> Your exact flat number is time-locked and only revealed to {pro.name} 30 minutes before arrival.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(1)} className="text-xs">
                    ← Back
                  </Button>
                  <Button
                    onClick={() => {
                      if (!doorstepFlat.trim()) {
                        toast.error('Please enter your flat or house number');
                        return;
                      }
                      setCheckoutStep(3);
                    }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-10 gap-1.5"
                  >
                    Proceed to SafePay Breakdown <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 3: SAFEPAY BREAKDOWN & PAYMENT MODE ───────── */}
            {checkoutStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground">
                    3. SafePay Escrow & Price Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    100% Milestone Escrow Protection. Funds are NOT given to the technician upfront.
                  </p>
                </div>

                {/* Itemized Price Table */}
                <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Transparent Price Breakdown
                  </span>
                  <div className="flex justify-between text-xs text-foreground/90">
                    <span>
                      {selectedService ? selectedService.name : 'Doorstep Inspection & Diagnostic Visit'}
                      <span className="block text-[10px] text-muted-foreground">
                        Date: {jobDate ? format(jobDate, 'd MMM yyyy') : 'Selected Date'} ({activeDayPricing.label})
                      </span>
                    </span>
                    <span className="font-semibold text-foreground">₹{activeDayPricing.price}</span>
                  </div>

                  {includeParts && (
                    <div className="flex justify-between text-xs text-foreground/90">
                      <span>Consumable Seals / Hardware Advance</span>
                      <span className="font-semibold text-foreground">₹450</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-foreground/90">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="size-3.5 text-emerald-600" />
                      SafePay Escrow Guarantee Fee
                    </span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </div>

                  <div className="h-px bg-border my-1" />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GST / Platform Taxes (18%)</span>
                    <span>₹{Math.round(((selectedService?.price || activeDayPricing.price) + (includeParts ? 450 : 0)) * 0.18)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-foreground pt-1">
                    <span>Total SafePay Escrow Deposit</span>
                    <span className="font-display text-base text-primary">
                      ₹{Math.round(
                        ((selectedService?.price || activeDayPricing.price) + (includeParts ? 450 : 0)) * 1.18
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Mode of Payment Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Select Escrow Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'upi', label: 'UPI / QR', desc: 'GPay, PhonePe, Paytm' },
                      { id: 'card', label: 'Cards & NetBanking', desc: 'All Indian Banks' },
                      { id: 'escrow', label: 'SafePay Wallet', desc: 'Instant Milestone Release' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMode(m.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          paymentMode === m.id
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-warm-xs'
                            : 'border-border bg-background text-foreground/80 hover:bg-surface-subtle'
                        }`}
                      >
                        <span className="text-xs font-bold block">{m.label}</span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SafePay Escrow Guarantee Pledge */}
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    How SafePay Protects Your Money
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Your deposit is safely held in RBI-compliant escrow. {pro.name} is NOT paid upfront. Payment is released only after the technician finishes the job and you provide your 4-digit sign-off PIN.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setCheckoutStep(2)} className="text-xs">
                    ← Back
                  </Button>
                  <Button
                    onClick={() => requestQuoteMutation.mutate()}
                    disabled={requestQuoteMutation.isPending}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl px-6 h-11 gap-2 shadow-warm"
                  >
                    <ShieldCheck className="size-4" />
                    {requestQuoteMutation.isPending
                      ? 'Securing Escrow…'
                      : `Authorize SafePay Escrow (₹${Math.round(
                          ((selectedService?.price || activeDayPricing.price) + (includeParts ? 450 : 0)) * 1.18
                        ).toLocaleString('en-IN')})`}
                  </Button>
                </div>
              </div>
            )}

            {/* ── STEP 4: CONFIRMED DOORSTEP PASS ───────────────── */}
            {checkoutStep === 4 && (
              <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95">
                <div className="size-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-warm">
                  <CheckCircle2 className="size-9" />
                </div>

                <div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs mb-2">
                    SafePay Escrow Secured • #{confirmedBookingId}
                  </Badge>
                  <h3 className="font-display text-2xl font-bold text-foreground">
                    Doorstep Visit Confirmed!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {pro.name} has accepted your booking and is assigned to your doorstep service request.
                  </p>
                </div>

                {/* Doorstep Pass Card */}
                <div className="p-5 rounded-2xl bg-surface-subtle border border-border text-left space-y-3.5 max-w-md mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Karighar Doorstep Pass
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      Verified Pro
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Technician</span>
                      <span className="font-semibold text-foreground">{pro.name}</span>
                      <span className="text-[11px] text-muted-foreground block">{pro.trade}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Arrival Window</span>
                      <span className="font-semibold text-foreground">
                        {jobDate ? format(jobDate, 'd MMM yyyy') : 'Today'}
                      </span>
                      <span className="text-[11px] text-primary font-medium block">{selectedTimeSlot}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border text-xs">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">
                      Service Address
                    </span>
                    <p className="font-medium text-foreground">
                      {doorstepFlat}, {doorstepSociety ? doorstepSociety + ', ' : ''}{customerLocality}, Mumbai — {doorstepPincode}
                    </p>
                  </div>

                  {/* 4-Digit Release PIN */}
                  <div className="p-3 rounded-xl bg-background border border-primary/25 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Milestone Completion PIN
                      </span>
                      <span className="text-[11px] text-muted-foreground">Give to pro ONLY after satisfactory finish</span>
                    </div>
                    <div className="font-mono text-lg font-bold tracking-widest text-primary px-3 py-1 bg-primary/10 rounded-lg">
                      4 8 2 1
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCheckoutModalOpen(false);
                      navigate({ to: '/my-projects' });
                    }}
                    className="text-xs font-semibold rounded-xl h-10 px-6"
                  >
                    View in My Projects
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl h-10 px-6"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </main>
    </PageShell>
  );
}
