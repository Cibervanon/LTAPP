"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { createClient, isBrowser } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Truck, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];

const ESTADOS: { key: string; label: string; color: string }[] = [
  { key: "pendiente", label: "Pendiente", color: "warning" },
  { key: "empacando", label: "Empacando", color: "neutral" },
  { key: "despachado", label: "Despachado", color: "success" },
  { key: "cancelado", label: "Cancelado", color: "critical" },
];

export default function PedidosPage() {
  const supabase = useMemo(() => (isBrowser() ? createClient() : null), []);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [variantes, setVariantes] = useState<{ id: string; sku: string; talla: string; color: string; stock_disponible: number; stock_reservado: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ cliente: '', canal: '', variante_id: '', cantidad: '', precio_venta: '' });

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!newOrder.cliente.trim() || !newOrder.variante_id.trim() || !newOrder.cantidad.trim()) {
      toast({ title: "Campos requeridos", description: "Cliente, variante y cantidad son obligatorios", variant: "warning" });
      return;
    }
    const { data: pedidoCreado, error } = await supabase.from('pedidos').insert({
      cliente_id: null,
      cliente: newOrder.cliente,
      canal: newOrder.canal,
      estado: 'pendiente',
    }).select().single();
    if (error || !pedidoCreado) {
      toast({ title: 'Error', description: error?.message ?? 'No se pudo crear el pedido', variant: 'critical' });
      return;
    }
    if (newOrder.variante_id && Number(newOrder.cantidad) > 0) {
      const { data: variante } = await supabase.from('variantes').select('stock_disponible, stock_reservado').eq('id', newOrder.variante_id).single();
      const disponible = (variante?.stock_disponible ?? 0) - (variante?.stock_reservado ?? 0);
      const solicitado = Number(newOrder.cantidad);
      if (disponible < solicitado) {
        toast({ title: "Stock insuficiente", description: `Solo quedan ${disponible} unidades disponibles de esta variante`, variant: "warning" });
        return;
      }
      const actual = variante?.stock_reservado ?? 0;
      await supabase.from('variantes').update({ stock_reservado: actual + solicitado }).eq('id', newOrder.variante_id);
      await supabase.from('detalle_pedidos').insert({
        pedido_id: pedidoCreado.id,
        variante_id: newOrder.variante_id,
        cantidad: solicitado,
        precio_venta: Number(newOrder.precio_venta) || null,
      });
    }
    toast({ title: 'Pedido creado', description: 'Stock reservado', variant: 'success' });
    setShowNewOrder(false);
    setNewOrder({ cliente: '', canal: '', variante_id: '', cantidad: '', precio_venta: '' });
  };

  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    if (!window.confirm(`¿Cambiar estado del pedido ${pedidoId.slice(0, 8)} a "${nuevoEstado}"?`)) return;
    if (!supabase) return;
    const { error } = await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', pedidoId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'critical' });
    } else {
      toast({ title: 'Estado actualizado', description: `Pedido ${pedidoId.slice(0, 8)} ahora es ${nuevoEstado}`, variant: 'success' });
    }
  };

  const handleAsignarTracking = async (pedidoId: string, tracking: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('pedidos').update({ tracking }).eq('id', pedidoId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'critical' });
    } else {
      toast({ title: 'Tracking asignado', description: `Pedido ${pedidoId.slice(0, 8)} con guía ${tracking}`, variant: 'success' });
    }
  };

  useEffect(() => {
    const load = async () => {
      const [p, v] = await Promise.all([
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
        supabase.from("variantes").select("id, sku, talla, color, stock_disponible, stock_reservado"),
      ]);
      if (p.error) {
        toast({ title: "Error", description: p.error.message, variant: "critical" });
      }
      setPedidos(p.data ?? []);
      setVariantes(v.data ?? []);
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
      <div className="space-y-8 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161618]/50 p-4 rounded-xl border border-[#2C2C2E]/50">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-32" />
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
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2C2C2E]/50 bg-[#161618]/30">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="px-4 py-3 text-[10px] font-semibold text-[#A1A1A6] uppercase">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 3 }).map((_, row) => (
                  <tr key={row} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                    {Array.from({ length: 7 }).map((_, col) => (
                      <td key={col} className="px-4 py-3 text-xs text-[#FFFFFF]">
                        <Skeleton className="h-4 w-24" />
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

  const stats = useMemo(() => ({
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    despachados: pedidos.filter((p) => p.estado === "despachado").length,
  }), [pedidos]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#161618]/50 p-4 rounded-xl border border-[#2C2C2E]/50">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#30D158]" />
          <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-tighter">Nuevo pedido</h2>
        </div>
        <Button
          variant="success"
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Crear pedido
        </Button>
      </div>

      {showNewOrder && (
        <Card padding="sm" className="border-[#30D158]/30">
          <form onSubmit={handleCreateOrder} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Cliente</label>
              <input
                value={newOrder.cliente}
                onChange={(e) => setNewOrder({ ...newOrder, cliente: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Canal</label>
              <select
                value={newOrder.canal}
                onChange={(e) => setNewOrder({ ...newOrder, canal: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              >
                <option value="web">Web</option>
                <option value="tienda">Tienda física</option>
                <option value="mayoreo">Mayoreo</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Variante</label>
              <select
                value={newOrder.variante_id}
                onChange={(e) => setNewOrder({ ...newOrder, variante_id: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
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
                value={newOrder.cantidad}
                onChange={(e) => setNewOrder({ ...newOrder, cantidad: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[#A1A1A6] uppercase">Precio venta</label>
              <input
                type="number"
                step="0.01"
                value={newOrder.precio_venta}
                onChange={(e) => setNewOrder({ ...newOrder, precio_venta: e.target.value })}
                className="h-9 rounded-lg border border-[#2C2C2E] bg-[#0A0A0A] px-3 text-sm text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <Button type="submit" variant="success" className="w-full">
                Crear pedido
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowNewOrder(false)}
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
                const [nuevoEstado, setNuevoEstado] = React.useState(p.estado);
                const [trackingInput, setTrackingInput] = React.useState(p.tracking ?? "");
                return (
                  <tr key={p.id} className="border-b border-[#2C2C2E]/30 hover:bg-[#161618]/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[#FFFFFF]">{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.cliente ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#FFFFFF]">{p.canal ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        className="bg-[#161618] border border-[#2C2C2E] rounded-lg px-2 py-1 text-xs text-[#FFFFFF] focus:border-[#30D158] focus:outline-none"
                      >
                        {ESTADOS.map((e) => (
                          <option key={e.key} value={e.key}>{e.label}</option>
                        ))}
                      </select>
                      <Button
                        onClick={() => handleCambiarEstado(p.id, nuevoEstado)}
                        variant="outline"
                        size="sm"
                        className="ml-1 px-2 py-1 text-[10px]"
                      >
                        Cambiar
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-[#FFFFFF]">
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Guía"
                        className="bg-[#161618] border border-[#2C2C2E] rounded px-2 py-1 text-xs text-[#FFFFFF] focus:border-[#30D158] focus:outline-none w-20"
                      />
                      <Button
                        onClick={() => handleAsignarTracking(p.id, trackingInput)}
                        variant="outline"
                        size="sm"
                        className="ml-1 px-2 py-1 text-[10px]"
                      >
                        Guardar
                      </Button>
                    </td>
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
