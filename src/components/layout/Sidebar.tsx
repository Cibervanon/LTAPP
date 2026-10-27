"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Factory, ShoppingCart, PackageCheck, TrendingUp, Search } from "lucide-react";

const NAV = [
  { href: "/inventario", label: "Inventario", icon: Box },
  { href: "/ordenes-fabrica", label: "Órdenes de Fábrica", icon: Factory },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/packing", label: "Packing", icon: PackageCheck },
  { href: "/rentabilidad", label: "Rentabilidad", icon: TrendingUp },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleSidebarSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement | null;
    const q = input?.value.trim();
    if (!q) return;
    router.push(`/inventario?search=${encodeURIComponent(q)}`);
    setMobileMenu(false);
  };

  return (
    <div className={`fixed left-0 top-0 h-screen z-30 transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 sm:relative sm:transform-none sm:bg-transparent sm:shadow-none`}>
      {mobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setMobileMenu(false)}
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
        />
      )}
      <aside className={`w-64 bg-[#0A0A0A] border-r border-[#2C2C2E] h-screen flex flex-col transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0 relative" : "-translate-x-full absolute"} sm:translate-x-0 sm:relative sm:transform-none sm:bg-transparent sm:shadow-none`}>
        <div className="p-6 border-b border-[#2C2C2E]/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#161618] flex items-center justify-center border border-[#2C2C2E]/50 overflow-hidden">
            <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#FFFFFF] tracking-tighter uppercase leading-none">Lifting Trust</h1>
            <p className="text-[9px] text-[#A1A1A6] leading-tight uppercase tracking-widest">ERP Operativo</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <form onSubmit={handleSidebarSearch} className="flex items-center gap-2 px-3 py-2 mb-6">
            <Search className="w-4 h-4 text-[#A1A1A6]" />
            <input
              name="q"
              type="text"
              placeholder="Buscar SKU, pedido..."
              className="flex-1 bg-[#161618] border border-[#2C2C2E] rounded-lg px-3 py-1.5 text-xs text-[#FFFFFF] focus:border-[#30D158] focus:outline-none focus:ring-1 focus:ring-[#30D158]"
            />
          </form>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${active ? "bg-[#161618] text-[#30D158] border-r-2 border-[#30D158]" : "text-[#A1A1A6] hover:bg-[#161618]/50 hover:text-[#FFFFFF] group-hover:border-transparent"}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
