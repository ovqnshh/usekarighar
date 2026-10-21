import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, ArrowLeft } from "lucide-react";
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
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
      <Input
        id={id}
        type={show ? "text" : "password"}
        required
        minLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl pl-10 pr-11"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
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
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + dest,
            data: { full_name: name },
          },
        });
        if (error) { toast.error("Signup failed", { description: error.message }); return; }
        if (data.user && data.user.identities?.length === 0) {
          toast.error("Email already in use", { description: "This email is already registered. Please sign in instead." });
          return;
        }
        if (!data.session) {
          toast.success("Account created!", { description: "Please check your email to verify your account." });
          return;
        }
        toast.success("Account created!", { description: "Welcome to Karighar." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error("Login failed", { description: error.message }); return; }
        toast.success("Welcome back!", { description: "You have successfully logged in." });
      }
      navigate({ to: dest });
    } finally {
      setBusy(false);
    }
  }

  async function forgot() {
    if (!resetEmail) { toast.error("Email required", { description: "Please enter your email address." }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error("Error", { description: error.message }); return; }
    toast.success("Check your email", { description: "We've sent you a password reset link." });
    setResetEmail("");
    setForgotOpen(false);
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
    <div className="flex min-h-screen bg-background">
      {/* Left editorial brand panel (desktop only) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-surface-subtle p-12 lg:flex">
        {/* Subtle patterned collage */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-2 gap-4 p-8 opacity-20" aria-hidden>
          {wall.map((src, i) => (
            <img key={i} src={src} alt="" className="aspect-square w-full rounded-2xl object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-subtle via-surface-subtle/80 to-transparent" />

        <div className="relative z-10">
          <Brand />
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="font-display text-3xl font-semibold leading-tight text-foreground">
            "Every home deserves craftsmanship, clarity, and trust."
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            Connect directly with verified local plumbers, carpenters, electricians, and painters across Mumbai.
          </p>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground">
          © 2026 Karighar · Crafted with care
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-12 lg:w-1/2">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Brand />
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" strokeWidth={1.5} />
            Back to home
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {mode === "in" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "in"
                ? "Enter your details to access your projects and quotes."
                : "Join Karighar to post projects and hire verified experts."}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="mb-6 flex rounded-xl border border-border bg-surface-subtle p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  mode === m
                    ? "bg-card text-foreground shadow-warm-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "in" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="mb-6 h-11 w-full rounded-xl font-medium"
            onClick={google}
          >
            <svg className="mr-2 size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6 flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-border" />
            <span className="relative bg-background px-3 text-xs text-muted-foreground">or with email</span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              onSubmit={submit}
              variants={mode === "in" ? slideRightVariants : slideLeftVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.fast}
              className="space-y-4"
            >
              {mode === "up" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl pl-10"
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                  {mode === "in" && (
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <PasswordField id="password" value={password} onChange={setPassword} />
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-xl text-sm font-semibold shadow-warm transition-all"
              >
                {busy ? (
                  <>
                    <Spinner className="mr-2" />
                    {mode === "in" ? "Signing in…" : "Creating account…"}
                  </>
                ) : mode === "in" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          By signing in you agree to our Terms of Service & Privacy Policy.
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Reset password</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your email and we'll send you a recovery link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-xl"
            />
            <Button onClick={forgot} disabled={busy} className="h-11 w-full rounded-xl">
              {busy ? <><Spinner className="mr-2" />Sending…</> : "Send reset link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
