import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Wrench,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
  Flame,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailedProjectBrief, StepAClassification } from "@/lib/ask-karighar.functions";
import { SafetyHazardRule } from "@/lib/search-dictionary";

interface ProjectBriefCardProps {
  brief: DetailedProjectBrief;
  classification?: StepAClassification;
  safetyHazard?: SafetyHazardRule;
  onAnswerClarification?: (questionId: string, answer: string) => void;
  onClearBrief?: () => void;
}

export function ProjectBriefCard({
  brief,
  classification,
  safetyHazard,
  onAnswerClarification,
  onClearBrief,
}: ProjectBriefCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeIssueTab, setActiveIssueTab] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleSelectOption = (qId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: option }));
    if (onAnswerClarification) {
      onAnswerClarification(qId, option);
    }
  };

  const isEmergency = brief.urgency === "emergency" || !!safetyHazard;

  return (
    <div className="w-full space-y-4">
      {/* ── Rule-Based Safety Hazard Banner (Pre-AI Escalation) ── */}
      {safetyHazard && (
        <div className="rounded-2xl border-2 border-destructive/60 bg-destructive/10 p-5 text-destructive shadow-warm-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-destructive p-2 text-destructive-foreground shrink-0 mt-0.5">
              <AlertTriangle className="size-5 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold tracking-tight">
                  {safetyHazard.title}
                </h3>
                <span className="rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
                  Urgent Precaution
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <span className="font-semibold block text-destructive">
                  Recommended Immediate Life-Safety Steps:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-destructive/90">
                  {safetyHazard.instructions.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold shadow-warm-xs"
                >
                  <Flame className="size-3.5 mr-1" />
                  {safetyHazard.emergencyActionText}
                </Button>
                <span className="text-[11px] text-destructive/80">
                  Dial 112 (Mumbai Police / Fire / Medical) in extreme emergencies.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Issue Tab Switcher ── */}
      {classification?.isMultiIssue && classification.issues.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
            Detected Issues:
          </span>
          {classification.issues.map((issue, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIssueTab(idx)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                activeIssueTab === idx
                  ? "bg-primary text-primary-foreground shadow-warm-xs"
                  : "bg-surface-subtle text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              Issue {idx + 1}: {issue.title}
            </button>
          ))}
        </div>
      )}

      {/* ── Structured 14-Section Project Brief Card ── */}
      <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card p-5 md:p-6 shadow-warm space-y-6">
        {/* Header: Title, Category Path & Collapse Toggle */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default" className="text-[10px] uppercase font-semibold">
                Ask Karighar Structured Brief
              </Badge>

              {/* Category Breadcrumbs as Chips */}
              {brief.categoryPath.map((crumb, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {idx > 0 && <span className="opacity-40">/</span>}
                  {crumb}
                </span>
              ))}

              {isEmergency && (
                <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                  Emergency Priority
                </Badge>
              )}
            </div>

            <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight">
              {brief.title}
            </h2>

            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed max-w-3xl">
              {brief.summary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface-subtle px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Collapse brief details" : "Expand brief details"}
            >
              <span>{isExpanded ? "Less details" : "Full brief"}</span>
              {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {onClearBrief && (
              <Button variant="ghost" size="sm" onClick={onClearBrief} className="text-xs h-7 px-2">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* ── Scannable Grid: Scope, Causes, Price & Time ── */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Left Column: Scope & Possible Causes (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* 4. What the Pro Will Likely Check */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                <Wrench className="size-3.5" /> What the Specialist Will Inspect
              </span>
              <div className="space-y-1.5">
                {brief.whatProWillCheck.map((scopeItem, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-surface-subtle/50 p-2.5 text-xs text-foreground/90"
                  >
                    <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{scopeItem}</span>
                  </div>
                ))}
              </div>
            </div>

            {isExpanded && (
              <>
                {/* 5. Possible Causes (Hedged) */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                    <Info className="size-3.5" /> Potential Causes (For On-Site Verification)
                  </span>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {brief.possibleCauses.map((cause, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span className="leading-relaxed">{cause}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Parts & Materials Likely Needed */}
                {brief.likelyParts && brief.likelyParts.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Package className="size-3.5" /> Likely Parts / Consumables
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {brief.likelyParts.map((part, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground/80 font-medium"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Pricing, Duration, Urgency & Preparation (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* 8. Grounded Non-Binding Price Estimate */}
            <div className="rounded-2xl border border-border bg-surface-subtle p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Estimated Price Range (INR)
              </span>
              <div className="font-display text-2xl font-bold text-foreground">
                {brief.priceRange.label}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {brief.priceRange.disclaimer}
              </p>
            </div>

            {/* 7 & 9. Duration & Urgency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Time On Site
                </span>
                <p className="text-xs font-semibold text-foreground">
                  {brief.estimatedDuration}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Urgency
                </span>
                <p className="text-xs font-semibold capitalize text-foreground">
                  {brief.urgency.replace("_", " ")}
                </p>
              </div>
            </div>

            {isExpanded && (
              <>
                {/* 11. What to Prepare Before Arrival */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                    Preparation For Visit
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {brief.whatToPrepare.map((tip, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 14. Assumptions */}
                <div className="text-[11px] text-muted-foreground/80 leading-relaxed space-y-1 pt-1">
                  <span className="font-semibold text-muted-foreground block">
                    Assumptions made by engine:
                  </span>
                  {brief.assumptionsMade.map((asm, idx) => (
                    <p key={idx}>• {asm}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Non-Blocking Refinement Questions (Tap-To-Answer) ── */}
        {brief.tapQuestions && brief.tapQuestions.length > 0 && (
          <div className="rounded-xl border border-border bg-surface-subtle/70 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-primary" /> Optional Refinements (Tap to clarify scope)
            </span>
            <div className="space-y-3">
              {brief.tapQuestions.map((q) => (
                <div key={q.id} className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">{q.question}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((opt) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectOption(q.id, opt)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-warm-xs"
                              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom Stub Link: Get Quotes for this Brief ── */}
        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            Showing verified specialists matched strictly for this diagnosis.
          </span>
          <span className="italic text-[11px] text-muted-foreground/90">
            Want competitive proposals? You can request multiple quotes for this brief.
          </span>
        </div>
      </div>
    </div>
  );
}
