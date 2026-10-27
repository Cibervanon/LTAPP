"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/(modules)/inventario", label: "Inventario" },
  { href: "/(modules)/ordenes-fabrica", label: "Órdenes de Fábrica" },
  { href: "/(modules)/pedidos", label: "Pedidos" },
  { href: "/(modules)/packing", label: "Packing" },
  { href: "/(modules)/rentabilidad", label: "Rentabilidad" },
];

export default function AppNav() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 z-20 flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <img src="/logos/logo-mark.svg" alt="Lifting Trust" className="w-10 h-10" />
        <div>
          <h1 className="text-sm font-bold text-primary-text tracking-tighter uppercase leading-none">Lifting Trust</h1>
          <p className="text-[10px] text-secondary-text leading-tight">ERP Operativo</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#2A2A2A] text-success border border-success/20"
                  : "text-secondary-text hover:bg-[#252525] hover:text-primary-text"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-critical hover:bg-[#252525]">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
