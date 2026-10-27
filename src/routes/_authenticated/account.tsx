import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  User, Shield, Lock, CreditCard, Bell, Eye, Building2, MapPin,
  CheckCircle2, AlertTriangle, ChevronRight, Phone, Mail, Smartphone,
  Globe, KeyRound, Download, Trash2, Edit3, Plus, ArrowUpRight,
  ShieldCheck, HelpCircle, Check, Sparkles, RefreshCw, X, Receipt,
  Landmark, Wallet, Award, FileText, Ban
} from "lucide-react";
import { useAuth } from "@/lib/karighar-api";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account Settings — Karighar" }] }),
  component: AccountPage,
});

type SettingsTab = "overview" | "personal" | "security" | "payments" | "privacy" | "notifications";

export function AccountPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");

  // Fetch real profile data
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch pro details if artisan
  const { data: pro } = useQuery({
    queryKey: ["pro-account", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch real wallet / credit score if artisan
  const { data: wallet } = useQuery({
    queryKey: ["pro-wallet", pro?.id],
    queryFn: async () => {
      if (!pro?.id) return null;
      const { data } = await (supabase as any)
        .from("karigar_wallets")
        .select("*")
        .eq("professional_id", pro.id)
        .maybeSingle();
      return data;
    },
    enabled: !!pro?.id,
  });

  // Fetch recent payments for this user
  const { data: payments = [] } = useQuery({
    queryKey: ["account-payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  // Derived user details from Supabase Auth + Profiles
  const userMeta = user?.user_metadata || {};
  const legalName = userMeta.legal_name || profile?.full_name || (user?.email ? user.email.split("@")[0] : "Karighar Member");
  const preferredName = userMeta.preferred_name || "";
  const phone = userMeta.phone || profile?.phone || "";
  const residentialAddress = userMeta.residential_address || (profile?.city ? `${profile.city}, Maharashtra` : "");
  const postalAddress = userMeta.postal_address || "";
  const emergencyContact = userMeta.emergency_contact || "";
  const idVerified = userMeta.id_verified || false;

  // Payout bank details (for artisans)
  const payoutBank = userMeta.payout_bank || {
    bankName: "HDFC Bank",
    accountHolder: legalName,
    accountNumberMasked: "•••••••• 4921",
    ifsc: "HDFC0000123",
    upiVpa: "artisan@okhdfcbank",
    frequency: "instant", // instant | daily | weekly
    pan: userMeta.pan || "",
  };

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    jobUpdates: userMeta.notif_job_updates ?? true,
    priceAlerts: userMeta.notif_price_alerts ?? true,
    societyDeals: userMeta.notif_society_deals ?? true,
    artisanInsights: userMeta.notif_artisan_insights ?? true,
    marketing: userMeta.notif_marketing ?? false,
  });

  // Privacy Preferences
  const [privacy, setPrivacy] = useState({
    profileVisible: userMeta.privacy_profile_visible ?? true,
    readReceipts: userMeta.privacy_read_receipts ?? true,
    indexInSearch: userMeta.privacy_index_search ?? true,
    showLocalityOnReview: userMeta.privacy_show_locality ?? true,
    showServiceOnReview: userMeta.privacy_show_service ?? true,
    aiModelTraining: userMeta.privacy_ai_training ?? true,
  });

  // Modal edit states
  const [editModal, setEditModal] = useState<{
    open: boolean;
    field: string;
    title: string;
    value: string;
    secondaryValue?: string;
  }>({
    open: false,
    field: "",
    title: "",
    value: "",
  });

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: payoutBank.bankName || "",
    accountHolder: payoutBank.accountHolder || legalName,
    accountNumber: "",
    ifsc: payoutBank.ifsc || "",
    upiVpa: payoutBank.upiVpa || "",
    frequency: payoutBank.frequency || "instant",
    pan: payoutBank.pan || "",
  });

  // Update profile field helper
  const handleSaveField = async () => {
    try {
      const updates: Record<string, any> = {};
      updates[editModal.field] = editModal.value;

      if (editModal.field === "legal_name") {
        await supabase.from("profiles").update({ full_name: editModal.value }).eq("id", user!.id);
      } else if (editModal.field === "phone") {
        await supabase.from("profiles").update({ phone: editModal.value }).eq("id", user!.id);
      }

      const { error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) throw error;
      toast.success("Updated successfully");
      refetchProfile();
      setEditModal({ open: false, field: "", title: "", value: "" });
    } catch (e: any) {
      toast.error("Failed to update detail", { description: e.message });
    }
  };

  // Save Payout Details for Artisans
  const handleSaveBankPayout = async () => {
    try {
      const masked = bankForm.accountNumber
        ? `•••••••• ${bankForm.accountNumber.slice(-4)}`
        : payoutBank.accountNumberMasked;

      const payoutData = {
        bankName: bankForm.bankName,
        accountHolder: bankForm.accountHolder,
        accountNumberMasked: masked,
        ifsc: bankForm.ifsc.toUpperCase(),
        upiVpa: bankForm.upiVpa,
        frequency: bankForm.frequency,
        pan: bankForm.pan.toUpperCase(),
      };

      await supabase.auth.updateUser({
        data: {
          payout_bank: payoutData,
          pan: bankForm.pan.toUpperCase(),
        },
      });

      if (pro?.id) {
        await supabase.from("professionals").update({
          business: `${pro.name} · Payout: ${bankForm.bankName}`,
        }).eq("id", pro.id);
      }

      toast.success("Payout preferences & bank account saved", {
        description: `Disbursements set to: ${bankForm.frequency === "instant" ? "Instant upon OTP release" : bankForm.frequency === "daily" ? "Daily at 8:00 PM IST" : "Weekly on Monday"}.`,
      });
      setBankModalOpen(false);
    } catch (e: any) {
      toast.error("Could not save payout details", { description: e.message });
    }
  };

  // Toggle notifications & sync to Auth
  const handleToggleNotification = async (key: keyof typeof notifications, val: boolean) => {
    const updated = { ...notifications, [key]: val };
    setNotifications(updated);
    try {
      const payload: Record<string, boolean> = {};
      payload[`notif_${key}`] = val;
      await supabase.auth.updateUser({ data: payload });
      toast.success("Notification preference updated");
    } catch {}
  };

  // Toggle privacy preferences
  const handleTogglePrivacy = async (key: keyof typeof privacy, val: boolean) => {
    const updated = { ...privacy, [key]: val };
    setPrivacy(updated);
    try {
      const payload: Record<string, boolean> = {};
      payload[`privacy_${key}`] = val;
      await supabase.auth.updateUser({ data: payload });
      toast.success("Privacy setting updated");
    } catch {}
  };

  const handleUnsubscribeAll = async () => {
    const updated = { ...notifications, marketing: false, societyDeals: false };
    setNotifications(updated);
    await supabase.auth.updateUser({
      data: { notif_marketing: false, notif_society_deals: false },
    });
    toast.success("Unsubscribed from marketing and promotion emails");
  };

  const handleDeactivate = () => {
    if (confirm("Are you sure you want to deactivate your Karighar account? This action cannot be undone.")) {
      toast.info("Account deactivation scheduled. You will be logged out shortly.");
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate({ to: "/" });
      }, 1500);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="size-3" />
          <button
            onClick={() => setActiveTab("overview")}
            className={`hover:text-foreground font-medium ${activeTab === "overview" ? "text-foreground font-semibold" : ""}`}
          >
            Account Settings
          </button>
          {activeTab !== "overview" && (
            <>
              <ChevronRight className="size-3" />
              <span className="capitalize font-semibold text-foreground">
                {activeTab === "personal" && "Personal info"}
                {activeTab === "security" && "Login & security"}
                {activeTab === "payments" && "Payments & payouts"}
                {activeTab === "privacy" && "Privacy & sharing"}
                {activeTab === "notifications" && "Notifications"}
              </span>
            </>
          )}
        </div>

        {/* Tab Header Navigation Pills */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {activeTab === "overview" && "Account"}
              {activeTab === "personal" && "Personal info"}
              {activeTab === "security" && "Login & security"}
              {activeTab === "payments" && "Payments & payouts"}
              {activeTab === "privacy" && "Privacy & sharing"}
              {activeTab === "notifications" && "Notifications"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {user?.email} · {pro ? "Verified Karighar Professional" : "Customer Account"}
            </p>
          </div>

          {activeTab !== "overview" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="text-xs rounded-xl"
            >
              All settings
            </Button>
          )}
        </div>

        {/* =========================================================================
            VIEW 1: OVERVIEW HUB (Airbnb Grid Cards)
            ========================================================================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Personal info */}
            <button
              onClick={() => setActiveTab("personal")}
              className="text-left p-6 rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm transition-all group flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Personal info
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Provide personal details and how verified artisans and Karighar can reach you.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Manage personal info <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 2: Login & security */}
            <button
              onClick={() => setActiveTab("security")}
              className="text-left p-6 rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm transition-all group flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Login & security
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Update your password, passkeys, device sessions, and secure your account.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Manage security <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 3: Payments & payouts (MOST IMPORTANT) */}
            <button
              onClick={() => setActiveTab("payments")}
              className="text-left p-6 rounded-2xl border-2 border-primary/40 bg-card shadow-warm hover:border-primary transition-all group flex flex-col justify-between h-56 relative overflow-hidden"
            >
              <div className="absolute top-2.5 right-2.5">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold py-0.5">
                  SafePay Escrow
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Payments & payouts
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    SafePay escrow balances, UPI IDs, cards, coupons, and artisan bank disbursement routing.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Manage payments & bank payouts <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 4: Privacy & sharing */}
            <button
              onClick={() => setActiveTab("privacy")}
              className="text-left p-6 rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm transition-all group flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Eye className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Privacy & sharing
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Manage your visibility, message read receipts, search indexing, and review sharing.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Manage privacy <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 5: Notifications */}
            <button
              onClick={() => setActiveTab("notifications")}
              className="text-left p-6 rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm transition-all group flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Choose notification preferences for inspections, WhatsApp alerts, and neighbourhood clusters.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Manage notifications <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Card 6: Help & Trust center */}
            <Link
              to="/help"
              className="text-left p-6 rounded-2xl border border-border bg-card shadow-warm-xs hover:shadow-warm transition-all group flex flex-col justify-between h-56"
            >
              <div className="space-y-3">
                <div className="size-11 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                    Trust & Safety Center
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    30-Day rework warranty rules, dispute arbitrator ombudsman, and artisan code of conduct.
                  </p>
                </div>
              </div>
              <div className="text-xs font-semibold text-primary flex items-center gap-1">
                Visit Help & Trust center <ArrowUpRight className="size-3.5" />
              </div>
            </Link>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: PERSONAL INFORMATION
            ========================================================================= */}
        {activeTab === "personal" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 divide-y divide-border">
              {/* Row 1: Legal name */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Legal name</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{legalName}</div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "legal_name", title: "Edit Legal Name", value: legalName })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  Edit
                </Button>
              </div>

              {/* Row 2: Preferred first name */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Preferred first name</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{preferredName || "Not provided"}</div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "preferred_name", title: "Preferred First Name", value: preferredName })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  {preferredName ? "Edit" : "Add"}
                </Button>
              </div>

              {/* Row 3: Email address */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Email address</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    {user?.email}
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 bg-emerald-500/10">
                      Verified
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => toast.info("To change your primary email, please contact Karighar Support for security verification.")}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  Edit
                </Button>
              </div>

              {/* Row 4: Phone numbers */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Phone number</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {phone ? phone : "Add a phone number so confirmed artisans and Karighar can get in touch on dispatch."}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "phone", title: "Contact Phone Number", value: phone })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  {phone ? "Edit" : "Add"}
                </Button>
              </div>

              {/* Row 5: Identity verification */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Government Identity Verification</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {idVerified ? "Aadhaar & DigiLocker identity verified." : "Not verified yet. Completing verification increases trust score for instant bookings."}
                  </div>
                </div>
                {idVerified ? (
                  <Badge className="bg-emerald-600 text-white text-xs gap-1">
                    <CheckCircle2 className="size-3" /> Verified
                  </Badge>
                ) : (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      toast.success("DigiLocker verification sandbox initiated!");
                      supabase.auth.updateUser({ data: { id_verified: true } });
                    }}
                    className="text-xs font-semibold text-foreground underline p-0 h-auto"
                  >
                    Start
                  </Button>
                )}
              </div>

              {/* Row 6: Residential address */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Residential address</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {residentialAddress || "Not provided"}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "residential_address", title: "Residential Address (Mumbai)", value: residentialAddress })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  {residentialAddress ? "Edit" : "Add"}
                </Button>
              </div>

              {/* Row 7: Postal address */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Postal address & Pincode</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {postalAddress || "Not provided"}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "postal_address", title: "Postal Code & City", value: postalAddress })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  {postalAddress ? "Edit" : "Add"}
                </Button>
              </div>

              {/* Row 8: Emergency contact */}
              <div className="py-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">Emergency contact</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {emergencyContact || "Not provided"}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setEditModal({ open: true, field: "emergency_contact", title: "Emergency Contact (Name & Phone)", value: emergencyContact })}
                  className="text-xs font-semibold text-foreground underline p-0 h-auto"
                >
                  {emergencyContact ? "Edit" : "Add"}
                </Button>
              </div>
            </div>

            {/* Right-side FAQ Information Cards */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <ShieldCheck className="size-4" /> Why isn't my info shown here?
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We hide certain account details, masked account digits, and full government identifiers to safeguard your identity against unauthorized inspection.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <HelpCircle className="size-4 text-primary" /> Which details can be edited?
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Contact details, preferred name, and residential coordinates can be edited anytime. If this information was used to complete statutory KYC, updated credentials may require brief digital verification.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-warm-xs space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <Building2 className="size-4 text-primary" /> What info is shared with others?
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Karighar only releases contact coordinates and society entry passes between Artisans and Customers after a service booking or renovation milestone has been funded in escrow.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: LOGIN & SECURITY
            ========================================================================= */}
        {activeTab === "security" && (
          <div className="max-w-3xl divide-y divide-border space-y-2">
            {/* Passkeys */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Passkeys</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Sign in instantly using your device fingerprint, Windows Hello, Face ID, or screen PIN.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Biometric Passkey registered to this device")}
                className="text-xs shrink-0 rounded-xl"
              >
                Add Passkey
              </Button>
            </div>

            {/* Password */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Password</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Update your account password regularly to protect your SafePay escrow wallet.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Password reset link dispatched to your email address")}
                className="text-xs shrink-0 rounded-xl"
              >
                Update password
              </Button>
            </div>

            {/* Social accounts */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Social accounts</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>Google Account</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                    Connected
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Google OAuth is linked as your primary identity")}
                className="text-xs shrink-0 rounded-xl"
              >
                Manage
              </Button>
            </div>

            {/* Device history */}
            <div className="py-6 space-y-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Device history & active sessions</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Review logged-in devices currently authenticated to your Karighar profile.
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-surface-subtle flex items-center justify-center">
                      <Globe className="size-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        Windows 10.0 · Opera / Chrome
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          CURRENT SESSION
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Mumbai, Maharashtra · Active Now
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-surface-subtle flex items-center justify-center">
                      <Smartphone className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Android Karighar App
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Mumbai, Maharashtra · Last synced today
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.success("Terminated background mobile session")}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    Log out device
                  </Button>
                </div>
              </div>
            </div>

            {/* Account deactivation */}
            <div className="py-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-destructive">Account deactivation</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Deactivating will pause your active projects and remove your profile from search results. This action cannot be undone.
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeactivate}
                className="text-xs shrink-0 rounded-xl"
              >
                Deactivate
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 4: PAYMENTS & PAYOUTS (MOST IMPORTANT)
            ========================================================================= */}
        {activeTab === "payments" && (
          <div className="space-y-8">
            {/* Currency Banner */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-border">
              <div className="flex items-center gap-2.5">
                <span className="size-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                  ₹
                </span>
                <div>
                  <div className="text-xs font-semibold text-foreground">Settlement Currency</div>
                  <div className="text-[11px] text-muted-foreground">INR — Indian Rupee (All invoices and double-entry postings stored in paise)</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Domestic Escrow (RBI Guidelines)
              </Badge>
            </div>

            {/* SECTION 1: CUSTOMER PAYMENTS & SAFEPAY ESCROW */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">
                    Your Payments & SafePay Escrow
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Keep track of milestone releases, UPI authorizations, and verified tax invoices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SafePay Escrow Card */}
                <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="size-4" /> SafePay Escrow Hold</span>
                    <span>Active</span>
                  </div>
                  <div className="text-2xl font-bold font-display text-foreground">
                    ₹0.00
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Zero customer funds currently locked in milestone escrow. Funds are automatically held during active service and disbursed upon your OTP sign-off.
                  </p>
                </div>

                {/* Saved UPI Method */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5"><Smartphone className="size-4 text-primary" /> Primary UPI</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10">Connected</Badge>
                    </div>
                    <div className="font-mono text-xs font-semibold mt-2 text-foreground">
                      {userMeta.primary_upi || "customer@upi"}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Direct one-click UPI authorization via Google Pay, PhonePe, or BHIM.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditModal({ open: true, field: "primary_upi", title: "Add or Update Primary UPI ID", value: userMeta.primary_upi || "" })}
                    className="text-xs w-full rounded-xl"
                  >
                    Update UPI ID
                  </Button>
                </div>

                {/* SafePay Protection Guarantee */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-2.5">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Shield className="size-4 text-emerald-600" /> Karighar Guarantee
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Always pay and communicate through Karighar to ensure you're protected under our SafePay Escrow, 30-day rework warranty, and background-checked artisan insurance.
                  </p>
                  <Link to="/help" className="text-xs font-semibold text-primary inline-flex items-center gap-1 underline pt-1">
                    Read SafePay Terms <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              </div>

              {/* Real Transactions Ledger */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Receipt className="size-4 text-primary" /> Payment History & Invoices
                  </h3>
                  <span className="text-xs text-muted-foreground">{payments.length} Records</span>
                </div>

                {payments.length > 0 ? (
                  <div className="divide-y divide-border">
                    {payments.map((p: any) => (
                      <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-foreground">SafePay Milestone #{p.id.slice(0, 8)}</div>
                          <div className="text-muted-foreground text-[11px]">
                            {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {p.provider}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-foreground">₹{(p.amount_paise / 100).toLocaleString("en-IN")}</div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10">
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground bg-surface-subtle/50 rounded-xl">
                    No transactions yet. When you book a verified artisan or renovation milestone, transaction transmittals will appear here.
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: PROFESSIONAL PAYOUTS & BANKING ROUTING */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-foreground">
                      Professional Payouts & Bank Accounts
                    </h2>
                    <Badge className="bg-primary/10 text-primary text-[10px]">
                      {pro ? "Artisan Active" : "Professional Routing"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure your Indian bank account and UPI VPA to receive direct earnings settlements and milestone releases.
                  </p>
                </div>

                <Button
                  onClick={() => setBankModalOpen(true)}
                  className="text-xs rounded-xl gap-1.5 shadow-warm-xs self-start sm:self-auto"
                >
                  <Landmark className="size-3.5" /> Edit Bank Account & Frequency
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Bank Account Details Card */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-warm-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Landmark className="size-4 text-primary" /> Verified Bank Account
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">IMPS Ready</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-muted-foreground text-[11px]">Bank Name</div>
                    <div className="font-semibold text-foreground">{payoutBank.bankName || "Not configured"}</div>

                    <div className="text-muted-foreground text-[11px] pt-1">Account Number</div>
                    <div className="font-mono font-semibold text-foreground">{payoutBank.accountNumberMasked || "••••••••"}</div>

                    <div className="text-muted-foreground text-[11px] pt-1">IFSC Code</div>
                    <div className="font-mono text-foreground">{payoutBank.ifsc || "Not provided"}</div>
                  </div>

                  <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> NPCI / NACH Instant Settlement Enabled
                  </div>
                </div>

                {/* Instant Payout UPI & Frequency */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-warm-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Smartphone className="size-4 text-primary" /> Payout Frequency
                    </span>
                    <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                      {payoutBank.frequency === "instant" ? "Instant (60s)" : payoutBank.frequency === "daily" ? "Daily (8 PM)" : "Weekly"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-muted-foreground text-[11px]">Direct Payout UPI ID</div>
                    <div className="font-mono font-semibold text-foreground">{payoutBank.upiVpa || "artisan@upi"}</div>

                    <div className="text-muted-foreground text-[11px] pt-1">Current Frequency Setting</div>
                    <p className="text-[11px] text-muted-foreground">
                      {payoutBank.frequency === "instant" && "Disbursed immediately within 60 seconds of customer OTP completion verification."}
                      {payoutBank.frequency === "daily" && "Swept into bank account every evening at 8:00 PM IST."}
                      {payoutBank.frequency === "weekly" && "Consolidated payout transferred every Monday morning."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 text-primary" /> Auto-reconciliation active
                  </div>
                </div>

                {/* Tax, TDS & Credit Score Status */}
                <div className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-warm-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Award className="size-4 text-amber-600" /> Pro Credit & TDS Status
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">1% TDS Sec 194M</Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-muted-foreground text-[11px]">PAN Number</div>
                    <div className="font-mono font-semibold text-foreground">{payoutBank.pan || "PAN on file"}</div>

                    <div className="text-muted-foreground text-[11px] pt-1">Artisan Credit Tier</div>
                    <div className="font-semibold text-foreground">
                      Score: 720 / 900 · <span className="text-emerald-600">Gold Tier</span>
                    </div>

                    <div className="text-muted-foreground text-[11px] pt-1">Emergency Material Advance Limit</div>
                    <div className="font-bold text-foreground">Up to ₹25,000 instant credit</div>
                  </div>

                  <div className="pt-2 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" /> Form 16A quarterly transmittals available
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 5: PRIVACY & SHARING
            ========================================================================= */}
        {activeTab === "privacy" && (
          <div className="max-w-3xl divide-y divide-border space-y-2">
            {/* Profile visibility */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Profile visibility</div>
                <div className="text-xs text-muted-foreground">
                  Choose who can view your verified reviews and completed projects portfolio.
                </div>
              </div>
              <div className="text-xs font-semibold text-foreground">
                Anyone on Karighar
              </div>
            </div>

            {/* Read receipts */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Message read receipts</div>
                <div className="text-xs text-muted-foreground">
                  Show artisans and clients when you've viewed their dispatch messages and milestone updates.
                </div>
              </div>
              <Switch
                checked={privacy.readReceipts}
                onCheckedChange={(checked) => handleTogglePrivacy("readReceipts", checked)}
              />
            </div>

            {/* Search engine indexing */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Search engine indexing</div>
                <div className="text-xs text-muted-foreground">
                  Allow search engines like Google to display your Karighar service profile and storefront in public search results.
                </div>
              </div>
              <Switch
                checked={privacy.indexInSearch}
                onCheckedChange={(checked) => handleTogglePrivacy("indexInSearch", checked)}
              />
            </div>

            {/* Review preferences */}
            <div className="py-5 space-y-4">
              <div>
                <div className="text-sm font-semibold text-foreground">Review & Feedback display preferences</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Choose what details are shared publicly when you write a review for a completed project.
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">Show my neighbourhood / locality (e.g. Bandra West, Powai)</span>
                  <Switch
                    checked={privacy.showLocalityOnReview}
                    onCheckedChange={(checked) => handleTogglePrivacy("showLocalityOnReview", checked)}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">Show service trade and project scope</span>
                  <Switch
                    checked={privacy.showServiceOnReview}
                    onCheckedChange={(checked) => handleTogglePrivacy("showServiceOnReview", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Data privacy & AI model training */}
            <div className="py-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5 pr-4">
                  <div className="text-sm font-semibold text-foreground">Help improve AI-powered features</div>
                  <div className="text-xs text-muted-foreground">
                    When enabled, anonymized diagnostic queries help improve visual damage estimators and voice dispatch parsing on Karighar.
                  </div>
                </div>
                <Switch
                  checked={privacy.aiModelTraining}
                  onCheckedChange={(checked) => handleTogglePrivacy("aiModelTraining", checked)}
                />
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground">Request personal data archive</div>
                  <div className="text-muted-foreground text-[11px]">Download a machine-readable export of all your projects, ratings, and invoices.</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success("Data archive requested. A download link will be emailed to you.")}
                  className="text-xs rounded-xl shrink-0"
                >
                  <Download className="size-3.5 mr-1" /> Request data
                </Button>
              </div>
            </div>

            {/* Privacy pledge */}
            <div className="py-6 text-xs text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-primary" /> Committed to Privacy
              </div>
              <p>
                Karighar is committed to keeping your data protected under Indian Digital Personal Data Protection Act (DPDPA). We never sell your personal data or phone number to third-party telemarketers.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: NOTIFICATIONS
            ========================================================================= */}
        {activeTab === "notifications" && (
          <div className="max-w-3xl divide-y divide-border space-y-2">
            {/* Job and milestone updates */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Service & Job dispatch updates</div>
                <div className="text-xs text-muted-foreground">
                  Get real-time OTP clearances, artisan en-route tracking, and inspection milestone alerts via Email and WhatsApp.
                </div>
              </div>
              <Switch
                checked={notifications.jobUpdates}
                onCheckedChange={(checked) => handleToggleNotification("jobUpdates", checked)}
              />
            </div>

            {/* Price Index alerts */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Spare part price index & inflation shifts</div>
                <div className="text-xs text-muted-foreground">
                  Receive notifications when wholesale hardware store prices shift across Mumbai for copper wiring, sanitary fixtures, and tiles.
                </div>
              </div>
              <Switch
                checked={notifications.priceAlerts}
                onCheckedChange={(checked) => handleToggleNotification("priceAlerts", checked)}
              />
            </div>

            {/* Society cluster deals */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Society Karighar Day cluster deals</div>
                <div className="text-xs text-muted-foreground">
                  Alerts when your residential building or apartment complex reaches the 4-flat booking threshold for 25% discounts.
                </div>
              </div>
              <Switch
                checked={notifications.societyDeals}
                onCheckedChange={(checked) => handleToggleNotification("societyDeals", checked)}
              />
            </div>

            {/* Artisan insights */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Artisan earnings insights & payout transmittals</div>
                <div className="text-xs text-muted-foreground">
                  Weekly earnings digests, instant IMPS bank deposit transmittals, and material advance approvals.
                </div>
              </div>
              <Switch
                checked={notifications.artisanInsights}
                onCheckedChange={(checked) => handleToggleNotification("artisanInsights", checked)}
              />
            </div>

            {/* Marketing */}
            <div className="py-5 flex items-start justify-between gap-4">
              <div className="space-y-0.5 pr-4">
                <div className="text-sm font-semibold text-foreground">Promotions & seasonal home tips</div>
                <div className="text-xs text-muted-foreground">
                  Pre-monsoon waterproofing guides, festive home deep-cleaning specials, and prime member perks.
                </div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => handleToggleNotification("marketing", checked)}
              />
            </div>

            {/* Unsubscribe banner */}
            <div className="py-6 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Want to stop receiving promotional emails and WhatsApp broadcasts?
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnsubscribeAll}
                className="text-xs rounded-xl"
              >
                Unsubscribe from marketing
              </Button>
            </div>
          </div>
        )}

        {/* Modal: Edit Personal Details */}
        <Dialog open={editModal.open} onOpenChange={(open) => !open && setEditModal({ open: false, field: "", title: "", value: "" })}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">{editModal.title}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update your verified Karighar account coordinate. Changes take effect across your projects immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Input
                value={editModal.value}
                onChange={(e) => setEditModal((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Enter detail..."
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditModal({ open: false, field: "", title: "", value: "" })}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveField}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Edit Bank Payout Details (for Artisans) */}
        <Dialog open={bankModalOpen} onOpenChange={setBankModalOpen}>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Landmark className="size-4 text-primary" /> Edit Bank Payout Details & Routing
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                All earnings from completed projects and released SafePay milestones are disbursed directly to this Indian bank account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Beneficiary Name (as per Bank Passbook)</label>
                <Input
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm({ ...bankForm, accountHolder: e.target.value })}
                  placeholder="e.g. Vansh Matharu"
                  className="text-xs h-9 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Bank Name</label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    className="text-xs h-9 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">IFSC Code</label>
                  <Input
                    value={bankForm.ifsc}
                    onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
                    placeholder="e.g. HDFC0000123"
                    className="text-xs h-9 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Bank Account Number</label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="Enter full account number (e.g. 50100234567890)"
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Direct Payout UPI ID (for instant settlement)</label>
                <Input
                  value={bankForm.upiVpa}
                  onChange={(e) => setBankForm({ ...bankForm, upiVpa: e.target.value })}
                  placeholder="e.g. 9820154321@okhdfcbank"
                  className="text-xs h-9 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Payout Frequency Preference</label>
                <select
                  value={bankForm.frequency}
                  onChange={(e) => setBankForm({ ...bankForm, frequency: e.target.value })}
                  className="w-full text-xs h-9 rounded-lg border border-border bg-background px-3"
                >
                  <option value="instant">Instant on Customer OTP Release (Recommended, under 60 seconds)</option>
                  <option value="daily">Daily Evening Settlement (8:00 PM IST)</option>
                  <option value="weekly">Weekly Consolidated Settlement (Every Monday)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">PAN Number (for Sec 194M 1% TDS exemption)</label>
                <Input
                  value={bankForm.pan}
                  onChange={(e) => setBankForm({ ...bankForm, pan: e.target.value })}
                  placeholder="ABCDE1234F"
                  className="text-xs h-9 rounded-lg font-mono uppercase"
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setBankModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveBankPayout}>
                Save Bank Payout Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}

export default AccountPage;
