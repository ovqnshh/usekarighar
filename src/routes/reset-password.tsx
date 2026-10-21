import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand } from "@/components/karighar-shell";
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
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Couldn't update password", { description: error.message }); return; }
    toast.success("Password updated", { description: "You're all set." });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="mb-8">
        <Brand />
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.smooth}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-warm"
      >
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 6 characters long.
          </p>
        </div>

        <Input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="h-11 rounded-xl"
        />

        <Button
          type="submit"
          disabled={busy}
          className="h-11 w-full rounded-xl text-sm font-semibold shadow-warm-xs"
        >
          {busy ? <><Spinner className="mr-2" />Updating…</> : "Update password"}
        </Button>

        <div className="text-center pt-2">
          <Link to="/auth" className="text-xs text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
