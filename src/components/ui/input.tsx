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
          <label className="block text-xs font-medium text-secondary-text uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-[#3A3A3C] bg-[#252525] px-3 py-2 text-sm text-primary-text placeholder:text-[#5A5A5A] focus:outline-none focus:border-success focus:ring-1 focus:ring-success transition-colors",
            error && "border-critical focus:border-critical focus:ring-critical",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-xs text-critical">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
