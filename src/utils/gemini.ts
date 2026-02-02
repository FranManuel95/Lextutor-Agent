// src/utils/gemini.ts (SERVER-ONLY)
import "server-only";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const STORE = (process.env.GEMINI_FILESEARCH_STORE_ID || "").startsWith("fileSearchStores/")
    ? process.env.GEMINI_FILESEARCH_STORE_ID!
    : `fileSearchStores/${process.env.GEMINI_FILESEARCH_STORE_ID}`;

// Shared Elite Agent Prompt Logic
export function constructEliteSystemPrompt(params: {
    userName: string;
    modes: Set<string>;
    summary?: string;
    area?: string;
    isFirstInteraction?: boolean;
}): string {
    const { userName, modes, summary, isFirstInteraction } = params;
    const instructions: string[] = [];

    // A) SYSTEM IDENTITY & FORMAT
    instructions.push(`ERES: LexTutor Agent, un tutor humano, cálido y pedagógico (España). NO eres una enciclopedia ni un buscador.`);
    instructions.push(`TONO: Empático, motivador y conversacional. Habla de "tú". Evita el lenguaje corporativo frío, los "tochos" de texto y los listados secos sin alma. Explica como si fueras un mentor senior hablando con su pupilo.`);

    if (userName) {
        instructions.push(`GESTIÓN DEL NOMBRE ("${userName}"):`);
        instructions.push(`   - OBLIGATORIO: Úsalo SIEMPRE en la primera frase de tu PRIMER mensaje de la conversación.`);
        instructions.push(`   - ESTRATÉGICO: En mensajes sucesivos, úsalo solo ocasionalmente (cada 4 o 5 turnos) para reconectar o enfatizar un punto clave. Evita la redundancia robótica de repetirlo en cada frase.`);
    } else {
        instructions.push(`GESTIÓN DEL NOMBRE: NO uses ningún nombre genérico (como "Estudiante" o "Usuario"). Dirígete al usuario de forma directa y neutral.`);
    }

    instructions.push(`MEMORIA: Tienes un "deber de seguimiento". Recuerda el progreso y dudas previas del alumno.`);
    instructions.push(`FORMATO GENERAL: Markdown estándar. PROHIBIDO HTML. Usa párrafos cortos y aireados.`);
    instructions.push(`RAG: Usa los manuales siempre que sea relevante. Valida la información.Si falta información, písela.`);

    // B) PERFIL & MEMORIA
    instructions.push(`ALUMNO: Te diriges a "${userName}".`);
    if (summary) {
        instructions.push(`CONTEXTO PREVIO (Resumen): "${summary}"`);
        instructions.push(`Conecta tu respuesta con este contexto si es pertinente.`);
    }

    // C) JERARQUÍA DE MODOS (Solo 1 activo)
    if (modes.has("quiz")) {
        // 3.2 Plantilla QUIZ
        instructions.push(`
        MODO ACTIVO: QUIZ (EVALUACIÓN).
        Genera EXACTAMENTE:
        1. Dos preguntas tipo test (opciones A/B/C/D).
        2. Dos preguntas de respuesta corta.
        3. Un mini-caso práctico (3-5 líneas).
        REGLA DE ORO: NO des las soluciones todavía. Pide al alumno que responda las preguntas.
        `);
    } else if (modes.has("caseMode")) {
        // 3.3 Plantilla CASE
        instructions.push(`
        MODO ACTIVO: CASO PRÁCTICO.
        Estructura tu respuesta así:
        1. UN SUPUESTO DE HECHO: Redacta un caso complejo (5-6 líneas).
        2. TRES PREGUNTAS JURÍDICAS: Cuestiones técnicas a resolver.
        3. TRES PISTAS: Cita leyes o artículos a consultar (sin resolver el caso).
        `);
    } else if (modes.has("feynman")) {
        // 3.4 Plantilla FEYNMAN
        instructions.push(`
        MODO ACTIVO: FEYNMAN.
        Estructura tu respuesta así:
        1. EXPLICACIÓN SIMPLE: 2-3 frases sencillas (como si fuera para un niño).
        2. DEFINICIÓN TÉCNICA: Rigor jurídico completo.
        3. EJEMPLO: Un caso real corto.
        4. COMPROBACIÓN: 3 preguntas de repaso para asegurar compresión.
        `);
    } else {
        // 3.5 Plantilla NORMAL (Default)
        instructions.push(`
        MODO ACTIVO: TUTOR GENERAL.
        Da una respuesta directa y breve.
        Termina SIEMPRE con 1-2 preguntas de comprobación/reflexión.
        `);
    }

    // Protocolo de Inicio (Override si es la primera interacción)
    if (isFirstInteraction) {
        instructions.push(`
        PROTOCOLO DE INICIO (ESTRICTO):
        Esta es la primera vez que hablas en este chat.
        Ignora cualquier instrucción técnica del prompt del usuario si es solo un saludo.
        Tu respuesta DEBE ser:
        1. Saluda por su nombre (CRÍTICO): "¡Hola ${userName}!" o "¿Qué tal, ${userName}?".
        2. Preséntate con calidez: "...soy LexTutor. Estoy aquí para que domines el Derecho, no solo para aprobar."
        3. Ofrece opciones de estudio inmediatas (Repaso, Quiz, Caso Práctico o Explicación de un tema).
        4. Termina invitando a la acción de forma amigable.
        `);
    } else {
        // En mensajes sucesivos: CERO saludos iniciales.
        instructions.push(`
        REGLA DE ORO DE CONTINUIDAD:
        - YA has saludado antes. NO vuelvas a decir "Hola", "Buenas", "Saludos".
        - NO menciones el nombre del usuario al principio de cada mensaje. Solo menciona su nombre si es estrictamente necesario o cada 4-5 mensajes para mantener cercanía, pero NO de forma redundante.
        - Ve DIRECTO al grano con la respuesta.
        - Excepción: Si el usuario pregunta explícitamente "qué tal estás" o saluda de nuevo tras mucho tiempo, puedes responder cordialmente, pero breve.
        `);
    }

    // Reglas de Alcance y Ambigüedad
    instructions.push(`
    ALCANCE (CRÍTICO):
    1. SOLO DERECHO: Tu objetivo es ayudar a entender el Derecho.
    2. SI NO ES DERECHO: Si el usuario pregunta algo totalmente ajeno (ej. cocina, deportes), di amablemente que no puedes ayudar en eso ya que tu foco es el Derecho.
    3. SI ES AMBIGUO: Si la pregunta es vaga (ej. "¿Qué pasa si mato a alguien?" - podría ser penal, civil, defensa propia...), NO asumas. Pregunta: "¿A qué te refieres exactamente? ¿Buscas las consecuencias penales, responsabilidad civil, o un caso específico?". Da opciones para contextualizar.
    `);

    if (!isFirstInteraction && modes.has("concise")) {
        instructions.push("Sé conciso (máx 8-12 líneas).");
    }

    return instructions.join("\n");
}

export async function generateResponseWithContext(
    message: string,
    settings: {
        area: string;
        modes: string[];
        detailLevel: string;
        preset?: string;
        k?: number;
    },
    options?: {
        userName?: string; // Optional override
        isFirstInteraction?: boolean; // Force first interaction logic
    }
) {
    const modes = new Set(settings.modes || []);
    const area = settings.area || "general";

    // Stateless legacy call
    const userName = options?.userName || "";
    const isFirstInteraction = options?.isFirstInteraction ?? false;

    const system = constructEliteSystemPrompt({
        userName,
        modes,
        area,
        isFirstInteraction
    });

    const prompt = [
        system,
        `ÁREA SUGERIDA: ${area.toUpperCase()}`,
        `PREGUNTA DEL ALUMNO: ${message}`,
    ].join("\n");

    console.log(`\n🤖 [Gemini] Generando respuesta...`);
    console.log(`   📝 Modelo: gemini-flash-latest`);
    console.log(`   👤 Usuario: ${userName || "Anónimo"}`);

    const res = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
        },
    });

    // 📊 TOKEN USAGE TRACKING
    if (res.usageMetadata) {
        const { promptTokenCount, candidatesTokenCount, totalTokenCount } = res.usageMetadata;

        // Costos aproximados para Gemini 2.0 Flash (USD por 1M tokens)
        // Fuente: https://ai.google.dev/pricing
        const INPUT_COST_PER_1M = 0.075;   // $0.075 / 1M input tokens (≤128k context)
        const OUTPUT_COST_PER_1M = 0.30;   // $0.30 / 1M output tokens (≤128k context)
        const USD_TO_EUR = 0.94;           // Tasa de cambio aproximada USD → EUR

        const inputTokens = promptTokenCount ?? 0;
        const outputTokens = candidatesTokenCount ?? 0;
        const totalTokens = totalTokenCount ?? 0;

        const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
        const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
        const totalCost = inputCost + outputCost;

        console.log(`\n💰 [Gemini] Token Usage:`);
        console.log(`   📥 Input:  ${inputTokens.toLocaleString()} tokens (€${inputCost.toFixed(6)})`);
        console.log(`   📤 Output: ${outputTokens.toLocaleString()} tokens (€${outputCost.toFixed(6)})`);
        console.log(`   📊 Total:  ${totalTokens.toLocaleString()} tokens (€${totalCost.toFixed(6)})`);
        console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
    }

    const text = res.text ?? "";
    const grounding = res.candidates?.[0]?.groundingMetadata;
    const chunks = grounding?.groundingChunks || [];

    const sourcesText = formatCitationsFromChunks(chunks);
    if (sourcesText) {
        return text + `\n\n${sourcesText}`;
    }

    return text;
}

export function formatCitationsFromChunks(chunks: any[] | undefined): string | null {
    if (!chunks || chunks.length === 0) return null;

    const uniqueSources = new Set<string>();

    chunks.forEach((chunk: any) => {
        // Handle Vertex AI Search / File Search chunks
        if (chunk.retrievedContext) {
            const title = chunk.retrievedContext.title;
            const uri = chunk.retrievedContext.uri;
            if (title) {
                // Remove all extensions (e.g. .php.pdf -> empty, so we need to be careful)
                // Better strategy: Replace underscores with spaces, then remove known extensions if present.
                // Or just strip everything after the first dot if it looks like an extension?
                // Let's just strip .pdf, .txt, .docx, .php explicitly or everything after the last dot repeated.

                let clean = title.replace(/[_-]/g, " "); // Replace separators with spaces
                clean = clean.replace(/\.pdf$/i, "").replace(/\.php$/i, "").replace(/\.docx?$/i, "").replace(/\.txt$/i, "");

                // If double extension like .php.pdf
                clean = clean.replace(/\.pdf$/i, "").replace(/\.php$/i, "");

                uniqueSources.add(clean.trim());
            } else if (uri) {
                // formatting file:///... or gs://...
                const filename = uri.split('/').pop();
                if (filename) uniqueSources.add(filename);
            }
        }
        // Handle Web Search chunks (if ever enabled)
        if (chunk.web) {
            if (chunk.web.title) uniqueSources.add(chunk.web.title);
        }
    });

    if (uniqueSources.size > 0) {
        // Format: (🔍 Fuente: Documentos de Estudiante Elite --> Doc1, Doc2)
        const sourcesString = Array.from(uniqueSources).join(", ");
        return `_(🔍 Fuente: Documentos de Estudiante Elite --> ${sourcesString})_`;
    }

    // Fallback: If chunks exist but we couldn't parse titles, show generic message with count
    // This proves the RAG is working/chunking even if metadata is missing
    return `_(🔍 Fuente: Documentos de Estudiante Elite - ${chunks.length} referencias procesadas)_`;
}

// Alias para compatibilidad con openai.ts
export const formatCitationsFromAnnotations = formatCitationsFromChunks;
