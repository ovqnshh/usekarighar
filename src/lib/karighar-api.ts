import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ProRow = Database["public"]["Tables"]["professionals"]["Row"];
export type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type QuoteRow = Database["public"]["Tables"]["quotes"]["Row"];
export type Addon = { name: string; price: number };

export const materialsLabel: Record<string, string> = {
  customer: "Customer supplies",
  professional: "Professional supplies",
  help: "Help me choose",
};

export const statusLabel: Record<string, string> = {
  requested: "Awaiting quotes",
  scheduled: "Scheduled",
  in_progress: "In progress",
  complete: "Complete",
};

export const inr = (n: number | null | undefined) => `₹${(n ?? 0).toLocaleString("en-IN")}`;

export function computeQuoteTotal(labour: number, materialsCost: number, transport: number, other: number) {
  const subtotal = (labour || 0) + (materialsCost || 0) + (transport || 0) + (other || 0);
  const platformFee = Math.round(subtotal * 0.05); // 5% platform fee
  const tax = Math.round((subtotal + platformFee) * 0.18); // 18% GST
  const total = subtotal + platformFee + tax;
  return { subtotal, platformFee, tax, total };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    supabase.auth.getSession().then(({ data: d }) => { setUser(d.session?.user ?? null); setLoading(false); });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export type Brief = { intent: string; summary: string; location: string; budget: string; timing: string };
const BRIEF_KEY = "karighar-brief";
export function saveBrief(brief: Brief) { sessionStorage.setItem(BRIEF_KEY, JSON.stringify(brief)); }
export function loadBrief(): Brief | null {
  try { const v = sessionStorage.getItem(BRIEF_KEY); return v ? (JSON.parse(v) as Brief) : null; } catch { return null; }
}

export async function createProjectFromBrief(fallbackTitle: string) {
  const brief = loadBrief();
  const { data, error } = await supabase.from("projects").insert({
    title: brief?.summary || fallbackTitle,
    summary: brief?.summary ?? "",
    intent: brief?.intent ?? "",
    location: brief?.location ?? "",
    budget: brief?.budget ?? "",
    timing: brief?.timing ?? "",
    source: "quote",
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function requestQuotes(projectId: string, professionalIds: string[]) {
  const { error } = await supabase.from("quotes").insert(professionalIds.map((professional_id) => ({ project_id: projectId, professional_id })));
  if (error) throw error;
}

export function usePhotoUrls(paths: string[]) {
  const [urls, setUrls] = useState<string[]>([]);
  const key = paths.join("|");
  useEffect(() => {
    if (!paths.length) { setUrls([]); return; }
    supabase.storage.from("gig-photos").createSignedUrls(paths, 3600).then(({ data }) => setUrls((data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}
