# Conexión Supabase — Lifting Trust

## 1. Crear proyecto en Supabase
1. Ve a https://app.supabase.com y crea un proyecto nuevo.
2. Espera a que se provisione la base de datos.

## 2. Ejecutar el esquema SQL
1. En el panel de Supabase, ve a **SQL Editor**.
2. Copia y pega todo el contenido de `supabase/schema.sql`.
3. Ejecútalo. Esto creará:
   - Tablas: colecciones, productos, variantes, ordenes_fabrica, detalle_po, pedidos, detalle_pedidos, movimientos_stock, profiles
   - RLS (Row Level Security) habilitado en todas las tablas
   - Políticas de lectura para autenticados y escritura para admin
   - Función y triggers de `updated_at`

## 3. Obtener credenciales
1. Ve a **Configuración del proyecto (Settings) → API**.
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Configurar variables de entorno

### Local (desarrollo)
Copia `.env.example` a `.env.local` y pega los valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Luego reinicia el servidor: `npm run dev`

### Netlify (producción)
1. Conecta tu repositorio a Netlify.
2. En **Site settings → Environment variables**, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=https://tu-dominio.netlify.app`
3. Vuelve a desplegar.

## 5. Autenticación (Auth)
1. En Supabase, ve a **Authentication → Settings**.
2. Habilita **Email confirmations** si deseas verificación de email (recomendado para producción).
3. Para desarrollo rápido, puedes desactivar "Confirm email" para que los usuarios entren sin verificar.

## 6. Verificar conexión
- Inicia la app localmente con `npm run dev`.
- Ve a `/login`, crea una cuenta e inicia sesión.
- Deberías poder acceder a `/(modules)/inventario` y ver la matriz de inventario (vacía hasta que agregues datos).

## Archivos relevantes
- `supabase/schema.sql` — esquema de base de datos
- `src/lib/supabase/client.ts` — cliente de Supabase (navegador)
- `src/lib/supabase/server.ts` — cliente de Supabase (servidor)
- `src/lib/auth/useAuth.ts` — hook de autenticación
- `.env.example` — plantilla de variables de entorno
- `netlify.toml` — configuración de despliegue Netlify
