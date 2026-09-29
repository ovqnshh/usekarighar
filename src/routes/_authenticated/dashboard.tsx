import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { type Addon, type GigRow, type ProRow, inr, materialsLabel, slugify, usePhotoUrls } from "@/lib/karighar-api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Professional dashboard — Karighar" },
    { name: "description", content: "Manage your Karighar storefront, gigs and quote requests." },
    { property: "og:title", content: "Professional dashboard — Karighar" },
    { property: "og:description", content: "Manage your storefront, gigs and quote requests." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const pro = useQuery({ queryKey: ["my-pro", user.id], queryFn: async () => (await supabase.from("professionals").select("*").eq("user_id", user.id).maybeSingle()).data });
  return (
    <PageShell><main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      {pro.isLoading ? <p className="text-muted-foreground">Loading…</p> : pro.data ? <ProDashboard pro={pro.data} /> : <SetupStorefront userId={user.id} />}
    </main></PageShell>
  );
}

function SetupStorefront({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", business: "", trade: "", city: "", experience: "", bio: "" });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("professionals").insert({ ...f, user_id: userId, slug: slugify(f.business || f.name) });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-pro"] });
  }
  return (
    <form onSubmit={save} className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6">
      <p className="text-sm font-semibold text-primary">Join as a professional</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">Set up your storefront</h1>
      <div className="mt-6 grid gap-3">
        {(["name", "business", "trade", "city", "experience"] as const).map((k) => (
          <label key={k}><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{k === "business" ? "Business name" : k}</span><Input required={k === "name" || k === "business"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
        ))}
        <label><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Bio</span><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
      </div>
      <Button type="submit" className="mt-5 w-full">Create storefront</Button>
    </form>
  );
}

function ProDashboard({ pro }: { pro: ProRow }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-primary">{pro.trade || "Professional"}</p><h1 className="mt-1 font-display text-4xl font-semibold">{pro.business}</h1></div>
        <Button asChild variant="outline"><Link to="/professionals/$id" params={{ id: pro.slug || pro.id }}>View my storefront</Link></Button>
      </div>
      <Tabs defaultValue="quotes" className="mt-8">
        <TabsList><TabsTrigger value="quotes">Quote requests</TabsTrigger><TabsTrigger value="gigs">Gigs</TabsTrigger><TabsTrigger value="bookings">Bookings</TabsTrigger><TabsTrigger value="portfolio">Portfolio & Profile</TabsTrigger></TabsList>
        <TabsContent value="quotes" className="pt-5"><QuoteRequests pro={pro} /></TabsContent>
        <TabsContent value="gigs" className="pt-5"><Gigs pro={pro} /></TabsContent>
        <TabsContent value="bookings" className="pt-5"><Bookings pro={pro} /></TabsContent>
        <TabsContent value="portfolio" className="pt-5"><PortfolioEditor pro={pro} /></TabsContent>
      </Tabs>
    </>
  );
}

/* ---------------- Gigs ---------------- */

function Gigs({ pro }: { pro: ProRow }) {
  const qc = useQueryClient();
  const gigs = useQuery({ queryKey: ["gigs", pro.id], queryFn: async () => (await supabase.from("gigs").select("*").eq("professional_id", pro.id).order("created_at")).data ?? [] });
  const [editing, setEditing] = useState<GigRow | "new" | null>(null);
  async function remove(g: GigRow) {
    if (!confirm(`Delete “${g.name}”?`)) return;
    const { error } = await supabase.from("gigs").delete().eq("id", g.id);
    if (error) { toast.error(error.message); return; }
    if (g.photos.length) await supabase.storage.from("gig-photos").remove(g.photos);
    qc.invalidateQueries({ queryKey: ["gigs", pro.id] });
  }
  return (
    <div>
      <div className="flex justify-between"><p className="text-muted-foreground">{gigs.data?.length ?? 0} gigs on your storefront</p><Button onClick={() => setEditing("new")}><Plus /> New gig</Button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {gigs.data?.map((g) => (
          <article key={g.id} className="rounded-lg border border-border bg-card p-5">
            <GigThumb paths={g.photos} />
            <div className="mt-3 flex justify-between gap-3"><h3 className="font-semibold">{g.name}</h3><strong>{inr(g.starting_price)}</strong></div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{g.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{g.duration} · {materialsLabel[g.materials]} · {g.service_area}</p>
            <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(g)}><Pencil /> Edit</Button><Button size="sm" variant="ghost" onClick={() => remove(g)}><Trash2 /> Delete</Button></div>
          </article>
        ))}
      </div>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing === "new" ? "New gig" : "Edit gig"}</DialogTitle></DialogHeader>
          {editing ? <GigForm pro={pro} gig={editing === "new" ? null : editing} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["gigs", pro.id] }); }} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GigThumb({ paths }: { paths: string[] }) {
  const urls = usePhotoUrls(paths.slice(0, 3));
  if (!urls.length) return <div className="grid aspect-[16/7] place-items-center rounded-md bg-muted text-xs text-muted-foreground">No photos yet</div>;
  return <div className="grid grid-cols-3 gap-2">{urls.map((u) => <img key={u} src={u} alt="" className="aspect-[4/3] w-full rounded-md object-cover" />)}</div>;
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

function GigForm({ pro, gig, onDone }: { pro: ProRow; gig: GigRow | null; onDone: () => void }) {
  const [f, setF] = useState({
    name: gig?.name ?? "", description: gig?.description ?? "", starting_price: String(gig?.starting_price ?? ""),
    included: (gig?.included ?? []).join("\n"), not_included: (gig?.not_included ?? []).join("\n"),
    duration: gig?.duration ?? "", materials: gig?.materials ?? "professional", service_area: gig?.service_area ?? pro.city,
    availability: gig?.availability ?? "", warranty: gig?.warranty ?? "",
    addons: ((gig?.addons as Addon[] | undefined) ?? []).map((a) => `${a.name} - ${a.price}`).join("\n"),
  });
  const [photos, setPhotos] = useState<string[]>(gig?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const previews = usePhotoUrls(photos);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function upload(files: FileList | null) {
    if (!files?.length || !pro.user_id) return;
    setBusy(true);
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${pro.user_id}/${crypto.randomUUID()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error } = await supabase.storage.from("gig-photos").upload(path, file);
      if (error) toast.error(error.message); else added.push(path);
    }
    setPhotos((p) => [...p, ...added]); setBusy(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const addons: Addon[] = lines(f.addons).map((l) => { const [name, price] = l.split(/\s-\s|:/); return { name: (name ?? "").trim(), price: Number((price ?? "0").replace(/\D/g, "")) || 0 }; });
    const row = { name: f.name, description: f.description, starting_price: Number(f.starting_price) || 0, included: lines(f.included), not_included: lines(f.not_included),
      duration: f.duration, materials: f.materials, service_area: f.service_area, availability: f.availability, warranty: f.warranty, addons, photos, professional_id: pro.id };
    const { error } = gig ? await supabase.from("gigs").update(row).eq("id", gig.id) : await supabase.from("gigs").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gig saved"); onDone();
  }

  const L = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{label}</span>{children}</label>;
  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><L label="Service name"><Input required value={f.name} onChange={set("name")} /></L></div>
      <div className="sm:col-span-2"><L label="Description"><Textarea value={f.description} onChange={set("description")} /></L></div>
      <div className="sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Photos</span>
        <div className="flex flex-wrap gap-2">
          {previews.map((u, i) => <button type="button" key={u} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="relative" aria-label="Remove photo"><img src={u} alt="" className="size-20 rounded-md object-cover" /><span className="absolute right-1 top-1 rounded bg-background/90 px-1 text-xs">✕</span></button>)}
          <label className="grid size-20 cursor-pointer place-items-center rounded-md border border-dashed border-border text-muted-foreground"><ImagePlus /><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} /></label>
        </div>
      </div>
      <L label="Starting price (₹)"><Input required type="number" min={0} value={f.starting_price} onChange={set("starting_price")} /></L>
      <L label="Estimated duration"><Input value={f.duration} onChange={set("duration")} placeholder="e.g. 1–2 hours" /></L>
      <L label="What's included (one per line)"><Textarea value={f.included} onChange={set("included")} /></L>
      <L label="Not included (one per line)"><Textarea value={f.not_included} onChange={set("not_included")} /></L>
      <L label="Materials"><select value={f.materials} onChange={set("materials")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(materialsLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></L>
      <L label="Service area"><Input value={f.service_area} onChange={set("service_area")} /></L>
      <L label="Availability"><Input value={f.availability} onChange={set("availability")} placeholder="Mon–Sat, 9 AM–7 PM" /></L>
      <L label="Warranty terms"><Input value={f.warranty} onChange={set("warranty")} /></L>
      <div className="sm:col-span-2"><L label="Add-ons (one per line, e.g. Tank cleaning - 600)"><Textarea value={f.addons} onChange={set("addons")} /></L></div>
      <Button type="submit" disabled={busy} className="sm:col-span-2">{busy ? "Saving…" : "Save gig"}</Button>
    </form>
  );
}

/* ---------------- Quote requests ---------------- */

function QuoteRequests({ pro }: { pro: ProRow }) {
  const q = useQuery({ queryKey: ["pro-quotes", pro.id], queryFn: async () => (await supabase.from("quotes").select("*, projects(*)").eq("professional_id", pro.id).order("created_at", { ascending: false })).data ?? [] });
  if (!q.data?.length) return <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No quote requests yet. Customers who request a quote from your storefront appear here.</p>;
  return <div className="grid gap-4">{q.data.map((row) => <QuoteRequestCard key={row.id} row={row} proId={pro.id} />)}</div>;
}

type QuoteWithProject = { id: string; status: string; projects: { title: string; location: string; timing: string; budget: string; summary: string } | null } & Record<string, unknown>;

function QuoteRequestCard({ row, proId }: { row: QuoteWithProject; proId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const r = row as unknown as Record<string, number | string>;
  const [f, setF] = useState({ labour: String(r["labour"] || ""), materials_cost: String(r["materials_cost"] || ""), transport: String(r["transport"] || ""), other: String(r["other"] || ""), platform_fee: String(r["platform_fee"] || "99"), tax: String(r["tax"] || ""), duration: String(r["duration"] ?? ""), workers: String(r["workers"] || "1"), materials: String(r["materials"] || "professional"), warranty: String(r["warranty"] ?? ""), scope: String(r["scope"] ?? "") });
  const n = (k: keyof typeof f) => Number(f[k]) || 0;
  const total = n("labour") + n("materials_cost") + n("transport") + n("other") + n("platform_fee") + n("tax");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.rpc("submit_quote", { _quote_id: row.id, _labour: n("labour"), _materials_cost: n("materials_cost"), _transport: n("transport"), _other: n("other"), _platform_fee: n("platform_fee"), _tax: n("tax"), _duration: f.duration, _workers: n("workers") || 1, _materials: f.materials, _warranty: f.warranty, _scope: f.scope });
    if (error) { toast.error(error.message); return; }
    toast.success("Quote sent"); setOpen(false); qc.invalidateQueries({ queryKey: ["pro-quotes", proId] });
  }
  const editable = row.status === "requested" || row.status === "submitted";
  const money = ["labour", "materials_cost", "transport", "other", "platform_fee", "tax"] as const;
  const moneyLabel: Record<string, string> = { labour: "Labour", materials_cost: "Materials", transport: "Transport", other: "Other", platform_fee: "Platform fee", tax: "Tax" };
  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="font-semibold">{row.projects?.title}</h3><p className="mt-1 text-sm text-muted-foreground">{[row.projects?.location, row.projects?.timing, row.projects?.budget].filter(Boolean).join(" · ")}</p></div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{row.status === "requested" ? "Pending" : row.status}</span>
      </div>
      {editable ? <Button size="sm" className="mt-4" variant={row.status === "requested" ? "default" : "outline"} onClick={() => setOpen(!open)}>{row.status === "requested" ? "Write quote" : "Revise quote"}</Button> : null}
      {open ? (
        <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
          {money.map((k) => <label key={k}><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{moneyLabel[k]} (₹)</span><Input type="number" min={0} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>)}
          <label><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Duration</span><Input required value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></label>
          <label><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Workers</span><Input type="number" min={1} value={f.workers} onChange={(e) => setF({ ...f, workers: e.target.value })} /></label>
          <label><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Materials</span><select value={f.materials} onChange={(e) => setF({ ...f, materials: e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{Object.entries(materialsLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="sm:col-span-3"><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Warranty terms</span><Input value={f.warranty} onChange={(e) => setF({ ...f, warranty: e.target.value })} /></label>
          <label className="sm:col-span-3"><span className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">Scope</span><Textarea required value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} /></label>
          <div className="flex items-center justify-between sm:col-span-3"><p className="text-lg">Total <strong>{inr(total)}</strong></p><Button type="submit">Send quote</Button></div>
        </form>
      ) : null}
    </article>
  );
}

/* ---------------- Bookings ---------------- */

function Bookings({ pro }: { pro: ProRow }) {
  const q = useQuery({ queryKey: ["pro-bookings", pro.id], queryFn: async () => (await supabase.from("projects").select("*").eq("professional_id", pro.id).order("created_at", { ascending: false })).data ?? [] });
  if (!q.data?.length) return <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No confirmed bookings yet.</p>;
  return <div className="grid gap-3">{q.data.map((p) => <Link key={p.id} to="/projects/$id" params={{ id: p.id }} className="flex justify-between rounded-lg border border-border bg-card p-5 hover:bg-muted/50"><span className="font-semibold">{p.title}</span><span className="text-sm text-muted-foreground">{inr(p.price)} · {p.status}</span></Link>)}</div>;
}

/* ---------------- Portfolio & Profile ---------------- */

function PortfolioEditor({ pro }: { pro: any }) {
  const qc = useQueryClient();
  const [bio, setBio] = useState(pro.bio || '');
  const [youtube, setYoutube] = useState(pro.youtube_link || '');
  const [website, setWebsite] = useState(pro.website_link || '');
  const [uploading, setUploading] = useState(false);

  const images = useQuery({
    queryKey: ['portfolio', pro.id],
    queryFn: async () => (await supabase.from('portfolio_images').select('*').eq('professional_id', pro.id).order('created_at', { ascending: false })).data ?? []
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('professionals').update({ bio, youtube_link: youtube, website_link: website }).eq('id', pro.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Profile updated!'); qc.invalidateQueries({ queryKey: ['my-pro'] }); }
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const ext = file.name.split('.').pop();
        const fileName = `${pro.id}/${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('portfolios').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('portfolios').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('portfolio_images').insert({ professional_id: pro.id, image_url: publicUrlData.publicUrl });
        if (dbError) throw dbError;
      }
      qc.invalidateQueries({ queryKey: ['portfolio'] });
      toast.success('Images uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(id: string) {
    if (!confirm('Delete this image?')) return;
    await supabase.from('portfolio_images').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['portfolio'] });
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4 max-w-2xl">
        <h2 className="text-xl font-semibold">About & Links</h2>
        <div className="space-y-2"><Label>Bio / About you</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Tell customers about your experience..." /></div>
        <div className="space-y-2"><Label>YouTube Video Link</Label><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
        <div className="space-y-2"><Label>Website or Portfolio Link</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." /></div>
        <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>{saveProfile.isPending ? 'Saving...' : 'Save Profile'}</Button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Photo Gallery</h2>
          <div className="relative">
            <Button disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Photos'}</Button>
            <input type="file" multiple accept="image/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>
        
        {images.isLoading ? <div className="h-40 bg-muted animate-pulse rounded-xl" /> : images.data?.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground">No photos yet. Upload some past work!</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.data?.map((img: any) => (
              <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                <button onClick={() => deleteImage(img.id)} className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

