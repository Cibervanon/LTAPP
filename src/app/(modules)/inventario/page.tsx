"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, isBrowser } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { AnimatePresence } from "framer-motion";
import { Box, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Variante = Database["public"]["Tables"]["variantes"]["Row"];

export default function InventarioPage() {
  const supabase = useMemo(() => (isBrowser() ? createClient() : null), []);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("todos");
  const { toast } = useToast();

  const stats = useMemo(() => ({
    total: variantes.reduce((acc, v) => acc + v.stock_disponible, 0),
    reservado: variantes.reduce((acc, v) => acc + v.stock_reservado, 0),
    bajoMinimo: variantes.filter((v) => v.stock_disponible <= v.stock_minimo && v.stock_disponible > 0).length,
    sinStock: variantes.filter((v) => v.stock_disponible === 0).length,
  }), [variantes]);

  const filtered = useMemo(() => variantes.filter((v) => {
    const matchesSearch =
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.talla.toLowerCase().includes(search.toLowerCase()) ||
      v.color.toLowerCase().includes(search.toLowerCase());
    const matchesStock =
      filterStock === "todos" ||
      (filterStock === "bajo" && v.stock_disponible <= v.stock_minimo && v.stock_disponible > 0) ||
      (filterStock === "critico" && v.stock_disponible === 0) ||
      (filterStock === "ok" && v.stock_disponible > v.stock_minimo);
    return matchesSearch && matchesStock;
  }), [variantes, search, filterStock]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("variantes").select("*").order("sku");
      if (error) {
        toast({ title: "Error", description: error.message, variant: "critical" });
      }
      setVariantes(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "variantes" },
        () => {
          supabase.from("variantes").select("*").order("sku").then(({ data }) => {
            setVariantes(data ?? []);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, toast]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#30D158]/20 border-t-[#30D158] rounded-full animate-spin" />
      </div>
    );
  }

  const tallas = [...new Set(variantes.map((v) => v.talla))].sort();
  const colores = [...new Set(variantes.map((v) => v.color))].sort();
  const skuPorTallaYColor: Record<string, Variante | undefined> = {};
  for (const v of variantes) {
    skuPorTallaYColor[`${v.talla}|${v.color}`] = v;
  }

  const statusColor = (v: Variante) => {
    if (v.stock_disponible === 0) return "bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30";
    if (v.stock_disponible <= v.stock_minimo) return "bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30";
    return "bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Box className="w-5 h-5 text-[#30D158]" />
            <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tighter uppercase">Matriz de Inventario</h1>
          </div>
          <p className="text-[#A1A1A6] text-sm">
            Control de stock por SKU, talla y color. Actualizado en tiempo real.
          </p>
        </div>
        <Button variant="success" className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva variante
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Stock Disponible" value={stats.total} icon={Box} color="success" />
        <StatCard title="Reservado" value={stats.reservado} icon={AlertTriangle} color="warning" />
        <StatCard title="Bajo Mínimo" value={stats.bajoMinimo} icon={AlertTriangle} color="warning" />
        <StatCard title="Sin Stock" value={stats.sinStock} icon={AlertTriangle} color="critical" />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar SKU, talla, color..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 bg-[#161618] border border-[#2C2C2E] rounded-lg px-4 py-2 pl-10 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none focus:ring-1 focus:ring-[#30D158] relative"
        />
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="bg-[#161618] border border-[#2C2C2E] rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none focus:ring-1 focus:ring-[#30D158]"
        >
          <option value="todos">Todos</option>
          <option value="ok">Disponible</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="critico">Sin stock</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="Prueba con otro término o filtro."
          icon={<AlertTriangle className="w-8 h-8" />}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                  <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase tracking-widest">
                    SKU / Talla
                  </th>
                  {colores.map((color) => (
                    <th key={color} className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase tracking-widest text-center">
                      {color}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tallas.map((talla) => (
                  <tr key={talla} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                    <th className="px-4 py-3 text-sm text-[#FFFFFF] font-medium">{talla}</th>
                    {colores.map((color) => {
                      const v = skuPorTallaYColor[`${talla}|${color}`];
                      return (
                        <td key={color} className="px-4 py-3 text-center">
                          {v ? (
                            <div className="flex flex-col items-center gap-2 group cursor-default">
                              <span className="text-xs font-mono text-[#A1A1A6]">{v.sku}</span>
                              <span
                                className={cn(
                                  "text-xs font-bold px-3 py-1 rounded-full border transition-all duration-200 group-hover:scale-105",
                                  statusColor(v)
                                )}
                              >
                                {v.stock_disponible}
                              </span>
                              <span className="text-[10px] text-[#A1A1A6]">R:{v.stock_reservado}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-[#4A4A4A]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length < variantes.length && (
            <p className="mt-3 text-[10px] text-[#A1A1A6] text-center">
              Mostrando {filtered.length} de {variantes.length} variantes
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: "success" | "warning" | "critical" }) {
  const colorMap = {
    success: "bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158]",
    warning: "bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A]",
    critical: "bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A]",
  };
  return (
    <Card padding="sm" className="border border-[#2C2C2E]/30 hover:border-[#2C2C2E]/50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#A1A1A6] uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold text-[#FFFFFF] mt-1">{value}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#161618]/50 flex items-center justify-center border border-[#2C2C2E]/30">
          <Icon className="w-4 h-4 text-[#A1A1A6]" />
        </div>
      </div>
    </Card>
  );
}
