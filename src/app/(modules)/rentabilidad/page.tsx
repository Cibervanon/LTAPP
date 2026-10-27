"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient, isBrowser } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Variante = Database["public"]["Tables"]["variantes"]["Row"];
type Orden = Database["public"]["Tables"]["ordenes_fabrica"]["Row"];
type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
type DetallePedido = Database["public"]["Tables"]["detalle_pedidos"]["Row"];

export default function RentabilidadPage() {
  const supabase = useMemo(() => (isBrowser() ? createClient() : null), []);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallesPedido, setDetallesPedido] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);

  const [perdidas, setPerdidas] = useState({ unidades: 0, monto: 0 });

  useEffect(() => {
    const load = async () => {
      const [v, o, p, dp] = await Promise.all([
        supabase.from("variantes").select("*"),
        supabase.from("ordenes_fabrica").select("*"),
        supabase.from("pedidos").select("*"),
        supabase.from("detalle_pedidos").select("*"),
      ]);
      setVariantes(v.data ?? []);
      setOrdenes(o.data ?? []);
      setPedidos(p.data ?? []);
      setDetallesPedido(dp.data ?? []);

      const { data: mov } = await supabase.from("movimientos_stock").select("*").eq("tipo", "salida");
      const lista = mov?.data ?? [];
      setPerdidas({
        unidades: lista.reduce((acc, m) => acc + (m.cantidad ?? 0), 0),
        monto: 0,
      });

      setLoading(false);
    };
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#161618]/50 p-4 rounded-xl border border-[#2C2C2E]/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-[#2C2C2E]/30">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="w-8 h-8" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#FFFFFF] mb-6">
                <Skeleton className="h-5 w-32" />
              </h2>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#FFFFFF] mb-6">
                <Skeleton className="h-5 w-32" />
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <tbody>
                    {Array.from({ length: 3 }).map((_, row) => (
                      <tr key={row} className="border-b border-[#2C2C2E]/30">
                        {Array.from({ length: 8 }).map((_, col) => (
                          <td key={col} className="px-4 py-2 text-xs text-[#FFFFFF]">
                            <Skeleton className="h-4 w-16" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (variantes.length === 0 && pedidos.length === 0 && ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <DollarSign className="w-16 h-16 text-[#A1A1A6] mb-4" />
        <h2 className="text-lg font-bold text-[#FFFFFF] mb-2">Sin datos aún</h2>
        <p className="text-[#A1A1A6] text-sm mb-6 max-w-xs">
          Crea variantes en Inventario y pedidos en Pedidos para ver rentabilidad y márgenes.
        </p>
        <Button variant="success" asChild>
          <Link href="/inventario">Crear primera variante</Link>
        </Button>
      </div>
    );
  }

  const totalStock = variantes.reduce((acc, v) => acc + v.stock_disponible, 0);
  const totalReservado = variantes.reduce((acc, v) => acc + v.stock_reservado, 0);
  const bajoMinimo = variantes.filter((v) => v.stock_disponible <= v.stock_minimo && v.stock_disponible > 0).length;
  const sinStock = variantes.filter((v) => v.stock_disponible === 0).length;
  const valorInventario = totalStock * 50;
  const rotacionAlta = variantes.filter((v) => v.stock_disponible > v.stock_minimo * 3).length;
  const rotacionBaja = variantes.filter((v) => v.stock_disponible > 0 && v.stock_disponible <= v.stock_minimo).length;

  const preciosVenta = detallesPedido.map((d) => d.precio_venta ?? 0).filter((p) => p > 0);
  const precioVentaPromedio = preciosVenta.length > 0 ? preciosVenta.reduce((a, b) => a + b, 0) / preciosVenta.length : 0;
  const costoLandedPromedio = ordenes.filter((o) => o.costo_landed_unitario).length > 0
    ? ordenes.filter((o) => o.costo_landed_unitario).reduce((a, b) => a + (b.costo_landed_unitario ?? 0), 0) / ordenes.filter((o) => o.costo_landed_unitario).length
    : 0;
  const margenUnitario = precioVentaPromedio - costoLandedPromedio;
  const ventasTotales = detallesPedido.reduce((acc, d) => acc + ((d.precio_venta ?? 0) * (d.cantidad ?? 0)), 0);
  const gananciaEstimada = ventasTotales - (costoLandedPromedio * detallesPedido.reduce((acc, d) => acc + (d.cantidad ?? 0), 0));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#30D158]" />
            <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tighter uppercase">Rentabilidad y Salud Comercial</h1>
          </div>
          <p className="text-[#A1A1A6] text-sm">
            Márgenes, rotación de inventario y valorización de activos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardRentabilidad title="Valor Inventario" value={`$${valorInventario.toLocaleString("es-CO")}`} icon={<DollarSign className="w-5 h-5" />} color="success" />
        <StatCardRentabilidad title="SKU Rotación Alta" value={rotacionAlta} icon={<Box className="w-5 h-5" />} color="success" />
        <StatCardRentabilidad title="SKU Rotación Baja" value={rotacionBaja} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
        <StatCardRentabilidad title="Sin Stock" value={sinStock} icon={<AlertTriangle className="w-5 h-5" />} color="critical" />
        <StatCardRentabilidad title="Pérdidas (unidades)" value={perdidas.unidades} icon={<AlertTriangle className="w-5 h-5" />} color="critical" />
        <StatCardRentabilidad title="Pérdidas (monto)" value={`$${perdidas.monto.toLocaleString("es-CO")}`} icon={<DollarSign className="w-5 h-5" />} color="critical" />
        <StatCardRentabilidad title="Margen Unitario" value={`$${margenUnitario.toFixed(0)}`} icon={<DollarSign className="w-5 h-5" />} color="success" />
        <StatCardRentabilidad title="Ganancia Estimada" value={`$${gananciaEstimada.toLocaleString("es-CO")}`} icon={<TrendingUp className="w-5 h-5" />} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-[#FFFFFF] mb-6">Salud del Inventario</h2>
            <div className="space-y-4">
              <HealthRow label="Disponible" value={totalStock} color="success" />
              <HealthRow label="Reservado" value={totalReservado} color="warning" />
              <HealthRow label="Bajo Mínimo" value={bajoMinimo} color="warning" />
              <HealthRow label="Sin Stock" value={sinStock} color="critical" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-[#FFFFFF] mb-6">Matriz de Variantes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">SKU</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Talla</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Color</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Disponible</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Reservado</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Mínimo</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {variantes.map((v) => {
                    const estado =
                      v.stock_disponible === 0
                        ? { label: "CRÍTICO", color: "critical", bg: "bg-[#FF453A]/15" }
                        : v.stock_disponible <= v.stock_minimo
                        ? { label: "BAJO", color: "warning", bg: "bg-[#FF9F0A]/15" }
                        : { label: "OK", color: "success", bg: "bg-[#30D158]/15" };
                    return (
                      <tr key={v.id} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                        <td className="px-4 py-2 text-xs font-mono text-[#FFFFFF]">{v.sku}</td>
                        <td className="px-4 py-2 text-xs text-[#FFFFFF]">{v.talla}</td>
                        <td className="px-4 py-2 text-xs text-[#FFFFFF]">{v.color}</td>
                        <td className="px-4 py-2 text-xs text-right text-[#FFFFFF]">{v.stock_disponible}</td>
                        <td className="px-4 py-2 text-xs text-right text-[#FFFFFF]">{v.stock_reservado}</td>
                        <td className="px-4 py-2 text-xs text-right text-[#FFFFFF]">{v.stock_minimo}</td>
                        <td className="px-4 py-2">
                          <Badge variant={estado.color as "success" | "warning" | "critical" | "neutral"}>{estado.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCardRentabilidad({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: "success" | "warning" | "critical" }) {
  const colorMap = {
    success: "bg-[#30D158]/15 border border-[#30D158]/30 text-[#30D158]",
    warning: "bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-[#FF9F0A]",
    critical: "bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A]",
  };
  return (
    <Card className="border border-[#2C2C2E]/30 hover:border-[#2C2C2E]/50 transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-[#A1A1A6] uppercase tracking-widest">{title}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold text-[#FFFFFF]">{value}</p>
      </div>
    </Card>
  );
}

function HealthRow({ label, value, color }: { label: string; value: number; color: "success" | "warning" | "critical" }) {
  const colorMap = {
    success: "text-[#30D158]",
    warning: "text-[#FF9F0A]",
    critical: "text-[#FF453A]",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#A1A1A6]">{label}</span>
      <span className={`font-medium ${colorMap[color]}`}>{value}</span>
    </div>
  );
}
