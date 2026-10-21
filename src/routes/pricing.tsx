import { createFileRoute } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ShieldCheck, Sparkles, Users, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: 'Transparent Pricing & Plans — Karighar' },
      { name: 'description', content: 'Explore honest, upfront pricing for homeowners and verified professionals. No hidden fees or surprise markups.' },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const [view, setView] = useState<'customer' | 'professional'>('customer');

  return (
    <PageShell>
      <main className="min-h-screen pb-24">
        {/* Editorial Header */}
        <div className="bg-surface-subtle border-b border-border py-16 px-5 text-center">
          <Badge variant="default" className="mb-4">Transparent Pricing</Badge>
          <h1 className="text-3xl md:text-5xl font-display font-semibold text-foreground">
            Simple, honest plans for everyone
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Zero hidden markups. Whether you are maintaining your family home or growing your local trade business.
          </p>

          {/* Segmented Switcher */}
          <div className="mt-8 inline-flex rounded-xl border border-border bg-card p-1 shadow-warm-xs">
            <button
              onClick={() => setView('customer')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === 'customer'
                  ? 'bg-primary text-primary-foreground shadow-warm-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Homeowners
            </button>
            <button
              onClick={() => setView('professional')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                view === 'professional'
                  ? 'bg-primary text-primary-foreground shadow-warm-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              For Professionals
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto px-5 -mt-8">
          {view === 'customer' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Standard Plan */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-warm-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground">Standard Pay-As-You-Go</h2>
                  <p className="text-sm text-muted-foreground mt-1">Free account with zero recurring fees.</p>
                  <div className="my-6">
                    <span className="text-4xl font-display font-semibold text-foreground">₹0</span>
                    <span className="text-sm text-muted-foreground"> / month</span>
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl mb-6 font-medium" disabled>
                    Active Default
                  </Button>
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Access to all verified Karighars
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      SafePay Escrow protection
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Standard 30-day workmanship warranty
                    </li>
                    <li className="flex items-start gap-3 text-foreground/90 pt-1">
                      <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5 text-[10px] font-bold">
                        %
                      </span>
                      <span>
                        <strong className="font-semibold text-foreground">Standard 15% booking fee</strong> included in all-in price
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Plus Plan */}
              <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-warm flex flex-col justify-between relative">
                <div className="absolute -top-3 right-6">
                  <Badge variant="default" className="px-3 py-1 text-[11px] shadow-warm-xs">
                    Recommended
                  </Badge>
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                    Karighar Plus
                    <Sparkles className="size-4 text-primary" strokeWidth={1.5} />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">For homeowners who want priority care.</p>
                  <div className="my-6">
                    <span className="text-4xl font-display font-semibold text-foreground">₹499</span>
                    <span className="text-sm text-muted-foreground"> / month</span>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl mb-6 font-semibold shadow-warm-xs"
                    onClick={() => toast.success("Redirecting to payment gateway...")}
                  >
                    Upgrade to Plus
                  </Button>
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-center gap-3 text-foreground font-semibold">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      0% booking fee on all jobs
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Priority emergency dispatch
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Extended 60-day rework warranty
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Free 1× annual AC maintenance checkup
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Standard Pro */}
              <div className="bg-card rounded-2xl p-8 border border-border shadow-warm-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground">Solo Pro Partner</h2>
                  <p className="text-sm text-muted-foreground mt-1">For independent verified tradespeople.</p>
                  <div className="my-6">
                    <span className="text-4xl font-display font-semibold text-foreground">₹0</span>
                    <span className="text-sm text-muted-foreground"> / month</span>
                  </div>
                  <Button variant="outline" className="w-full h-11 rounded-xl mb-6 font-medium" disabled>
                    Current Plan
                  </Button>
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Receive matched jobs in your neighborhood
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      SafePay guaranteed payouts next business day
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Standard profile with verified customer reviews
                    </li>
                    <li className="flex items-center gap-3 text-foreground/90">
                      <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-primary shrink-0 text-[10px] font-bold">
                        %
                      </span>
                      <span>Configurable 12–15% platform commission</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Agency Pro */}
              <div className="bg-card rounded-2xl p-8 border-2 border-primary shadow-warm flex flex-col justify-between relative">
                <div className="absolute -top-3 right-6">
                  <Badge variant="default" className="px-3 py-1 text-[11px] shadow-warm-xs">
                    Growing Teams
                  </Badge>
                </div>
                <div>
                  <h2 className="text-xl font-display font-semibold text-foreground flex items-center gap-2">
                    Karighar Agency
                    <Users className="size-4 text-primary" strokeWidth={1.5} />
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Dispatch verified team helpers under your store.</p>
                  <div className="my-6">
                    <span className="text-4xl font-display font-semibold text-foreground">₹999</span>
                    <span className="text-sm text-muted-foreground"> / month</span>
                  </div>
                  <Button
                    className="w-full h-11 rounded-xl mb-6 font-semibold shadow-warm-xs"
                    onClick={() => toast.success("Redirecting to Agency onboarding...")}
                  >
                    Upgrade to Agency
                  </Button>
                  <ul className="space-y-3.5 text-sm">
                    <li className="flex items-center gap-3 text-foreground font-semibold">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Lower 8% commission on crew projects
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Dispatch up to 5 verified helpers
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      Featured storefront with customer priority badge
                    </li>
                    <li className="flex items-center gap-3 text-foreground">
                      <Check className="text-success size-4 shrink-0" strokeWidth={2} />
                      AI Scope & Price-Book Assistant
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
