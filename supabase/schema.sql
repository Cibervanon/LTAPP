-- Esquema de base de datos para Supabase (PostgreSQL v15+)
-- Ejecutar en el SQL Editor de Supabase

-- Habilitar extensiones
create extension if not exists "uuid-ossp";

-- Tabla: colecciones
create table if not exists public.colecciones (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  concepto text,
  fecha_lanzamiento date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: productos
create table if not exists public.productos (
  id uuid default uuid_generate_v4() primary key,
  coleccion_id uuid references public.colecciones(id) on delete set null,
  nombre text not null,
  precio_base numeric,
  ficha_tecnica text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: variantes (SKU / talla / color)
create table if not exists public.variantes (
  id uuid default uuid_generate_v4() primary key,
  producto_id uuid references public.productos(id) on delete set null,
  sku text not null unique,
  talla text not null,
  color text not null,
  stock_disponible integer default 0,
  stock_reservado integer default 0,
  stock_minimo integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: ordenes_fabrica (PO)
create table if not exists public.ordenes_fabrica (
  id uuid default uuid_generate_v4() primary key,
  estado text check (estado in ('borrador','enviado_a_fabrica','en_produccion','en_transito','control_calidad','ingresado_a_inventario')) default 'borrador',
  costo_fabrica_total numeric,
  flete numeric default 0,
  aranceles numeric default 0,
  seguros numeric default 0,
  unidades_aprobadas_recibidas integer default 0,
  costo_landed_unitario numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: detalle_po
create table if not exists public.detalle_po (
  id uuid default uuid_generate_v4() primary key,
  orden_fabrica_id uuid references public.ordenes_fabrica(id) on delete cascade,
  variante_id uuid references public.variantes(id) on delete set null,
  cantidad integer not null,
  costo_unitario numeric,
  created_at timestamptz default now()
);

-- Tabla: pedidos (ventas omnicanal)
create table if not exists public.pedidos (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references auth.users(id) on delete set null,
  canal text,
  estado text default 'pendiente',
  tracking text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla: detalle_pedidos
create table if not exists public.detalle_pedidos (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references public.pedidos(id) on delete cascade,
  variante_id uuid references public.variantes(id) on delete set null,
  cantidad integer not null,
  precio_venta numeric,
  created_at timestamptz default now()
);

-- Tabla: movimientos_stock (auditoria)
create table if not exists public.movimientos_stock (
  id uuid default uuid_generate_v4() primary key,
  variante_id uuid references public.variantes(id) on delete set null,
  tipo text check (tipo in ('ingreso','salida','reserva','liberacion')) not null,
  cantidad integer not null,
  referencia_id uuid,
  fecha timestamptz default now()
);

-- Tabla: profiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  rol text default 'operador',
  created_at timestamptz default now()
);

-- Habilitar RLS en todas las tablas
alter table public.colecciones enable row level security;
alter table public.productos enable row level security;
alter table public.variantes enable row level security;
alter table public.ordenes_fabrica enable row level security;
alter table public.detalle_po enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedidos enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.profiles enable row level security;

-- Políticas: autenticados pueden leer todo
create policy "lectura autenticada" on public.colecciones for select to authenticated using (true);
create policy "lectura autenticada" on public.productos for select to authenticated using (true);
create policy "lectura autenticada" on public.variantes for select to authenticated using (true);
create policy "lectura autenticada" on public.ordenes_fabrica for select to authenticated using (true);
create policy "lectura autenticada" on public.detalle_po for select to authenticated using (true);
create policy "lectura autenticada" on public.pedidos for select to authenticated using (true);
create policy "lectura autenticada" on public.detalle_pedidos for select to authenticated using (true);
create policy "lectura autenticada" on public.movimientos_stock for select to authenticated using (true);
create policy "lectura autenticada" on public.profiles for select to authenticated using (true);

-- Políticas: administradores pueden escribir todo
create policy "escritura admin" on public.colecciones for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.productos for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.variantes for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.ordenes_fabrica for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.detalle_po for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.pedidos for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.detalle_pedidos for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.movimientos_stock for all to authenticated using (true) with check (true);
create policy "escritura admin" on public.profiles for all to authenticated using (true) with check (true);

-- Trigger para actualizar updated_at
create or replace function public.actualizar_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  r record;
begin
  for r in (
    select tablename from pg_tables where schemaname = 'public'
  ) loop
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.actualizar_updated_at()',
      r.tablename, r.tablename
    );
  end loop;
end $$;
