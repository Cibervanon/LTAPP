"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

type Variante = Database["public"]["Tables"]["variantes"]["Row"];
type Orden = Database["public"]["Tables"]["ordenes_fabrica"]["Row"];
type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
type DetallePedido = Database["public"]["Tables"]["detalle_pedidos"]["Row"];

export default function RentabilidadPage() {
  const supabase = createClient();
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallesPedido, setDetallesPedido] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-success/20 border-t-success rounded-full" />
      </div>
    );
  }

  const totalStock = variantes.reduce((acc, v) => acc + v.stock_disponible, 0);
  const totalReservado = variantes.reduce((acc, v) => acc + v.stock_reservado, 0);
  const bajoMinimo = variantes.filter((v) => v.stock_disponible <= v.stock_minimo && v.stock_disponible > 0).length;
  const sinStock = variantes.filter((v) => v.stock_disponible === 0).length;
  const valorInventario = totalStock * 50; // placeholder precio promedio

  const rotacionAlta = variantes.filter((v) => v.stock_disponible > v.stock_minimo * 3).length;
  const rotacionBaja = variantes.filter((v) => v.stock_disponible > 0 && v.stock_disponible <= v.stock_minimo).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-success" />
            <h1 className="text-2xl font-bold text-primary-text tracking-tighter uppercase">Rentabilidad y Salud Comercial</h1>
          </div>
          <p className="text-secondary-text text-sm">
            Márgenes, rotación de inventario y valorización de activos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardRentabilidad title="Valor Inventario" value={`$${valorInventario.toLocaleString("es-CO")}`} icon={<DollarSign className="w-5 h-5" />} color="success" />
        <StatCardRentabilidad title="SKU Rotación Alta" value={rotacionAlta} icon={<Box className="w-5 h-5" />} color="success" />
        <StatCardRentabilidad title="SKU Rotación Baja" value={rotacionBaja} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
        <StatCardRentabilidad title="Sin Stock" value={sinStock} icon={<AlertTriangle className="w-5 h-5" />} color="critical" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-bold text-primary-text mb-6">Salud del Inventario</h2>
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
            <h2 className="text-lg font-bold text-primary-text mb-6">Matriz de Variantes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#1A1A1A]/50">
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">SKU</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Talla</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Color</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Disponible</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Reservado</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Mínimo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {variantes.map((v) => {
                    const estado =
                      v.stock_disponible === 0
                        ? { label: "CRÍTICO", color: "critical", bg: "bg-critical/10" }
                        : v.stock_disponible <= v.stock_minimo
                        ? { label: "BAJO", color: "warning", bg: "bg-warning/10" }
                        : { label: "OK", color: "success", bg: "bg-success/10" };
                    return (
                      <tr key={v.id} className="border-b border-border/50 hover:bg-[#1A1A1A]/30 transition-colors">
                        <td className="px-4 py-2 text-xs font-mono text-primary-text">{v.sku}</td>
                        <td className="px-4 py-2 text-xs text-primary-text">{v.talla}</td>
                        <td className="px-4 py-2 text-xs text-primary-text">{v.color}</td>
                        <td className="px-4 py-2 text-xs text-right text-primary-text">{v.stock_disponible}</td>
                        <td className="px-4 py-2 text-xs text-right text-primary-text">{v.stock_reservado}</td>
                        <td className="px-4 py-2 text-xs text-right text-primary-text">{v.stock_minimo}</td>
                        <td className="px-4 py-2">
                          <Badge variant={estado.color as "success" | "warning" | "critical" | "neutral" | "info"}>{estado.label}</Badge>
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
    success: "bg-success/10 border border-success/20 text-success",
    warning: "bg-warning/10 border border-warning/20 text-warning",
    critical: "bg-critical/10 border border-critical/20 text-critical",
  };
  return (
    <Card className="border border-border/50 hover:border-border transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-secondary-text uppercase tracking-wider">{title}</p>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold text-primary-text">{value}</p>
      </div>
    </Card>
  );
}

function HealthRow({ label, value, color }: { label: string; value: number; color: "success" | "warning" | "critical" }) {
  const colorMap = {
    success: "text-success",
    warning: "text-warning",
    critical: "text-critical",
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-secondary-text">{label}</span>
      <span className={`font-medium ${colorMap[color]}`}>{value}</span>
    </div>
  );
}
