Crea una nueva migración de base de datos Supabase. Descripción: $ARGUMENTS

Sigue exactamente estos pasos:

1. **Lee el contexto**:
   - Las últimas 3 migraciones en `supabase/migrations/` para entender el estilo y convenciones del proyecto
   - `src/types/database.types.ts` para ver el schema actual

2. **Genera el timestamp** ejecutando `date +%Y%m%d%H%M%S` para obtener el prefijo correcto.

3. **Crea `supabase/migrations/[timestamp]_[nombre_descriptivo].sql`**:

   Estructura de la migración:
   ```sql
   -- Descripción breve de qué hace esta migración

   -- Tabla principal (si aplica)
   CREATE TABLE IF NOT EXISTS [tabla] (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Índices para performance
   CREATE INDEX IF NOT EXISTS idx_[tabla]_user_id ON [tabla](user_id);

   -- RLS: habilitar siempre
   ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;

   -- Políticas RLS: usuarios solo ven sus propios datos
   CREATE POLICY "Users can view own [tabla]"
     ON [tabla] FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own [tabla]"
     ON [tabla] FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own [tabla]"
     ON [tabla] FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can delete own [tabla]"
     ON [tabla] FOR DELETE
     USING (auth.uid() = user_id);

   -- Trigger para updated_at automático
   CREATE TRIGGER update_[tabla]_updated_at
     BEFORE UPDATE ON [tabla]
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
   ```

4. **Adapta** el schema según la descripción del argumento. Si es ALTER TABLE, ADD COLUMN, o índices, ajusta el template.

5. **Aplica la migración** localmente con `supabase db reset` (si Supabase está corriendo) o indica al usuario que la ejecute.

6. **Actualiza `src/types/database.types.ts`** si la migración añade tablas o columnas — añade los tipos TypeScript correspondientes.

**Restricciones**: RLS obligatorio en todas las tablas nuevas. Siempre usa `IF NOT EXISTS` / `IF EXISTS` para idempotencia. No uses `SERIAL` — usa `gen_random_uuid()` para IDs. Foreign keys con `ON DELETE CASCADE` para datos de usuario.
