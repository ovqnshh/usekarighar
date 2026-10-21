import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { HELP_ARTICLES } from '@/lib/help-data';
import { toast } from 'sonner';

export const Route = createFileRoute('/help/$articleId')({
  loader: ({ params }) => {
    const article = HELP_ARTICLES.find(a => a.id === params.articleId);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.article?.title || 'Help'} — Karighar` }]
  }),
  component: HelpArticlePage
});

function HelpArticlePage() {
  const { article } = Route.useLoaderData();

  return (
    <PageShell>
      <main className="min-h-screen pb-24">
        <div className="max-w-3xl mx-auto px-5 pt-10">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
            <Link to="/help">
              <ArrowLeft className="mr-1.5 size-4" strokeWidth={1.5} />
              Back to Help Centre
            </Link>
          </Button>

          <article className="bg-card rounded-2xl p-6 sm:p-10 border border-border shadow-warm-xs">
            <Badge variant="default" className="mb-4">
              {article.category}
            </Badge>

            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-foreground mb-3 leading-tight">
              {article.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-8 pb-6 border-b border-border leading-relaxed">
              {article.excerpt}
            </p>

            <div className="space-y-4 text-sm text-foreground/90 leading-relaxed">
              {article.content.map((paragraph, i) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={i} className="font-display text-lg font-semibold text-foreground pt-4 pb-1">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                return <p key={i}>{paragraph}</p>;
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-border flex flex-col items-center text-center">
              <p className="text-xs font-medium text-muted-foreground mb-3">Was this article helpful?</p>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => toast.success("Thank you for your feedback!")}
                >
                  <ThumbsUp className="size-3.5 text-success" strokeWidth={1.5} />
                  Yes, helpful
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                  onClick={() => toast.success("We'll work on making this clearer.")}
                >
                  <ThumbsDown className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
                  Not really
                </Button>
              </div>
            </div>
          </article>
        </div>
      </main>
    </PageShell>
  );
}
