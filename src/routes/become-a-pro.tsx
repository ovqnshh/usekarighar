import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BriefcaseBusiness, CheckCircle2, ChevronLeft, MapPin, Wrench } from "lucide-react";

export const Route = createFileRoute("/become-a-pro")({
  component: BecomeAProPage,
});

function BecomeAProPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    trade: "",
    city: "",
    experience: "",
    bio: "",
  });

  const updateForm = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    
    // Generate slug from business name
    const slug = formData.business.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
    
    const { error } = await supabase.from("professionals").insert({
      user_id: user.id,
      slug,
      name: formData.name,
      business: formData.business,
      trade: formData.trade,
      city: formData.city,
      experience: formData.experience,
      bio: formData.bio,
    });

    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to Karighar! Your storefront is live.");
      navigate({ to: "/dashboard" });
    }
  };

  if (!user) {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl px-5 py-20 text-center">
          <BriefcaseBusiness className="mx-auto mb-6 size-16 text-primary" />
          <h1 className="font-display text-4xl font-bold md:text-5xl">Become a Karighar</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Join our marketplace and start getting high-quality projects. Sign up to set up your professional storefront.
          </p>
          <div className="mt-8">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full" asChild>
              <Link to="/auth" search={{ redirect: "/become-a-pro" }}>Sign up or Log in</Link>
            </Button>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-5 py-10 lg:px-8">
        {step > 1 && step < 4 && (
          <Button variant="ghost" onClick={prevStep} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 size-4" /> Back
          </Button>
        )}
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h1 className="font-display text-4xl font-semibold">Tell us about your services</h1>
            <p className="mt-2 text-muted-foreground text-lg">This is what customers will see first when looking for a professional.</p>
            
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your full name</Label>
                <Input id="name" placeholder="e.g. Ramesh Kumar" value={formData.name} onChange={(e) => updateForm("name", e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business">Business name</Label>
                <Input id="business" placeholder="e.g. Ramesh Plumbing Works" value={formData.business} onChange={(e) => updateForm("business", e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade">Primary trade</Label>
                <Select value={formData.trade} onValueChange={(v) => updateForm("trade", v)}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Select a trade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing & water systems">Plumbing & water systems</SelectItem>
                    <SelectItem value="Electrical & lighting">Electrical & lighting</SelectItem>
                    <SelectItem value="Renovation & interiors">Renovation & interiors</SelectItem>
                    <SelectItem value="Carpentry & woodwork">Carpentry & woodwork</SelectItem>
                    <SelectItem value="Painting & finishing">Painting & finishing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-10 border-t border-border pt-6 flex justify-end">
              <Button onClick={nextStep} disabled={!formData.name || !formData.business || !formData.trade} className="h-12 px-8 text-base rounded-full">Next</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <MapPin className="mb-4 size-10 text-primary" />
            <h1 className="font-display text-4xl font-semibold">Where do you work?</h1>
            <p className="mt-2 text-muted-foreground text-lg">Add your primary city and service areas.</p>
            
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="city">City & Area</Label>
                <Input id="city" placeholder="e.g. Andheri West, Mumbai" value={formData.city} onChange={(e) => updateForm("city", e.target.value)} className="h-12" />
              </div>
            </div>
            
            <div className="mt-10 border-t border-border pt-6 flex justify-between">
              <Button variant="ghost" onClick={prevStep} className="h-12 text-base rounded-full">Back</Button>
              <Button onClick={nextStep} disabled={!formData.city} className="h-12 px-8 text-base rounded-full">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <Wrench className="mb-4 size-10 text-primary" />
            <h1 className="font-display text-4xl font-semibold">Build trust with customers</h1>
            <p className="mt-2 text-muted-foreground text-lg">Highlight your experience and write a short bio about your work ethic.</p>
            
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="experience">Years of experience</Label>
                <Input id="experience" placeholder="e.g. 10 years" value={formData.experience} onChange={(e) => updateForm("experience", e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Professional bio</Label>
                <Textarea id="bio" placeholder="e.g. I specialize in complete bathroom renovations with a focus on leak-proof fittings and timely delivery." value={formData.bio} onChange={(e) => updateForm("bio", e.target.value)} className="min-h-32 rounded-xl" />
              </div>
            </div>
            
            <div className="mt-10 border-t border-border pt-6 flex justify-between">
              <Button variant="ghost" onClick={prevStep} className="h-12 text-base rounded-full">Back</Button>
              <Button onClick={nextStep} disabled={!formData.experience || !formData.bio} className="h-12 px-8 text-base rounded-full">Review</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 text-center">
            <CheckCircle2 className="mx-auto mb-6 size-16 text-success" />
            <h1 className="font-display text-4xl font-semibold">Ready to launch</h1>
            <p className="mt-2 text-muted-foreground text-lg">Your professional storefront is ready to be published on Karighar.</p>
            
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left">
              <h3 className="font-semibold text-lg">{formData.name} · {formData.business}</h3>
              <p className="text-muted-foreground">{formData.trade} in {formData.city}</p>
              <p className="mt-4 text-sm">{formData.bio}</p>
              <p className="mt-2 text-sm font-semibold">{formData.experience} experience</p>
            </div>
            
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={prevStep} className="h-12 px-8 text-base rounded-full" disabled={loading}>Edit details</Button>
              <Button onClick={handleSubmit} className="h-12 px-8 text-base rounded-full" disabled={loading}>
                {loading ? "Publishing..." : "Publish my storefront"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}
