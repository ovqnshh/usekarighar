import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift,
  Award,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Coins,
  ChevronRight,
  Send,
  MessageCircle,
  Mail,
  Check,
  Info,
  CheckCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/karighar-api";
import {
  createArtisanReferralCore,
  getArtisanReferralsCore,
  advanceReferralMilestoneCore,
  getReferralStats,
  ArtisanReferral,
  ArtisanReferralStatus,
} from "@/lib/referrals/referral.functions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/refer")({
  head: () => ({
    meta: [
      { title: "Refer an Artisan & Earn ₹500 — Karighar" },
      {
        name: "description",
        content:
          "Refer skilled carpenters, plumbers, electricians, and painters to Karighar. Earn ₹500 directly in your account when they complete their first verified job.",
      },
    ],
  }),
  component: ReferPage,
});

const TRADES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Masonry & Civil",
  "Tiling & Granite",
  "AC & HVAC Technician",
  "Waterproofing",
  "Fabrication & Welding",
];

const MILESTONES: Array<{
  status: ArtisanReferralStatus;
  title: string;
  description: string;
  rewardText: string;
}> = [
  {
    status: "INVITED",
    title: "1. Referral Sent",
    description: "Invite generated with unique code & link sent via WhatsApp/Email.",
    rewardText: "Pending signup",
  },
  {
    status: "REGISTERED",
    title: "2. Artisan Joined",
    description: "Artisan signed up and submitted trade background details.",
    rewardText: "Pro earns ₹250 joining credit",
  },
  {
    status: "KYC_VERIFIED",
    title: "3. Trade & ID Vetted",
    description: "Aadhaar KYC & Karighar skill vetting passed 100%.",
    rewardText: "Eligible for doorstep jobs",
  },
  {
    status: "FIRST_JOB_COMPLETED",
    title: "4. 1st SafePay Job Done",
    description: "First client project delivered with OTP check & milestone release.",
    rewardText: "₹500 Reward unlocked!",
  },
  {
    status: "REWARD_DISBURSED",
    title: "5. Payout Credited",
    description: "₹500 transferred to your SafePay escrow wallet / instant UPI.",
    rewardText: "Paid ₹500",
  },
];

function ReferPage() {
  const { user } = useAuth();

  // Form State
  const [referrerName, setReferrerName] = useState("");
  const [referrerContact, setReferrerContact] = useState("");
  const [referredName, setReferredName] = useState("");
  const [referredContact, setReferredContact] = useState("");
  const [trade, setTrade] = useState("Plumbing");
  const [locality, setLocality] = useState("Mumbai");
  const [personalNote, setPersonalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal
  const [lastReferral, setLastReferral] = useState<ArtisanReferral | null>(null);
  const [shareLinks, setShareLinks] = useState<{
    joinUrl: string;
    whatsappUrl: string;
    mailtoUrl: string;
    message: string;
  } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active Referrals List & Stats
  const [referrals, setReferrals] = useState<ArtisanReferral[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  // Prefill user details if signed in
  useEffect(() => {
    if (user) {
      if (user.email && !referrerContact) {
        setReferrerContact(user.email);
      }
      const displayName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split("@")[0] : "");
      if (displayName && !referrerName) {
        setReferrerName(displayName);
      }
    }
  }, [user]);

  // Load existing referrals
  const loadReferrals = async () => {
    setIsLoadingReferrals(true);
    const res = await getArtisanReferralsCore(user?.id, referrerContact || undefined);
    if (res.ok) {
      setReferrals(res.referrals);
    }
    setIsLoadingReferrals(false);
  };

  useEffect(() => {
    loadReferrals();
  }, [user, referrerContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referredName.trim()) {
      toast.error("Please enter the artisan's full name");
      return;
    }

    if (!referredContact.trim()) {
      toast.error("Please enter the artisan's phone number or email");
      return;
    }

    if (!referrerContact.trim()) {
      toast.error("Please enter your phone or email so we can send your ₹500 reward");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createArtisanReferralCore({
        referrerUserId: user?.id,
        referrerName: referrerName.trim() || "A Karighar Member",
        referrerContact: referrerContact.trim(),
        referredName: referredName.trim(),
        referredContact: referredContact.trim(),
        trade,
        city: locality,
        personalNote: personalNote.trim() || undefined,
      });

      if (!res.ok || !res.referral) {
        toast.error(res.error || "Failed to create referral");
        return;
      }

      setLastReferral(res.referral);
      if (res.shareLinks) {
        setShareLinks(res.shareLinks);
      }
      setShowShareModal(true);
      toast.success("Artisan invitation generated successfully!");

      // Reset pro input fields
      setReferredName("");
      setReferredContact("");
      setPersonalNote("");

      // Refresh real referrals
      loadReferrals();
    } catch (err: any) {
      toast.error(err.message || "Failed to process referral");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareLinks?.joinUrl) return;
    navigator.clipboard.writeText(shareLinks.joinUrl);
    setCopied(true);
    toast.success("Referral invitation link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAdvanceMilestone = async (referral: ArtisanReferral) => {
    const nextMap: Record<ArtisanReferralStatus, ArtisanReferralStatus | null> = {
      INVITED: "REGISTERED",
      REGISTERED: "KYC_VERIFIED",
      KYC_VERIFIED: "FIRST_JOB_COMPLETED",
      FIRST_JOB_COMPLETED: "REWARD_DISBURSED",
      REWARD_DISBURSED: null,
    };

    const next = nextMap[referral.status];
    if (!next) return;

    toast.loading(`Advancing referral to ${next}...`, { id: "advance" });
    const res = await advanceReferralMilestoneCore(referral.id, next);
    if (res.ok && res.referral) {
      toast.success(`Milestone updated to ${next}!`, { id: "advance" });
      loadReferrals();
    } else {
      toast.error(res.error || "Failed to advance milestone", { id: "advance" });
    }
  };

  const stats = getReferralStats(referrals);

  return (
    <PageShell>
      <main className="min-h-screen pb-24 bg-surface-subtle/30">
        {/* Editorial Hero Banner */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/5 via-background to-background py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-5">
              <Gift className="size-3.5" />
              Artisan Referral Programme & Milestone Challenge
            </div>

            <h1 className="text-3xl sm:text-5xl font-display font-semibold text-foreground tracking-tight">
              Know a skilled artisan? <br />
              <span className="text-primary">Refer them and earn ₹500</span> directly.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Invite a master plumber, electrician, carpenter, or painter in Mumbai. When they verify their KYC and
              complete their first SafePay milestone, you receive ₹500 cash in your account, and they get ₹250 joining credit!
            </p>

            {/* Quick Metrics Bar */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-xs">
                <p className="text-xs text-muted-foreground font-medium">Your Reward</p>
                <p className="text-xl font-bold text-primary mt-0.5">₹500</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Direct to UPI / Wallet</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-xs">
                <p className="text-xs text-muted-foreground font-medium">Artisan Bonus</p>
                <p className="text-xl font-bold text-foreground mt-0.5">₹250</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Joining credit on 1st job</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-xs">
                <p className="text-xs text-muted-foreground font-medium">Platform Fee</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">0%</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">On artisan's first 3 jobs</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5 text-center shadow-xs">
                <p className="text-xs text-muted-foreground font-medium">Payout Speed</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">60 Sec</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">SafePay Escrow release</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content: Form & Milestone Progress */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Referral Invitation Form */}
            <div className="lg:col-span-7">
              <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-surface-subtle/50 border-b border-border/60 pb-5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                    <Send className="size-4" />
                    <span>Send Artisan Invitation</span>
                  </div>
                  <CardTitle className="text-xl font-display mt-1">Enter your artisan's details</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Enter their mobile number or email. We'll generate a personalized invitation with your name and referral code.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Referrer Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-surface-subtle/60 border border-border/70">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Your Name
                        </label>
                        <Input
                          required
                          placeholder="e.g. Vansh Matharu"
                          value={referrerName}
                          onChange={(e) => setReferrerName(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Your Phone or Email <span className="text-primary">*</span>
                        </label>
                        <Input
                          required
                          placeholder="Where we credit your ₹500"
                          value={referrerContact}
                          onChange={(e) => setReferrerContact(e.target.value)}
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>

                    {/* Artisan Details */}
                    <div className="space-y-3.5 pt-1">
                      <div>
                        <label className="text-xs font-semibold text-foreground block mb-1">
                          Artisan's Full Name <span className="text-primary">*</span>
                        </label>
                        <Input
                          required
                          placeholder="e.g. Ramesh Sharma"
                          value={referredName}
                          onChange={(e) => setReferredName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1">
                            Artisan's Mobile or Email <span className="text-primary">*</span>
                          </label>
                          <Input
                            required
                            placeholder="e.g. 9820199999 or pro@gmail.com"
                            value={referredContact}
                            onChange={(e) => setReferredContact(e.target.value)}
                            className="h-9 text-xs"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Indian 10-digit mobile number or active email
                          </p>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1">
                            Craft / Trade Skill <span className="text-primary">*</span>
                          </label>
                          <select
                            value={trade}
                            onChange={(e) => setTrade(e.target.value)}
                            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                          >
                            {TRADES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1">
                            City / Work Region
                          </label>
                          <Input
                            value={locality}
                            onChange={(e) => setLocality(e.target.value)}
                            placeholder="Mumbai"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-foreground block mb-1">
                            Personal Endorsement (Optional)
                          </label>
                          <Input
                            placeholder="e.g. Excellent tile fitting & clean finishing"
                            value={personalNote}
                            onChange={(e) => setPersonalNote(e.target.value)}
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 font-semibold gap-2 shadow-sm text-sm"
                      >
                        {isSubmitting ? (
                          <span>Generating Invitation...</span>
                        ) : (
                          <>
                            <Send className="size-4" />
                            Send Official Invitation & Unlock ₹500 Reward
                          </>
                        )}
                      </Button>
                      <p className="text-[11px] text-center text-muted-foreground mt-2">
                        You can immediately share the invitation on WhatsApp, Email, or copy the direct link.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: Milestone Progression Challenge Explainer */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
                <CardHeader className="pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                    <Award className="size-4" />
                    <span>How the Milestone Challenge Works</span>
                  </div>
                  <CardTitle className="text-lg font-display">4 Simple Steps to ₹500</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  {MILESTONES.map((m, idx) => (
                    <div key={m.status} className="flex items-start gap-3.5 relative">
                      {idx < MILESTONES.length - 1 && (
                        <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-border -mb-3" />
                      )}
                      <div className="size-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 z-10">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-foreground">{m.title}</h4>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-foreground">
                            {m.rewardText}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {m.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Guild Challenge Card */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background p-4.5 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                  <Sparkles className="size-4" />
                  <span>Guild Builder Monthly Challenge</span>
                </div>
                <p className="text-xs text-foreground font-medium">
                  Refer 3 verified artisans in 30 days & unlock an extra <strong>₹1,000 cash bonus</strong>!
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Current Challenge Progress:</span>
                  <span className="font-semibold text-foreground">
                    {stats.kycVerified} / 3 Artisans Vetted
                  </span>
                </div>
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.kycVerified / 3) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* User's Active Referrals Section */}
          <section className="mt-14 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
                  Your Active Referrals & Rewards
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Track real-time KYC validation, first project milestones, and cash rewards.
                </p>
              </div>

              {/* Stats pill counter */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  Invited: <strong className="ml-1 text-foreground">{stats.totalInvited}</strong>
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  Jobs Done: <strong className="ml-1 text-emerald-600">{stats.jobsCompleted}</strong>
                </Badge>
                <Badge variant="default" className="px-3 py-1 text-xs font-semibold">
                  Earned: ₹{(stats.rewardsEarnedPaise / 100).toLocaleString("en-IN")}
                </Badge>
              </div>
            </div>

            {isLoadingReferrals ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading your active referrals...
              </div>
            ) : referrals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <Gift className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No artisan referrals yet</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-5">
                  You haven't invited any artisans yet. Use the form above to refer your trusted plumber, electrician,
                  or carpenter and start tracking your ₹500 rewards.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {referrals.map((r) => {
                  const statusColors: Record<ArtisanReferralStatus, string> = {
                    INVITED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300",
                    REGISTERED: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
                    KYC_VERIFIED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
                    FIRST_JOB_COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
                    REWARD_DISBURSED: "bg-emerald-600 text-white border-emerald-700",
                  };

                  return (
                    <Card key={r.id} className="border-border shadow-xs rounded-xl overflow-hidden">
                      <CardContent className="p-4 space-y-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-foreground">{r.referred_name}</h3>
                              <Badge variant="outline" className="text-[10px] py-0 px-2">
                                {r.trade}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {r.contact_type === "PHONE" ? `+91 ${r.referred_contact}` : r.referred_contact} • {r.city}
                            </p>
                          </div>

                          <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColors[r.status]}`}>
                            {r.status.replace(/_/g, " ")}
                          </div>
                        </div>

                        {/* Referral Code & Date */}
                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-surface-subtle border border-border/60">
                          <span className="text-muted-foreground text-[11px]">
                            Referral Code: <strong className="font-mono text-foreground font-semibold ml-1">{r.referral_code}</strong>
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {new Date(r.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Milestone Stepper */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
                            <span>Challenge Milestone</span>
                            <span className="text-primary font-semibold">
                              {r.status === "REWARD_DISBURSED" ? "₹500 Rewarded" : "₹500 Pending 1st Job"}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 h-1.5">
                            {["INVITED", "REGISTERED", "KYC_VERIFIED", "FIRST_JOB_COMPLETED", "REWARD_DISBURSED"].map((s, idx) => {
                              const order = ["INVITED", "REGISTERED", "KYC_VERIFIED", "FIRST_JOB_COMPLETED", "REWARD_DISBURSED"];
                              const currIdx = order.indexOf(r.status);
                              const isComplete = idx <= currIdx;
                              return (
                                <div
                                  key={s}
                                  className={`rounded-full transition-all ${
                                    isComplete ? "bg-primary" : "bg-muted"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Simulation / Progression Controls */}
                        {r.status !== "REWARD_DISBURSED" && (
                          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              Simulate artisan journey:
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAdvanceMilestone(r)}
                              className="h-7 text-[11px] rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/5"
                            >
                              <span>Next Milestone</span>
                              <ChevronRight className="size-3" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-border pt-12 max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-display font-semibold text-foreground">
                Frequently Asked Questions
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Everything you need to know about Karighar's artisan referral programme.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                  When do I receive my ₹500 referral reward?
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Your ₹500 reward is unlocked the moment your referred artisan completes their first verified job on Karighar
                  and the customer verifies the Completion OTP. You can withdraw it instantly to your UPI ID or use it for your own home services.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                  What does the artisan get?
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  The artisan receives a <strong>₹250 joining cash bonus</strong> credited directly to their wallet upon completion
                  of their first milestone, plus <strong>0% platform commission on their first 3 doorstep jobs</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                  How does Karighar verify the artisan?
                </h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Our Trust & Safety team conducts digital Aadhaar verification, past work inspection, and a telephone or in-person skill assessment before assigning doorstep customer leads.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Share Invitation Modal */}
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card">
            <DialogHeader>
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                <Gift className="size-5" />
              </div>
              <DialogTitle className="text-lg font-display">Invitation Created!</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your referral invitation for <strong>{lastReferral?.referred_name}</strong> is ready to send.
              </DialogDescription>
            </DialogHeader>

            {shareLinks && (
              <div className="space-y-4 pt-2">
                {/* Referral Code Box */}
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Unique Referral Code
                    </span>
                    <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                      {lastReferral?.referral_code}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-8 text-xs gap-1.5 rounded-lg"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>

                {/* Instant Share Actions */}
                <div className="space-y-2">
                  <a
                    href={shareLinks.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <MessageCircle className="size-4" />
                    Share via WhatsApp
                  </a>

                  <a
                    href={shareLinks.mailtoUrl}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-border bg-background text-foreground font-medium text-xs hover:bg-surface-subtle transition-colors"
                  >
                    <Mail className="size-4" />
                    Send Invitation Email
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Info className="size-4 text-primary shrink-0" />
                  <span>
                    When {lastReferral?.referred_name} verifies KYC and finishes their 1st job, ₹500 is credited to your account!
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </PageShell>
  );
}
