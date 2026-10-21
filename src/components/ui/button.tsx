import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base — consistent touch target (min 44px tall via padding), accessible focus
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer select-none" +
  " transition-all duration-150 ease-out" +
  " active:scale-[0.97]" +
  " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" +
  " disabled:pointer-events-none disabled:opacity-45" +
  " [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — terracotta-600, white text, AA compliant
        default:
          "bg-primary text-primary-foreground shadow-warm-xs" +
          " hover:-translate-y-0.5 hover:brightness-105 hover:shadow-warm-sm" +
          " active:brightness-97",

        // Destructive — earthy red
        destructive:
          "bg-destructive text-destructive-foreground shadow-warm-xs" +
          " hover:-translate-y-0.5 hover:brightness-105 hover:shadow-warm-sm",

        // Outlined — clean 1px border
        outline:
          "border border-border bg-background text-foreground" +
          " hover:bg-surface-subtle hover:border-foreground/20 hover:-translate-y-0.5",

        // Secondary — warm muted fill
        secondary:
          "bg-surface-subtle text-foreground" +
          " hover:bg-accent hover:-translate-y-0.5",

        // Ghost — no background until hover
        ghost:
          "text-foreground hover:bg-surface-subtle",

        // Link — text only, underline on hover
        link:
          "text-primary underline-offset-4 hover:underline active:scale-100",

        // Warm — terracotta tint fill (for secondary CTAs in brand context)
        warm:
          "bg-primary/10 text-primary" +
          " hover:bg-primary/15 hover:-translate-y-0.5",
      },
      size: {
        sm:      "h-8  rounded-md  px-3   text-xs",
        default: "h-10 rounded-lg  px-4",
        lg:      "h-12 rounded-lg  px-6   text-base",
        xl:      "h-14 rounded-xl  px-8   text-base font-semibold",
        icon:    "h-9  rounded-lg  w-9",
        "icon-sm": "h-8 rounded-md w-8",
        "icon-lg": "h-11 rounded-xl w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
