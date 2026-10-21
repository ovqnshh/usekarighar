import React, { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AskKarigharAutocomplete } from "@/components/ask-karighar-autocomplete";
import { useNavigate } from "@tanstack/react-router";
import { SearchSuggestion } from "@/lib/search-index";
import { Sparkles, X, ShieldCheck, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  defaultQuery?: string;
}

export function SearchOverlay({ isOpen, onClose, defaultQuery = "" }: SearchOverlayProps) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState(defaultQuery);

  useEffect(() => {
    setQuery(defaultQuery);
  }, [defaultQuery, isOpen]);

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (searchQuery: string, suggestion?: SearchSuggestion) => {
    onClose();
    navigate({
      to: "/professionals",
      search: {
        q: searchQuery,
        category: suggestion?.matchedTrade || undefined,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 gap-0 overflow-hidden border border-border bg-card shadow-warm-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-subtle/50">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-foreground leading-tight">
                Ask Karighar Search
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Describe the problem or service you need in Mumbai
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
              aria-label="Close search"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Search Autocomplete Input */}
        <div className="p-5 space-y-4">
          <AskKarigharAutocomplete
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            autoFocus
            placeholder="e.g. 'my ac is not working', 'water dripping under sink', 'switchboard sparking'..."
          />

          {/* Quick Filter Tags */}
          <div className="pt-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Browse Common Services
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "AC Repair & Cooling", query: "my ac is not working and blowing warm air" },
                { label: "Tap / Pipe Leakage", query: "kitchen sink pipe is leaking" },
                { label: "Tripping MCB / Switch", query: "switchboard sparking and tripping mcb" },
                { label: "Wardrobe Sliding Door", query: "wardrobe sliding door is stuck" },
                { label: "Wall Dampness Scan", query: "living room wall peeling and moisture dampness" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleSubmit(item.query)}
                  className="rounded-full border border-border bg-surface-subtle px-3 py-1 text-xs text-foreground font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-border bg-surface-subtle/40 px-5 py-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="size-3.5 text-primary" />
            All specialists background & skills verified
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5 text-muted-foreground" />
            Mumbai (Powai, Bandra, Andheri & nearby)
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
