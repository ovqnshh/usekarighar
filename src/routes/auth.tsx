import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brand } from "@/components/karighar-shell";
import { projectImages } from "@/lib/karighar-data";
import { Spinner } from "@/components/page-transition";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { slideLeftVariants, slideRightVariants, transitions } from "@/lib/animations";

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

const wall = Object.values(projectImages);

function PasswordField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input id={id} type={show ? "text" : "password"} required minLength={6} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl pl-10 pr-11" placeholder="••••••••" />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const dest = redirect ?? "/dashboard";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + dest, data: { full_name: name } } });
        if (error) { toast.error("Signup failed", { description: error.message }); return; }
        if (data.user && data.user.identities?.length === 0) { toast.error("Email already in use", { description: "This email is already registered. Please sign in instead." }); return; }
        if (!data.session) { toast.success("Account created!", { description: "Please check your email to verify your account." }); return; }
        toast.success("Account created!", { description: "Welcome to Karighar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error("Login failed", { description: error.message }); return; }
        toast.success("Welcome back!", { description: "You have successfully logged in." });
      }
      navigate({ to: dest });
    } finally { setBusy(false); }
  }

  async function forgot() {
    if (!resetEmail) { toast.error("Email required", { description: "Please enter your email address." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error("Error", { description: error.message }); return; }
    toast.success("Check your email", { description: "We've sent you a password reset link." });
    setResetEmail(""); setForgotOpen(false);
  }

  async function google() {
    if (redirect) sessionStorage.setItem("karighar-after-auth", redirect);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Google sign-in failed", { description: r.error.message }); return; }
    if (r.redirected) return;
    toast.success("Welcome back!", { description: "You have successfully logged in." });
    navigate({ to: dest });
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <header className="relative z-20 flex h-20 items-center justify-between border-b border-border bg-background px-5 md:px-10 xl:px-20">
        <Brand />
        <Link to="/become-a-pro" className="rounded-full px-4 py-3 text-sm font-medium hover:bg-muted">Become a pro</Link>
      </header>
      <div className="pointer-events-none absolute inset-0 top-20 grid grid-cols-3 gap-6 p-6 opacity-90 md:grid-cols-6" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <img key={i} src={wall[i % wall.length]} alt="" className={`h-56 w-full rounded-3xl object-cover ${i % 2 ? "mt-16" : ""}`} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 top-20 bg-foreground/45" />

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={transitions.smooth}
          className="w-full max-w-xl rounded-[2rem] bg-background p-6 shadow-2xl sm:p-10">
          <div className="text-center">
            <div className="flex justify-center"><Brand /></div>
            <h1 className="mt-4 text-3xl font-semibold">{mode === "in" ? "Log in or sign up" : "Create your account"}</h1>
          </div>
          <div className="mt-6 flex gap-2 rounded-2xl border border-border bg-muted/70 p-1.5">
            {(["in", "up"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${mode === m ? "scale-[1.02] bg-background shadow-float" : "text-muted-foreground hover:text-foreground"}`}>
                {m === "in" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <Button variant="outline" className="mt-5 h-14 w-full rounded-xl font-semibold transition-transform active:scale-[0.98]" onClick={google}>Continue with Google</Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form key={mode} onSubmit={submit} variants={mode === "in" ? slideRightVariants : slideLeftVariants}
              initial="hidden" animate="visible" exit="exit" transition={transitions.fast} className="space-y-4">
              {mode === "up" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl pl-10" placeholder="Priya Sharma" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "in" && <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>}
                </div>
                <PasswordField id="password" value={password} onChange={setPassword} />
              </div>
              <Button type="submit" disabled={busy} className="h-14 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base font-semibold transition-transform active:scale-[0.98]">
                {busy ? <><Spinner className="mr-2" />{mode === "in" ? "Signing in..." : "Creating account..."}</> : mode === "in" ? "Sign in" : "Create account"}
              </Button>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>Enter your email and we'll send you a reset link.</DialogDescription>
          </DialogHeader>
          <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl" />
          <Button onClick={forgot} disabled={busy} className="h-12 rounded-xl">{busy ? <><Spinner className="mr-2" />Sending...</> : "Send reset link"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
