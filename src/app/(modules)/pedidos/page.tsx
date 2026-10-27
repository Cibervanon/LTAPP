"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, Truck, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];

const ESTADOS: { key: string; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "warning" },
  { key: "empacando", label: "Empacando", color: "info" },
  { key: "despachado", label: "Despachado", color: "success" },
  { key: "cancelado", label: "Cancelado", color: "critical" },
];

export default function PedidosPage() {
  const supabase = createClient();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
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
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-success/20 border-t-success rounded-full" />
      </div>
    );
  }

  const stats = {
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    despachados: pedidos.filter((p) => p.estado === "despachado").length,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-6 h-6 text-success" />
            <h1 className="text-2xl font-bold text-primary-text tracking-tighter uppercase">Pedidos Omnicanal</h1>
          </div>
          <p className="text-secondary-text text-sm">
            Ventas por canal, estado contable y seguimiento de envíos.
          </p>
        </div>
        <Button variant="success" className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo pedido
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard3 title="Total Pedidos" value={stats.total} color="primary" />
        <StatCard3 title="Pendientes" value={stats.pendientes} color="warning" />
        <StatCard3 title="Despachados" value={stats.despachados} color="success" />
        <StatCard3 title="Tasa de Cumplimiento" value={stats.total > 0 ? Math.round((stats.despachados / stats.total) * 100) : 0} suffix="%" color="success" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-[#1A1A1A]/50">
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Cliente</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Canal</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Tracking</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => {
                const est = ESTADOS.find((e) => e.key === p.estado) ?? ESTADOS[0];
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-[#1A1A1A]/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-primary-text">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-primary-text">{p.cliente_id ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-primary-text">{p.canal ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={est.color as "success" | "warning" | "critical" | "neutral" | "info"}>{est.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-primary-text">{p.tracking ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-right text-secondary-text">{new Date(p.created_at).toLocaleDateString("es-CO")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard3({ title, value, color, suffix }: { title: string; value: number; color: "primary" | "warning" | "success"; suffix?: string }) {
  const colorMap = {
    primary: "text-primary-text bg-primary-text/10",
    warning: "text-warning bg-warning/10",
    success: "text-success bg-success/10",
  };
  return (
    <Card padding="sm" className="border border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-text uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold ${colorMap[color]} mt-1`}>{value}{suffix}</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-border/50">
          <div className="w-3 h-3 rounded-full bg-[#4A4A4A]" />
        </div>
      </div>
    </Card>
  );
}
