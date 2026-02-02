# Auditoría de Seguridad y Plan de Fortalecimiento - Estudiante Elite

Este documento detalla los hallazgos de seguridad tras un análisis del código fuente y la arquitectura del proyecto, junto con un plan de acción para mitigar riesgos y asegurar la escalabilidad.

## 🚨 Hallazgos Críticos

### 1. Escalada de Privilegios (Critical)
**Ubicación:** `schema.sql` (Tabla `profiles`, Policy "Users can update own profile")
**Descripción:** La política RLS actual permite a cualquier usuario autenticado actualizar *todas* las columnas de su propia fila en `profiles`.
```sql
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
```
**Riesgo:** Un usuario malintencionado puede enviar una petición manual a Supabase para cambiar su `role` de `'user'` a `'admin'`.
**Impacto:** Acceso total al panel de administración, subida de archivos, gestión de documentos RAG y visualización de datos sensibles de otros usuarios (si las políticas de admin lo permiten).

### 2. Validación de Archivos (Medium)
**Ubicación:** `src/app/api/upload/route.ts`
**Descripción:** La ruta confía en la extensión del archivo y el tipo MIME proporcionado por el cliente/navegador para guardar archivos temporales.
**Riesgo:** Posibilidad de subir archivos maliciosos. Aunque el servidor no los ejecuta, es un vector de ataque potencial.

### 3. Visibilidad de Documentos RAG (Low)
**Ubicación:** `schema.sql` (Tabla `rag_documents`)
**Descripción:** La política RLS actual solo permite visualización a admins.
**Riesgo:** Limitación funcional si el estudiante necesita ver fuentes.

---

## 🛡️ Plan de Acción y Recomendaciones

### Fase 1: Sellado de Seguridad (Inmediato)

#### 1. Remediar RLS de Perfiles
**Acción:** Crear un Trigger en PostgreSQL que impida la modificación de la columna `role` por parte del propio usuario.
```sql
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() = OLD.id THEN
      RAISE EXCEPTION 'No tienes permiso para cambiar tu rol.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_profile_update
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_change();
```

### Fase 2: Robustez y Calidad

#### 2. Rate Limiting
**Acción:** Implementar límites de velocidad en endpoints de IA (`/api/chat`, `/api/exam/generate`) para evitar abuso de costes.

#### 3. Security Headers
**Acción:** Configurar `next.config.mjs` con headers de seguridad estrictos (CSP, Anti-Sniffing).

#### 4. Logs de Auditoría
**Acción:** Registrar acciones críticas (subidas, cambios de configuración) en una tabla dedicada.

---

## ✅ Conclusión
Se recomienda aplicar la **Fase 1** inmediatamente para cerrar la vulnerabilidad crítica de escalada de privilegios.
