Crea una nueva página del dashboard para este proyecto Next.js 14. Ruta y descripción: $ARGUMENTS

Sigue exactamente estos pasos:

1. **Determina la ruta**: La página va en `src/app/(dashboard)/[ruta]/page.tsx`. Si el argumento incluye una descripción, extrae la ruta del segmento antes del espacio o guión.

2. **Lee el contexto**:
   - `src/app/(dashboard)/chat/page.tsx` para entender el patrón de páginas del dashboard
   - `src/middleware.ts` para confirmar que la ruta queda protegida automáticamente
   - `src/components/layout/` para ver qué componentes de layout están disponibles

3. **Crea `src/app/(dashboard)/[ruta]/page.tsx`**:
   - Server Component por defecto (`async function`)
   - `export const metadata: Metadata` con title y description relevantes
   - Verifica la sesión de Supabase server-side con `createServerClient`
   - Redirige a `/login` si no hay sesión
   - Usa componentes de `src/components/ui/` y `src/components/layout/`
   - Estructura: header con título + descripción, área de contenido principal
   - Accesibilidad: `<main>`, headings jerárquicos (`h1` → `h2`), landmarks ARIA

4. **Crea `src/app/(dashboard)/[ruta]/loading.tsx`**:
   - Skeleton loader usando `src/components/ui/skeleton.tsx`
   - Refleja la estructura visual de la página real

5. **Crea `src/app/(dashboard)/[ruta]/error.tsx`**:
   - `"use client"` (requerido por Next.js para error boundaries)
   - Muestra mensaje de error con botón para reintentar (`reset()`)

6. **Verifica** que no hay errores de TypeScript con `npx tsc --noEmit`.

**Restricciones**: Nunca uses `"use client"` en `page.tsx` salvo que sea estrictamente necesario. No expongas `SUPABASE_SERVICE_ROLE_KEY` en componentes cliente.
