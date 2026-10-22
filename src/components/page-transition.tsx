import { type ReactNode, useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modern, Framer-inspired page transition:
 * - Fluid upward glide and smooth opacity fade
 * - Glowing top horizon progress line for tactile navigation feedback
 * - Non-blocking entrance: zero double-clicks, zero route blinks, zero frame drops
 * - Hardware accelerated using GPU transforms
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {/* Sleek Framer-style Top Route Transition Progress Beam */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`route-beam-${pathname}`}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: [1, 1, 0] }}
          transition={{
            duration: 0.45,
            times: [0, 0.7, 1],
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ originX: 0 }}
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none bg-gradient-to-r from-primary via-amber-400 to-primary shadow-[0_0_14px_rgba(234,88,12,0.8)]"
        />
      </AnimatePresence>

      {/* Smooth, high-performance page entrance */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12, scale: 0.996 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="w-full h-full flex flex-col flex-1 transform-gpu will-change-[transform,opacity]"
      >
        {children}
      </motion.div>
    </>
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
