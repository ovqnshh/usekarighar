import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { PageShell } from '@/components/karighar-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/help/contact')({
  component: HelpContactPage
});

function HelpContactPage() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <main className="min-h-screen bg-muted/10 pb-20">
        <div className="max-w-2xl mx-auto px-5 pt-10">
          <Button asChild variant="ghost" className="mb-8 -ml-4 text-muted-foreground hover:text-foreground">
            <Link to="/help"><ArrowLeft className="mr-2 size-4" /> Back to Help Center</Link>
          </Button>

          <div className="bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h1 className="text-3xl font-display font-bold mb-2">Contact Support</h1>
            <p className="text-muted-foreground mb-8">
              Open a ticket and our Trust & Safety team will get back to you within 24 hours.
            </p>

            <form onSubmit={(e) => {
              e.preventDefault();
              toast.success("Support ticket created! We will email you shortly.");
              setTimeout(() => navigate({ to: '/help' }), 1500);
            }} className="space-y-6">
              
              <div>
                <label className="block text-sm font-semibold mb-2">What do you need help with?</label>
                <select className="w-full h-12 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none">
                  <option>Issue with a Karighar</option>
                  <option>Payment or SafePay Dispute</option>
                  <option>Account Verification</option>
                  <option>Other Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Project ID (Optional)</label>
                <Input placeholder="e.g. 9b1deb4d-..." className="h-12" />
                <p className="text-xs text-muted-foreground mt-1">If this is about a specific job, paste the ID here.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea 
                  required 
                  className="w-full p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none resize-none h-32" 
                  placeholder="Please describe the issue in detail..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full h-12 text-base">
                <Send className="mr-2 size-4" /> Submit Ticket
              </Button>
            </form>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
