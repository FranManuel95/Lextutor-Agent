Crea tests para un fichero existente del proyecto. Fichero o módulo a testear: $ARGUMENTS

Sigue exactamente estos pasos:

1. **Lee el fichero objetivo**: Busca y lee `$ARGUMENTS` — puede ser una ruta relativa (`src/lib/utils.ts`) o un nombre de módulo (`utils`, `rateLimit`, `ai-service`).

2. **Analiza qué testear**:
   - Funciones puras: testea todos los casos de éxito y borde
   - Funciones async: testea resolución y rechazo
   - Constantes/configs: verifica valores correctos
   - Componentes React: render, props, interacciones, accesibilidad

3. **Crea el fichero de test** en la ruta correspondiente:
   - Para `src/lib/X.ts` → `src/test/lib/X.test.ts`
   - Para `src/components/X.tsx` → `src/test/components/X.test.tsx`
   - Para `src/hooks/X.ts` → `src/test/hooks/X.test.ts`
   - Para `src/app/api/X/route.ts` → `src/test/api/X.test.ts`

4. **Estructura del test**:
   ```typescript
   import { describe, it, expect, vi, beforeEach } from "vitest";
   // Para componentes: import { render, screen, fireEvent } from "@testing-library/react";

   // Mocks necesarios (Supabase, fetch, módulos externos)
   vi.mock("@/lib/supabase", () => ({ createClient: vi.fn() }));

   describe("[NombreDelMódulo]", () => {
     describe("[nombreFunción]", () => {
       it("[descripción del caso]", () => {
         // arrange → act → assert
       });
     });
   });
   ```

5. **Cubre estos casos mínimos**:
   - Caso happy path (input válido → output esperado)
   - Casos borde (vacío, null, valores extremos)
   - Casos de error (excepciones, rechazos, auth fallida)
   - Al menos 5 test cases por módulo

6. **Ejecuta** `npx vitest run [ruta-del-test]` y corrige hasta que pasen todos.

**Restricciones**: No uses `any` en los tests. Mockea dependencias externas (Supabase, APIs de IA, Resend). Cada `describe` debe tener mínimo 2 `it`. Los tests deben ser deterministas (sin `Date.now()` sin mockear, sin números random).
