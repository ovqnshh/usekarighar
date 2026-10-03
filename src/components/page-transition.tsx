import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { pageVariants } from "@/lib/animations";

/** Smooth, modern page transition using AnimatePresence. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={pathname} 
        variants={pageVariants} 
        initial={first.current ? false : "hidden"} 
        animate="visible"
        exit="exit"
        className="w-full h-full flex flex-col flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden />;
}
