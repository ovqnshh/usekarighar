import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-11 w-full rounded-lg border border-border bg-background px-3.5 py-2.5" +
          " text-sm text-foreground placeholder:text-muted-foreground/60" +
          // Transition
          " transition-all duration-150" +
          // Hover
          " hover:border-foreground/25" +
          // Focus
          " focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" +
          // File
          " file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground" +
          // Disabled
          " disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-surface-subtle",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
