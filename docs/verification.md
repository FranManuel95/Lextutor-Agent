# Guía de Verificación y Despliegue - LexTutor Nitro

Este documento detalla los pasos manuales y automáticos para verificar la integridad del sistema y desplegar cambios críticos.

## 1. Configuración Manual Requerida (Supabase)

Para el funcionamiento de **Audio Notes (PR3)**, se requiere una acción manual en el Dashboard de Supabase, ya que no se gestiona vía SQL para evitar conflictos de RLS complejos en almacenamiento.

### **Crear Bucket de Almacenamiento**
1. Ir a **Storage** en el Dashboard de Supabase.
2. Crear un nuevo bucket llamado: `audio-notes`.
3. Configuración:
   - **Public**: OFF (Privado).
   - **Allowed MIME types**: `audio/*` (o dejar vacío para todos).
   - **File size limit**: 10MB (suficiente para 90s de audio).
4. No es necesario añadir Policies adicionales si se usa Signed Upload URLs (implementado en Backend).

## 2. Verificación de Seguridad (RLS)

### **Base de Datos**
- **rag_documents**:
  - `SELECT`: Solo `is_admin()`.
  - `INSERT/DELETE`: Solo `is_admin()`.
  - **Prueba**: Intentar acceder a `/api/rag/documents` sin ser admin debe devolver 401/Redirect.
  
- **messages**:
  - `INSERT`: Auth users (propio `user_id`).
  - `SELECT`: Auth users (propio `user_id`).

### **Storage (Audio)**
- Acceso directo a archivos bloqueado (Bucket privado).
- Acceso solo mediante URLs firmadas generadas por el servidor (`server-side`).

## 3. Pruebas Funcionales

### **Admin RAG**
1. Entrar a `/admin/rag`.
2. **Upload**: Subir un PDF/TXT. Verificar que aparece en la lista y sale toast de éxito.
3. **Delete**: Pulsar trash, confirmar en diálogo. Verificar que desaparece de la lista.

### **Chat & Audio**
1. Entrar a `/chat/new`.
2. **Texto**: Enviar "Hola". Verificar respuesta streaming/completa.
3. **Audio**:
   - Pulsar micro -> Grabar 5s -> Stop.
   - Estado: "Subiendo..." -> "Transcribiendo..." -> Respuesta.
   - Verificar en bd: `transcript` y `audio_path` rellenos en tabla `messages`.

## 4. Coste y Latencia (Rationale)

- **Chat History**: Limitado a últimos 6-10 mensajes para reducir tokens de entrada.
- **RAG topK**: 6 chunks. Balance precisión/coste.
- **Audio**:
  - Max duración: 90s (aprox 1.5MB webm). Evita uploads masivos.
  - Modelo: Gemini 1.5 Flash (rápido y barato para transcripción + razonamiento).
- **Storage**: Limpieza automática no implementada en V1 (TODO futuro: cron job para borrar audios antiguos).

## 5. Troubleshooting Común

- **Build Error (Type 'never')**: Comprobar casting `as any` en queries complejas de Supabase.
- **Upload 403**: Verificar que el bucket `audio-notes` existe y es privado.
- **Gemini 400**: Verificar API KEY válida y créditos disponibles.
