import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, MessageCircleQuestion, ShieldCheck } from 'lucide-react';
import { HELP_ARTICLES, HELP_CATEGORIES } from '@/lib/help-data';
import { useState } from 'react';

export const Route = createFileRoute('/help/')({
  head: () => ({ meta: [{ title: 'Help Centre — Karighar' }] }),
  component: HelpCenterHome,
});

function HelpCenterHome() {
  const [query, setQuery] = useState('');

  const filteredArticles = query
    ? HELP_ARTICLES.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.excerpt.toLowerCase().includes(query.toLowerCase())
      )
    : HELP_ARTICLES.slice(0, 4);

  return (
    <PageShell>
      <main className="min-h-screen pb-24">
        {/* Editorial Hero */}
        <div className="bg-surface-subtle border-b border-border py-16 px-5 text-center">
          <Badge variant="default" className="mb-4">Karighar Support</Badge>
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-foreground">
            How can we help?
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Search for guides on quotes, SafePay escrow, bookings, and customer protection.
          </p>

          <div className="mt-8 max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Search guides (e.g. 'SafePay', 'Warranty')…"
              className="h-12 pl-11 pr-4 rounded-xl bg-background text-sm shadow-warm-xs border-border"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-5 mt-12">
          {query ? (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4 text-foreground">
                Search Results ({filteredArticles.length})
              </h2>
              {filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center text-muted-foreground text-sm">
                  No articles found for "{query}". Try another search term or contact our support team.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredArticles.map(article => (
                    <Link
                      key={article.id}
                      to="/help/$articleId"
                      params={{ articleId: article.id }}
                      className="group block bg-card rounded-xl p-5 border border-border shadow-warm-xs hover:border-primary/40 hover:shadow-warm transition-all"
                    >
                      <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{article.excerpt}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
                {HELP_CATEGORIES.map(cat => (
                  <div
                    key={cat.id}
                    className="bg-card rounded-xl p-5 border border-border shadow-warm-xs hover:border-primary/40 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold text-foreground text-base">{cat.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Popular Guides */}
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground">Popular Guides</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredArticles.map(article => (
                  <Link
                    key={article.id}
                    to="/help/$articleId"
                    params={{ articleId: article.id }}
                    className="group block bg-card rounded-xl p-5 border border-border shadow-warm-xs hover:border-primary/40 hover:shadow-warm transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{article.excerpt}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-0.5 mt-0.5" strokeWidth={1.5} />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Contact Support Banner */}
              <div className="mt-14 rounded-2xl border border-border bg-surface-subtle p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Need personal assistance?</h2>
                  <p className="text-muted-foreground mt-1 text-sm max-w-md leading-relaxed">
                    Have an issue with an ongoing project, payment milestone, or schedule conflict? Our Mumbai team is here to help.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
                  <Button asChild size="default" className="rounded-xl shadow-warm-xs">
                    <Link to="/help/contact">
                      <MessageCircleQuestion className="mr-1.5 size-4" strokeWidth={1.5} />
                      Contact Support
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    className="rounded-xl"
                    asChild
                  >
                    <Link to="/help/contact">
                      <ShieldCheck className="mr-1.5 size-4 text-primary" strokeWidth={1.5} />
                      Dispute Resolution
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}
