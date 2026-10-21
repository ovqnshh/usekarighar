import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck, AlertTriangle, Users, Sliders, IndianRupee,
  FileSpreadsheet, Activity, Building2, CheckCircle2, RefreshCw,
  Search, Check, X, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DEFAULT_POLICIES } from "@/lib/catalog";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Karighar Central Operations Console" }] }),
  component: AdminConsolePage,
});

type AdminTab = "live_ops" | "policies" | "kyc_queue" | "ledger_finance" | "compliance";

function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("live_ops");
  const [policies, setPolicies] = useState({
    commissionRate: 15,
    inspectionFeeElectrical: 199,
    cashWalletLimit: 2500,
    offerTimeoutSeconds: 45,
    escrowAutoReleaseHours: 48,
  });

  const [activeSos] = useState([
    {
      id: "sos-101",
      jobId: "job-8841",
      triggeredBy: "Arjun Nair (Karigar)",
      severity: "critical",
      location: "Lokhandwala, Andheri West",
      time: "2 mins ago",
      status: "In Triage",
    },
  ]);

  const [kycQueue, setKycQueue] = useState([
    {
      id: "pro-992",
      name: "Suresh Patil",
      trade: "AC & Appliance Repair",
      tierRequested: "Verified",
      digiLockerMatch: "Aadhaar eKYC Verified (Name match 98%)",
      policeClearance: "Uploaded (Ref: POL-MH-2026-991)",
      skillScore: "88% on Appliance Diagnosis Quiz",
      status: "pending",
    },
  ]);

  const handleSavePolicies = () => {
    toast.success("Policies updated successfully!", {
      description: "Changes are active across Mumbai and Pune zones instantly.",
    });
  };

  const handleApproveKyc = (id: string) => {
    setKycQueue((prev) => prev.filter((k) => k.id !== id));
    toast.success("Karigar verified & unlocked for on-demand dispatch!");
  };

  return (
    <div className="min-h-screen bg-[#1A1411] text-[#F5EDE7] font-sans pb-12 selection:bg-primary">
      {/* Admin Top Header */}
      <header className="border-b border-[#3A2E27] bg-[#231B17] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-xl font-bold tracking-tight text-white">
            KARIGHAR OPS CONSOLE
          </span>
          <Badge variant="default" className="text-[10px] bg-primary text-white">
            ROLE: SUPER-ADMIN
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <Activity className="size-3.5" /> All Systems 99.98% Healthy
          </span>
          <Link to="/" className="text-neutral-400 hover:text-white underline ml-4">
            Exit to Storefront
          </Link>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="border-b border-[#3A2E27] bg-[#201814] px-6">
        <div className="flex gap-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: "live_ops", label: "Live Operations & SOS Alerts", icon: Activity },
            { id: "policies", label: "Configurable Policies & Fees", icon: Sliders },
            { id: "kyc_queue", label: "Supply Verification Queue", icon: ShieldCheck },
            { id: "ledger_finance", label: "Ledger & Cash Wallets", icon: IndianRupee },
            { id: "compliance", label: "Social Security Code & Compliance", icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 py-3.5 border-b-2 transition-all whitespace-nowrap ${
                  isActive ? "border-primary text-primary" : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Admin Workspace */}
      <main className="max-w-7xl mx-auto p-6">
        {/* TAB 1: Live Ops & SOS Alerts */}
        {activeTab === "live_ops" && (
          <div className="space-y-6">
            {/* SOS Incident Banner */}
            {activeSos.length > 0 && (
              <div className="rounded-2xl border-2 border-red-500 bg-red-950/20 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-red-400 font-bold text-sm tracking-wide">
                    <ShieldAlert className="size-5" /> 1 ACTIVE EMERGENCY SOS ALERT
                  </span>
                  <Badge variant="destructive" className="animate-pulse">CRITICAL</Badge>
                </div>

                {activeSos.map((sos) => (
                  <div key={sos.id} className="p-4 rounded-xl bg-[#231B17] border border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-base">{sos.triggeredBy}</p>
                      <p className="text-xs text-neutral-400">{sos.location} · {sos.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="outline" className="border-neutral-700 text-xs" onClick={() => toast.info("Police Liaison protocol dispatched with coordinates.")}>
                        Alert Local Police Station
                      </Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold" onClick={() => toast.success("Connected to caller line.")}>
                        Open Direct Audio Line
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Job Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Active Jobs In Progress", val: "142", sub: "Mumbai & Pune" },
                { label: "Avg Dispatch Latency", val: "18.4s", sub: "Target < 45s" },
                { label: "Daily Escrow Held", val: "₹4,82,500", sub: "100% Balanced" },
                { label: "Cash Wallet Deficit Total", val: "₹34,120", sub: "12 Pros near limit" },
              ].map((s, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#231B17] border border-[#3A2E27]">
                  <span className="text-xs text-neutral-400 block">{s.label}</span>
                  <span className="text-2xl font-bold text-white mt-1 block font-mono">{s.val}</span>
                  <span className="text-[11px] text-primary mt-1 block">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Configurable Policies (Zero Hardcoding) */}
        {activeTab === "policies" && (
          <div className="max-w-2xl rounded-2xl border border-[#3A2E27] bg-[#231B17] p-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Dynamic Marketplace Policies</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Configure commission scales, inspection fees, and safety thresholds without redeploying code.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Platform Commission Rate (%)
                </label>
                <Input
                  type="number"
                  value={policies.commissionRate}
                  onChange={(e) => setPolicies({ ...policies, commissionRate: Number(e.target.value) })}
                  className="bg-[#1A1411] border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Electrical Diagnostic Visit Fee (₹)
                </label>
                <Input
                  type="number"
                  value={policies.inspectionFeeElectrical}
                  onChange={(e) => setPolicies({ ...policies, inspectionFeeElectrical: Number(e.target.value) })}
                  className="bg-[#1A1411] border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Maximum Cash Wallet Deficit (₹) Before Blocking Gigs
                </label>
                <Input
                  type="number"
                  value={policies.cashWalletLimit}
                  onChange={(e) => setPolicies({ ...policies, cashWalletLimit: Number(e.target.value) })}
                  className="bg-[#1A1411] border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  On-Demand Offer Cascade Timeout (seconds)
                </label>
                <Input
                  type="number"
                  value={policies.offerTimeoutSeconds}
                  onChange={(e) => setPolicies({ ...policies, offerTimeoutSeconds: Number(e.target.value) })}
                  className="bg-[#1A1411] border-neutral-700 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                  Escrow Auto-Release Window (hours after completion)
                </label>
                <Input
                  type="number"
                  value={policies.escrowAutoReleaseHours}
                  onChange={(e) => setPolicies({ ...policies, escrowAutoReleaseHours: Number(e.target.value) })}
                  className="bg-[#1A1411] border-neutral-700 text-white"
                />
              </div>
            </div>

            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white font-bold" onClick={handleSavePolicies}>
              Save & Propagate Rules
            </Button>
          </div>
        )}

        {/* TAB 3: KYC Verification Queue */}
        {activeTab === "kyc_queue" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white">Pending Karigar Verifications</h2>
            {kycQueue.map((pro) => (
              <div key={pro.id} className="p-6 rounded-2xl bg-[#231B17] border border-[#3A2E27] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{pro.name}</h3>
                    <p className="text-xs text-neutral-400">{pro.trade}</p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                    Applying for Tier: {pro.tierRequested}
                  </Badge>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs bg-[#1A1411] p-4 rounded-xl border border-neutral-800">
                  <div>
                    <span className="text-neutral-500 block">DigiLocker Identity:</span>
                    <span className="text-emerald-400 font-semibold">{pro.digiLockerMatch}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Police Clearance:</span>
                    <span className="text-neutral-200 font-semibold">{pro.policeClearance}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">Skill Assessment:</span>
                    <span className="text-emerald-400 font-semibold">{pro.skillScore}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" size="sm" className="border-neutral-700 text-neutral-300">
                    Request More Evidence
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" onClick={() => handleApproveKyc(pro.id)}>
                    Approve & Activate Karigar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: Ledger & Finance */}
        {activeTab === "ledger_finance" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white">Double-Entry Ledger Chart of Accounts</h2>
            <div className="overflow-x-auto rounded-2xl border border-[#3A2E27] bg-[#231B17]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1A1411] text-neutral-400 border-b border-[#3A2E27]">
                  <tr>
                    <th className="p-4">Account Code</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Classification</th>
                    <th className="p-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A2E27] text-neutral-200">
                  <tr>
                    <td className="p-4 font-mono">1010-CUST-ESCROW</td>
                    <td className="p-4 font-semibold">Customer Escrow Funds Held</td>
                    <td className="p-4 text-amber-400">Liability</td>
                    <td className="p-4 text-right font-mono font-bold">₹4,82,500.00</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono">2010-PLATFORM-REV</td>
                    <td className="p-4 font-semibold">Platform Commission Revenue</td>
                    <td className="p-4 text-emerald-400">Revenue</td>
                    <td className="p-4 text-right font-mono font-bold">₹72,375.00</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono">2020-GST-PAYABLE</td>
                    <td className="p-4 font-semibold">GST Output Tax Payable (18%)</td>
                    <td className="p-4 text-neutral-400">Liability</td>
                    <td className="p-4 text-right font-mono font-bold">₹13,027.50</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono">3010-PRO-PAYABLE</td>
                    <td className="p-4 font-semibold">Karigar Service Earnings Payable</td>
                    <td className="p-4 text-neutral-400">Liability</td>
                    <td className="p-4 text-right font-mono font-bold">₹3,97,097.50</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-mono">1020-CASH-RECEIVABLE</td>
                    <td className="p-4 font-semibold">Karigar Cash Commission Receivable</td>
                    <td className="p-4 text-sky-400">Asset</td>
                    <td className="p-4 text-right font-mono font-bold">₹34,120.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: Statutory Compliance */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Statutory Gig-Worker Registry & Social Security Code 2025/2026
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Automated compliance module generating mandatory Central Social Security Board contributions and e-Shram registry exports.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#231B17] border border-[#3A2E27]">
                <span className="text-xs text-neutral-400 block">Total Active Partners</span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">1,280</span>
                <span className="text-[11px] text-emerald-400 mt-1 block">100% e-Shram UAN Linked</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#231B17] border border-[#3A2E27]">
                <span className="text-xs text-neutral-400 block">Statutory Welfare Fee (1.5%)</span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">₹5,956.46</span>
                <span className="text-[11px] text-neutral-400 mt-1 block">FY 2026-2027 Contribution</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#231B17] border border-[#3A2E27]">
                <span className="text-xs text-neutral-400 block">State Welfare Cess (1%)</span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">₹3,970.97</span>
                <span className="text-[11px] text-neutral-400 mt-1 block">Maharashtra & Karnataka</span>
              </div>
            </div>

            <Button
              className="bg-primary hover:bg-primary/90 text-white font-bold text-sm"
              onClick={() => toast.success("Exported e-Shram statutory audit CSV!")}
            >
              Export e-Shram & Social Security Registry File
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
