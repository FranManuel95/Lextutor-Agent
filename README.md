# Estudiante Elite (LexTutor Agent)

Plataforma avanzada de tutoría jurídica con Inteligencia Artificial (RAG), diseñada para estudiantes de Derecho en España.

## 🏗 Arquitectura del Proyecto

El sistema está construido sobre una arquitectura moderna, modular y escalable, priorizando la **Baja Latencia**, la **Seguridad** y la **Observabilidad**.

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router) + React + TailwindCSS + Shadcn/UI.
- **Backend**: Next.js API Routes (Serverless Functions).
- **Base de Datos & Auth**: Supabase (PostgreSQL, Row Level Security, Auth, Storage).
- **IA & RAG**: Arquitectura de "Doble Nube" (Google Gemini + OpenAI).

---

## 🧠 Estrategia de IA y RAG (Dual Cloud)

El núcleo del agente no depende de un solo proveedor. Hemos implementado una capa de abstracción (`src/lib/ai-service.ts`) que nos permite orquestar múltiples modelos según la tarea.

### ¿Por qué usamos Google File Search Y OpenAI Vector Stores?
Para garantizar la máxima disponibilidad y calidad de respuesta, el sistema mantiene **redundancia total** en la base de conocimiento:
1.  **Google File Search**: Se utiliza como motor primario por su ventana de contexto masiva (1M+ tokens) y velocidad de recuperación nativa.
2.  **OpenAI Vector Stores**: Se mantiene como respaldo y validación cruzada.

**Nota:** Cuando un administrador sube un archivo desde el panel, el sistema lo **sincroniza simultáneamente** en ambas nubes para asegurar consistencia total.

### Modelos Utilizados
Confirmamos el uso de una arquitectura híbrida de modelos para optimizar coste/rendimiento:
*   **Gemini 1.5 Flash**: Modelo principal para el Chat y Consultas Rápidas (Baja latencia).
*   **Gemini 2.0 Flash**: Utilizado para tareas de razonamiento complejo, como la **Evaluación de Exámenes de Desarrollo** (grading).
*   **GPT-5.2**: Modelo de respaldo (fallback) y validación en tareas críticas.

---

## 💰 Observabilidad y Costes (Debug)

Hemos implementado un sistema de **Trazabilidad Financiera en Tiempo Real**.
Cada operación que consume IA (Chat, Generación de Exámenes, Evaluación, Audio) emite logs detallados en la consola del servidor:

```text
💰 [GEMINI] Token Usage:
   📥 Input:  15,402 tokens (€0.001085)
   📤 Output: 345 tokens (€0.000102)
   📊 Total:  15,747 tokens (€0.001187)
   💵 Costo estimado: €0.001187 EUR
```

Esto permite auditar exactamente cuánto cuesta cada interacción del agente, desglosado por prompt (input) y generación (output).

---

## 🛡️ Panel de Administración y Seguridad

El sistema incluye un **Panel de Administración (`/admin`)** protegido estrictamente por Roles (RBAC).

*   **Subida de Archivos**: Solo los administradores pueden "enseñar" al agente subiendo PDFs/DOCs.
*   **Seguridad**:
    *   **RLS (Row Level Security)**: A nivel de base de datos, un usuario JAMÁS puede leer los chats o exámenes de otro.
    *   **Validación Zod**: Todas las entradas de la API se validan estrictamente antes de procesarse.
    *   **Rate Limiting**: Implementado nativamente en Postgres mediante **Supabase RPC**. Usamos un algoritmo de ventana deslizante paramétrica (`check_rate_limit`) para controlar el abuso sin latencia de red adicional.

---

## 📚 Documentación de API

### 1. Chat Inteligente
**`POST /api/chat`**
Orquesta la conversación. Recupera contexto (RAG), historial previo y perfil del usuario.
- **Body**: `{ "chatId": "uuid", "message": "string" }`
- **Rate Limit**: 50 mensajes/hora.

### 2. Generación de Exámenes (Desarrollo)
**`POST /api/exam/generate`**
Crea un examen de preguntas abiertas basado exclusivamente en la documentación subida.
- **Body**: `{ "area": "civil", "difficulty": "hard", "count": 3 }`
- **Output**: JSON estricto con preguntas `id` y `text`.

### 3. Generación de Quiz (Test)
**`POST /api/quiz/generate`**
Genera preguntas tipo test (A/B/C/D) con corrección automática.
- **Rate Limit**: 20/día.

### 4. Evaluación (Grading)
**`POST /api/exam/grade`** (Desarrollo) / **`POST /api/quiz/grade`** (Test)
*   **Desarrollo**: Usa **Gemini 2.0 Flash** para leer la respuesta del alumno y corregirla con rúbrica académica. Genera coste de IA.
*   **Quiz**: Evaluación **determinista** (Lógica matemática). Coste IA: **0 tokens**.

### 5. Gestión Documental (Admin)
**`POST /api/upload`**
Endpoint crítico que maneja la ingestión "Dual Cloud".
- Sube el archivo a Supabase Storage.
- Lo indexa en **Google File Search**.
- Lo indexa en **OpenAI Vector Store**.
- Registra la referencia en la BD `rag_documents`.

---

## 🚀 Despliegue e Instalación

1.  **Requisitos**: Node.js 18+, Cuenta de Supabase, API Keys de Google y OpenAI.
2.  **Instalación**:
    ```bash
    npm install
    # Configura .env.local con tus claves
    npm run dev
    ```
3.  **Producción**:
    ```bash
    npm run build
    npm start
    ```

**Copyright © 2026 Francisco Manuel Perejón Carmona.**

⚠️ **Aviso de Propiedad Intelectual y Uso Restringido:**
Este código fuente, diseño y arquitectura son propiedad exclusiva del autor.
Este repositorio se pone a disposición **ÚNICAMENTE con fines de evaluación académica y revisión técnica**.
Queda terminantemente prohibida su copia, distribución, uso comercial o despliegue en producción sin autorización expresa por escrito del autor.
