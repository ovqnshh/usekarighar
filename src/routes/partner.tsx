import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Power, MapPin, Navigation, Clock, ShieldCheck, CheckCircle2,
  AlertTriangle, Phone, PhoneForwarded, IndianRupee, Camera,
  FileText, ArrowRight, Bell, Sparkles, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { settleCashJob } from "@/lib/ledger";

export const Route = createFileRoute("/partner")({
  head: () => ({ meta: [{ title: "Karighar Partner App — Partner Mode" }] }),
  component: KarigarPartnerPage,
});

type JobStep = "offer" | "en_route" | "arrived" | "in_progress" | "collect_payment" | "completed";

function KarigarPartnerPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeStep, setActiveStep] = useState<JobStep>("offer");
  const [offerCountdown, setOfferCountdown] = useState(45);
  const [startOtp, setStartOtp] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [walletBalance, setWalletBalance] = useState(-450); // deficit balance example
  const [cashCollected, setCashCollected] = useState(1200);
  const [sosActive, setSosActive] = useState(false);

  // Timed dispatch countdown for the offer
  useEffect(() => {
    if (activeStep !== "offer" || !isOnline) return;
    const timer = setInterval(() => {
      setOfferCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Offer timed out. Cascading to next Karigar nearby.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeStep, isOnline]);

  const handleVerifyOtp = () => {
    if (startOtp === "4821" || startOtp.length === 4) {
      setIsOtpVerified(true);
      setActiveStep("in_progress");
      toast.success("Start OTP Confirmed! Work is officially in progress.", {
        description: "Customer has been notified in their app.",
      });
    } else {
      toast.error("Invalid Start OTP. Please ask the customer at the door.");
    }
  };

  const handleCompleteJob = async () => {
    const result = await settleCashJob({
      projectId: "proj-8841-demo",
      professionalId: "arjun-nair-demo",
      totalAmount: cashCollected,
      currentWalletBalance: walletBalance,
    });
    setWalletBalance(result.updatedWalletBalance);
    setActiveStep("completed");
    toast.success("Job completed and settled!", {
      description: `₹${result.commissionDebited} commission recorded to Karighar wallet.`,
    });
  };

  const triggerEmergencySOS = () => {
    setSosActive(true);
    toast.error("EMERGENCY SOS BROADCASTED", {
      description: "24/7 Ops Center alerted with live GPS coordinates.",
    });
  };

  return (
    <div className="min-h-screen bg-[#1F1916] text-[#F5EDE7] font-sans pb-16 selection:bg-primary">
      {/* High-Contrast Partner Top Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#3A2E27] bg-[#231B17] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-white tracking-wide">
            कारिगर PARTNER
          </span>
          <Badge variant="default" className="text-[10px] bg-primary text-white">
            TIER: VERIFIED
          </Badge>
        </div>

        {/* Big Online/Offline Switch */}
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            toast.info(isOnline ? "You are now OFFLINE" : "You are now ONLINE & ready for jobs");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 ${
            isOnline ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400 border border-neutral-700"
          }`}
        >
          <Power className="size-3.5" />
          <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
        </button>
      </header>

      {/* Wallet Deficit Status Bar */}
      <div className="bg-[#2A211C] border-b border-[#3A2E27] px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <IndianRupee className="size-4 text-primary" />
          <span className="text-neutral-300">Cash Gig Wallet:</span>
          <span className={`font-mono font-bold ${walletBalance < 0 ? "text-amber-400" : "text-emerald-400"}`}>
            ₹{walletBalance} (Limit: ₹2,500)
          </span>
        </div>
        <Link to="/dashboard" className="text-primary font-semibold underline text-[11px]">
          View Full Statements
        </Link>
      </div>

      {/* Main Partner Content */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* STEP 1: Incoming Timed Job Offer */}
        {activeStep === "offer" && (
          <div className="rounded-2xl border-2 border-primary bg-[#281F1A] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Bell className="size-3.5 animate-bounce" /> New Job Offer Nearby
              </span>
              <span className="font-mono text-sm font-bold bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                00:{offerCountdown.toString().padStart(2, "0")}
              </span>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Bathroom Tap & Valve Leakage</h2>
              <p className="text-xs text-neutral-300 mt-1 flex items-center gap-1">
                <MapPin className="size-3 text-neutral-400" /> Andheri West, Lokhandwala (2.4 km away)
              </p>
            </div>

            {/* Earnings Preview */}
            <div className="p-4 rounded-xl bg-[#1E1714] border border-[#3A2E27] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block uppercase">Estimated Payout</span>
                <span className="text-2xl font-bold text-emerald-400">₹850</span>
              </div>
              <Badge variant="outline" className="border-neutral-700 text-neutral-300 text-xs">
                Visit & Quote
              </Badge>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                className="h-12 border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-bold"
                onClick={() => toast.info("Offer declined.")}
              >
                Pass
              </Button>
              <Button
                className="h-12 bg-primary hover:bg-primary/90 text-white text-base font-bold shadow-lg"
                onClick={() => {
                  setActiveStep("en_route");
                  toast.success("Job Accepted! Customer is expecting your arrival.");
                }}
              >
                Accept Job
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: En Route with Masked Calling */}
        {activeStep === "en_route" && (
          <div className="rounded-2xl border border-[#3A2E27] bg-[#281F1A] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A2E27]">
              <span className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1">
                <Navigation className="size-3.5" /> En Route to Customer
              </span>
              <span className="text-xs text-neutral-400">ETA: 14 mins</span>
            </div>

            <div>
              <h3 className="font-bold text-white text-base">Ramesh Sharma</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Building 4B, Flat 302, Lokhandwala Complex</p>
            </div>

            {/* Masked Call Trigger (Protects personal numbers) */}
            <div className="p-3.5 rounded-xl bg-[#1E1714] border border-[#3A2E27] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500/20 grid place-items-center">
                  <PhoneForwarded className="size-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Masked Call Line</span>
                  <span className="text-[10px] text-neutral-400">Customer will not see your private number</span>
                </div>
              </div>
              <Button
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-500 text-xs"
                onClick={() => toast.info("Connecting via Karighar Secure Masked Telephony...")}
              >
                Call
              </Button>
            </div>

            <Button
              className="w-full h-12 bg-primary text-white font-bold text-sm"
              onClick={() => setActiveStep("arrived")}
            >
              I Have Arrived at Doorstep
            </Button>
          </div>
        )}

        {/* STEP 3: Arrived & Exchange Start OTP at the door */}
        {activeStep === "arrived" && (
          <div className="rounded-2xl border-2 border-amber-500 bg-[#281F1A] p-5 space-y-4 shadow-2xl">
            <div className="text-center pb-2">
              <ShieldCheck className="size-10 text-amber-400 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">Enter Customer Start OTP</h3>
              <p className="text-xs text-neutral-300 mt-1">
                Ask the customer at the door for their 4-digit code to start the job.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                type="text"
                maxLength={4}
                value={startOtp}
                onChange={(e) => setStartOtp(e.target.value)}
                placeholder="e.g. 4821"
                className="h-14 text-center font-mono text-2xl tracking-widest bg-[#1E1714] border-neutral-700 text-white placeholder:text-neutral-600"
              />
              <Button
                size="xl"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
                onClick={handleVerifyOtp}
              >
                Verify OTP & Start Work
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Work In Progress & Mandatory Before/After Evidence */}
        {activeStep === "in_progress" && (
          <div className="rounded-2xl border border-[#3A2E27] bg-[#281F1A] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A2E27]">
              <span className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4" /> Work Officially In Progress
              </span>
              <span className="text-xs text-neutral-400">Job #8841</span>
            </div>

            {/* Mandatory Evidence Upload */}
            <div className="p-4 rounded-xl bg-[#1E1714] border border-[#3A2E27] space-y-3">
              <span className="text-xs font-semibold text-neutral-300 block flex items-center gap-1.5">
                <Camera className="size-4 text-primary" /> Mandatory Work Evidence
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400">
                <div className="p-3 border border-dashed border-neutral-700 rounded-lg text-center hover:bg-neutral-800 cursor-pointer">
                  📸 Before Photo Uploaded
                </div>
                <div className="p-3 border border-dashed border-primary/50 text-primary rounded-lg text-center hover:bg-primary/10 cursor-pointer">
                  + Capture After Photo
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 bg-primary text-white font-bold text-sm"
              onClick={() => setActiveStep("collect_payment")}
            >
              Work Completed → Collect Payment
            </Button>
          </div>
        )}

        {/* STEP 5: Payment Collection (Cash Settlement) */}
        {activeStep === "collect_payment" && (
          <div className="rounded-2xl border border-[#3A2E27] bg-[#281F1A] p-5 space-y-4">
            <h3 className="font-bold text-white text-lg">Collect Payment</h3>
            <div className="p-4 rounded-xl bg-[#1E1714] border border-[#3A2E27] space-y-2">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Labour & Inspection:</span>
                <span className="text-white font-medium">₹850</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Consumable Parts (Brass Valve):</span>
                <span className="text-white font-medium">₹350</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#3A2E27]">
                <span>Total Cash Due:</span>
                <span className="text-emerald-400 font-mono">₹{cashCollected}</span>
              </div>
            </div>

            <Button
              size="xl"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              onClick={handleCompleteJob}
            >
              Confirm Cash Received (₹{cashCollected})
            </Button>
          </div>
        )}

        {/* STEP 6: Completed State */}
        {activeStep === "completed" && (
          <div className="rounded-2xl border border-emerald-500/40 bg-[#281F1A] p-6 text-center space-y-3">
            <CheckCircle2 className="size-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Job Successfully Settled</h3>
            <p className="text-xs text-neutral-300">
              Warranty card sent to customer. Your cash gig wallet has been updated.
            </p>
            <Button
              className="w-full mt-4 bg-primary text-white font-semibold"
              onClick={() => {
                setActiveStep("offer");
                setOfferCountdown(45);
              }}
            >
              Ready for Next Job
            </Button>
          </div>
        )}

        {/* Emergency SOS Button for Karigar Safety */}
        <div className="pt-4">
          <button
            onClick={triggerEmergencySOS}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center justify-center gap-2 transition-all ${
              sosActive
                ? "bg-red-600 text-white border-red-500 animate-pulse"
                : "bg-red-950/40 text-red-400 border-red-900/80 hover:bg-red-900/40"
            }`}
          >
            <AlertTriangle className="size-4" />
            {sosActive ? "EMERGENCY SOS ACTIVE · OPS DISPATCHED" : "Karigar Emergency SOS"}
          </button>
        </div>
      </main>
    </div>
  );
}
