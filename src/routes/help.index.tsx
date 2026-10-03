import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronRight, MessageCircleQuestion, LifeBuoy } from 'lucide-react';
import { HELP_ARTICLES, HELP_CATEGORIES } from '@/lib/help-data';
import { useState } from 'react';

export const Route = createFileRoute('/help/')({
  component: HelpCenterHome
});

function HelpCenterHome() {
  const [query, setQuery] = useState('');

  const filteredArticles = query
    ? HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.excerpt.toLowerCase().includes(query.toLowerCase()))
    : HELP_ARTICLES.slice(0, 4);

  return (
    <PageShell>
      <main className="min-h-screen bg-muted/10 pb-20">
        {/* Hero */}
        <div className="bg-primary px-5 py-20 text-center text-primary-foreground">
          <h1 className="font-display text-4xl font-bold md:text-5xl">How can we help?</h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-lg mx-auto">
            Search for guides, rules, and workflows to get the most out of Karighar.
          </p>
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input 
              placeholder="Search for 'SafePay' or 'Bidding'..." 
              className="h-14 pl-12 rounded-full bg-background text-foreground text-lg shadow-xl border-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 mt-12">
          {query ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Search Results</h2>
              {filteredArticles.length === 0 ? (
                <p className="text-muted-foreground">No articles found for "{query}"</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredArticles.map(article => (
                    <Link key={article.id} to="/help/$articleId" params={{ articleId: article.id }} className="block bg-card rounded-xl p-5 border border-border hover:border-primary/50 hover:shadow-md transition-all">
                      <h3 className="font-bold text-lg">{article.title}</h3>
                      <p className="text-muted-foreground mt-1 text-sm">{article.excerpt}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                {HELP_CATEGORIES.map(cat => (
                  <div key={cat.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors cursor-pointer">
                    <h3 className="font-bold text-lg">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Popular Articles */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display">Popular Guides</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {filteredArticles.map(article => (
                  <Link key={article.id} to="/help/$articleId" params={{ articleId: article.id }} className="group block bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{article.title}</h3>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{article.excerpt}</p>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Workflows / Contact Support */}
              <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">Need human help?</h2>
                  <p className="text-blue-700 mt-2 max-w-md">Can't find what you're looking for? Report an issue with a project, dispute a payment, or ask a question.</p>
                </div>
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"><Link to="/help/contact"><MessageCircleQuestion className="mr-2 size-5"/> Open a Ticket</Link></Button>
                  <Button variant="outline" size="lg" className="rounded-full bg-white"><LifeBuoy className="mr-2 size-5 text-red-500" /> Dispute a Charge</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </PageShell>
  );
}
