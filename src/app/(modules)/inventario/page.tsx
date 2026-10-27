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
import { Skeleton } from "@/components/ui/skeleton";
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

  const [showAddVariant, setShowAddVariant] = useState(false);
  const [showLoss, setShowLoss] = useState(false);
  const [newVariant, setNewVariant] = useState({ sku: '', talla: '', color: '', stock_disponible: '', stock_minimo: '' });
  const [lossVariant, setLossVariant] = useState('');
  const [lossQty, setLossQty] = useState('');
  const [lossReason, setLossReason] = useState('');
  const [historialPerdidas, setHistorialPerdidas] = useState<{ id: string; sku: string; talla: string; color: string; cantidad: number; motivo: string | null; fecha: string }[]>([]);

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('variantes').insert({
      sku: newVariant.sku,
      talla: newVariant.talla,
      color: newVariant.color,
      stock_disponible: Number(newVariant.stock_disponible) || 0,
      stock_minimo: Number(newVariant.stock_minimo) || 0,
    });
    if (!error) {
      setShowAddVariant(false);
      setNewVariant({ sku: '', talla: '', color: '', stock_disponible: '', stock_minimo: '' });
      toast({ title: 'Variante creada', description: 'Se agregó al inventario', variant: 'success' });
    }
  };

  const handleRegisterLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.from('movimientos_stock').insert({
      variante_id: lossVariant,
      tipo: 'salida',
      cantidad: Number(lossQty) || 0,
      referencia_id: null,
    });
    if (!error) {
      setShowLoss(false);
      setLossVariant('');
      setLossQty('');
      setLossReason('');
      toast({ title: 'Pérdida registrada', description: 'Stock descontado', variant: 'warning' });
    }
  };

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
      const [v, m] = await Promise.all([
        supabase.from("variantes").select("*").order("sku"),
        supabase.from("movimientos_stock").select("*, variantes(sku, talla, color)").eq("tipo", "salida").order("fecha", { ascending: false }),
      ]);
      if (v.error) {
        toast({ title: "Error", description: v.error.message, variant: "critical" });
      }
      setVariantes(v.data ?? []);
      const movimientos = m.data ?? [];
      setHistorialPerdidas(movimientos.map((mov: any) => ({
        id: mov.id,
        sku: mov.variantes?.sku ?? "—",
        talla: mov.variantes?.talla ?? "—",
        color: mov.variantes?.color ?? "—",
        cantidad: mov.cantidad ?? 0,
        motivo: mov.referencia_id ? null : "Pérdida registrada",
        fecha: mov.fecha ?? "",
      })));
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161618]/50 p-4 rounded-xl border border-[#2C2C2E]/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} padding="sm" className="border border-[#2C2C2E]/30">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-12 h-10" />
              </div>
            </Card>
          ))}
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase tracking-widest">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, row) => (
                  <tr key={row} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                    <th className="px-4 py-3 text-sm text-[#FFFFFF] font-medium">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    {Array.from({ length: 5 }).map((_, col) => (
                      <td key={col} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161618]/50 p-4 rounded-xl border border-[#2C2C2E]/50">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-[#30D158]" />
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-tighter">Acciones rápidas</h2>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="success"
            onClick={() => setShowAddVariant(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva variante
          </Button>
          <Button
            variant="warning"
            onClick={() => setShowLoss(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Registrar pérdida
          </Button>
        </div>
      </div>

      {showAddVariant && (
        <Card padding="sm" className="border-[#30D158]/30">
          <form onSubmit={handleAddVariant} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">SKU</label>
              <input
                value={newVariant.sku}
                onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Talla</label>
              <input
                value={newVariant.talla}
                onChange={(e) => setNewVariant({ ...newVariant, talla: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Color</label>
              <input
                value={newVariant.color}
                onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Stock inicial</label>
              <input
                type="number"
                value={newVariant.stock_disponible}
                onChange={(e) => setNewVariant({ ...newVariant, stock_disponible: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Stock mínimo</label>
              <input
                type="number"
                value={newVariant.stock_minimo}
                onChange={(e) => setNewVariant({ ...newVariant, stock_minimo: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Button type="submit" variant="success" className="w-full">
                Crear variante
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddVariant(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showLoss && (
        <Card padding="sm" className="border-[#FF453A]/30">
          <form onSubmit={handleRegisterLoss} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Variante</label>
              <select
                value={lossVariant}
                onChange={(e) => setLossVariant(e.target.value)}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#FF453A] focus:outline-none"
              >
                <option value="">Seleccionar variante...</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} — T:{v.talla} C:{v.color} (disp: {v.stock_disponible - v.stock_reservado})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Cantidad</label>
              <input
                type="number"
                value={lossQty}
                onChange={(e) => setLossQty(e.target.value)}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#FF453A] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Motivo</label>
              <input
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#FF453A] focus:outline-none"
                placeholder="Daño, muestra, robo..."
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Button type="submit" variant="critical" className="w-full">
                Confirmar pérdida
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLoss(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
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

      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#FFFFFF] mb-4">Historial de Pérdidas</h2>
          {historialPerdidas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-[#A1A1A6] mb-2" />
              <p className="text-sm text-[#A1A1A6]">No hay pérdidas registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">SKU</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Talla</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Color</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Cantidad</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {historialPerdidas.map((p) => (
                    <tr key={p.id} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.sku}</td>
                      <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.talla}</td>
                      <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.color}</td>
                      <td className="px-4 py-3 text-xs text-right text-[#FF453A]">{p.cantidad}</td>
                      <td className="px-4 py-3 text-xs text-right text-[#A1A1A6]">{new Date(p.fecha).toLocaleDateString("es-CO")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
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
