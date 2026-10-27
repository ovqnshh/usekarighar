import { useState, useRef } from "react";
import {
  Camera, Upload, Sparkles, AlertTriangle, ShieldCheck,
  CheckCircle2, Wrench, X, Loader2, ArrowRight, Tag, Info, FilePlus2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  analyzeVisualDamage,
  createDraftProjectFromEstimate,
  type VisualDiagnosis
} from "@/lib/visual-damage.functions";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/karighar-api";

export function VisualDamageEstimatorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [userNote, setUserNote] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBookingDraft, setIsBookingDraft] = useState(false);
  const [diagnosis, setDiagnosis] = useState<VisualDiagnosis | null>(null);
  const [aiEstimateId, setAiEstimateId] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      // Strip data url prefix for API
      const base64Clean = result.split(",")[1];
      setBase64Image(base64Clean);
      setDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleStartAnalysis = async () => {
    if (!base64Image) {
      toast.error("Please select or capture a photo first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await analyzeVisualDamage({
        data: {
          imageBase64: base64Image,
          userNote,
          customerId: user?.id,
        },
      });

      if (res.ok && res.diagnosis) {
        setDiagnosis(res.diagnosis);
        if (res.aiEstimateId) setAiEstimateId(res.aiEstimateId);
        toast.success("AI Damage Diagnosis Complete!");
      } else {
        toast.error("Analysis failed. Please try a clearer photo.");
      }
    } catch (err: any) {
      toast.error("Diagnostic error", { description: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBookWithEstimate = async () => {
    if (!diagnosis) return;
    setIsBookingDraft(true);
    try {
      const res = await createDraftProjectFromEstimate({
        customerId: user?.id || "guest",
        title: `${diagnosis.fixtureType} Repair`,
        description: `Automated Visual Diagnosis: ${diagnosis.identifiedIssue}\n\nRecommended Labor: ${diagnosis.estimatedLaborCost}\n\nRequired Parts: ${diagnosis.requiredSpareParts.map((p) => p.partName).join(", ")}\n\nStandard Operating Procedure:\n${diagnosis.sopSteps.join("\n")}`,
        trade: diagnosis.detectedTrade,
        aiEstimateId: aiEstimateId,
        estimatedPaise: diagnosis.laborMinPaise,
      });

      if (res.ok) {
        toast.success("Draft project created with AI diagnosis attached!");
        onClose();
        navigate({ to: "/my-projects" });
      } else {
        toast.error("Could not create draft project. Please try again.");
      }
    } catch (err: any) {
      toast.error("Error creating draft project", { description: err.message });
    } finally {
      setIsBookingDraft(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setBase64Image(null);
    setDiagnosis(null);
    setAiEstimateId(undefined);
    setUserNote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-lenis-prevent className="max-w-2xl max-h-[85vh] sm:max-h-[88vh] overflow-y-auto overscroll-contain rounded-3xl p-5 sm:p-6 border-border bg-card">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-1 font-semibold">
              <Sparkles className="size-3" /> AI Visual Diagnostic
            </Badge>
          </div>
          <DialogTitle className="font-display text-xl sm:text-2xl font-bold text-foreground">
            AI Visual Damage & Material Estimator
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Snap or upload a photo of the leaking pipe, burnt switch, or damaged woodwork. Our AI diagnoses the root cause, lists fair spare parts, and estimates labor before the worker arrives.
          </DialogDescription>
        </DialogHeader>

        {!diagnosis ? (
          <div className="space-y-5 pt-2">
            {/* Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-border hover:border-primary/50 hover:bg-surface-subtle/50 rounded-2xl p-8 sm:p-12 text-center space-y-3 transition-all group"
              >
                <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <Camera className="size-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-foreground">
                    Click to snap a photo or upload from gallery
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP up to 10MB
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold pt-1">
                  <Upload className="size-3.5" /> Select Image
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-black max-h-[280px] flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Problem to diagnose"
                    className="max-h-[280px] w-auto object-contain"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 size-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Optional: Add any sounds, leaks, or smell details
                  </label>
                  <input
                    type="text"
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="e.g. 'Dripping constantly since yesterday night, smells like burnt plastic...'"
                    className="w-full text-xs rounded-xl border border-border bg-background px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-5 text-xs font-semibold shadow-warm-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Analyzing damage & diagnosing fixture...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4 mr-1.5" /> Run AI Visual Damage Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Diagnosis Result Display */
          <div className="space-y-5 pt-3">
            {/* Header Result summary */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Verified Diagnosis
                </span>
                <Badge
                  variant={diagnosis.severity === "critical_emergency" ? "destructive" : "default"}
                  className="text-[10px] capitalize"
                >
                  {diagnosis.severity.replace("_", " ")}
                </Badge>
              </div>

              <h3 className="font-display text-lg font-bold text-foreground">
                {diagnosis.fixtureType}
              </h3>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {diagnosis.identifiedIssue}
              </p>
            </div>

            {/* Safety Warning if present */}
            {diagnosis.safetyRecommendation && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Pre-Arrival Safety Advice:</strong>
                  {diagnosis.safetyRecommendation}
                </div>
              </div>
            )}

            {/* Price Estimates Card */}
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-1">
                <span className="text-muted-foreground font-medium block">Estimated Labor Visit</span>
                <span className="text-base font-bold text-foreground">{diagnosis.estimatedLaborCost}</span>
                <span className="text-[10px] text-muted-foreground block">Duration: ~{diagnosis.estimatedDuration}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-surface-subtle space-y-1">
                <span className="text-muted-foreground font-medium block">Trade Specialization</span>
                <span className="text-sm font-bold text-primary block">{diagnosis.detectedTrade}</span>
                <span className="text-[10px] text-muted-foreground">Governed by Mumbai Price Index</span>
              </div>
            </div>

            {/* Required Spare Parts Table */}
            {diagnosis.requiredSpareParts.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Likely Replacement Parts Required:</span>
                  <Link to="/price-index" className="text-[11px] text-primary hover:underline flex items-center gap-1">
                    <Tag className="size-3" /> Compare in Price Index
                  </Link>
                </div>
                <div className="rounded-xl border border-border divide-y divide-border/60 overflow-hidden text-xs">
                  {diagnosis.requiredSpareParts.map((part, i) => (
                    <div key={i} className="p-3 bg-card flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{part.partName}</div>
                        <div className="text-[10px] text-muted-foreground">Standard Brand: {part.brandRecommendation}</div>
                      </div>
                      <div className="font-bold text-emerald-600 text-right">
                        {part.estimatedCostRange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Operating Procedure */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground block">
                Standard Technician Workmanship SOP:
              </span>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {diagnosis.sopSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex flex-col gap-2 border-t border-border">
              <Button
                onClick={handleBookWithEstimate}
                disabled={isBookingDraft}
                className="w-full text-xs font-semibold py-4 shadow-warm-xs bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5"
              >
                {isBookingDraft ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating Draft Project with AI Estimate...
                  </>
                ) : (
                  <>
                    <FilePlus2 className="size-4" /> Book with this AI Estimate (Create Draft Project)
                  </>
                )}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="text-xs flex-1">
                  Diagnose Another Photo
                </Button>
                <Button asChild size="sm" variant="secondary" className="text-xs font-semibold flex-1">
                  <Link
                    to="/professionals"
                    search={{ q: diagnosis.detectedTrade }}
                    onClick={onClose}
                  >
                    Browse Verified Specialists <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
