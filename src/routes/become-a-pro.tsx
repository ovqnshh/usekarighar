import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/karighar-shell";
import { useAuth } from "@/lib/karighar-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, Plug, Droplet, Paintbrush, Hammer, Snowflake, HardHat, ShieldCheck, Bug, Users, Home, ImagePlus, Shield, Clock, Package, Zap } from "lucide-react";

export const Route = createFileRoute("/become-a-pro")({
  head: () => ({
    meta: [
      { title: 'Join as a Verified Karighar Partner — Karighar' },
      { name: 'description', content: 'Karighar verified home services platform.' },
    ],
  }),
  component: BecomeAProPage,
});

const TRADES = [
  { id: "Plumbing repair & installation", icon: Droplet, label: "Plumbing" },
  { id: "Electrical repair & installation", icon: Plug, label: "Electrical" },
  { id: "AC & appliance repair/installation", icon: Snowflake, label: "AC & Appliance" },
  { id: "Carpentry & custom furniture", icon: Hammer, label: "Carpentry" },
  { id: "Painting & wall finishing", icon: Paintbrush, label: "Painting" },
  { id: "Masonry & plastering", icon: HardHat, label: "Masonry" },
  { id: "Tiling & flooring", icon: Home, label: "Tiling & Flooring" },
  { id: "Home automation & smart locks", icon: ShieldCheck, label: "Smart Home" },
  { id: "Pest control", icon: Bug, label: "Pest Control" },
  { id: "General labour / helper", icon: Users, label: "General Labour" },
];

const AMENITIES = [
  { id: "tools", icon: Wrench, label: "Brings own tools", desc: "I have all necessary equipment" },
  { id: "materials", icon: Package, label: "Provides materials", desc: "Can purchase parts for the customer" },
  { id: "emergency", icon: Zap, label: "24/7 Emergency", desc: "Available for urgent requests" },
  { id: "warranty", icon: Shield, label: "Work Warranty", desc: "Guarantee on completed work" },
  { id: "punctual", icon: Clock, label: "On-time guarantee", desc: "Will arrive exactly at booked time" },
];

function BecomeAProPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isVerified, setIsVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    trade: "",
    state: "Maharashtra - MH",
    city: "",
    locality: "",
    experience: "",
    bio: "",
    amenities: [] as string[],
    basePrice: "500",
    emergencyAdjustment: "+20%",
  });

  const toggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id) 
        : [...prev.amenities, id]
    }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 7));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setPhotos(prev => [...prev, ...droppedFiles]);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setPhotos(prev => [...prev, ...selectedFiles]);
    }
  };
  
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in.");
      navigate({ to: "/auth", search: { redirect: "/become-a-pro" } });
      return;
    }
    setLoading(true);
    
    // Fallbacks
    const businessName = formData.business || formData.name || "My Business";
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);
    const fullCity = formData.locality ? `${formData.locality}, ${formData.city}` : formData.city;
    
    const { error } = await supabase.from("professionals").insert({
      user_id: user.id,
      slug,
      name: formData.name || "Karighar Pro",
      business: businessName,
      trade: formData.trade,
      city: fullCity,
      experience: formData.experience,
      bio: formData.bio,
    });

    setLoading(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome to Karighar! Your profile is live.");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      {/* Top Header */}
      <header className="flex h-20 items-center px-6 lg:px-10 justify-between shrink-0">
        <Brand />
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold hover:bg-muted px-4 py-2 rounded-full cursor-pointer transition-colors hidden sm:block">Questions?</span>
          <Button variant="outline" className="rounded-full font-semibold px-4 hidden sm:flex">Save & exit</Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto mb-20 relative">
        {step === 0 && (
          <div className="flex-1 flex flex-col lg:flex-row items-center justify-center max-w-[1400px] mx-auto w-full px-6 lg:px-12 py-8 gap-12 lg:gap-24 animate-in fade-in duration-700">
            <div className="flex-1 text-center lg:text-left max-w-xl">
              <h1 className="font-display text-5xl lg:text-[64px] font-semibold leading-[1.1] tracking-tight mb-6">
                Set up your<br />Karighar profile
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                It's easy to create a great professional profile — let's start by choosing your trade.
              </p>
              
              {!user && (
                <div className="bg-muted/50 border border-border rounded-2xl p-6 text-left mb-6 shadow-sm">
                  <h3 className="font-semibold text-lg mb-2">You'll need an account to continue</h3>
                  <Button asChild className="w-full rounded-full h-12 text-base mt-2">
                    <Link to="/auth" search={{ redirect: "/become-a-pro" }}>Sign in or create account</Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full max-w-xl aspect-square lg:aspect-auto lg:h-[600px] relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop" 
                alt="Karighar at work" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-10 text-center">Which of these best describes your trade?</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
              {TRADES.map((trade) => {
                const isSelected = formData.trade === trade.id;
                const Icon = trade.icon;
                return (
                  <button
                    key={trade.id}
                    onClick={() => setFormData({ ...formData, trade: trade.id })}
                    className={`flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all hover:bg-muted/30 hover:border-foreground/40 active:scale-95 ${
                      isSelected ? 'border-foreground bg-muted/20' : 'border-border bg-background'
                    }`}
                  >
                    <Icon className={`size-8 mb-4 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                    <span className="font-semibold text-sm">{trade.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-6 text-center">Confirm your service area</h1>
            
            <Button 
              variant="outline" 
              className="mb-8 rounded-full gap-2 px-6 shadow-sm border-muted-foreground/30 font-semibold"
              onClick={() => {
                toast.loading("Detecting location...", { id: "gps" });
                navigator.geolocation.getCurrentPosition(async (pos) => {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                    const data = await res.json();
                    if (data.address) {
                      setFormData(prev => ({
                        ...prev,
                        city: data.address.city || data.address.town || data.address.state_district || '',
                        locality: data.address.suburb || data.address.neighbourhood || data.address.county || ''
                      }));
                      toast.success("Location updated!", { id: "gps" });
                    }
                  } catch (e) {
                    toast.error("Failed to detect location", { id: "gps" });
                  }
                }, () => toast.error("Location permission denied", { id: "gps" }));
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>
              Use my current location
            </Button>
            
            <div className="w-full rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
              <div className="p-4 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">State/region</label>
                <select 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-transparent text-base outline-none appearance-none cursor-pointer"
                >
                  <option>Maharashtra - MH</option>
                  <option>Delhi - DL</option>
                  <option>Karnataka - KA</option>
                  <option>Gujarat - GJ</option>
                </select>
              </div>
              
              <div className="p-4 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">City/town</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full bg-transparent text-base outline-none" 
                />
              </div>
              
              <div className="p-4 focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">District/locality (if applicable)</label>
                <input 
                  type="text" 
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="e.g. Andheri East"
                  className="w-full bg-transparent text-base outline-none" 
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-2 text-center">Tell us about your business</h1>
            <p className="text-muted-foreground mb-10 text-center">These details help customers trust your profile.</p>
            
            <div className="w-full rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
              <div className="p-4 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Your Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-transparent text-base outline-none" 
                />
              </div>
              
              <div className="p-4 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Business Name (Optional)</label>
                <input 
                  type="text" 
                  value={formData.business}
                  onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                  placeholder="e.g. Ramesh Plumbing Solutions"
                  className="w-full bg-transparent text-base outline-none" 
                />
              </div>
              
              <div className="p-4 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Years of Experience</label>
                <input 
                  type="text" 
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g. 10 years"
                  className="w-full bg-transparent text-base outline-none" 
                />
              </div>
              
              <div className="p-4 focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Short Bio / About You</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Describe your expertise and why customers should hire you..."
                  className="w-full bg-transparent text-base outline-none resize-none h-24 mt-1" 
                />
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-2 text-center">Tell customers what you provide</h1>
            <p className="text-muted-foreground mb-10 text-center">You can add more services after you publish your profile.</p>
            
            <div className="w-full text-left max-w-3xl">
              <h2 className="text-lg font-semibold mb-4">Basics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES.map((am) => {
                  const isSelected = formData.amenities.includes(am.id);
                  const Icon = am.icon;
                  return (
                    <button
                      key={am.id}
                      onClick={() => toggleAmenity(am.id)}
                      className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left min-h-[120px] ${
                        isSelected ? 'border-foreground bg-muted/10 ring-1 ring-foreground' : 'border-border bg-background hover:border-foreground/30'
                      }`}
                    >
                      <Icon className="size-8 mb-4 text-foreground" strokeWidth={1.5} />
                      <span className="font-semibold text-sm">{am.label}</span>
                      {isSelected && <span className="text-xs text-muted-foreground mt-1">{am.desc}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-2 text-center">Add some photos of your past work</h1>
            <p className="text-muted-foreground mb-10 text-center">You can add photos to get started, or make changes later.</p>
            
            <div 
              className="w-full border-2 border-dashed border-border hover:border-foreground/50 transition-colors rounded-2xl bg-muted/10 p-16 flex flex-col items-center justify-center text-center cursor-pointer relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <ImagePlus className="size-16 text-foreground/70 mb-4" strokeWidth={1} />
              <h3 className="text-xl font-semibold mb-2">Drag and drop</h3>
              <p className="text-muted-foreground mb-6">or browse for photos</p>
              <Button type="button" className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-8 rounded-full pointer-events-none">
                Browse
              </Button>
            </div>

            {photos.length > 0 && (
              <div className="w-full mt-8 grid grid-cols-3 gap-4">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                    <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-6 py-12 animate-in slide-in-from-right-8 duration-500">
            <h1 className="text-3xl font-semibold mb-2 text-center">Now, set your prices</h1>
            <p className="text-muted-foreground mb-10 text-center">These suggestions are based on demand for similar Karighars in your area.</p>
            
            <div className="w-full max-w-md rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
              <div className="p-6 border-b border-border focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-sm font-semibold text-foreground block mb-2">Base starting price (₹)</label>
                <div className="flex items-center">
                  <span className="text-4xl font-semibold mr-2">₹</span>
                  <input 
                    type="text" 
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full bg-transparent text-4xl font-semibold outline-none" 
                  />
                </div>
              </div>
              
              <div className="p-6 focus-within:bg-muted/30 focus-within:ring-2 focus-within:ring-foreground focus-within:z-10 relative transition-all">
                <label className="text-sm font-semibold text-foreground block mb-2">Emergency/Weekend adjustment</label>
                <div className="flex items-center justify-between">
                  <input 
                    type="text" 
                    value={formData.emergencyAdjustment}
                    onChange={(e) => setFormData({ ...formData, emergencyAdjustment: e.target.value })}
                    className="w-full bg-transparent text-2xl font-semibold outline-none" 
                  />
                  <span className="text-xs text-muted-foreground">For urgent jobs</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full px-6 py-12 animate-in fade-in duration-500">
            <h1 className="text-3xl font-semibold mb-10 text-center">Steps to publish</h1>
            
            <div className="w-full space-y-6">
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-lg">Identity verification</h3>
                  {isVerified && <span className="bg-success-soft text-success rounded-full text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="size-3" /> Verified</span>}
                </div>
                <p className="text-muted-foreground text-sm mb-6">{isVerified ? "Your identity is verified" : "Required to publish"}</p>
                
                {!isVerified && (
                  <div className="bg-muted/30 rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                      <ShieldCheck className="size-12 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">Verify your identity</h4>
                    <p className="text-muted-foreground mb-6">We'll gather some information to help confirm you're you.</p>
                    <Button 
                      onClick={() => {
                        toast.success("Identity verified successfully!");
                        setIsVerified(true);
                      }}
                      className="bg-foreground text-background hover:bg-foreground/90 px-8 rounded-full font-semibold"
                    >
                      Get started
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Phone number confirmation</h3>
                  <p className="text-muted-foreground text-sm">{isPhoneVerified ? "Phone number confirmed" : "Not started"}</p>
                </div>
                {!isPhoneVerified ? (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      toast.success("Phone number confirmed!");
                      setIsPhoneVerified(true);
                    }}
                    className="rounded-full font-semibold"
                  >
                    Verify
                  </Button>
                ) : (
                  <span className="bg-success-soft text-success rounded-full text-xs font-semibold px-2.5 py-0.5 rounded flex items-center gap-1"><ShieldCheck className="size-3" /> Confirmed</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4 z-50">
        {/* Progress Bar (Airbnb style at top of footer) */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(step / 7) * 100}%` }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            {step > 0 && (
              <button 
                onClick={prevStep}
                className="font-semibold underline text-foreground hover:bg-muted px-4 py-2 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
          </div>
          
          <div>
            {step === 0 ? (
              <Button 
                onClick={nextStep} 
                disabled={!user}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm px-8 h-12 rounded-lg font-semibold text-base"
              >
                Get started
              </Button>
            ) : step === 7 ? (
              <Button 
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.city || !isVerified || !isPhoneVerified}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-warm px-8 h-12 rounded-lg font-semibold text-base"
              >
                {loading ? "Publishing..." : "Publish profile"}
              </Button>
            ) : (
              <Button 
                onClick={nextStep}
                disabled={step === 1 && !formData.trade}
                className="bg-foreground text-background hover:bg-foreground/90 px-8 h-12 rounded-lg font-semibold text-base"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
