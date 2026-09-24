import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, Clock3, IndianRupee, MapPin, MessageCircle, Send, Star } from "lucide-react";
import { useState } from "react";
import { PageShell, TrustBadge } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { professionals, projectImages } from "@/lib/karighar-data";

export const Route = createFileRoute("/project")({
  head: () => ({ meta: [
    { title: "Water tank repair project — Karighar" },
    { name: "description", content: "Track your Karighar project, messages, photos, progress, and costs in one place." },
    { property: "og:title", content: "Water tank repair project — Karighar" },
    { property: "og:description", content: "Track your project, messages, photos, progress, and costs in one place." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}), component: ProjectPage,
});

function ProjectPage() {
  const pro = professionals[0];
  const [messages, setMessages] = useState(["Hi Riya, I’ve reviewed the photos. I can be there by 9:30 tomorrow morning.", "Perfect, the building security will have your name."]);
  const [message, setMessage] = useState("");
  function sendMessage() { if (!message.trim()) return; setMessages((current) => [...current, message]); setMessage(""); }
  return (
    <PageShell><main className="mx-auto max-w-7xl px-5 py-9 lg:px-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" /><p className="text-sm font-semibold text-success">Professional confirmed</p></div><h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">Water tank leak repair</h1><p className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" /> Andheri West, Mumbai</p></div><Button variant="outline"><MessageCircle /> Message Arjun</Button></div>
      <div className="mt-9 grid gap-7 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="rounded-lg border border-border bg-card p-5 md:p-7"><div className="flex justify-between text-sm"><span className="font-semibold">Visit scheduled</span><span className="text-muted-foreground">2 of 4 stages</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/2 rounded-full bg-primary" /></div><div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground"><span className="text-foreground">Brief</span><span className="font-semibold text-primary">Scheduled</span><span>In progress</span><span>Complete</span></div></div>
          <Tabs defaultValue="overview" className="mt-7"><TabsList className="h-auto w-full justify-start gap-5 overflow-x-auto rounded-none border-b border-border bg-transparent p-0"><TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Overview</TabsTrigger><TabsTrigger value="messages" className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Messages</TabsTrigger><TabsTrigger value="photos" className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Photos</TabsTrigger><TabsTrigger value="costs" className="rounded-none border-b-2 border-transparent px-0 pb-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Costs</TabsTrigger></TabsList>
            <TabsContent value="overview" className="pt-5"><div className="grid gap-5 md:grid-cols-2"><div className="rounded-lg border border-border p-5"><CalendarDays className="size-5 text-primary" /><h2 className="mt-4 font-semibold">Tomorrow, 9:30 AM</h2><p className="mt-1 text-sm text-muted-foreground">Estimated visit: 1–2 hours</p></div><div className="rounded-lg border border-border p-5"><Check className="size-5 text-success" /><h2 className="mt-4 font-semibold">Access confirmed</h2><p className="mt-1 text-sm text-muted-foreground">Building security has been informed</p></div></div><div className="mt-5 rounded-lg border border-border p-5"><h2 className="font-semibold">Scope of work</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Inspect the water tank outlet, replace the leaking connector and seal, test water flow, and clean the work area.</p></div></TabsContent>
            <TabsContent value="messages" className="pt-5"><div className="space-y-3">{messages.map((text, index) => <div key={`${text}-${index}`} className={`max-w-[85%] rounded-lg p-4 text-sm leading-6 ${index % 2 ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{text}</div>)}</div><div className="mt-5 flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Write a message…" className="h-11" /><Button size="icon" className="size-11" onClick={sendMessage} aria-label="Send message"><Send /></Button></div></TabsContent>
            <TabsContent value="photos" className="pt-5"><div className="grid grid-cols-2 gap-3"><img src={projectImages.waterTank} width={1200} height={912} loading="lazy" alt="Water tank connection" className="aspect-[4/3] w-full rounded-lg object-cover" /><img src={projectImages.electrical} width={1200} height={912} loading="lazy" alt="Nearby service area" className="aspect-[4/3] w-full rounded-lg object-cover" /></div></TabsContent>
            <TabsContent value="costs" className="pt-5"><div className="rounded-lg border border-border p-5"><div className="flex justify-between border-b border-border py-3"><span className="text-muted-foreground">Labour</span><strong>₹1,200</strong></div><div className="flex justify-between border-b border-border py-3"><span className="text-muted-foreground">Materials</span><strong>₹650</strong></div><div className="flex justify-between pt-5 text-lg"><strong>Total estimate</strong><strong>₹1,850</strong></div><p className="mt-3 text-xs text-muted-foreground">Final total will be confirmed before work begins.</p></div></TabsContent>
          </Tabs>
        </section>
        <aside className="space-y-5"><div className="rounded-lg border border-border bg-card p-5"><div className="flex gap-4"><img src={pro.image} width={1024} height={1024} loading="lazy" alt={pro.name} className="size-16 rounded-full object-cover" /><div><h2 className="font-semibold">{pro.name}</h2><p className="text-sm text-muted-foreground">{pro.business}</p><p className="mt-1 flex items-center gap-1 text-sm"><Star className="size-3.5 fill-primary text-primary" /> {pro.rating}</p></div></div><div className="mt-4"><TrustBadge>Identity & skills verified</TrustBadge></div></div><div className="rounded-lg bg-foreground p-5 text-primary-foreground"><IndianRupee className="size-5" /><p className="mt-5 text-sm text-primary-foreground/70">Current estimate</p><p className="mt-1 text-3xl font-semibold">₹1,850</p><p className="mt-4 flex items-center gap-2 text-sm"><Clock3 className="size-4" /> Pay after work is confirmed</p></div></aside>
      </div>
    </main></PageShell>
  );
}