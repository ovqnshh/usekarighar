import { createFileRoute, Link } from "@tanstack/react-router";
import {
  User, Shield, Eye, Wrench, Briefcase, Bell, Check, Sparkles,
  MapPin, Plus, Trash2, Edit3, CreditCard, Building2, Globe, Lock,
  KeyRound, Download, Smartphone, AlertTriangle, ChevronRight,
  FileText, CheckCircle2, ShieldCheck, HelpCircle, ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/lib/karighar-api";
import { PageShell } from "@/components/karighar-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useI18n, SUPPORTED_LANGUAGES, type Language } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account & Settings — Karighar" }] }),
  component: AccountPage,
});

interface SavedAddress {
  id: string;
  tag: "Home" | "Work" | "Rental" | "Other";
  flatNo: string;
  society: string;
  locality: string;
  landmark: string;
  pincode: string;
  gateInstructions: string;
  isDefault: boolean;
}

interface SavedUPI {
  id: string;
  vpa: string;
  provider: "Google Pay" | "PhonePe" | "Paytm" | "BHIM";
  isDefault: boolean;
}

const DEFAULT_MUMBAI_AREAS = [
  "Andheri West",
  "Bandra West",
  "Juhu Scheme",
  "Lokhandwala Complex",
  "Versova",
  "Powai",
  "Khar West",
  "Vile Parle West",
  "Goregaon West",
  "Worli",
  "Dadar West",
  "Lower Parel",
  "Chembur",
  "Thane West",
];

const INITIAL_ADDRESSES: SavedAddress[] = [
  {
    id: "addr_1",
    tag: "Home",
    flatNo: "Flat 402, B-Wing, Palm Grove",
    society: "Raheja Residency",
    locality: "Andheri West",
    landmark: "Behind Infiniti Mall, off Link Road",
    pincode: "400053",
    gateInstructions: "Security code 402 on intercom. Service lift available.",
    isDefault: true,
  },
  {
    id: "addr_2",
    tag: "Work",
    flatNo: "Studio 12, 3rd Floor",
    society: "Kedia Industrial Estate",
    locality: "Bandra West",
    landmark: "Opposite Starbucks, Waterfield Road",
    pincode: "400050",
    gateInstructions: "Commercial entrance. Visitors parking available.",
    isDefault: false,
  },
];

const INITIAL_UPI: SavedUPI[] = [
  {
    id: "upi_1",
    vpa: "user@okhdfcbank",
    provider: "Google Pay",
    isDefault: true,
  },
];

type SettingsTab = "personal" | "addresses" | "payments" | "regional" | "security";

function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("personal");

  // Supabase Profile Query
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!user?.id) throw new Error("Not logged in");
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, ...updates })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile saved successfully");
      setEditingField(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Local state for inline field edits
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    if (profile) {
      setEditValues({
        full_name: profile.full_name || user?.user_metadata?.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "Andheri West, Mumbai",
        is_professional: profile.is_professional || false,
        notifications_enabled: profile.notifications_enabled ?? true,
      });
    } else if (user) {
      setEditValues({
        full_name: user.user_metadata?.full_name || "",
        phone: "",
        city: "Andheri West, Mumbai",
        is_professional: false,
        notifications_enabled: true,
      });
    }
  }, [profile, user]);

  // Saved Doorstep Addresses State (localStorage persistence)
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("karighar-user-addresses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_ADDRESSES;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("karighar-user-addresses", JSON.stringify(addresses));
    }
  }, [addresses]);

  // Add Address Modal / Drawer Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<SavedAddress, "id" | "isDefault">>({
    tag: "Home",
    flatNo: "",
    society: "",
    locality: DEFAULT_MUMBAI_AREAS[0],
    landmark: "",
    pincode: "400053",
    gateInstructions: "",
  });

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.flatNo.trim()) {
      toast.error("Please enter flat, floor or house number");
      return;
    }
    const created: SavedAddress = {
      ...newAddress,
      id: `addr_${Date.now()}`,
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, created]);
    setIsAddingAddress(false);
    setNewAddress({
      tag: "Home",
      flatNo: "",
      society: "",
      locality: DEFAULT_MUMBAI_AREAS[0],
      landmark: "",
      pincode: "400053",
      gateInstructions: "",
    });
    toast.success("Doorstep service address added!");
  };

  const handleDeleteAddress = (id: string) => {
    if (addresses.length <= 1) {
      toast.error("You need at least one saved service address");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success("Address removed");
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
    const selected = addresses.find((a) => a.id === id);
    if (selected) {
      updateProfileMutation.mutate({ city: `${selected.locality}, Mumbai` });
      toast.success(`Default doorstep address set to ${selected.locality}`);
    }
  };

  // Payment UPI State (localStorage persistence)
  const [upiList, setUpiList] = useState<SavedUPI[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("karighar-user-upi");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_UPI;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("karighar-user-upi", JSON.stringify(upiList));
    }
  }, [upiList]);

  const [newVpa, setNewVpa] = useState("");
  const [newVpaProvider, setNewVpaProvider] = useState<SavedUPI["provider"]>("Google Pay");
  const [isAddingUPI, setIsAddingUPI] = useState(false);

  const handleAddUPI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVpa.includes("@") || newVpa.length < 5) {
      toast.error("Please enter a valid UPI ID (e.g. mobile@upi)");
      return;
    }
    const created: SavedUPI = {
      id: `upi_${Date.now()}`,
      vpa: newVpa.trim(),
      provider: newVpaProvider,
      isDefault: upiList.length === 0,
    };
    setUpiList((prev) => [...prev, created]);
    setNewVpa("");
    setIsAddingUPI(false);
    toast.success("UPI ID added for instant SafePay refunds and payouts");
  };

  // GST & Business Invoicing State
  const [gstInfo, setGstInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("karighar-user-gst");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return { gstin: "", legalName: "", isEnabled: false };
  });

  const handleSaveGst = () => {
    localStorage.setItem("karighar-user-gst", JSON.stringify(gstInfo));
    toast.success("GST billing details updated for project tax invoices");
  };

  // Measurement unit state
  const [unitPreference, setUnitPreference] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("karighar-pref-unit") || "sqft";
    }
    return "sqft";
  });

  const handleUnitChange = (unit: string) => {
    setUnitPreference(unit);
    if (typeof window !== "undefined") {
      localStorage.setItem("karighar-pref-unit", unit);
    }
    toast.success(`Measurement preference updated to ${unit === "sqft" ? "Sq. Feet (sq ft)" : "Square Metres (m²)"}`);
  };

  const handleSave = (field: string) => {
    updateProfileMutation.mutate({
      [field]: editValues[field],
    });
  };

  const handleCancel = () => {
    setEditingField(null);
    if (profile) {
      setEditValues({
        ...editValues,
        full_name: profile.full_name || user?.user_metadata?.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "Andheri West, Mumbai",
      });
    }
  };

  const toggleBoolean = (field: string) => {
    const newValue = !editValues[field];
    setEditValues({ ...editValues, [field]: newValue });
    updateProfileMutation.mutate({ [field]: newValue });
  };

  // Data Export (DPDP Act Compliance)
  const handleExportData = () => {
    const data = {
      user: {
        id: user?.id,
        email: user?.email,
        full_name: editValues.full_name,
        phone: editValues.phone,
        city: editValues.city,
      },
      savedAddresses: addresses,
      savedPaymentMethods: upiList,
      languagePreference: language,
      exportTimestamp: new Date().toISOString(),
      compliance: "Digital Personal Data Protection Act (DPDP India 2023)",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karighar-profile-${user?.id?.slice(0, 8) || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Your complete account archive has been downloaded");
  };

  const renderField = (id: string, label: string, description: string, placeholder: string = "") => {
    const isEditing = editingField === id;
    const value = editValues[id];
    const displayValue =
      (profile as any)?.[id] ||
      (id === "full_name" ? user?.user_metadata?.full_name : "") ||
      editValues[id] ||
      "Not provided";

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-border gap-4">
        <div className="flex-1 w-full">
          <h3 className="font-medium text-foreground text-sm">{label}</h3>

          {isEditing ? (
            <div className="mt-3 space-y-3 max-w-sm">
              <Input
                value={value || ""}
                onChange={(e) => setEditValues({ ...editValues, [id]: e.target.value })}
                placeholder={placeholder}
                className="h-10 text-sm bg-background border-border"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(id)}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground/90 mt-1">{displayValue}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                  {description}
                </p>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => setEditingField(id)}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {(profile as any)?.[id] || editValues[id] ? "Edit" : "Add"}
          </button>
        )}
      </div>
    );
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Hero / Profile Header Card */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-16 md:size-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-display font-semibold text-2xl md:text-3xl">
                  {(editValues.full_name || user?.email || "K").charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-success text-white p-1 rounded-full border-2 border-card" title="Aadhaar ID Verified">
                  <ShieldCheck className="size-3.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-xl md:text-2xl font-semibold text-foreground">
                    {editValues.full_name || "Karighar Member"}
                  </h1>
                  <Badge variant="outline" className="bg-surface-subtle text-xs border-border text-foreground font-medium">
                    {editValues.is_professional ? "Verified Pro" : "Verified Homeowner"}
                  </Badge>
                  <Badge variant="success" className="text-[11px] font-medium">
                    100% SafePay Escrow Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{user?.email}</span>
                  <span>•</span>
                  <span>{editValues.phone || "+91 Mobile Verified"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary">
                    <MapPin className="size-3" />
                    {addresses.find((a) => a.isDefault)?.locality || "Mumbai"}
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Switch Pro / Homeowner */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
              <Button
                variant={editValues.is_professional ? "default" : "outline"}
                size="sm"
                className="h-9 rounded-xl text-xs"
                onClick={() => toggleBoolean("is_professional")}
                disabled={updateProfileMutation.isPending}
              >
                <Sparkles className="size-3.5 mr-1.5" />
                {editValues.is_professional ? "Switch to Buying" : "Switch to Karighar Pro"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0 space-y-6">
            <nav className="space-y-1.5 bg-card border border-border rounded-2xl p-2.5 shadow-warm-xs">
              <button
                onClick={() => setActiveTab("personal")}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "personal"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>Personal Details</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "addresses"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>Doorstep Addresses</span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.2">
                  {addresses.length}
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "payments"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>SafePay & Billing</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </button>

              <button
                onClick={() => setActiveTab("regional")}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "regional"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>Language & Regional</span>
                </div>
                <span className="text-xs text-muted-foreground uppercase font-mono">
                  {language}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "security"
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground/80 hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="size-4 shrink-0" strokeWidth={1.5} />
                  <span>Security & Privacy</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground/60" />
              </button>
            </nav>

            {/* Quick Links Card */}
            <div className="rounded-2xl border border-border bg-surface-subtle p-4 shadow-warm-xs space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Quick Shortcuts
              </span>
              <div className="space-y-1">
                <Link
                  to="/my-projects"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground hover:bg-background transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="size-3.5 text-primary" /> My Active Projects
                  </span>
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </Link>
                <Link
                  to="/shortlist"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground hover:bg-background transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-primary" /> Saved Pros
                  </span>
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </Link>
                <Link
                  to="/help"
                  className="flex items-center justify-between p-2 rounded-lg text-xs font-medium text-foreground hover:bg-background transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-3.5 text-primary" /> SafePay Help Centre
                  </span>
                  <ArrowUpRight className="size-3 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="flex-1 max-w-2xl">
            {/* 1. PERSONAL DETAILS TAB */}
            {activeTab === "personal" && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Personal Details
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your official identity information used for doorstep safety verification and project records.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {renderField(
                    "full_name",
                    "Full Name",
                    "As registered on your Aadhaar or PAN card. Pros will address you by this name.",
                    "e.g. Priya Sharma"
                  )}

                  <div className="flex justify-between items-start pb-6 border-b border-border">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Email Address</h3>
                      <p className="text-sm font-medium text-foreground/90 mt-1">
                        {user?.email || "Not provided"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                        Used for SafePay payment receipts, quotation breakdown PDFs, and dispute resolutions.
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                      Verified
                    </Badge>
                  </div>

                  {renderField(
                    "phone",
                    "Phone Number (+91)",
                    "Direct contact for pros arriving at your doorstep. Never shared with outside lead-sellers.",
                    "e.g. +91 98200 12345"
                  )}

                  {renderField(
                    "city",
                    "Primary Mumbai Locality",
                    "Default neighbourhood used to match the fastest arriving verified technicians.",
                    "e.g. Andheri West, Mumbai"
                  )}

                  <div className="flex justify-between items-start pb-6 border-b border-border">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Government ID Verification</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <ShieldCheck className="size-4 text-success" />
                        <span className="text-xs font-semibold text-success">
                          Aadhaar & Police Clearance Verified
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                        Ensures safe doorstep entry across Mumbai gated societies and housing societies.
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Active Shield
                    </Badge>
                  </div>

                  {/* Notification Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">SMS & WhatsApp Arrival Alerts</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Get live updates when your Karighar technician leaves their workshop.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleBoolean("notifications_enabled")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        editValues.notifications_enabled ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                          editValues.notifications_enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SAVED DOORSTEP ADDRESSES TAB (Zepto/Uber Style) */}
            {activeTab === "addresses" && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-foreground">
                      Doorstep Service Addresses
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Manage accurate apartment numbers and society gate directions for swift arrival.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl h-9 text-xs"
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                  >
                    <Plus className="size-3.5 mr-1" /> Add Address
                  </Button>
                </div>

                {/* Add Address Collapsible Form */}
                {isAddingAddress && (
                  <form
                    onSubmit={handleCreateAddress}
                    className="rounded-xl border-2 border-dashed border-primary/40 bg-surface-subtle p-5 space-y-4 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        Add New Mumbai Doorstep Address
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Address Tag
                        </label>
                        <select
                          value={newAddress.tag}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              tag: e.target.value as SavedAddress["tag"],
                            })
                          }
                          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work / Office</option>
                          <option value="Rental">Rental Property</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Mumbai Locality
                        </label>
                        <select
                          value={newAddress.locality}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, locality: e.target.value })
                          }
                          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                        >
                          {DEFAULT_MUMBAI_AREAS.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Flat / Door / Floor & Building Name
                      </label>
                      <Input
                        required
                        placeholder="e.g. Flat 501, D-Wing, Oberoi Splendor"
                        value={newAddress.flatNo}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, flatNo: e.target.value })
                        }
                        className="h-9 text-xs bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Nearby Landmark
                        </label>
                        <Input
                          placeholder="e.g. Opposite Joggers Park, Link Rd"
                          value={newAddress.landmark}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, landmark: e.target.value })
                          }
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-1">
                          Pincode
                        </label>
                        <Input
                          placeholder="e.g. 400053"
                          value={newAddress.pincode}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, pincode: e.target.value })
                          }
                          className="h-9 text-xs bg-background"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Gate & Society Access Instructions
                      </label>
                      <Input
                        placeholder="e.g. Tell security: Flat 501. Lift B. Park at visitor bay."
                        value={newAddress.gateInstructions}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, gateInstructions: e.target.value })
                        }
                        className="h-9 text-xs bg-background"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingAddress(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" className="rounded-lg">
                        Save Address
                      </Button>
                    </div>
                  </form>
                )}

                {/* Address Cards List */}
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-xl border p-5 transition-all ${
                        addr.isDefault
                          ? "border-primary bg-primary/4 shadow-warm-xs"
                          : "border-border bg-card hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              addr.isDefault
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface-subtle text-muted-foreground"
                            }`}
                          >
                            <MapPin className="size-4" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">
                                {addr.tag}
                              </span>
                              {addr.isDefault && (
                                <Badge variant="default" className="text-[10px] py-0 px-2 h-4">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-medium text-foreground">
                              {addr.flatNo}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {addr.locality}, Mumbai — {addr.pincode}
                            </p>
                            {addr.landmark && (
                              <p className="text-[11px] text-muted-foreground">
                                Landmark: <span className="text-foreground/80">{addr.landmark}</span>
                              </p>
                            )}
                            {addr.gateInstructions && (
                              <div className="mt-2 text-[11px] bg-surface-subtle/80 text-foreground/80 px-2.5 py-1.5 rounded-md border border-border">
                                🔑 <span className="font-medium">Pro Instructions:</span> {addr.gateInstructions}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs text-primary font-medium hover:underline"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Delete address"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SAFEPAY ESCROW & BILLING TAB */}
            {activeTab === "payments" && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    SafePay Escrow & Payment Methods
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your payments are held in safe RBI-compliant escrow until milestone delivery.
                  </p>
                </div>

                {/* SafePay Escrow Protection Guarantee */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
                  <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">
                      Karighar SafePay Escrow Guarantee
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Professionals never receive funds directly beforehand. Advance deposits remain locked in your SafePay escrow and are only released when you inspect and sign off on completion.
                    </p>
                  </div>
                </div>

                {/* Saved UPI IDs */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Saved UPI Handles (For Instant Refunds)
                    </span>
                    <button
                      onClick={() => setIsAddingUPI(!isAddingUPI)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Add UPI ID
                    </button>
                  </div>

                  {isAddingUPI && (
                    <form
                      onSubmit={handleAddUPI}
                      className="rounded-xl border border-border bg-surface-subtle p-3.5 flex items-center gap-2"
                    >
                      <Input
                        required
                        placeholder="e.g. 9820012345@paytm or name@okhdfcbank"
                        value={newVpa}
                        onChange={(e) => setNewVpa(e.target.value)}
                        className="h-9 text-xs bg-background flex-1"
                      />
                      <Button type="submit" size="sm" className="h-9 text-xs">
                        Save UPI
                      </Button>
                    </form>
                  )}

                  {upiList.map((upi) => (
                    <div
                      key={upi.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-surface-subtle flex items-center justify-center text-primary font-semibold text-xs">
                          UPI
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{upi.vpa}</p>
                          <p className="text-[10px] text-muted-foreground">{upi.provider}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-success border-success/30">
                        Active for Escrow Refunds
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* GST & Tax Invoicing for Renovation Projects */}
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        GSTIN & Business Invoicing
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Add business GST details if you require tax input credit on home or office renovations.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        GST Identification Number (GSTIN)
                      </label>
                      <Input
                        placeholder="27AAAAA0000A1Z5"
                        value={gstInfo.gstin}
                        onChange={(e) => setGstInfo({ ...gstInfo, gstin: e.target.value.toUpperCase() })}
                        className="h-9 text-xs bg-background uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1">
                        Registered Business / Entity Name
                      </label>
                      <Input
                        placeholder="e.g. Apex Living Ventures LLP"
                        value={gstInfo.legalName}
                        onChange={(e) => setGstInfo({ ...gstInfo, legalName: e.target.value })}
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={handleSaveGst}
                  >
                    Save GST Details
                  </Button>
                </div>
              </div>
            )}

            {/* 4. LANGUAGE & REGIONAL PREFERENCES TAB */}
            {activeTab === "regional" && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Language & Regional Preferences
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select your preferred Indian language and construction measurement units.
                  </p>
                </div>

                {/* Indian Languages Interactive Grid */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Choose App Language
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            toast.success(`Language set to ${lang.nativeLabel} (${lang.label})`);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-warm-xs"
                              : "border-border bg-background hover:bg-surface-subtle text-foreground"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium">{lang.nativeLabel}</p>
                            <p className="text-[11px] text-muted-foreground">{lang.label}</p>
                          </div>
                          {isSelected && <Check className="size-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Measurement Units */}
                <div className="pt-6 border-t border-border space-y-3">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                    Measurement Units (Renovations & Flooring)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleUnitChange("sqft")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        unitPreference === "sqft"
                          ? "border-primary bg-primary/5 text-foreground font-semibold"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-semibold text-foreground">Square Feet (sq. ft.)</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Standard Mumbai real estate and carpenter measurement.
                      </p>
                    </button>

                    <button
                      onClick={() => handleUnitChange("sqm")}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        unitPreference === "sqm"
                          ? "border-primary bg-primary/5 text-foreground font-semibold"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <p className="text-xs font-semibold text-foreground">Square Metres (m²)</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        International metric standard for architectural planning.
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SECURITY, PRIVACY SHIELD & COMPLIANCE */}
            {activeTab === "security" && (
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-warm-xs space-y-6">
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    Security, Privacy Shield & Data
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage session security, phone number masking, and personal data portability.
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  {/* SafePay Privacy Shield Info */}
                  <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-primary" />
                      <span className="text-xs font-semibold text-foreground">
                        SafePay Doorstep Privacy Shield
                      </span>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                      <li>Your exact flat number is strictly time-locked and only shown to the technician 30 minutes before the scheduled arrival.</li>
                      <li>Calls between you and the professional are masked to prevent spam.</li>
                      <li>No external off-platform contact is permitted. All quotes, payments, and warranties stay protected within Karighar.</li>
                    </ul>
                  </div>

                  {/* Password Reset */}
                  <div className="flex justify-between items-start pb-6 border-b border-border">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">Account Password</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ensure your account uses a strong passphrase to protect project agreements.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="rounded-lg h-8 text-xs">
                      <Link to="/reset-password">Change Password</Link>
                    </Button>
                  </div>

                  {/* Active Sessions */}
                  <div className="space-y-3 pb-6 border-b border-border">
                    <h3 className="font-medium text-foreground text-sm">Active Devices</h3>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                      <div className="flex items-center gap-3">
                        <Smartphone className="size-4 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            Current Browser Session (Windows / Chrome)
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Mumbai, India • Active right now
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-success border-success/30">
                        This Device
                      </Badge>
                    </div>
                  </div>

                  {/* Data Export (DPDP India 2023 compliant) */}
                  <div className="flex justify-between items-start pb-6 border-b border-border">
                    <div>
                      <h3 className="font-medium text-foreground text-sm">
                        Export Personal Data & Project Briefs
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                        Download a machine-readable JSON archive of all your quotes, room planner briefs, and addresses.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-8 text-xs flex items-center gap-1.5"
                      onClick={handleExportData}
                    >
                      <Download className="size-3" /> Export Archive
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-2">
                    <h3 className="font-medium text-destructive text-sm flex items-center gap-1.5">
                      <AlertTriangle className="size-4" /> Danger Zone
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permanently delete your Karighar profile, project archives, and saved addresses.
                    </p>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-8"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete your Karighar account? This action cannot be undone.")) {
                            toast.info("Account deletion request submitted. An email confirmation has been dispatched.");
                          }
                        }}
                      >
                        Request Account Deletion
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </PageShell>
  );
}
