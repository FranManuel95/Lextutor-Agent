Crea una nueva ruta de API para este proyecto. Ruta y descripción: $ARGUMENTS

Sigue exactamente estos pasos:

1. **Lee el contexto**:
   - `src/app/api/me/route.ts` o `src/app/api/quiz/grade/route.ts` para entender el patrón de API routes
   - `src/lib/rateLimit.ts` para ver los rate limits disponibles
   - `src/server/security/` para ver cómo usar `requireAdmin()` si aplica

2. **Crea `src/app/api/[ruta]/route.ts`** con este patrón exacto:

   ```typescript
   import { NextRequest, NextResponse } from "next/server";
   import { createServerClient } from "@/utils/supabase/server";
   import { z } from "zod";
   import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

   // Schema Zod para validar el body
   const RequestSchema = z.object({ ... });

   export async function POST(request: NextRequest) {
     // 1. Auth check
     const supabase = createServerClient();
     const { data: { user }, error: authError } = await supabase.auth.getUser();
     if (authError || !user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     }

     // 2. Rate limiting
     const rateLimit = await checkRateLimit(user.id, RATE_LIMITS.CHAT); // ajusta el límite
     if (!rateLimit.allowed) {
       return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
     }

     // 3. Validación de input
     const body = await request.json();
     const parsed = RequestSchema.safeParse(body);
     if (!parsed.success) {
       return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
     }

     // 4. Lógica de negocio
     try {
       // ... implementación
       return NextResponse.json({ ... });
     } catch (error) {
       console.error("[api/ruta]", error);
       return NextResponse.json({ error: "Internal server error" }, { status: 500 });
     }
   }
   ```

3. **Adapta** el schema Zod, los métodos HTTP (GET/POST/PUT/DELETE), y el rate limit según la descripción del argumento.

4. **Si es ruta admin**: importa y usa `requireAdmin()` de `src/server/security/` antes de la lógica.

5. **Crea el test** en `src/test/api/[ruta].test.ts`:
   - Mock de `createServerClient` para simular usuario autenticado y no autenticado
   - Testa: 401 sin auth, 400 con body inválido, 200 con datos correctos

6. **Verifica** con `npx tsc --noEmit`.

**Restricciones**: Zod obligatorio para todo input. Auth check siempre primero. Nunca uses `SUPABASE_SERVICE_ROLE_KEY` en rutas que reciben input de usuario. No uses `console.log` con datos de usuario.
