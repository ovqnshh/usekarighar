import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3.5 py-2.5" +
        " text-sm text-foreground placeholder:text-muted-foreground/60" +
        " resize-none leading-relaxed" +
        " transition-all duration-150" +
        " hover:border-foreground/25" +
        " focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" +
        " disabled:cursor-not-allowed disabled:opacity-45 disabled:bg-surface-subtle",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
