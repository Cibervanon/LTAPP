"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, AlertTriangle, Plus, Calculator, Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Orden = Database["public"]["Tables"]["ordenes_fabrica"]["Row"];

const ESTADOS: { key: Orden["estado"]; label: string; color: string; bg: string }[] = [
  { key: "borrador", label: "Borrador", color: "text-[#5A5A5A]", bg: "bg-[#5A5A5A]/10" },
  { key: "enviado_a_fabrica", label: "Enviado a Fábrica", color: "text-primary-text", bg: "bg-primary-text/10" },
  { key: "en_produccion", label: "En Producción", color: "text-primary-text", bg: "bg-primary-text/10" },
  { key: "en_transito", label: "En Tránsito", color: "text-primary-text", bg: "bg-primary-text/10" },
  { key: "control_calidad", label: "Control de Calidad", color: "text-warning", bg: "bg-warning/10" },
  { key: "ingresado_a_inventario", label: "Ingresado a Inventario", color: "text-success", bg: "bg-success/10" },
];

export default function OrdenesFabricaPage() {
  const supabase = createClient();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [nuevaOrden, setNuevaOrden] = useState<Record<string, string>>({
    costo_fabrica_total: "",
    flete: "",
    aranceles: "",
    seguros: "",
    unidades_aprobadas_recibidas: "",
  });
  const { toast } = useToast();

  const stats = {
    total: ordenes.length,
    enProduccion: ordenes.filter((o) => o.estado === "en_produccion").length,
    enTransito: ordenes.filter((o) => o.estado === "en_transito").length,
    ingresadas: ordenes.filter((o) => o.estado === "ingresado_a_inventario").length,
  };

  const calcularLanded = (o: Orden) => {
    const total =
      (o.costo_fabrica_total ?? 0) +
      (o.flete ?? 0) +
      (o.aranceles ?? 0) +
      (o.seguros ?? 0);
    const unidades = o.unidades_aprobadas_recibidas ?? 0;
    return unidades > 0 ? total / unidades : 0;
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from("ordenes_fabrica").select("*").order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "critical" });
      }
      setOrdenes(data ?? []);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("ordenes-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ordenes_fabrica" }, () => {
        supabase.from("ordenes_fabrica").select("*").order("created_at", { ascending: false }).then(({ data }) => {
          setOrdenes(data ?? []);
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
        <div className="flex flex-col items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-success/20 border-t-success rounded-full" />
          <p className="text-secondary-text text-sm">Cargando órdenes de fábrica…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Factory className="w-6 h-6 text-success" />
            <h1 className="text-2xl font-bold text-primary-text tracking-tighter uppercase">Órdenes de Fábrica</h1>
          </div>
          <p className="text-secondary-text text-sm">
            Gestiona el ciclo de producción: Borrador → Enviado a Fábrica → En Producción → En Tránsito → Control de Calidad → Ingresado a Inventario.
          </p>
        </div>
        <Button variant="success" className="w-full md:w-auto">
          Nueva orden
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard2 title="Órdenes Totales" value={stats.total} icon={<Factory className="w-5 h-5" />} color="success" />
        <StatCard2 title="En Producción" value={stats.enProduccion} icon={<Clock className="w-5 h-5" />} color="warning" />
        <StatCard2 title="En Tránsito" value={stats.enTransito} icon={<Truck className="w-5 h-5" />} color="warning" />
        <StatCard2 title="Ingresadas" value={stats.ingresadas} icon={<AlertTriangle className="w-5 h-5" />} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card padding="sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-primary-text">Órdenes</h2>
              <div className="flex gap-2">
                <select className="bg-[#1A1A1A] border border-[#3A3A3C] rounded-lg px-3 py-2 text-sm text-primary-text focus:border-success focus:outline-none">
                  <option>Todos los estados</option>
                  {ESTADOS.map((e) => <option key={e.key}>{e.label}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#1A1A1A]/50">
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase">Estado</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Costo Fábrica</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Flete</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Aranceles</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Seguros</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Unidades</th>
                    <th className="px-4 py-3 text-xs font-semibold text-secondary-text uppercase text-right">Costo Landed</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => {
                    const est = ESTADOS.find((e) => e.key === o.estado)!;
                    const landed = calcularLanded(o);
                    return (
                      <tr key={o.id} className="border-b border-border/50 hover:bg-[#1A1A1A]/30 transition-colors">
                        <td className="px-4 py-3 text-xs font-mono text-primary-text">{o.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={est.color.includes("success") ? "success" : est.color.includes("warning") ? "warning" : "neutral"}>
                            {est.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-right text-primary-text">{o.costo_fabrica_total?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-right text-primary-text">{o.flete?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-right text-primary-text">{o.aranceles?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-right text-primary-text">{o.seguros?.toFixed(2) ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-right text-primary-text">{o.unidades_aprobadas_recibidas ?? "—"}</td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-primary-text">{landed.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="sm">
            <h2 className="text-lg font-bold text-primary-text mb-6">Costo Landed Unitario</h2>
            <p className="text-xs text-secondary-text mb-4">Calcula el costo real por unidad incluyendo manufactura, flete, aranceles y seguros.</p>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3C]/50">
                  <div className="w-8 h-8 rounded bg-[#252525] flex items-center justify-center text-xs">
                    <Factory className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-secondary-text uppercase tracking-wider">Costo Fábrica Total</label>
                    <Input
                      value={nuevaOrden.costo_fabrica_total ?? ""}
                      onChange={(e) => setNuevaOrden((p) => ({ ...p, costo_fabrica_total: e.target.value }))}
                      className="w-full h-9 bg-transparent border-0 focus:ring-0 text-sm text-primary-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3C]/50">
                  <div className="w-8 h-8 rounded bg-[#252525] flex items-center justify-center text-xs">
                    <Truck className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-secondary-text uppercase tracking-wider">Flete</label>
                    <Input
                      value={nuevaOrden.flete ?? ""}
                      onChange={(e) => setNuevaOrden((p) => ({ ...p, flete: e.target.value }))}
                      className="w-full h-9 bg-transparent border-0 focus:ring-0 text-sm text-primary-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3C]/50">
                  <div className="w-8 h-8 rounded bg-[#252525] flex items-center justify-center text-xs">
                    <Calculator className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-secondary-text uppercase tracking-wider">Aranceles</label>
                    <Input
                      value={nuevaOrden.aranceles ?? ""}
                      onChange={(e) => setNuevaOrden((p) => ({ ...p, aranceles: e.target.value }))}
                      className="w-full h-9 bg-transparent border-0 focus:ring-0 text-sm text-primary-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3C]/50">
                  <div className="w-8 h-8 rounded bg-[#252525] flex items-center justify-center text-xs">
                    <AlertTriangle className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-secondary-text uppercase tracking-wider">Seguros</label>
                    <Input
                      value={nuevaOrden.seguros ?? ""}
                      onChange={(e) => setNuevaOrden((p) => ({ ...p, seguros: e.target.value }))}
                      className="w-full h-9 bg-transparent border-0 focus:ring-0 text-sm text-primary-text"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] border border-[#3A3A3C]/50">
                  <div className="w-8 h-8 rounded bg-[#252525] flex items-center justify-center text-xs">
                    <Clock className="w-4 h-4 text-secondary-text" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-secondary-text uppercase tracking-wider">Unidades Aprobadas Recibidas</label>
                    <Input
                      value={nuevaOrden.unidades_aprobadas_recibidas ?? ""}
                      onChange={(e) => setNuevaOrden((p) => ({ ...p, unidades_aprobadas_recibidas: e.target.value }))}
                      className="w-full h-9 bg-transparent border-0 focus:ring-0 text-sm text-primary-text"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={async () => {
                  const { error } = await (supabase.from("ordenes_fabrica").insert as any)({
                    estado: "borrador",
                    costo_fabrica_total: Number(nuevaOrden.costo_fabrica_total) || null,
                    flete: Number(nuevaOrden.flete) || null,
                    aranceles: Number(nuevaOrden.aranceles) || null,
                    seguros: Number(nuevaOrden.seguros) || null,
                    unidades_aprobadas_recibidas: Number(nuevaOrden.unidades_aprobadas_recibidas) || null,
                  });
                  if (!error) {
                    setNuevaOrden({ costo_fabrica_total: "", flete: "", aranceles: "", seguros: "", unidades_aprobadas_recibidas: "" });
                    toast({ title: "Orden creada", description: "La orden se agregó como borrador", variant: "success" });
                  }
                }}
                className="w-full bg-success text-[#121212] font-semibold py-3 rounded-xl"
              >
                Crear orden
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard2({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: "success" | "warning" }) {
  return (
    <Card padding="sm" className="border border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-secondary-text uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-primary-text mt-1">{value}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color === "success" ? "bg-success/10 border border-success/20" : "bg-warning/10 border border-warning/20"}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
