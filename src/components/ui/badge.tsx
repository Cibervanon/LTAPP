"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "critical" | "neutral";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", children, ...props }, ref) => {
    const variants = {
      success: "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30",
      warning: "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30",
      critical: "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30",
      neutral: "bg-[#2C2C2E]/30 text-[#A1A1A6] border border-[#2C2C2E]/50",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
