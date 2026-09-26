import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type S = { redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): S => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  head: () => ({ meta: [
    { title: "Sign in — Karighar" },
    { name: "description", content: "Sign in to Karighar to request quotes, book gigs and manage your storefront." },
    { property: "og:title", content: "Sign in — Karighar" },
    { property: "og:description", content: "Sign in to request quotes, book gigs and manage your storefront." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const dest = redirect ?? "/projects";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + dest } });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: dest });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function google() {
    if (redirect) sessionStorage.setItem("karighar-after-auth", redirect);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Google sign-in failed"); return; }
    if (r.redirected) return;
    navigate({ to: dest });
  }

  return (
    <PageShell><main className="mx-auto max-w-md px-5 py-16">
      <h1 className="font-display text-4xl font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-muted-foreground">One account for hiring professionals and running your own storefront.</p>
      <Button variant="outline" className="mt-8 h-11 w-full" onClick={google}>Continue with Google</Button>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        <Button type="submit" disabled={busy} className="h-11 w-full">{mode === "in" ? "Sign in" : "Sign up"}</Button>
      </form>
      <button className="mt-5 text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
    </main></PageShell>
  );
}
