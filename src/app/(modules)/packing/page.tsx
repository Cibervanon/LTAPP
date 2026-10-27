"use client";

import { useMemo, useState } from "react";
import { createClient, isBrowser } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { PackageCheck, Truck, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

type Pedido = Database["public"]["Tables"]["pedidos"]["Row"];
type DetallePedido = Database["public"]["Tables"]["detalle_pedidos"]["Row"];
type Variante = Database["public"]["Tables"]["variantes"]["Row"];

type Item = DetallePedido & { variante: Variante | null };

export default function PackingPage() {
  const supabase = useMemo(() => (isBrowser() ? createClient() : null), []);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [despachando, setDespachando] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const [p, d, v] = await Promise.all([
        supabase.from("pedidos").select("*").eq("estado", "pendiente").order("created_at"),
        supabase.from("detalle_pedidos").select("*"),
        supabase.from("variantes").select("*"),
      ]);
      setPedidos(p.data ?? []);
      setVariantes(v.data ?? []);
      const detalles = (d.data ?? []) as any[];
      const variantesList = (v.data ?? []) as any[];
      const itemsConVariante = detalles.map((det: any) => ({
        ...det,
        variante: variantesList.find((x: any) => x.id === det.variante_id) ?? null,
      }));
      setItems(itemsConVariante);
      setChecked(Object.fromEntries(itemsConVariante.map((i) => [i.id, false])));
      setLoading(false);
    };
    load();

    const channel = supabase.channel("packing-changes").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "pedidos" },
      () => {
        supabase.from("pedidos").select("*").eq("estado", "pendiente").order("created_at").then(({ data }) => {
          setPedidos(data ?? []);
        });
      }
    ).subscribe();

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

  if (pedidos.length === 0) {
    return (
      <EmptyStatePacking />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <PackageCheck className="w-5 h-5 text-[#30D158]" />
            <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tighter uppercase">Packing Digital</h1>
          </div>
          <p className="text-[#A1A1A6] text-sm">
            Verifica físicamente cada item antes de despachar.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {pedidos.map((pedido) => {
          const itemsPedido = items.filter((i) => i.pedido_id === pedido.id);
          const pedidoChecked = itemsPedido.length > 0 && itemsPedido.every((i) => checked[i.id]);
          const isDespachando = despachando.has(pedido.id);

          return (
            <motion.div
              key={pedido.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="border-b border-[#2C2C2E]/30 last:border-0"
            >
              <div className="px-6 py-4 flex items-center justify-between bg-[#161618]/30">
                <div>
                  <p className="text-sm font-semibold text-[#FFFFFF]">
                    Pedido {pedido.id.slice(0, 8)} · {pedido.canal ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#A1A1A6]">Cliente: {pedido.cliente_id ?? "—"}</p>
                </div>
                <div className="text-right">
                  <Badge variant={pedidoChecked ? "success" : "warning"}>
                    {pedidoChecked ? "Listo para despachar" : "Pendiente de verificación"}
                  </Badge>
                </div>
              </div>
              <div className="px-6 py-4 divide-y divide-[#2C2C2E]/30">
                {itemsPedido.map((item) => {
                  const isChecked = checked[item.id] ?? false;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between gap-4 py-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#FFFFFF] truncate">
                          {item.variante?.sku ?? "SKU desconocido"}
                        </p>
                        <p className="text-[10px] text-[#A1A1A6] truncate">
                          {item.variante?.talla ?? "—"} · {item.variante?.color ?? "—"}
                        </p>
                        <p className="text-[10px] text-[#A1A1A6]">Cant: {item.cantidad}</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setChecked((prev) => ({ ...prev, [item.id]: !isChecked }))}
                          className="w-5 h-5 rounded border-[#2C2C2E] text-[#30D158] accent-[#30D158] bg-[#161618] focus:ring-0 checked:bg-[#30D158] checked:border-[#30D158] transition-all"
                        />
                        <span className={`text-[10px] font-medium transition-colors ${isChecked ? "text-[#30D158]" : "text-[#A1A1A6]"}`}>
                          {isChecked ? "Verificado" : "Pendiente"}
                        </span>
                      </label>
                    </motion.div>
                  );
                })}
              </div>
              {pedidoChecked && (
                <div className="px-6 py-4 bg-[#161618]/30">
                  <Button
                    onClick={async () => {
                      setDespachando((prev) => new Set([...prev, pedido.id]));
                      await (supabase.from("pedidos").update as any)({ estado: "despachado" }).eq("id", pedido.id);
                      setDespachando((prev) => {
                        const next = new Set(prev);
                        next.delete(pedido.id);
                        return next;
                      });
                      setPedidos((prev) => prev.filter((p) => p.id !== pedido.id));
                      toast({ title: "Pedido despachado", description: `El pedido ${pedido.id.slice(0, 8)} ha sido despachado`, variant: "success" });
                    }}
                    disabled={isDespachando}
                    className="w-full bg-[#30D158] text-[#0A0A0A] font-semibold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isDespachando ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        <span>Despachar pedido</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </Card>
    </div>
  );
}

function EmptyStatePacking() {
  return (
    <Card className="p-12 text-center border-[#2C2C2E]/30">
      <div className="w-16 h-16 rounded-full bg-[#30D158]/10 flex items-center justify-center mx-auto mb-4">
        <Truck className="w-8 h-8 text-[#30D158]" />
      </div>
      <h3 className="text-lg font-bold text-[#FFFFFF] mb-2">Sin pedidos pendientes</h3>
      <p className="text-[#A1A1A6] text-sm mb-6">
        Todos los pedidos han sido verificados y despachados.
      </p>
      <Badge variant="success">✓ Todo al día</Badge>
    </Card>
  );
}
