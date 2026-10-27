"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/useAuth";

export default function Header() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/(modules)/inventario" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-border/50 overflow-hidden">
              <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-primary-text tracking-tighter uppercase leading-none">Lifting Trust</h1>
              <p className="text-[10px] text-secondary-text">ERP Operativo</p>
            </div>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
            <input
              type="text"
              placeholder="Buscar SKU, pedido, cliente o orden..."
              className="w-full bg-[#1A1A1A] border border-[#3A3A3C] rounded-lg px-4 py-2 pl-10 text-sm text-primary-text focus:border-success focus:outline-none focus:ring-1 focus:ring-success transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-secondary-text hover:text-primary-text hover:bg-[#1A1A1A] transition-colors">
            <User className="w-4 h-4 shrink-0" />
            <span>{session?.user?.email?.split("@")[0] ?? "Usuario"}</span>
          </button>
          <button
            onClick={signOut}
            className="p-2 rounded-lg text-critical hover:bg-[#1A1A1A] hover:text-[#d63a30] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
