"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-[10px] font-medium text-[#A1A1A6] uppercase tracking-widest">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-[#2C2C2E] bg-[#161618] px-3 py-2 text-sm text-[#FFFFFF] placeholder:text-[#5A5A5A] focus:outline-none focus:border-[#30D158] focus:ring-1 focus:ring-[#30D158] transition-colors",
            error && "border-[#FF453A] focus:border-[#FF453A] focus:ring-[#FF453A]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[10px] text-[#FF453A]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
