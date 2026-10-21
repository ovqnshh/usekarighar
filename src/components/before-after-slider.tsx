import React, { useState, useRef, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  title: string;
  subtitle: string;
  trade: string;
  location: string;
  cost: string;
  duration: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title,
  subtitle,
  trade,
  location,
  cost,
  duration,
}: BeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-warm-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-[10px]">Verified Transformation</Badge>
            <span className="text-xs text-muted-foreground">{location}</span>
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground mt-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs bg-surface-subtle px-3 py-1.5 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <span>Cost: <strong className="text-foreground">{cost}</strong></span>
          <span className="text-border">|</span>
          <span>Time: <strong className="text-foreground">{duration}</strong></span>
        </div>
      </div>

      {/* Interactive Drag Canvas */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative aspect-[16/9] w-full select-none overflow-hidden rounded-xl cursor-ew-resize border border-border"
      >
        {/* After Image (Full width background) */}
        <img
          src={afterImage}
          alt="After renovation"
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
        <span className="absolute bottom-3 right-3 rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm shadow-warm-xs">
          After
        </span>

        {/* Before Image (Clipped from left) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt="Before renovation"
            className="absolute inset-0 size-full object-cover max-w-none"
            style={{ width: containerRef.current?.clientWidth || "100%" }}
            draggable={false}
          />
          <span className="absolute bottom-3 left-3 rounded-md bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm shadow-warm-xs">
            Before
          </span>
        </div>

        {/* Divider Line & Tactile Handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-background shadow-warm"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-8 rounded-full bg-background border-2 border-primary shadow-warm flex items-center justify-center text-primary transition-transform hover:scale-110 active:scale-95">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <Sparkles className="size-3 text-primary" /> Drag slider left or right to compare
        </span>
        <span className="font-medium">{trade}</span>
      </div>
    </div>
  );
}
