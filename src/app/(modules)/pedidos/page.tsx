"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Truck, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];

const ESTADOS: { key: string; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "warning" },
  { key: "empacando", label: "Empacando", color: "neutral" },
  { key: "despachado", label: "Despachado", color: "success" },
  { key: "cancelado", label: "Cancelado", color: "critical" },
];

export default function PedidosPage() {
  const [supabase, setSupabase] = useState<any>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  if (!supabase) return null;
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "critical" });
      }
      setPedidos(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("pedidos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          setPedidos(data ?? []);
        });
      })
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

  const stats = useMemo(() => ({
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    despachados: pedidos.filter((p) => p.estado === "despachado").length,
  }), [pedidos]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-5 h-5 text-[#30D158]" />
            <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tighter uppercase">Pedidos Omnicanal</h1>
          </div>
          <p className="text-[#A1A1A6] text-sm">
            Ventas por canal, estado contable y seguimiento de envíos.
          </p>
        </div>
        <Button variant="success" className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo pedido
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard3 title="Total Pedidos" value={stats.total} color="success" />
        <StatCard3 title="Pendientes" value={stats.pendientes} color="warning" />
        <StatCard3 title="Despachados" value={stats.despachados} color="success" />
        <StatCard3 title="Tasa Cumplimiento" value={stats.total > 0 ? Math.round((stats.despachados / stats.total) * 100) : 0} suffix="%" color="success" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">ID</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Cliente</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Canal</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">Estado</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Tracking</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const est = ESTADOS.find((e) => e.key === p.estado) ?? ESTADOS[0];
                return (
                  <tr key={p.id} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[#FFFFFF]">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.cliente_id ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.canal ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={est.color as "success" | "warning" | "critical" | "neutral"}>{est.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-[#FFFFFF]">{p.tracking ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-right text-[#A1A1A6]">{new Date(p.created_at).toLocaleDateString("es-CO")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard3({ title, value, color, suffix }: { title: string; value: number; color: "success" | "warning"; suffix?: string }) {
  const colorMap = {
    success: "text-[#30D158]",
    warning: "text-[#FF9F0A]",
  };
  return (
    <Card padding="sm" className="border border-[#2C2C2E]/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#A1A1A6] uppercase tracking-widest">{title}</p>
          <p className={`text-2xl font-bold ${colorMap[color]} mt-1`}>{value}{suffix}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#161618]/50 flex items-center justify-center border border-[#2C2C2E]/30">
          <div className="w-3 h-3 rounded-full bg-[#4A4A4A]" />
        </div>
      </div>
    </Card>
  );
}
