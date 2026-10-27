"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  const [supabase] = useState(() => createClient());
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
        <div className="w-12 h-12 border-4 border-success/20 border-t-success rounded-full animate-spin" />
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
    if (v.stock_disponible === 0) return "bg-critical/10 text-critical border border-critical/20";
    if (v.stock_disponible <= v.stock_minimo) return "bg-warning/10 text-warning border border-warning/20";
    return "bg-success/10 text-success border border-success/20";
  };

  const statusLabel = (v: Variante) => {
    if (v.stock_disponible === 0) return "Sin stock";
    if (v.stock_disponible <= v.stock_minimo) return "Bajo mínimo";
    return "Disponible";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Box className="w-6 h-6 text-success" />
            <h1 className="text-2xl font-bold text-primary-text tracking-tighter uppercase">Matriz de Inventario</h1>
          </div>
          <p className="text-secondary-text text-sm">
            Control de stock por SKU, talla y color. Actualizado en tiempo real.
          </p>
        </div>
        <Button variant="success" className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva variante
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Stock Disponible" value={stats.total} icon={Box} color="success" />
        <StatCard title="Reservado" value={stats.reservado} icon={AlertTriangle} color="warning" />
        <StatCard title="Bajo Mínimo" value={stats.bajoMinimo} icon={AlertTriangle} color="warning" />
        <StatCard title="Sin Stock" value={stats.sinStock} icon={AlertTriangle} color="critical" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar SKU, talla, color..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64 bg-[#1A1A1A] border border-[#3A3A3C] rounded-lg px-4 py-2 pl-10 text-sm text-primary-text focus:border-success focus:outline-none focus:ring-1 focus:ring-success relative"
        />
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="bg-[#1A1A1A] border border-[#3A3A3C] rounded-lg px-3 py-2 text-sm text-primary-text focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
        >
          <option value="todos">Todos</option>
          <option value="ok">Disponible</option>
          <option value="bajo">Bajo mínimo</option>
          <option value="critico">Sin stock</option>
        </select>
      </div>

      {/* Matrix */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No hay coincidencias"
          description="Prueba con otro término de búsqueda o filtro."
          icon={<AlertTriangle className="w-8 h-8" />}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-[#1A1A1A]/50">
                  <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider">
                    SKU / Talla
                  </th>
                  {colores.map((color) => (
                    <th key={color} className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase tracking-wider text-center">
                      {color}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tallas.map((talla) => (
                  <tr key={talla} className="border-b border-border/50 hover:bg-[#1A1A1A]/30 transition-colors group">
                    <th className="px-4 py-3 text-sm text-primary-text font-medium">{talla}</th>
                    {colores.map((color) => {
                      const v = skuPorTallaYColor[`${talla}|${color}`];
                      return (
                        <td key={color} className="px-4 py-3 text-center">
                          {v ? (
                            <div className="flex flex-col items-center gap-2 group cursor-default">
                              <span className="text-xs font-mono text-secondary-text">{v.sku}</span>
                              <span
                                className={cn(
                                  "text-xs font-bold px-3 py-1 rounded-full border transition-all duration-200 group-hover:scale-105",
                                  statusColor(v)
                                )}
                              >
                                {v.stock_disponible}
                              </span>
                              <span className="text-[10px] text-secondary-text">R:{v.stock_reservado}</span>
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
            <p className="mt-3 text-xs text-secondary-text text-center">
              Mostrando {filtered.length} de {variantes.length} variantes
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: "success" | "warning" | "critical" }) {
  return (
    <Card padding="sm" className="border border-border/50 hover:border-border transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-text uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-primary-text mt-1">{value}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-border/50">
          <Icon className="w-4 h-4 text-secondary-text" />
        </div>
      </div>
    </Card>
  );
}
