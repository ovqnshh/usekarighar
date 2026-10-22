import { type ReactNode } from "react";

/** Clean, instant page container without blocking exit delays or blank blink glitches */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col flex-1 transition-opacity duration-150 ease-out">
      {children}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-hidden
    />
  );
}
