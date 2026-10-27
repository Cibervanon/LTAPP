"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, Menu, X, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/(modules)/inventario", label: "Inventario", icon: "Box" },
  { href: "/(modules)/ordenes-fabrica", label: "Órdenes de Fábrica", icon: "Factory" },
  { href: "/(modules)/pedidos", label: "Pedidos", icon: "ShoppingCart" },
  { href: "/(modules)/packing", label: "Packing", icon: "PackageCheck" },
  { href: "/(modules)/rentabilidad", label: "Rentabilidad", icon: "TrendingUp" },
];

const ICONS: Record<string, React.ElementType> = {
  Box: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Factory: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 21.5V18m0-6l3-3m-3 3h3m-3 0v3m0 0v3m0-3h3m3 0V13.5M10.5 21.5H18m0 0h2.25m-2.25 0c0 0.621-0 0.932 0 1.124a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5c0-0.192 0-0.503 0-1.124M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  ShoppingCart: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  PackageCheck: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21l4-9 4 9M3 4h18M3 4l9 14" /></svg>,
  TrendingUp: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 3" /></svg>,
};

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      setIsOpen(!isMobile);
      setMobileMenu(false);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className={`fixed left-0 top-0 h-screen z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:relative sm:transform-none sm:bg-transparent sm:shadow-none`}>
      {/* Backdrop mobile */}
      {mobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        />
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "w-64 bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "translate-x-0 relative" : "-translate-x-full absolute",
        "sm:translate-x-0 sm:relative sm:transform-none sm:bg-transparent sm:shadow-none"
      )}
      >
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-border/50 overflow-hidden">
            <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-primary-text tracking-tighter uppercase leading-none">Lifting Trust</h1>
            <p className="text-[10px] text-secondary-text leading-tight">ERP Operativo</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <Search className="w-4 h-4 text-secondary-text" />
            <input
              type="text"
              placeholder="Buscar SKU, pedido, cliente..."
              className="flex-1 bg-[#252525] border border-[#3A3A3C] rounded-lg px-3 py-1.5 text-xs text-primary-text focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            />
          </div>
          {NAV.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-[#2A2A2A] text-success border-r-2 border-success"
                    : "text-secondary-text hover:bg-[#252525] hover:text-primary-text group-hover:border-border/50"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-critical hover:bg-[#252525] transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </div>
  );
}

export function MobileHeader() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { session } = useAuth();

  return (
    <div className="h-16 bg-[#1A1A1A] border-b border-border flex items-center justify-between px-4 z-20 sm:hidden">
      <button
        onClick={() => setMobileMenu(true)}
        className="rounded-lg p-2 hover:bg-[#2A2A2A] text-primary-text"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#252525] border border-border overflow-hidden">
          <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
        </div>
        <span className="hidden sm:block text-sm font-semibold text-primary-text">Lifting Trust</span>
      </div>
      <div className="flex items-center gap-2">
        <User className="w-5 h-5 text-secondary-text" />
        {session?.user?.email && <span className="text-xs text-secondary-text hidden sm:block">{session.user.email}</span>}
      </div>
    </div>
  );
}
