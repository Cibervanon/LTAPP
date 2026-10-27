"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "success" | "warning" | "critical" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const variants = {
      default: "bg-[#161618] border border-[#2C2C2E] text-[#FFFFFF] hover:bg-[#2C2C2E]",
      success: "bg-[#30D158] text-[#0A0A0A] hover:bg-[#2eb84d]",
      warning: "bg-[#FF9F0A] text-[#0A0A0A] hover:bg-[#e08f09]",
      critical: "bg-[#FF453A] text-[#FFFFFF] hover:bg-[#d63a30]",
      ghost: "bg-transparent text-[#FFFFFF] hover:bg-[#161618]",
      outline: "border border-[#2C2C2E] bg-transparent text-[#FFFFFF] hover:bg-[#161618]",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
