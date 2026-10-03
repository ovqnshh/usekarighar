import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
import { HELP_ARTICLES } from '@/lib/help-data';
import { toast } from 'sonner';

export const Route = createFileRoute('/help/$articleId')({
  loader: ({ params }) => {
    const article = HELP_ARTICLES.find(a => a.id === params.articleId);
    if (!article) throw notFound();
    return { article };
  },
  component: HelpArticlePage
});

function HelpArticlePage() {
  const { article } = Route.useLoaderData();

  return (
    <PageShell>
      <main className="min-h-screen bg-muted/10 pb-20">
        <div className="max-w-3xl mx-auto px-5 pt-10">
          <Button asChild variant="ghost" className="mb-8 -ml-4 text-muted-foreground hover:text-foreground">
            <Link to="/help"><ArrowLeft className="mr-2 size-4" /> Back to Help Center</Link>
          </Button>

          <div className="bg-card rounded-2xl p-8 md:p-12 border border-border shadow-sm">
            <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              {article.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{article.title}</h1>
            <p className="text-lg text-muted-foreground mb-10 pb-10 border-b border-border">
              {article.excerpt}
            </p>

            <div className="prose prose-zinc max-w-none">
              {article.content.map((paragraph, i) => {
                // Extremely simple markdown-like parsing for bold text
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return <h3 key={i} className="text-xl font-bold mt-8 mb-4 text-foreground">{paragraph.replace(/\*\*/g, '')}</h3>;
                }
                return <p key={i} className="mb-4 leading-relaxed text-foreground/90">{paragraph}</p>;
              })}
            </div>

            <div className="mt-16 pt-8 border-t border-border flex flex-col items-center">
              <p className="font-semibold mb-4 text-muted-foreground">Was this article helpful?</p>
              <div className="flex gap-4">
                <Button variant="outline" size="lg" className="rounded-full" onClick={() => toast.success("Thanks for your feedback!")}>
                  <ThumbsUp className="mr-2 size-5 text-green-600" /> Yes
                </Button>
                <Button variant="outline" size="lg" className="rounded-full" onClick={() => toast.success("We'll work on improving this.")}>
                  <ThumbsDown className="mr-2 size-5 text-red-500" /> No
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
