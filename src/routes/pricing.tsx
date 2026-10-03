import { createFileRoute, Link } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Check, Star, Users, Zap, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/pricing')({
  component: PricingPage
});

function PricingPage() {
  const [view, setView] = useState<'customer' | 'professional'>('customer');

  return (
    <PageShell>
      <main className="min-h-screen pb-20">
        <div className="bg-muted/30 pt-20 pb-32 px-5 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Karighar Prime</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Upgrade your experience. Choose the plan that fits how you use Karighar.
          </p>
          
          <div className="mt-10 inline-flex bg-card p-1 rounded-full border border-border shadow-sm">
            <button 
              onClick={() => setView('customer')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all ${view === 'customer' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              For Homeowners
            </button>
            <button 
              onClick={() => setView('professional')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all ${view === 'professional' ? 'bg-blue-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              For Professionals
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-5 -mt-16">
          {view === 'customer' ? (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h2 className="text-2xl font-bold">Basic</h2>
                <p className="text-muted-foreground mt-2">Pay as you go for standard jobs.</p>
                <div className="my-6">
                  <span className="text-4xl font-black">₹0</span><span className="text-muted-foreground">/mo</span>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl mb-8" disabled>Current Plan</Button>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> Access to all verified Karighars</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> SafePay Escrow protection</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> Standard 14-day warranty</li>
                  <li className="flex items-center gap-3 text-muted-foreground"><span className="w-5 flex justify-center text-xs">❌</span> 15% booking fee per job</li>
                </ul>
              </div>

              <div className="bg-primary text-primary-foreground rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Star className="size-32" /></div>
                <div className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4">Recommended</div>
                <h2 className="text-2xl font-bold">Karighar Plus</h2>
                <p className="text-primary-foreground/80 mt-2">For homeowners who want premium service.</p>
                <div className="my-6">
                  <span className="text-4xl font-black">₹499</span><span className="text-primary-foreground/70">/mo</span>
                </div>
                <Button className="w-full h-12 rounded-xl mb-8 bg-white text-primary hover:bg-gray-100" onClick={() => toast.success("Redirecting to payment gateway...")}>Subscribe Now</Button>
                <ul className="space-y-4 relative z-10">
                  <li className="flex items-center gap-3"><Check className="text-white size-5" /> <strong>0% booking fee</strong> on all jobs</li>
                  <li className="flex items-center gap-3"><Check className="text-white size-5" /> Priority emergency dispatch</li>
                  <li className="flex items-center gap-3"><Check className="text-white size-5" /> Extended 30-day warranty</li>
                  <li className="flex items-center gap-3"><Check className="text-white size-5" /> Free 1x AC Servicing per year</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h2 className="text-2xl font-bold">Standard Pro</h2>
                <p className="text-muted-foreground mt-2">Perfect for independent contractors.</p>
                <div className="my-6">
                  <span className="text-4xl font-black">₹0</span><span className="text-muted-foreground">/mo</span>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl mb-8" disabled>Current Plan</Button>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> Bid on local jobs</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> SafePay payment guarantees</li>
                  <li className="flex items-center gap-3"><Check className="text-green-500 size-5" /> Standard profile listing</li>
                  <li className="flex items-center gap-3 text-muted-foreground"><span className="w-5 flex justify-center text-xs">❌</span> 3% commission on earnings</li>
                  <li className="flex items-center gap-3 text-muted-foreground"><span className="w-5 flex justify-center text-xs">❌</span> Cannot add team members</li>
                </ul>
              </div>

              <div className="bg-blue-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="size-32" /></div>
                <div className="inline-block px-3 py-1 bg-blue-500/40 text-blue-100 text-xs font-bold uppercase tracking-wider rounded-full mb-4">For Businesses</div>
                <h2 className="text-2xl font-bold">Karighar Agency</h2>
                <p className="text-blue-200 mt-2">Scale your team and keep all your money.</p>
                <div className="my-6">
                  <span className="text-4xl font-black">₹999</span><span className="text-blue-300">/mo</span>
                </div>
                <Button className="w-full h-12 rounded-xl mb-8 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => toast.success("Redirecting to Pro checkout...")}>Upgrade to Agency</Button>
                <ul className="space-y-4 relative z-10">
                  <li className="flex items-center gap-3"><Check className="text-blue-300 size-5" /> <strong>0% commission</strong> — keep 100% of earnings</li>
                  <li className="flex items-center gap-3 font-semibold text-yellow-300"><Users className="size-5" /> Unlock Agency Mode (Add up to 5 helpers)</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-300 size-5" /> Top ranking in search results</li>
                  <li className="flex items-center gap-3"><Check className="text-blue-300 size-5" /> AI Smart-Quoting tools</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  );
}
