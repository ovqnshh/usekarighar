import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, inr } from '@/lib/karighar-api';
import {
  CalendarDays, MapPin, ChevronRight, FolderOpen, Plus,
  MessageSquare, ShieldCheck, Clock, CheckCircle2, Phone,
  ArrowRight, ArrowUpRight, Receipt, AlertCircle, Wrench
} from 'lucide-react';
import { KarigharChatPanel, type ChatThread } from '@/components/karighar-chat-panel';
import { toast } from 'sonner';

export const Route = createFileRoute('/my-projects')({
  head: () => ({ meta: [{ title: 'My Bookings & Inquiries — Karighar' }] }),
  component: MyProjectsPage,
});

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "outline" }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  requested: { label: 'Awaiting Quote', variant: 'info' },
  requesting_quotes: { label: 'Awaiting Quotes', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

function MyProjectsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'visits' | 'messages' | 'quotes'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const t = p.get('tab');
      if (t === 'messages' || t === 'quotes') return t;
    }
    return 'visits';
  });

  const [activeChatProjectId, setActiveChatProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('project') || null;
    }
    return null;
  });

  // 1. Fetch Customer Projects / Bookings
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['my-projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, professionals(id, name, trade, city, slug, user_id)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // 2. Fetch Customer Messages for all threads
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['my-customer-messages', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*, projects(id, title, location, customer_id, professional_id, professionals(name, trade, city, user_id))')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('Customer messages query notice:', error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 3000,
  });

  // 3. Fetch Quotes received across all projects
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['my-customer-quotes', user?.id, projects.length],
    queryFn: async () => {
      if (!user || projects.length === 0) return [];
      const projectIds = projects.map((p: any) => p.id);
      const { data, error } = await supabase
        .from('quotes')
        .select('*, projects(*), professionals(*)')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    enabled: !!user && projects.length > 0,
  });

  // Real-time subscription for customer messages & quotes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`customer-live-stream-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ['my-customer-messages', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotes' }, () => {
        qc.invalidateQueries({ queryKey: ['my-customer-quotes', user.id] });
        qc.invalidateQueries({ queryKey: ['my-projects', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  // Construct unified conversation threads for the customer
  const chatThreads: ChatThread[] = useMemo(() => {
    const threadMap = new Map<string, ChatThread>();

    // Seed threads from projects that have assigned professionals
    projects.forEach((p: any) => {
      threadMap.set(p.id, {
        projectId: p.id,
        title: p.title || 'Diagnostic Request',
        location: p.location || 'Mumbai',
        otherPartyName: p.professionals?.name || 'Verified Karighar',
        otherPartyRole: p.professionals?.trade ? `${p.professionals.trade} Specialist` : 'Master Artisan',
        otherPartyId: p.professionals?.user_id,
        messages: [],
        unread: false,
        status: p.status,
      });
    });

    // Populate messages into threads
    messages.forEach((msg: any) => {
      if (!msg.project_id) return;

      if (!threadMap.has(msg.project_id)) {
        threadMap.set(msg.project_id, {
          projectId: msg.project_id,
          title: msg.projects?.title || 'Direct Inquiry',
          location: msg.projects?.location || 'Mumbai',
          otherPartyName: msg.projects?.professionals?.name || 'Assigned Karighar',
          otherPartyRole: msg.projects?.professionals?.trade || 'Master Artisan',
          otherPartyId: msg.projects?.professionals?.user_id || (msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id),
          messages: [],
          unread: false,
          status: msg.projects?.status,
        });
      }

      const thread = threadMap.get(msg.project_id)!;
      thread.messages.push(msg);
      thread.lastMessage = msg;
      if (msg.receiver_id === user?.id && !msg.read) {
        thread.unread = true;
      }
    });

    return Array.from(threadMap.values()).sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [projects, messages, user?.id]);

  const handleSendMessage = async (projectId: string, content: string, receiverId?: string | null) => {
    if (!user) return;
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId || null,
      project_id: projectId,
      content,
      read: false,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['my-customer-messages', user.id] });
  };

  const handleAcceptQuote = async (quoteId: string) => {
    const { error } = await supabase.rpc('accept_quote', { _quote_id: quoteId });
    if (error) {
      // Fallback update
      const { error: updErr } = await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId);
      if (updErr) return toast.error('Failed to accept quote: ' + updErr.message);
    }
    toast.success('Quote Accepted! SafePay Escrow Authorized', {
      description: 'Funds are securely locked in trust. Your Karighar has been notified to proceed.',
    });
    qc.invalidateQueries({ queryKey: ['my-customer-quotes', user?.id] });
    qc.invalidateQueries({ queryKey: ['my-projects', user?.id] });
  };

  if (loading || projectsLoading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48 mb-6" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl w-full" />
            ))}
          </div>
        </main>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="mx-auto max-w-md px-5 py-24 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-surface-subtle">
            <FolderOpen className="size-7 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to view your bookings & messages</h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep track of diagnostic visits, direct chats with Karighars, and SafePay escrow.</p>
          <Button asChild className="mt-6 rounded-xl px-6" size="lg">
            <Link to="/auth" search={{ redirect: '/my-projects' }}>Sign in</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                My Bookings & Inquiries
              </h1>
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30">
                SafePay Protected
              </Badge>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Track doorstep visits, chat directly with verified Karighars, and monitor quotes & escrow milestones.
            </p>
          </div>
          <Button asChild className="rounded-xl gap-1.5 shadow-warm text-xs font-semibold shrink-0" size="sm">
            <Link to="/professionals">
              <Plus className="size-4" strokeWidth={2} />
              Book New Karighar
            </Link>
          </Button>
        </div>

        {/* 3 Unified Tabs (Clean Pill Dock) */}
        <div className="pt-6 pb-6">
          <div className="inline-flex items-center p-1 rounded-full bg-surface-subtle border border-border shadow-warm-xs gap-1">
            <button
              onClick={() => setActiveTab('visits')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'visits'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="size-3.5" />
              <span>Bookings & Visits</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-subtle border border-border font-bold">
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'messages'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="size-3.5" />
              <span>Messages & Inquiries</span>
              {chatThreads.some((t) => t.unread) && (
                <span className="size-2 rounded-full bg-primary animate-pulse" />
              )}
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-subtle border border-border font-bold">
                {chatThreads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'quotes'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Quotes & Escrow</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-subtle border border-border font-bold">
                {quotes.length}
              </span>
            </button>
          </div>
        </div>

        {/* ─── TAB 1: BOOKINGS & VISITS ─────────────────────────────── */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center rounded-2xl border border-dashed border-border bg-card p-12 space-y-4 shadow-warm-xs">
                <div className="size-14 rounded-2xl bg-surface-subtle text-primary mx-auto flex items-center justify-center">
                  <FolderOpen className="size-7" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-semibold text-foreground">No active bookings yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Search trusted plumbers, carpenters, or electricians in Mumbai and book a precision diagnostic visit.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button asChild size="sm" className="rounded-xl text-xs font-semibold">
                    <Link to="/professionals">Browse Karighars</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                    <Link to="/">Ask Karighar AI</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3.5">
                {projects.map((project: any) => {
                  const badgeConfig = STATUS_BADGES[project.status as keyof typeof STATUS_BADGES] ?? STATUS_BADGES.draft;
                  return (
                    <div
                      key={project.id}
                      className="group rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-warm-xs transition-all hover:border-primary/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Badge variant={badgeConfig.variant} className="text-[11px] font-semibold">
                            {badgeConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="size-3" />
                            Booked {new Date(project.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          {project.professionals && (
                            <span className="text-xs font-semibold text-foreground bg-surface-subtle px-2 py-0.5 rounded-md border border-border">
                              Karighar: {project.professionals.name} ({project.professionals.trade})
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
                          {project.title}
                        </h3>

                        {project.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {project.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                          {project.location && (
                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                              <MapPin className="size-3.5 text-primary shrink-0" />
                              <span className="truncate max-w-md">{project.location}</span>
                            </span>
                          )}
                          {project.timing && (
                            <span className="flex items-center gap-1.5">
                              <CalendarDays className="size-3.5 text-muted-foreground/70 shrink-0" />
                              <span>{project.timing}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border w-full md:w-auto justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveChatProjectId(project.id);
                            setActiveTab('messages');
                          }}
                          className="text-xs h-8 gap-1 text-primary border-primary/30 hover:bg-primary/5"
                        >
                          <MessageSquare className="size-3.5" />
                          <span>Chat with Karighar</span>
                        </Button>

                        <Button asChild size="sm" className="text-xs h-8 gap-1 bg-primary text-primary-foreground font-semibold">
                          <Link to="/projects/$id" params={{ id: project.id }}>
                            <span>Track & SafePay</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MESSAGES & INQUIRIES (LIVELY CHAT SYSTEM) ─────── */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <KarigharChatPanel
              threads={chatThreads}
              activeProjectId={activeChatProjectId || (chatThreads[0]?.projectId ?? null)}
              onSelectThread={setActiveChatProjectId}
              currentUserId={user?.id}
              isPro={false}
              onSendMessage={handleSendMessage}
              emptyPlaceholder="No active conversations yet"
            />
          </div>
        )}

        {/* ─── TAB 3: QUOTES & ESCROW ───────────────────────────────── */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            {quotes.length === 0 ? (
              <div className="text-center rounded-2xl border border-dashed border-border bg-card p-12 space-y-3 shadow-warm-xs">
                <ShieldCheck className="size-12 text-muted-foreground mx-auto" />
                <h3 className="font-display text-lg font-semibold text-foreground">No quotes awaiting approval</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When a Karighar inspects your project request, their itemized estimate will appear here under 100% SafePay Escrow protection.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {quotes.map((q: any) => {
                  const isAccepted = q.status === 'accepted';
                  const total = q.total || (q.labour + q.materials_cost + q.transport + (q.platform_fee || 0) + (q.tax || 0));

                  return (
                    <div
                      key={q.id}
                      className={`rounded-2xl border bg-card p-6 shadow-warm-xs flex flex-col justify-between space-y-4 ${
                        isAccepted ? 'border-emerald-500/50 bg-emerald-500/[0.02]' : 'border-border'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={isAccepted ? 'success' : 'default'} className="text-[10px] font-semibold uppercase">
                            {isAccepted ? 'SafePay Escrow Active' : 'Awaiting Your Approval'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-display font-semibold text-base text-foreground">
                            {q.projects?.title || 'Diagnostic Visit'}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Karighar: <strong className="text-foreground">{q.professionals?.name}</strong> ({q.professionals?.trade})
                          </p>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-surface-subtle p-3.5 rounded-xl border border-border space-y-1.5 text-xs">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Artisan Labour:</span>
                            <span className="font-medium text-foreground">{inr(q.labour)}</span>
                          </div>
                          {q.materials_cost > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Spares & Replacement Parts:</span>
                              <span className="font-medium text-foreground">{inr(q.materials_cost)}</span>
                            </div>
                          )}
                          {q.transport > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Diagnostic Travel:</span>
                              <span className="font-medium text-foreground">{inr(q.transport)}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm">
                            <span className="text-foreground">Total In Escrow:</span>
                            <span className="text-primary">{inr(total)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <ShieldCheck className="size-3.5 text-emerald-600" />
                          <span>Protected by 30-Day SafePay Workmanship Guarantee</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveChatProjectId(q.project_id);
                            setActiveTab('messages');
                          }}
                          className="flex-1 text-xs h-9"
                        >
                          <MessageSquare className="size-3.5 mr-1" />
                          <span>Chat</span>
                        </Button>

                        {!isAccepted ? (
                          <Button
                            size="sm"
                            onClick={() => handleAcceptQuote(q.id)}
                            className="flex-1 text-xs h-9 bg-primary text-primary-foreground font-semibold shadow-warm"
                          >
                            <span>Accept & Secure</span>
                            <ArrowRight className="size-3.5 ml-1" />
                          </Button>
                        ) : (
                          <Button asChild size="sm" variant="outline" className="flex-1 text-xs h-9">
                            <Link to="/projects/$id" params={{ id: q.project_id }}>
                              <span>Track Project</span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </PageShell>
  );
}
