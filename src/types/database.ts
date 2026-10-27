export type Database = {
  public: {
    Tables: {
      colecciones: {
        Row: {
          id: string;
          nombre: string;
          concepto: string | null;
          fecha_lanzamiento: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          concepto?: string | null;
          fecha_lanzamiento?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          concepto?: string | null;
          fecha_lanzamiento?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      productos: {
        Row: {
          id: string;
          coleccion_id: string | null;
          nombre: string;
          precio_base: number | null;
          ficha_tecnica: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coleccion_id?: string | null;
          nombre: string;
          precio_base?: number | null;
          ficha_tecnica?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coleccion_id?: string | null;
          nombre?: string;
          precio_base?: number | null;
          ficha_tecnica?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      variantes: {
        Row: {
          id: string;
          producto_id: string | null;
          sku: string;
          talla: string;
          color: string;
          stock_disponible: number;
          stock_reservado: number;
          stock_minimo: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          producto_id?: string | null;
          sku: string;
          talla: string;
          color: string;
          stock_disponible?: number;
          stock_reservado?: number;
          stock_minimo?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          producto_id?: string | null;
          sku?: string;
          talla?: string;
          color?: string;
          stock_disponible?: number;
          stock_reservado?: number;
          stock_minimo?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ordenes_fabrica: {
        Row: {
          id: string;
          estado:
            | "borrador"
            | "enviado_a_fabrica"
            | "en_produccion"
            | "en_transito"
            | "control_calidad"
            | "ingresado_a_inventario";
          costo_fabrica_total: number | null;
          flete: number | null;
          aranceles: number | null;
          seguros: number | null;
          unidades_aprobadas_recibidas: number | null;
          costo_landed_unitario: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          estado?: "borrador" | "enviado_a_fabrica" | "en_produccion" | "en_transito" | "control_calidad" | "ingresado_a_inventario";
          costo_fabrica_total?: number | null;
          flete?: number | null;
          aranceles?: number | null;
          seguros?: number | null;
          unidades_aprobadas_recibidas?: number | null;
          costo_landed_unitario?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          estado?: "borrador" | "enviado_a_fabrica" | "en_produccion" | "en_transito" | "control_calidad" | "ingresado_a_inventario";
          costo_fabrica_total?: number | null;
          flete?: number | null;
          aranceles?: number | null;
          seguros?: number | null;
          unidades_aprobadas_recibidas?: number | null;
          costo_landed_unitario?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      detalle_po: {
        Row: {
          id: string;
          orden_fabrica_id: string | null;
          variante_id: string | null;
          cantidad: number;
          costo_unitario: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          orden_fabrica_id?: string | null;
          variante_id?: string | null;
          cantidad: number;
          costo_unitario?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          orden_fabrica_id?: string | null;
          variante_id?: string | null;
          cantidad?: number;
          costo_unitario?: number | null;
          created_at?: string;
        };
      };
      pedidos: {
        Row: {
          id: string;
          cliente_id: string | null;
          canal: string | null;
          estado: string | null;
          tracking: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          canal?: string | null;
          estado?: string | null;
          tracking?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string | null;
          canal?: string | null;
          estado?: string | null;
          tracking?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      detalle_pedidos: {
        Row: {
          id: string;
          pedido_id: string | null;
          variante_id: string | null;
          cantidad: number;
          precio_venta: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pedido_id?: string | null;
          variante_id?: string | null;
          cantidad: number;
          precio_venta?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pedido_id?: string | null;
          variante_id?: string | null;
          cantidad?: number;
          precio_venta?: number | null;
          created_at?: string;
        };
      };
      movimientos_stock: {
        Row: {
          id: string;
          variante_id: string | null;
          tipo: "ingreso" | "salida" | "reserva" | "liberacion";
          cantidad: number;
          referencia_id: string | null;
          fecha: string;
        };
        Insert: {
          id?: string;
          variante_id?: string | null;
          tipo: "ingreso" | "salida" | "reserva" | "liberacion";
          cantidad: number;
          referencia_id?: string | null;
          fecha?: string;
        };
        Update: {
          id?: string;
          variante_id?: string | null;
          tipo?: "ingreso" | "salida" | "reserva" | "liberacion";
          cantidad?: number;
          referencia_id?: string | null;
          fecha?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          rol: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          rol?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          rol?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
