import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Status chip variants — only 5, muted and earthy (no rainbow).
 * Size always small; padding generous for touch.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Brand
        default:     "bg-primary/12 text-primary border border-primary/20",
        // Muted neutral
        secondary:   "bg-surface-subtle text-muted-foreground border border-border",
        // Earthy success
        success:     "bg-success-soft text-success border border-success/20",
        // Earthy warning
        warning:     "bg-warning-soft text-warning border border-warning/20",
        // Error
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        // Info
        info:        "bg-info-soft text-info border border-info/20",
        // No border
        outline:     "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
