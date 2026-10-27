"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Sin datos",
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 text-center", className)}
      {...props}
    >
      {icon && (
        <div className="mb-4 p-3 rounded-lg bg-[#1A1A1A] border border-border/50">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-primary-text">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-secondary-text max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
