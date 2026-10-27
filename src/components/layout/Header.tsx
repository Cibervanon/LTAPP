"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const input = document.querySelector('header input[name="q"]') as HTMLInputElement | null;
        input?.focus();
      }
      if (e.key === "/" && !(e.target as HTMLElement).closest("input, textarea")) {
        e.preventDefault();
        const input = document.querySelector('header input[name="q"]') as HTMLInputElement | null;
        input?.focus();
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyboard);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyboard);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement | null;
    const q = input?.value.trim();
    if (!q) return;
    router.push(`/inventario?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-10 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#2C2C2E]/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/inventario" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#161618] flex items-center justify-center border border-[#2C2C2E]/50 overflow-hidden">
              <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[#FFFFFF] tracking-tighter uppercase leading-none">Lifting Trust</h1>
              <p className="text-[9px] text-[#A1A1A6] uppercase tracking-widest">ERP Operativo</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" />
            <input
              name="q"
              type="text"
              placeholder="Buscar SKU, pedido, cliente o orden... (Ctrl+K)"
              className="w-full bg-[#161618] border border-[#2C2C2E] rounded-lg px-4 py-2 pl-10 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none focus:ring-1 focus:ring-[#30D158] transition-all"
            />
          </form>
        </div>

        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest hidden sm:block ${isOnline ? "text-[#30D158]" : "text-[#FF453A]"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[#30D158] animate-pulse" : "bg-[#FF453A]"}`}></span>
            {isOnline ? "Online" : "Sin conexión"}
          </span>
        </div>
      </div>
    </header>
  );
}
