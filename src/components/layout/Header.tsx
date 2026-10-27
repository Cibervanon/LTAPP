"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1A6]" />
            <input
              type="text"
              placeholder="Buscar SKU, pedido, cliente o orden..."
              className="w-full bg-[#161618] border border-[#2C2C2E] rounded-lg px-4 py-2 pl-10 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none focus:ring-1 focus:ring-[#30D158] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-medium text-[#A1A1A6] uppercase tracking-widest hidden sm:block">
            Modo Personal
          </span>
        </div>
      </div>
    </header>
  );
}
