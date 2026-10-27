"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "warning" | "critical" | "info";
}

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextType {
  toast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => {},
});

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = (newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, ...newToast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const variantColors: Record<string, string> = {
    success: "border-success bg-success/10 text-success",
    warning: "border-warning bg-warning/10 text-warning",
    critical: "border-critical bg-critical/10 text-critical",
    info: "border-[#3A3A3C] bg-[#3A3A3C]/20 text-primary-text",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg border-border/50 min-w-[300px]",
                variantColors[t.variant ?? "info"]
              )}
            >
              <div className="flex flex-col">
                <h4 className="text-sm font-semibold text-primary-text">{t.title}</h4>
                {t.description && (
                  <p className="mt-1 text-xs text-secondary-text">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="ml-auto mt-1 rounded hover:bg-[#2A2A2A] p-1"
              >
                <X className="w-4 h-4 text-secondary-text" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
