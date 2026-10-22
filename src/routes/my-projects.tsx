import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { CalendarDays, MapPin, ChevronRight, FolderOpen, Plus } from 'lucide-react';

export const Route = createFileRoute('/my-projects')({
  head: () => ({ meta: [{ title: 'My Projects — Karighar' }] }),
  component: MyProjectsPage,
});

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "info" | "outline" }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  requested: { label: 'Awaiting quotes', variant: 'info' },
  requesting_quotes: { label: 'Awaiting quotes', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'warning' },
  in_progress: { label: 'In progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

function MyProjectsPage() {
  const { user, loading } = useAuth();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['my-projects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, professionals(name, trade, city, slug)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <PageShell>
        <main className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
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
          <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to view your projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">Keep track of quotes, scheduled dates, and messages.</p>
          <Button asChild className="mt-6 rounded-xl px-6" size="lg">
            <Link to="/auth" search={{ redirect: '/my-projects' }}>Sign in</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground">My Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track and manage your home repair requests.</p>
          </div>
          <Button asChild className="rounded-xl gap-1.5 shadow-warm-xs" size="default">
            <Link to="/professionals">
              <Plus className="size-4" strokeWidth={2} />
              New project
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="mt-16 text-center rounded-2xl border border-dashed border-border bg-surface-subtle p-12">
            <FolderOpen className="mx-auto mb-4 size-12 text-muted-foreground/60" strokeWidth={1.5} />
            <h2 className="font-display text-xl font-semibold text-foreground">No projects yet</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Start by describing what your home needs, or find a trusted professional in Mumbai.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button asChild className="rounded-xl">
                <Link to="/professionals">Browse Karighars</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/">Ask Karighar AI</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {projects.map((project: any) => {
              const badgeConfig = STATUS_BADGES[project.status as keyof typeof STATUS_BADGES] ?? STATUS_BADGES.draft;
              return (
                <Link
                  key={project.id}
                  to="/projects/$id"
                  params={{ id: project.id }}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-warm-xs transition-all hover:border-primary/40 hover:shadow-warm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <Badge variant={badgeConfig.variant} className="shrink-0 text-[11px]">
                        {badgeConfig.label}
                      </Badge>
                    </div>
                    {project.summary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {project.summary}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {project.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-muted-foreground/70" strokeWidth={1.5} />
                          {project.location}
                        </span>
                      )}
                      {project.timing && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-muted-foreground/70" strokeWidth={1.5} />
                          {project.timing}
                        </span>
                      )}
                      {project.professionals?.name && (
                        <span>
                          Karighar: <strong className="text-foreground font-medium">{project.professionals.name}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-0.5" strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
}
