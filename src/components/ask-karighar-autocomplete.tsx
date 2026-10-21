import React, { useState, useEffect, useRef, useId } from "react";
import {
  Search,
  Sparkles,
  Fan,
  Droplet,
  Plug,
  Hammer,
  PaintRoller,
  ShieldCheck,
  Mic,
  MicOff,
  Clock,
  ArrowRight,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  querySearchIndex,
  SearchSuggestion,
  POPULAR_SUGGESTIONS,
} from "@/lib/search-index";
import { SafetyHazardRule } from "@/lib/search-dictionary";
import { Badge } from "@/components/ui/badge";

export interface AutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (query: string, suggestion?: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  submitLabel?: string;
}

const RECENT_SEARCHES_KEY = "karighar_recent_searches_v2";

export function AskKarigharAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe what your home needs (e.g. 'my ac is not working', 'tap leaking')...",
  className = "",
  autoFocus = false,
  submitLabel = "Find the right pro",
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>(POPULAR_SUGGESTIONS);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [safetyHazard, setSafetyHazard] = useState<SafetyHazardRule | undefined>();
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const componentId = useId();
  const listboxId = `listbox-${componentId}`;

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 4));
      }
    } catch {}
  }, []);

  // Save to recent searches
  const saveRecent = (queryText: string) => {
    if (!queryText.trim() || queryText.length < 3) return;
    try {
      const updated = [queryText, ...recentSearches.filter((s) => s !== queryText)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Debounced index query (<100ms perceived)
  useEffect(() => {
    const timer = setTimeout(() => {
      const res = querySearchIndex(value);
      setSuggestions(res.suggestions);
      setSafetyHazard(res.safetyHazard);
      setActiveIndex(-1);
    }, 90);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation for ARIA combobox pattern
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        handleSubmitText(value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (item: SearchSuggestion) => {
    saveRecent(item.queryToRun);
    onChange(item.queryToRun);
    setIsOpen(false);
    onSubmit(item.queryToRun, item);
  };

  const handleSubmitText = (text: string) => {
    if (!text.trim()) return;
    saveRecent(text);
    setIsOpen(false);
    onSubmit(text);
  };

  // Browser speech recognition (Voice Input)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your query.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
          setIsOpen(true);
          handleSubmitText(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Render group icons
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Fan":
        return <Fan className="size-4 text-primary" strokeWidth={1.8} />;
      case "Droplet":
        return <Droplet className="size-4 text-primary" strokeWidth={1.8} />;
      case "Plug":
        return <Plug className="size-4 text-primary" strokeWidth={1.8} />;
      case "Hammer":
        return <Hammer className="size-4 text-primary" strokeWidth={1.8} />;
      case "PaintRoller":
        return <PaintRoller className="size-4 text-primary" strokeWidth={1.8} />;
      case "ShieldCheck":
        return <ShieldCheck className="size-4 text-success" strokeWidth={1.8} />;
      default:
        return <Sparkles className="size-4 text-primary" strokeWidth={1.8} />;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* ── Rule-Based Safety Hazard Escalation (Pre-AI) ── */}
      {safetyHazard && (
        <div className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-destructive animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-destructive animate-bounce" />
            <span className="font-semibold text-xs tracking-tight">{safetyHazard.title}</span>
          </div>
          <p className="mt-1 text-[11px] leading-tight text-destructive/90">
            {safetyHazard.instructions[0]}
          </p>
        </div>
      )}

      {/* ── Main Input Box ── */}
      <div className="relative flex items-center rounded-2xl border-2 border-border bg-card p-1.5 shadow-warm transition-all focus-within:border-primary/50 focus-within:shadow-warm-lg">
        <div className="pl-3 text-muted-foreground">
          <Search className="size-4 md:size-5" strokeWidth={1.8} />
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${componentId}-item-${activeIndex}` : undefined
          }
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2.5 text-sm md:text-base outline-none placeholder:text-muted-foreground/80 text-foreground"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground mr-1 rounded-full hover:bg-surface-subtle"
            aria-label="Clear query"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={`grid size-9 place-items-center rounded-xl transition-all mr-1.5 ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
          }`}
          aria-label={isListening ? "Listening... click to stop" : "Use voice search"}
          title={isListening ? "Listening..." : "Speak your issue"}
        >
          {isListening ? (
            <MicOff className="size-4" strokeWidth={1.8} />
          ) : (
            <Mic className="size-4" strokeWidth={1.8} />
          )}
        </button>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={() => handleSubmitText(value)}
          disabled={!value.trim()}
          className="rounded-xl bg-primary px-4 py-2 text-xs md:text-sm font-semibold text-primary-foreground shadow-warm transition-transform active:scale-95 disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <span>{submitLabel}</span>
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* ── Dropdown / Autocomplete Sheet ── */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-warm-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2 no-scrollbar"
        >
          {/* Recent Searches */}
          {!value.trim() && recentSearches.length > 0 && (
            <div className="mb-2 px-2 pt-1 pb-2 border-b border-border/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
                <Clock className="size-3" /> Recent Searches
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleSubmitText(rec)}
                    className="rounded-lg bg-surface-subtle px-2.5 py-1 text-xs text-foreground font-medium hover:bg-primary/10 hover:text-primary transition-colors text-left truncate max-w-[220px]"
                  >
                    {rec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Autocomplete Suggestions */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{value.trim() ? "Suggested Issues & Trades" : "Popular Across Mumbai"}</span>
              <span className="text-[9px] font-normal text-muted-foreground">Press ↑↓ to navigate</span>
            </div>

            {suggestions.map((item, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <div
                  key={item.id}
                  id={`${componentId}-item-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-surface-subtle text-foreground"
                  }`}
                >
                  <div className="mt-0.5 rounded-lg bg-surface-subtle p-1.5 shrink-0">
                    {renderIcon(item.iconName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs md:text-sm font-semibold truncate leading-snug">
                        {item.title}
                      </span>
                      {item.type === "service" && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          Service
                        </Badge>
                      )}
                      {item.type === "pro" && (
                        <Badge variant="default" className="text-[9px] px-1 py-0 h-4">
                          Pro
                        </Badge>
                      )}
                    </div>

                    {item.subtitle && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <ArrowRight className="size-3.5 text-muted-foreground opacity-60 shrink-0 self-center" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
