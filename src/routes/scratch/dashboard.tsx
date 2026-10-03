import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Menu, ShieldCheck, Wrench, ChevronDown, Settings, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { type ProRow } from "@/lib/karighar-api";

export const Route = createFileRoute("/scratch/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const pro = useQuery({ 
    queryKey: ["my-pro", user.id], 
    queryFn: async () => (await supabase.from("professionals").select("*").eq("user_id", user.id).maybeSingle()).data 
  });

  if (pro.isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  
  // If they don't have a profile yet, bounce them to the onboarding flow
  if (!pro.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <h1 className="text-2xl font-bold mb-4">You don't have a professional profile yet</h1>
        <Button asChild><Link to="/become-a-pro">Set up your profile</Link></Button>
      </div>
    );
  }

  return <ProDashboard pro={pro.data} user={user} />;
}

function ProDashboard({ pro, user }: { pro: ProRow, user: any }) {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header (Airbnb Host Style) */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-6 lg:px-10 border-b border-border bg-background">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#E51D53] text-white">
            <Wrench className="size-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-[#E51D53] hidden lg:block">karighar</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-muted-foreground">
          <button onClick={() => setActiveTab("today")} className={`transition-colors hover:text-foreground ${activeTab === 'today' ? 'text-foreground font-semibold' : ''}`}>Today</button>
          <button onClick={() => setActiveTab("calendar")} className={`transition-colors hover:text-foreground relative ${activeTab === 'calendar' ? 'text-foreground font-semibold after:absolute after:-bottom-[26px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}`}>Calendar</button>
          <button onClick={() => setActiveTab("listings")} className={`transition-colors hover:text-foreground relative ${activeTab === 'listings' ? 'text-foreground font-semibold after:absolute after:-bottom-[26px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}`}>Listings</button>
          <button onClick={() => setActiveTab("messages")} className={`transition-colors hover:text-foreground ${activeTab === 'messages' ? 'text-foreground font-semibold' : ''}`}>Messages</button>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="text-sm font-semibold hover:bg-muted px-4 py-2 rounded-full transition-colors hidden sm:block">Switch to buying</Link>
          <div className="flex items-center gap-2 border border-border rounded-full p-1 pl-3 pr-1 hover:shadow-md transition-shadow cursor-pointer bg-background">
            <Menu className="size-4 text-muted-foreground" />
            <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background font-bold text-xs uppercase">
              {user?.email?.charAt(0) || "P"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl">
        {/* Verification Banner */}
        <div className="flex justify-center py-6 px-4">
          <div className="flex items-center gap-4 bg-background border border-border rounded-2xl p-4 pr-10 shadow-sm max-w-md w-full cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="relative">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <ShieldCheck className="size-6 text-[#E51D53]" />
              </div>
              <div className="absolute -top-1 -left-1 flex size-5 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold border-2 border-background">
                2
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Verify your identity</h3>
              <p className="text-sm text-muted-foreground">Required to publish</p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "calendar" && <CalendarTab pro={pro} />}
        {activeTab === "listings" && <ListingsTab pro={pro} />}
        {(activeTab === "today" || activeTab === "messages") && (
          <div className="py-20 text-center text-muted-foreground">
            <h2 className="text-2xl font-semibold text-foreground mb-2">Nothing to see here yet</h2>
            <p>Your requests and messages will appear here.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CalendarTab({ pro }: { pro: ProRow }) {
  // Generate a fake calendar grid for October
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const startOffset = 3; // October 1st starts on Thursday in this fake view
  
  return (
    <div className="flex flex-col lg:flex-row gap-8 px-6 lg:px-10 py-4">
      {/* Left: Calendar */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            October <ChevronDown className="size-5 mt-1" />
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-full font-semibold gap-2">
              Month <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full shrink-0">
              <Settings className="size-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {/* Days of week */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[13px] font-medium text-muted-foreground pb-2 border-b border-border/50">
              {d}
            </div>
          ))}
          
          {/* Empty slots for start of month */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square p-2 border-b border-r border-border/50 border-dashed opacity-50" />
          ))}
          
          {/* Calendar Days */}
          {days.map(day => (
            <div key={day} className="aspect-[4/3] p-2 sm:p-3 border-b border-border/50 border-r last:border-r-0 hover:bg-muted/20 cursor-pointer flex flex-col justify-between group">
              <span className={`text-sm font-medium ${day === 3 ? 'flex size-7 items-center justify-center rounded-full bg-[#E51D53] text-white -mt-1 -ml-1' : ''}`}>{day}</span>
              <span className={`text-sm ${day === 3 ? 'font-semibold' : 'text-muted-foreground font-medium'}`}>₹{(pro.rating * 100).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="bg-[#f7f7f7] rounded-2xl p-6 text-center border border-border/50 relative">
          <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">✕</button>
          <div className="mx-auto w-32 h-24 mb-4 opacity-80 flex items-center justify-center">
            {/* Fake illustration placeholder */}
            <Users className="size-16 text-muted-foreground" strokeWidth={1} />
          </div>
          <h3 className="font-semibold text-lg mb-2">Attract more top-rated customers</h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Give a discount exclusively to customers rated 4.8+ with at least 3 reviews.
          </p>
          <Button className="w-full rounded-xl h-12 bg-foreground text-background font-semibold hover:bg-foreground/90">
            Get started
          </Button>
        </div>

        <div className="flex items-center justify-between p-2 cursor-pointer group">
          <div>
            <h4 className="font-semibold">Pricing</h4>
            <p className="text-sm text-muted-foreground">₹{(pro.rating * 100).toFixed(0)} base price</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-muted">
            <span className="text-lg">›</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ListingsTab({ pro }: { pro: ProRow }) {
  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your listing</h1>
        <div className="flex bg-muted/50 rounded-full p-1 border border-border">
          <button className="p-2 rounded-full bg-background shadow-sm"><LayoutGrid className="size-4" /></button>
          <button className="p-2 rounded-full text-muted-foreground hover:text-foreground"><List className="size-4" /></button>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl overflow-hidden group cursor-pointer">
        <div className="relative aspect-[4/3] bg-muted w-full">
          <img 
            src={`https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop`} 
            alt="Listing cover" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 bg-background px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 border border-border">
            <div className="size-2 rounded-full bg-[#E51D53]" />
            Action required
          </div>
        </div>
        <div className="py-4">
          <h3 className="font-semibold text-lg truncate">{pro.business}</h3>
          <p className="text-muted-foreground">{pro.city}</p>
        </div>
      </div>
    </div>
  );
}
