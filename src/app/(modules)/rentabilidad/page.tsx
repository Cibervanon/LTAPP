"use client";

import { useMemo, useState } from "react";
import { createClient, isBrowser } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Box } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <div className="w-10 h-10 border-4 border-[#30D158]/20 border-t-[#30D158] rounded-full animate-spin" />
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
