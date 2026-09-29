import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/karighar-api';
import { CalendarDays, MapPin, ChevronRight, FolderOpen } from 'lucide-react';

export const Route = createFileRoute('/my-projects')({ component: MyProjectsPage });

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  requesting_quotes: { label: 'Awaiting quotes', color: 'bg-blue-100 text-blue-700' },
  scheduled: { label: 'Scheduled', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'In progress', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
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
        <main className="mx-auto max-w-4xl px-5 py-20">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}
          </div>
        </main>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="mx-auto max-w-md px-5 py-20 text-center">
          <h1 className="text-2xl font-bold">Sign in to view your projects</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/auth" search={{ redirect: '/my-projects' }}>Sign in</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">My Projects</h1>
            <p className="mt-1 text-muted-foreground">Track all your Karighar projects in one place</p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/professionals">+ New project</Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="mt-20 text-center">
            <FolderOpen className="mx-auto mb-4 size-16 text-muted-foreground/40" />
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="mt-2 text-muted-foreground">Start by finding a Karighar or describing what you need.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="rounded-full"><Link to="/professionals">Browse Karighars</Link></Button>
              <Button asChild variant="outline" className="rounded-full"><Link to="/">Ask Karighar</Link></Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {projects.map((project: any) => {
              const status = STATUS_LABELS[project.status as keyof typeof STATUS_LABELS] ?? STATUS_LABELS.draft;
              return (
                <Link
                  key={project.id}
                  to="/projects/$id"
                  params={{ id: project.id }}
                  className="flex items-center gap-5 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold truncate">{project.title}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                    {project.summary && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{project.summary}</p>}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {project.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {project.location}</span>}
                      {project.timing && <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {project.timing}</span>}
                      {project.professionals?.name && <span>Karighar: <strong>{project.professionals.name}</strong></span>}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </PageShell>
  );
}
