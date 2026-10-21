import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/help/contact')({
  head: () => ({ meta: [{ title: 'Contact Support — Karighar' }] }),
  component: HelpContactPage
});

function HelpContactPage() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <main className="min-h-screen pb-24">
        <div className="max-w-xl mx-auto px-5 pt-10">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
            <Link to="/help">
              <ArrowLeft className="mr-1.5 size-4" strokeWidth={1.5} />
              Back to Help Centre
            </Link>
          </Button>

          <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-warm-xs">
            <h1 className="text-2xl font-display font-semibold text-foreground mb-1">Contact Support</h1>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Open a request and our customer care team will respond within 24 hours.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Support ticket created! We will email you shortly.");
                setTimeout(() => navigate({ to: '/help' }), 1200);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">What do you need help with?</Label>
                <select className="w-full h-11 px-3.5 rounded-lg border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all">
                  <option>Issue with a Karighar</option>
                  <option>Payment or SafePay Dispute</option>
                  <option>Account Verification</option>
                  <option>Other Technical Issue</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Project ID (Optional)</Label>
                <Input placeholder="e.g. 9b1deb4d-…" className="h-11 text-sm" />
                <p className="text-[11px] text-muted-foreground">If this is about an existing project, paste its ID from your projects tab.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Description</Label>
                <Textarea
                  required
                  className="min-h-[110px] text-sm"
                  placeholder="Please describe your issue or question in detail…"
                />
              </div>

              <Button type="submit" size="lg" className="w-full h-11 rounded-xl text-sm font-semibold shadow-warm-xs mt-2">
                <Send className="mr-2 size-4" strokeWidth={1.5} />
                Submit Request
              </Button>
            </form>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
