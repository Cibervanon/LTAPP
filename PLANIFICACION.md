# Planificacion — Lifting Trust App (ERP de Inventario y Operacion Omnicanal)

## 1. Alcance (v1.0 — Fase 1 del roadmap)
Solo lo esencial para que la app funcione. Se ignora deliberadamente el escaneo optico (fase 3 del documento de especificaciones).

Modulos incluidos:
- **Aprovisionamiento y control de fabrica (PO):** ciclo de estados, detalle de PO, costo landed unitario, auditoria de calidad (defectuosas).
- **Matriz de inventario:** grilla modelo x talla x color, segmentacion stock (disponible / reservado / en camino), alertas por umbral minimo.
- **Procesamiento de pedidos y packing digital:** lista de picking/packing interactiva con verificacion item por item, creacion de envios.
- **Rentabilidad y salud comercial:** margenes unitarios (venta vs costo landed por lote), rotacion de inventario por cuartiles.

## 2. Stack tecnologico
| Capa | Tecnologia | Justificacion |
|------|-----------|---------------|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS | Renderizado hibrido, despliegue nativo en Netlify, tipado estricto. |
| Estilo/UID | Tailwind + esquemas oscuros del documento (#121212, #1E1E1E, #30D158, #FF9F0A, #FF453A, Inter) | Coherencia con la identidad visual de Lifting Trust. |
| Backend / BaaS | Supabase (PostgreSQL + Auth + Realtime + Storage) | Base de datos relacional ACID, autenticacion, suscripciones en tiempo real para actualizar stock al instante, archivos de ficha tecnica. |
| Despliegue | Netlify | Hosting de Next.js con runtime de Netlify, CI/CD automatico por push a Git. |
| Offline | IndexedDB (dexie o idb-keyval) + cola de sincronizacion + UI optimista | Funcionamiento sin conexion y subida de cambios pendientes al volver online. |

## 3. Modelo de datos (Supabase / PostgreSQL)
Tablas principales (integridad referencial ACID):

- `colecciones` (id, nombre, concepto, fecha_lanzamiento)
- `productos` (id, coleccion_id, nombre, precio_base, ficha_tecnica)
- `variantes` (id, producto_id, sku, talla, color, stock_disponible, stock_reservado, stock_minimo)
- `ordenes_fabrica` (id, estado borrador/enviado/en_produccion/en_transito/control_calidad/ingresado, costo_fabrica_total, flete, aranceles, seguros, unidades_aprobadas_recibidas, costo_landed_unitario)
- `detalle_po` (id, orden_fabrica_id, variante_id, cantidad, costo_unitario)
- `pedidos` (id, cliente_id, canal, estado, tracking, fecha)
- `detalle_pedidos` (id, pedido_id, variante_id, cantidad, precio_venta)
- `movimientos_stock` (id, variante_id, tipo ingreso/salida/reserva/liberacion, cantidad, referencia_id, fecha) — auditoria de stock.
- `profiles` (id, email, rol) — extensiones de auth.users.

RLS (Row Level Security) activado en todas las tablas; políticas por rol (operador, administrador, supervisor de bodega).

## 4. Estrategia online / offline
- **Online:** Supabase client lee/escribe directo a Postgres. Realtime para que el stock y los pedidos se actualicen en todas las pestañas/usuarios al instante.
- **Offline:**
  1. Lecturas: cache en IndexedDB al cargar; se muestra dato cacheado con indicador "sin conexion".
  2. Escrituras: UI optimista (se ve el cambio inmediato) + accion encolada en una tabla de sincronizacion local (IndexedDB).
  3. Reconexion: worker de sincronizacion envia la cola a Supabase en orden, resuelve conflictos por timestamp y notifica al usuario.
- Si falta conexion durante mucho tiempo, se bloquean operaciones destructivas (ajustes de stock) con aviso claro.

## 5. Flujo de desarrollo (por entregas)

### Sprint A — Fundamentos
- [ ] Repositorio en Git, Next.js + TypeScript + Tailwind, despliegue en Netlify (conectado a Git).
- [ ] Proyecto de Supabase, tablas del modelo de datos, RLS, roles.
- [ ] Autenticacion (login/logout) y proteccion de rutas.

### Sprint B — Modulo de inventario y PO
- [ ] CRUD de colecciones, productos y variantes.
- [ ] Matriz de inventario (grilla talla x color) con stock disponible/reservado/en camino.
- [ ] CRUD de ordenes de fabrica con ciclo de estados y detalle de PO.
- [ ] Calculo automatico de costo landed unitario al ingresar a inventario.
- [ ] Registro de piezas defectuosas (auditoria de calidad).

### Sprint C — Pedidos y packing
- [ ] CRUD de pedidos omnicanal y detalle de pedidos.
- [ ] Lista de picking/packing interactiva con casillas de verificacion item por item.
- [ ] Creacion de envios y asignacion de numero de rastreo.
- [ ] Reservacion y liberacion de stock al crear/cancelar pedidos.

### Sprint D — Rentabilidad y salud comercial
- [ ] Margen unitario: precio de venta neto vs costo landed por lote.
- [ ] Rotacion de inventario por cuartiles (alta/baja demanda).
- [ ] Tablero basico de indicadores.

### Sprint E — Offline y despliegue
- [ ] Capa de cache IndexedDB para lecturas.
- [ ] Cola de escritura y sincronizacion al recuperar conexion.
- [ ] Build de produccion en Netlify, variables de entorno de Supabase, dominio.
- [ ] Pruebas funcionales end-to-end de cada modulo.

## 6. Definicion de hecho (Definition of Done)
- Build de produccion exitoso en Netlify sin errores.
- RLS probado: un usuario no puede ver/editar datos de otro rol sin permiso.
- Operaciones de stock funcionan con y sin conexion (cola de sync probada).
- Matriz de inventario refleja cambios en tiempo real entre pestañas (Realtime).
- Costo landed calculado correctamente segun formula del documento.
- Packing permite verificar item por item y marca pedido como despachado.

## 7. Siguiente paso inmediato
Crear el repositorio, inicializar Next.js y vincular a Netlify y Supabase. Luego ejecutar el Sprint A.
