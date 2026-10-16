import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, ShieldCheck, Wrench, ChevronDown, Settings, LayoutGrid, List, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { type ProRow, useAuth, computeQuoteTotal, inr } from "@/lib/karighar-api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


export const Route = createFileRoute("/_authenticated/dashboard")({
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
          <button onClick={() => setActiveTab("services")} className={`transition-colors hover:text-foreground relative ${activeTab === 'services' ? 'text-foreground font-semibold after:absolute after:-bottom-[26px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}`}>My Services</button>
          <button onClick={() => setActiveTab("messages")} className={`transition-colors hover:text-foreground ${activeTab === 'messages' ? 'text-foreground font-semibold' : ''}`}>Messages</button>
          <button onClick={() => setActiveTab("team")} className={`transition-colors hover:text-foreground ${activeTab === 'team' ? 'text-foreground font-semibold relative after:absolute after:-bottom-[26px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}`}>Agency Team</button>
        </nav>

        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="text-sm font-semibold hover:bg-muted px-4 py-2 rounded-full transition-colors hidden sm:block">Switch to buying</Link>
          <div className="relative">
            <div onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 border border-border rounded-full p-1 pl-3 pr-1 hover:shadow-md transition-shadow cursor-pointer bg-background">
              <Menu className="size-4 text-muted-foreground" />
              <div className="flex size-8 items-center justify-center rounded-full bg-foreground text-background font-bold text-xs uppercase">
                {user?.email?.charAt(0) || "P"}
              </div>
            </div>
            
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-background border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-3 bg-[#f7f7f7] mx-2 mb-2 rounded-xl">
                  <h4 className="font-semibold text-sm">New to Karighar?</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">Discover tips and best practices shared by top-rated professionals.</p>
                  <Button className="w-full bg-background text-foreground hover:bg-muted font-semibold h-8 text-xs rounded-lg border border-border">Get started</Button>
                </div>
                
                <Link to="/account" className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Account settings
                </Link>
                <div className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Languages & currency
                </div>
                <div className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Hosting resources
                </div>
                <div className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Get help
                </div>
                
                <div className="h-px bg-border my-2" />
                
                <Link to="/become-a-pro" className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground font-medium">
                  Create a new service
                </Link>
                <div className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Refer a professional
                </div>
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex items-center px-4 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-foreground">
                  Log out
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl">
        {/* Tab Content */}
        {activeTab === "calendar" && <CalendarTab pro={pro} />}
        {activeTab === "services" && <MyServicesTab pro={pro} />}
        {activeTab === "messages" && <MessagesTab pro={pro} />}
        {activeTab === "today" && <TodayTab pro={pro} />}
        {activeTab === "team" && <AgencyTeamTab pro={pro} />}
      </main>
    </div>
  );
}

function TodayTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [quoteData, setQuoteData] = useState<Record<string, { labour: string, materials_cost: string, transport: string, other: string }>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["pro-quotes", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, projects(*)")
        .eq("professional_id", pro.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const sendQuote = async (quoteId: string, projectId: string) => {
    const data = quoteData[quoteId] || { labour: '0', materials_cost: '0', transport: '0', other: '0' };
    const labour = Number(data.labour) || 0;
    const materials_cost = Number(data.materials_cost) || 0;
    const transport = Number(data.transport) || 0;
    const other = Number(data.other) || 0;
    
    if (labour + materials_cost + transport + other === 0) return toast.error("Please enter an amount");
    
    setLoadingId(quoteId);
    
    // Compute total securely
    const { platformFee, tax, total } = computeQuoteTotal(labour, materials_cost, transport, other);
    
    void total; void projectId;
    const { error: quoteErr } = await supabase.rpc("submit_quote", {
      _quote_id: quoteId, _labour: labour, _materials_cost: materials_cost, _transport: transport, _other: other,
      _platform_fee: platformFee, _tax: tax, _duration: "", _workers: 1, _materials: "professional", _warranty: "", _scope: "",
    });
      
    if (quoteErr) {
      setLoadingId(null);
      return toast.error("Failed to send quote");
    }

    
    qc.invalidateQueries({ queryKey: ["pro-quotes", pro.id] });
    toast.success("Quote sent to customer!");
    setLoadingId(null);
  };

  const declineQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    setLoadingId(quoteId);
    const { error } = await supabase.rpc("decline_quote", { _quote_id: quoteId });
    if (error) toast.error("Couldn't decline", { description: error.message }); else toast.success("Request declined");
    qc.invalidateQueries({ queryKey: ["pro-quotes", pro.id] });
    setLoadingId(null);
  };

  const updateQuoteData = (quoteId: string, field: string, val: string) => {
    setQuoteData(prev => ({
      ...prev,
      [quoteId]: { ...(prev[quoteId] || { labour: '', materials_cost: '', transport: '', other: '' }), [field]: val }
    }));
  };

  if (isLoading) return <p className="py-20 text-center text-muted-foreground">Loading today's requests...</p>;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {pro.name.split(' ')[0]}!</h1>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Today's requests</h2>
      </div>
      
      {quotes?.length === 0 ? (
        <div className="border border-border rounded-2xl p-12 text-center bg-muted/10">
          <h3 className="text-lg font-semibold mb-2">No new requests today</h3>
          <p className="text-muted-foreground">When customers request a quote, it will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes?.map((q: any) => {
            const currentData = quoteData[q.id] || { labour: '', materials_cost: '', transport: '', other: '' };
            const { total } = computeQuoteTotal(Number(currentData.labour), Number(currentData.materials_cost), Number(currentData.transport), Number(currentData.other));
            return (
              <div key={q.id} className="border border-border rounded-2xl p-6 bg-background shadow-sm flex flex-col sm:flex-row gap-6 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      q.status === 'requested' ? 'bg-orange-100 text-orange-700' :
                      q.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {q.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{q.projects?.title || 'New Job Request'}</h3>
                  {q.projects?.location && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">📍 {q.projects.location}</p>}
                  {q.projects?.summary && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-lg">{q.projects.summary}</p>}
                  
                  {q.status === 'submitted' && q.total && (
                    <p className="mt-3 font-semibold text-lg text-foreground">You quoted: {inr(q.total)}</p>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 min-w-[240px] shrink-0 justify-center bg-muted/30 p-4 rounded-xl">
                  {q.status === 'requested' && (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-muted-foreground">Labour</label>
                          <input type="number" placeholder="₹0" className="w-20 bg-background border border-border rounded-md px-2 py-1 text-right" value={currentData.labour} onChange={(e) => updateQuoteData(q.id, 'labour', e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-muted-foreground">Materials</label>
                          <input type="number" placeholder="₹0" className="w-20 bg-background border border-border rounded-md px-2 py-1 text-right" value={currentData.materials_cost} onChange={(e) => updateQuoteData(q.id, 'materials_cost', e.target.value)} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-muted-foreground">Transport</label>
                          <input type="number" placeholder="₹0" className="w-20 bg-background border border-border rounded-md px-2 py-1 text-right" value={currentData.transport} onChange={(e) => updateQuoteData(q.id, 'transport', e.target.value)} />
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-bold">
                          <span>Total + Tax</span>
                          <span>{inr(total)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-[#E51D53] hover:bg-[#d4174a] text-white font-semibold rounded-lg mt-2"
                        disabled={loadingId === q.id}
                        onClick={() => sendQuote(q.id, q.project_id)}
                      >
                        {loadingId === q.id ? 'Sending...' : 'Send Quote'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full font-semibold text-muted-foreground rounded-lg"
                        disabled={loadingId === q.id}
                        onClick={() => declineQuote(q.id)}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {q.status !== 'requested' && (
                    <Button variant="outline" className="w-full font-semibold rounded-lg bg-background">View details</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MessagesTab({ pro }: { pro: ProRow }) {
  const { user } = useAuth();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const { data: messages, isLoading } = useQuery({
    queryKey: ["pro-messages", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, projects(id, title, customer_id, professionals!inner(id))")
        .or(`sender_id.eq.${pro.user_id},receiver_id.eq.${pro.user_id}`)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.warn("Messages table might not exist yet:", error);
        return [];
      }
      return data ?? [];
    },
    refetchInterval: 3000 // Poll for new messages just for a smooth UX
  });

  // Group messages by project
  const threads = useMemo(() => {
    if (!messages) return [];
    const grouped = new Map();
    for (const msg of messages) {
      if (!msg.project_id) continue;
      if (!grouped.has(msg.project_id)) {
        grouped.set(msg.project_id, {
          projectId: msg.project_id,
          title: msg.projects?.title || 'Unknown Project',
          lastMessage: msg,
          unread: msg.receiver_id === user?.id && !msg.read,
          messages: []
        });
      }
      grouped.get(msg.project_id).messages.push(msg);
      if (msg.receiver_id === user?.id && !msg.read) {
        grouped.get(msg.project_id).unread = true;
      }
    }
    return Array.from(grouped.values()).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, user?.id]);

  const categorizeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0 && now.getDate() === date.getDate()) return "Today";
    if (diffDays === 1 || (diffDays === 0 && now.getDate() !== date.getDate())) return "Yesterday";
    if (diffDays < 7) return "This week";
    return "Earlier";
  };

  const activeThread = activeProjectId ? threads.find(t => t.projectId === activeProjectId) : null;

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeThread || !user) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem('content') as HTMLInputElement;
    if (!input.value.trim()) return;

    // Find the other user
    const firstMsg = activeThread.messages[0];
    const receiverId = firstMsg.sender_id === user.id ? firstMsg.receiver_id : firstMsg.sender_id;

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      project_id: activeThread.projectId,
      content: input.value,
      read: false
    });
    input.value = '';
  };

  return (
    <div className="flex border-t border-border mt-4 h-[calc(100vh-120px)] bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-border p-4 flex flex-col h-full overflow-hidden shrink-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h2 className="text-2xl font-bold">Messages</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading...</div>
          ) : threads.length > 0 ? (
            <div className="space-y-4">
              {['Today', 'Yesterday', 'This week', 'Earlier'].map(category => {
                const catThreads = threads.filter(t => categorizeDate(t.lastMessage.created_at) === category);
                if (catThreads.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">{category}</h3>
                    <div className="space-y-1">
                      {catThreads.map(t => (
                        <div 
                          key={t.projectId} 
                          onClick={() => setActiveProjectId(t.projectId)}
                          className={`p-3 rounded-xl cursor-pointer transition-colors ${activeProjectId === t.projectId ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h4 className={`text-sm truncate ${t.unread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                              {t.title}
                            </h4>
                            {t.unread && <span className="w-2 h-2 rounded-full bg-[#E51D53] shrink-0 mt-1.5" />}
                          </div>
                          <p className={`text-xs truncate mt-1 ${t.unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {t.lastMessage.sender_id === user?.id ? 'You: ' : ''}{t.lastMessage.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center text-sm text-muted-foreground p-4">No messages yet.</div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          <div className="border-b border-border p-4 shrink-0 flex justify-between items-center bg-card">
            <h3 className="font-semibold text-lg">{activeThread.title}</h3>
            <Link to="/projects/$id" params={{ id: activeThread.projectId }} className="text-sm font-semibold text-[#E51D53] hover:underline">View Project</Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4">
            {activeThread.messages.map((msg: any) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`p-3 rounded-2xl ${isMe ? 'bg-[#E51D53] text-white rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-background border-t border-border shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input 
                name="content"
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E51D53]"
                autoComplete="off"
              />
              <Button type="submit" size="icon" className="rounded-full bg-[#E51D53] hover:bg-[#d4174a] text-white shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/5">
          <div className="mb-4 text-foreground/20">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h.01"></path>
              <path d="M12 10h.01"></path>
              <path d="M16 10h.01"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Your messages</h3>
          <p className="max-w-xs">Select a conversation to start chatting.</p>
        </div>
      )}
    </div>
  );
}

function CalendarTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [customPrice, setCustomPrice] = useState<Record<string, string>>({});
  const [basePrice, setBasePrice] = useState(String(pro.rating ? Math.round(pro.rating * 100) : 500));
  const [discount, setDiscount] = useState('');
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5, 6]); // Mon-Sat default

  const { data: availability = [], refetch: refetchAvail } = useQuery({
    queryKey: ["availability", pro.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("karighar_availability")
        .select("*")
        .eq("professional_id", pro.id);
      if (error) { console.warn("karighar_availability table:", error.message); return []; }
      return data ?? [];
    },
  });

  const { data: scheduledProjects = [] } = useQuery({
    queryKey: ["scheduled-projects", pro.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("professional_id", pro.id)
        .in("status", ["scheduled", "in_progress"]);
      if (error) return [];
      return data ?? [];
    },
  });

  // --- Month navigation (create new Date objects, don't mutate) ---
  const goToPrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // --- Date helpers ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayStr = new Date().toISOString().split('T')[0];

  const fmtDate = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const getDateState = (dateStr: string, day: number) => {
    const dateObj = new Date(year, month, day);
    const today = new Date(); today.setHours(0,0,0,0);
    if (dateObj < today) return 'past';
    const proj = scheduledProjects.find((p: any) => p.timing === dateStr || p.timing?.startsWith(dateStr));
    if (proj) return 'scheduled';
    const blocked = availability.find((a: any) => a.date === dateStr && a.status === 'blocked');
    if (blocked) return 'blocked';
    return 'open';
  };

  // --- Toggle single date ---
  const toggleDate = async (dateStr: string) => {
    const state = getDateState(dateStr, parseInt(dateStr.split('-')[2]));
    if (state === 'past') return;
    if (state === 'scheduled') {
      toast.error("This date has a scheduled project. Cancel or complete it first.");
      return;
    }

    try {
      if (state === 'blocked') {
        // Unblock: delete the row
        const row = availability.find((a: any) => a.date === dateStr);
        if (row) {
          await (supabase as any).from("karighar_availability").delete().eq("id", row.id);
          toast.success(`${dateStr} unblocked`);
        }
      } else {
        // Block: insert
        await (supabase as any).from("karighar_availability").insert({
          professional_id: pro.id, date: dateStr, status: 'blocked'
        });
        toast.success(`${dateStr} blocked`);
      }
      refetchAvail();
    } catch (e: any) {
      toast.error(e.message || "Failed to update availability");
    }
  };

  // --- Bulk actions on selected dates ---
  const bulkBlock = async () => {
    if (selectedDates.size === 0) return toast.error("Select dates first");
    const toBlock = Array.from(selectedDates).filter(d => {
      const s = getDateState(d, parseInt(d.split('-')[2]));
      return s === 'open';
    });
    if (toBlock.length === 0) return toast.info("No open dates selected");
    try {
      for (const d of toBlock) {
        const { error } = await (supabase as any).from("karighar_availability").insert({
          professional_id: pro.id, date: d, status: 'blocked'
        });
        if (error) throw error;
      }
      toast.success(`Blocked ${toBlock.length} date(s)`);
      setSelectedDates(new Set());
      refetchAvail();
    } catch (e: any) {
      toast.error(e.message || "Failed to block dates");
    }
  };

  const bulkUnblock = async () => {
    if (selectedDates.size === 0) return toast.error("Select dates first");
    const toUnblock = Array.from(selectedDates).filter(d => {
      const s = getDateState(d, parseInt(d.split('-')[2]));
      return s === 'blocked';
    });
    if (toUnblock.length === 0) return toast.info("No blocked dates selected");
    try {
      for (const d of toUnblock) {
        const row = availability.find((a: any) => a.date === d);
        if (row) {
          const { error } = await (supabase as any).from("karighar_availability").delete().eq("id", row.id);
          if (error) throw error;
        }
      }
      toast.success(`Unblocked ${toUnblock.length} date(s)`);
      setSelectedDates(new Set());
      refetchAvail();
    } catch (e: any) {
      toast.error(e.message || "Failed to unblock dates");
    }
  };

  // --- Toggle selection (for multi-select) ---
  const toggleSelect = (dateStr: string, state: string) => {
    if (state === 'past' || state === 'scheduled') return;
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      return next;
    });
  };

  // --- State visual config ---
  const stateConfig: Record<string, { bg: string; label: string; textColor: string }> = {
    past: { bg: 'bg-muted/20', label: '—', textColor: 'text-muted-foreground/50' },
    scheduled: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: '📅 Booked', textColor: 'text-emerald-700 dark:text-emerald-400' },
    blocked: { bg: 'bg-red-50 dark:bg-red-950/20', label: 'Blocked', textColor: 'text-red-600 dark:text-red-400' },
    open: { bg: 'bg-background', label: 'Open', textColor: 'text-muted-foreground' },
  };

  const blockedCount = availability.filter((a: any) => a.status === 'blocked').length;
  const scheduledCount = scheduledProjects.length;

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-6 lg:px-10 py-6">
      {/* Left: Calendar */}
      <div className="flex-1">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToPrevMonth}>← Prev</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>Next →</Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-background border border-border" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-200" /> Blocked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-muted/40 border border-border" /> Past</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/20 border-2 border-primary" /> Selected</span>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border border-border rounded-xl overflow-hidden">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[12px] font-semibold text-muted-foreground py-2.5 bg-muted/30 border-b border-border">
              {d}
            </div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e-${i}`} className="aspect-[4/3] border-b border-r border-border/40 bg-muted/10" />
          ))}

          {/* Day cells */}
          {days.map(day => {
            const dateStr = fmtDate(day);
            const state = getDateState(dateStr, day);
            const cfg = stateConfig[state];
            const isToday = dateStr === todayStr;
            const isSelected = selectedDates.has(dateStr);
            const proj = scheduledProjects.find((p: any) => p.timing === dateStr || p.timing?.startsWith(dateStr));
            const hasCustomPrice = customPrice[dateStr] && customPrice[dateStr] !== '';
            const displayPrice = hasCustomPrice ? `₹${customPrice[dateStr]}` : (basePrice ? `₹${basePrice}` : '');

            return (
              <div
                key={day}
                onClick={(e) => {
                  if (state === 'past' || state === 'scheduled') return;
                  if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    toggleSelect(dateStr, state);
                  } else {
                    setSelectedDates(new Set([dateStr]));
                  }
                }}
                className={`aspect-[4/3] p-1.5 sm:p-2 border-b border-r border-border/40 transition-all flex flex-col justify-between relative group ${
                  isSelected ? 'ring-2 ring-primary ring-inset bg-primary/5' :
                  state === 'past' ? 'bg-muted/15 cursor-default opacity-35' :
                  state === 'scheduled' ? 'bg-emerald-50 dark:bg-emerald-950/30 cursor-not-allowed' :
                  state === 'blocked' ? 'bg-red-50/80 dark:bg-red-950/20 cursor-pointer hover:bg-red-100/60' :
                  'bg-background cursor-pointer hover:bg-muted/30'
                }`}
              >
                {/* Day number row */}
                <div className="flex items-start justify-between">
                  <span className={`text-sm font-semibold leading-none ${
                    isToday ? 'flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs' :
                    state === 'blocked' ? 'text-red-400 line-through decoration-red-400/70' :
                    state === 'scheduled' ? 'text-emerald-700 dark:text-emerald-400 font-bold' :
                    state === 'past' ? 'text-muted-foreground/40' :
                    'text-foreground'
                  }`}>
                    {day}
                  </span>
                  {isSelected && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold">✓</span>
                  )}
                </div>

                {/* Bottom info */}
                <div className="mt-auto space-y-0.5">
                  {state === 'scheduled' && proj && (
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 leading-tight truncate block">
                      {proj.title}
                    </span>
                  )}
                  {state === 'blocked' && (
                    <span className="text-[9px] font-bold text-red-500/80 leading-tight flex items-center gap-0.5">
                      <svg className="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Blocked
                    </span>
                  )}
                  {state === 'open' && (
                    <span className={`text-[9px] font-semibold leading-tight block ${
                      hasCustomPrice ? 'text-primary font-bold' : 'text-muted-foreground/50 group-hover:text-foreground/70'
                    } transition-colors`}>
                      {displayPrice || 'Open'}
                    </span>
                  )}
                  {state === 'past' && (
                    <span className="text-[9px] text-muted-foreground/30 leading-tight">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          💡 <strong>Click</strong> a date to block/unblock it. <strong>Ctrl+click</strong> or <strong>Shift+click</strong> to select multiple, then use bulk actions.
        </p>
      </div>

      {/* Right Sidebar — Settings */}
      <div className="w-full lg:w-[340px] shrink-0 space-y-5">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{scheduledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Booked</p>
          </div>
          <div className="rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{blockedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Blocked</p>
          </div>
        </div>

        {/* Availability Settings */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-base">Availability settings</h3>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Working days</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Sun', val: 0 }, { label: 'Mon', val: 1 }, { label: 'Tue', val: 2 },
                { label: 'Wed', val: 3 }, { label: 'Thu', val: 4 }, { label: 'Fri', val: 5 }, { label: 'Sat', val: 6 }
              ].map(wd => (
                <button
                  key={wd.val}
                  onClick={() => setWorkingDays(prev =>
                    prev.includes(wd.val) ? prev.filter(d => d !== wd.val) : [...prev, wd.val]
                  )}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    workingDays.includes(wd.val)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {wd.label}
                </button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={async () => {
            // Block all non-working days for the current month
            let count = 0;
            for (const day of days) {
              const d = new Date(year, month, day);
              if (!workingDays.includes(d.getDay())) {
                const ds = fmtDate(day);
                const state = getDateState(ds, day);
                if (state === 'open') {
                  await (supabase as any).from("karighar_availability").insert({
                    professional_id: pro.id, date: ds, status: 'blocked'
                  });
                  count++;
                }
              }
            }
            if (count > 0) {
              toast.success(`Blocked ${count} off-days this month`);
              refetchAvail();
            } else {
              toast.info("All off-days already blocked");
            }
          }}>
            Apply to this month
          </Button>
        </div>

        {/* General Pricing */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-base">General pricing</h3>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Base rate (₹ per visit)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={basePrice}
                onChange={e => setBasePrice(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. 500"
              />
              <Button variant="outline" size="sm" onClick={() => toast.success(`Base rate set to ₹${basePrice}`)}>
                Save
              </Button>
            </div>
          </div>
        </div>

        {/* Discounts */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-base">Discounts</h3>
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-1">Week-ahead discount (%)</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. 10"
                min="0" max="50"
              />
              <Button variant="outline" size="sm" onClick={() => {
                if (discount) toast.success(`${discount}% discount for bookings 7+ days ahead`);
              }}>
                Save
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">Customers who book 7+ days in advance get this discount applied automatically.</p>
          </div>
        </div>

        {/* Manage Selected Dates */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-base">Manage selected dates</h3>
          
          {selectedDates.size > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">{selectedDates.size} date(s) selected</p>
              
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" className="flex-1" onClick={bulkBlock}>Block</Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={bulkUnblock}>Unblock</Button>
              </div>
              
              <div className="pt-2 border-t border-border/50 space-y-2">
                <label className="text-xs text-muted-foreground">Custom price for selected date(s)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="₹ custom rate"
                    value={customPrice[Array.from(selectedDates)[0]] || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomPrice(prev => {
                        const next = { ...prev };
                        selectedDates.forEach(d => { next[d] = val; });
                        return next;
                      });
                    }}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <Button size="sm" onClick={() => {
                    toast.success(`Custom pricing set for ${selectedDates.size} date(s)`);
                    setSelectedDates(new Set());
                  }}>
                    Set
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Select dates on the calendar first (click or drag).</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MyServicesTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  
  const { data: gigs, isLoading } = useQuery({
    queryKey: ['my-gigs', pro.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('gigs').select('*').eq('professional_id', pro.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const saveGig = async () => {
    if (!editingId) return;
    if (!formData.name) return toast.error("Name is required");
    if (editingId === 'new') {
      const { error } = await supabase.from('gigs').insert({
        professional_id: pro.id,
        name: formData.name,
        description: formData.description,
        starting_price: formData.starting_price || 0,
        duration: formData.duration || '',
        is_published: formData.is_published ?? true
      });
      if (error) return toast.error("Error creating service");
      toast.success("Service created");
    } else {
      const { error } = await supabase.from('gigs').update({
        name: formData.name,
        description: formData.description,
        starting_price: formData.starting_price || 0,
        duration: formData.duration || '',
        is_published: formData.is_published
      }).eq('id', editingId);
      if (error) return toast.error("Error updating service");
      toast.success("Service updated");
    }
    setEditingId(null);
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  const deleteGig = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from('gigs').delete().eq('id', id);
    if (error) return toast.error("Cannot delete service. It may have active projects.");
    toast.success("Service deleted");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  const duplicateGig = async (gig: any) => {
    const { id, created_at, ...rest } = gig;
    const { error } = await supabase.from('gigs').insert({ ...rest, name: gig.name + " (Copy)" });
    if (error) return toast.error("Error duplicating");
    toast.success("Service duplicated");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };
  
  const togglePublish = async (gig: any) => {
    const { error } = await supabase.from('gigs').update({ is_published: !gig.is_published }).eq('id', gig.id);
    if (error) return toast.error("Error updating status");
    toast.success(gig.is_published ? "Service unpublished" : "Service published");
    qc.invalidateQueries({ queryKey: ['my-gigs', pro.id] });
  };

  if (isLoading) return <p className="px-10 py-10 text-muted-foreground">Loading services...</p>;

  return (
    <div className="px-6 lg:px-10 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Services</h1>
        {!editingId && (
          <Button onClick={() => { setEditingId('new'); setFormData({ is_published: true }); }} className="bg-[#E51D53] hover:bg-[#d4174a] text-white">
            + Add Service
          </Button>
        )}
      </div>
      
      {editingId ? (
        <Card className="mb-8 border-border max-w-3xl">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create New Service' : 'Edit Service'}</CardTitle>
            <CardDescription>Fill in the details below to define what you offer to customers.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Duration</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input id="name" placeholder="e.g. Basic Plumbing Repair" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe what is included in this service..." rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Starting Price (₹)</Label>
                    <Input id="price" type="number" placeholder="0" value={formData.starting_price || ''} onChange={e => setFormData({...formData, starting_price: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input id="duration" placeholder="e.g. 2 hours" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Publish Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this service visible to customers on your profile.
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published ?? true}
                    onCheckedChange={(checked) => setFormData({...formData, is_published: checked})}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={saveGig} className="bg-foreground text-background">
              {editingId === 'new' ? 'Create Service' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gigs?.map((gig: any) => (
            <div key={gig.id} className="border border-border rounded-2xl overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{gig.name}</h3>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${gig.is_published !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                    {gig.is_published !== false ? 'Active' : 'Draft'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">{gig.description || "No description provided."}</p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  {gig.starting_price > 0 && <span>Starts at {inr(gig.starting_price)}</span>}
                  {gig.duration && <span className="text-muted-foreground">⏱ {gig.duration}</span>}
                </div>
              </div>
              <div className="border-t border-border p-3 bg-muted/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex gap-1">
                  <button onClick={() => { setEditingId(gig.id); setFormData(gig); }} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md border border-transparent hover:border-border">Edit</button>
                  <button onClick={() => duplicateGig(gig)} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md border border-transparent hover:border-border">Duplicate</button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublish(gig)} className="text-xs font-semibold px-3 py-1.5 hover:bg-muted rounded-md text-muted-foreground border border-transparent hover:border-border">
                    {gig.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => deleteGig(gig.id)} className="text-xs font-semibold px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-md border border-transparent hover:border-destructive/20">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {gigs?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
              No services added yet. Add a service to show on your profile.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function AgencyTeamTab({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Helper");

  const members = useQuery({
    queryKey: ["agency-members", pro.id],
    queryFn: async () => (await supabase.from("agency_members").select("*").eq("professional_id", pro.id)).data ?? []
  });

  async function addMember() {
    if (!name || !phone) return toast.error("Name and Phone required");
    const { error } = await supabase.from("agency_members").insert({
      professional_id: pro.id, name, phone, role
    });
    if (error) return toast.error("Failed to add member");
    toast.success("Team member added");
    setName(""); setPhone("");
    qc.invalidateQueries({ queryKey: ["agency-members"] });
  }

  async function removeMember(id: string) {
    await supabase.from("agency_members").delete().eq("id", id);
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["agency-members"] });
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-blue-900 text-white rounded-2xl p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="size-32" /></div>
        <h2 className="text-2xl font-bold font-display relative z-10">Agency Mode Active</h2>
        <p className="text-blue-200 mt-2 max-w-xl relative z-10">
          You are on Karighar Agency. You can add up to 5 team members and dispatch them to jobs. They will receive the job location, and customers can track their arrival.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
            <CardDescription>Dispatch them to specific jobs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option>Helper</option>
                <option>Senior Plumber</option>
                <option>Electrician</option>
                <option>Carpenter</option>
              </select>
            </div>
            <Button onClick={addMember} className="w-full">Add Member</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-bold">Your Team ({members.data?.length || 0}/5)</h3>
          {members.isLoading ? (
            <p className="text-muted-foreground">Loading team...</p>
          ) : members.data?.length === 0 ? (
            <div className="bg-muted/50 border border-dashed border-border rounded-xl p-10 text-center">
              <p className="text-muted-foreground">You haven't added any team members yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {members.data?.map(m => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{m.name} <span className="ml-2 text-xs bg-muted px-2 py-1 rounded-full">{m.role}</span></h4>
                      <p className="text-sm text-muted-foreground mt-1">{m.phone}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeMember(m.id)}>Remove</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
