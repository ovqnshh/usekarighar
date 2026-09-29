import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/page-transition";
import { supabase } from "@/integrations/supabase/client";
import { transitions } from "@/lib/animations";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — Karighar" },
    { name: "description", content: "Choose a new password for your Karighar account." },
    { property: "og:title", content: "Reset password — Karighar" },
    { property: "og:description", content: "Choose a new password for your Karighar account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Couldn't update password", { description: error.message }); return; }
    toast.success("Password updated", { description: "You're all set." });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none fixed inset-0"><div className="auth-orb -right-32 -top-32 size-[500px] bg-primary/20" /></div>
      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={transitions.smooth}
        className="relative z-10 w-full max-w-md space-y-4 rounded-3xl border border-border bg-card/80 p-8 shadow-float backdrop-blur-xl">
        <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
        <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="h-12 rounded-xl" />
        <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl">{busy ? <><Spinner className="mr-2" />Updating...</> : "Update password"}</Button>
      </motion.form>
    </div>
  );
}
