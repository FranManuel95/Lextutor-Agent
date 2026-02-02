import "server-only";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// --- Configuration ---
export const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase() as "gemini" | "openai";
export const isOpenAI = AI_PROVIDER === "openai";
export const isGemini = AI_PROVIDER === "gemini";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const GEMINI_STORE_ID = (process.env.GEMINI_FILESEARCH_STORE_ID || "").startsWith("fileSearchStores/")
    ? process.env.GEMINI_FILESEARCH_STORE_ID!
    : `fileSearchStores/${process.env.GEMINI_FILESEARCH_STORE_ID}`;

const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

// --- Shared Logic ---

export async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        if (retries > 0 && (
            String(error.status) === '503' ||
            String(error.response?.status) === '503' ||
            error.message?.includes('overloaded') ||
            error.message?.includes('503') ||
            error.message?.includes('UNAVAILABLE')
        )) {
            console.log(`⚠️ Gemini 503 Error. Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

/**
 * Shared Elite Agent Prompt Logic
 */
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
    instructions.push(`RAG: Usa los manuales siempre que sea relevante. Valida la información. Si falta información, pídela.`);

    // B) PERFIL & MEMORIA
    instructions.push(`ALUMNO: Te diriges a "${userName}".`);
    if (summary) {
        instructions.push(`CONTEXTO PREVIO (Resumen): "${summary}"`);
        instructions.push(`Conecta tu respuesta con este contexto si es pertinente.`);
    }

    // C) JERARQUÍA DE MODOS (Solo 1 activo)
    if (modes.has("quiz")) {
        instructions.push(`
        MODO ACTIVO: QUIZ (EVALUACIÓN).
        Genera EXACTAMENTE:
        1. Dos preguntas tipo test (opciones A/B/C/D).
        2. Dos preguntas de respuesta corta.
        3. Un mini-caso práctico (3-5 líneas).
        REGLA DE ORO: NO des las soluciones todavía. Pide al alumno que responda las preguntas.
        `);
    } else if (modes.has("caseMode")) {
        instructions.push(`
        MODO ACTIVO: CASO PRÁCTICO.
        Estructura tu respuesta así:
        1. UN SUPUESTO DE HECHO: Redacta un caso complejo (5-6 líneas).
        2. TRES PREGUNTAS JURÍDICAS: Cuestiones técnicas a resolver.
        3. TRES PISTAS: Cita leyes o artículos a consultar (sin resolver el caso).
        `);
    } else if (modes.has("feynman")) {
        instructions.push(`
        MODO ACTIVO: FEYNMAN.
        Estructura tu respuesta así:
        1. EXPLICACIÓN SIMPLE: 2-3 frases sencillas (como si fuera para un niño).
        2. DEFINICIÓN TÉCNICA: Rigor jurídico completo.
        3. EJEMPLO: Un caso real corto.
        4. COMPROBACIÓN: 3 preguntas de repaso para asegurar compresión.
        `);
    } else {
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

/**
 * Calculates and logs token usage and cost.
 */
export function logUsage(provider: "gemini" | "openai", tokens: { prompt: number; completion: number; total: number }) {
    const USD_TO_EUR = 0.94;
    let inputCostPer1M = 0;
    let outputCostPer1M = 0;

    if (provider === "gemini") {
        inputCostPer1M = 0.075;
        outputCostPer1M = 0.30;
    } else {
        inputCostPer1M = 0.150;
        outputCostPer1M = 0.600;
    }

    const inputCost = (tokens.prompt / 1_000_000) * inputCostPer1M * USD_TO_EUR;
    const outputCost = (tokens.completion / 1_000_000) * outputCostPer1M * USD_TO_EUR;
    const totalCost = inputCost + outputCost;

    console.log(`\n💰 [${provider.toUpperCase()}] Token Usage:`);
    console.log(`   📥 Input:  ${tokens.prompt.toLocaleString()} tokens (€${inputCost.toFixed(6)})`);
    console.log(`   📤 Output: ${tokens.completion.toLocaleString()} tokens (€${outputCost.toFixed(6)})`);
    console.log(`   📊 Total:  ${tokens.total.toLocaleString()} tokens (€${totalCost.toFixed(6)})`);
    console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
}

/**
 * Formats citations for Gemini chunks.
 */
export function formatGeminiCitations(chunks: any[] | undefined): string | null {
    if (!chunks || chunks.length === 0) return null;
    const uniqueSources = new Set<string>();
    chunks.forEach((chunk: any) => {
        if (chunk.retrievedContext) {
            const title = chunk.retrievedContext.title;
            const uri = chunk.retrievedContext.uri;
            if (title) {
                let clean = title.replace(/[_-]/g, " ");
                clean = clean.replace(/\.pdf$/i, "").replace(/\.php$/i, "").replace(/\.docx?$/i, "").replace(/\.txt$/i, "");
                clean = clean.replace(/\.pdf$/i, "").replace(/\.php$/i, "");
                uniqueSources.add(clean.trim());
            } else if (uri) {
                const filename = uri.split('/').pop();
                if (filename) uniqueSources.add(filename);
            }
        }
        if (chunk.web && chunk.web.title) uniqueSources.add(chunk.web.title);
    });

    if (uniqueSources.size > 0) {
        return `_(🔍 Fuente: Documentos de Estudiante Elite --> ${Array.from(uniqueSources).join(", ")})_`;
    }
    return `_(🔍 Fuente: Documentos de Estudiante Elite - ${chunks.length} referencias procesadas)_`;
}

/**
 * Formats citations for OpenAI annotations.
 */
export function formatOpenAICitations(annotations: any[] | undefined): string | null {
    if (!annotations || annotations.length === 0) return null;
    const uniqueSources = new Set<string>();
    annotations.forEach((ann: any) => {
        if (ann.type === "file_citation") {
            const fileId = ann.file_citation.file_id;
            uniqueSources.add(`Documento ${fileId.slice(-8)}`);
        }
    });

    if (uniqueSources.size > 0) {
        return `_(🔍 Fuente: Documentos de Estudiante Elite → ${Array.from(uniqueSources).join(", ")})_`;
    }
    return `_(🔍 Fuente: Documentos de Estudiante Elite - ${annotations.length} referencias)_`;
}

// --- Unified API ---

/**
 * Generates AI response with provider-agnostic interface.
 */
export async function generateResponse(params: {
    message: string;
    history?: { role: string; content: string }[];
    settings: {
        area: string;
        modes: string[];
        detailLevel: string;
        summary?: string;
    };
    options?: {
        userName?: string;
        isFirstInteraction?: boolean;
    };
}) {
    const { message, history = [], settings, options } = params;
    const modes = new Set(settings.modes || []);
    const area = settings.area || "general";
    const userName = options?.userName || "";
    const isFirstInteraction = options?.isFirstInteraction ?? false;

    const system = constructEliteSystemPrompt({
        userName,
        modes,
        summary: settings.summary,
        area,
        isFirstInteraction
    });

    if (isGemini) {
        console.log("🤖 [MODELO] Chat conversacional → Gemini 1.5 Flash (generateContent API)");
        const contents = [
            ...history.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            })),
            {
                role: "user",
                parts: [{ text: `${system}\n\nÁREA: ${area.toUpperCase()}\nMENSAJE ACTUAL:\n${message}` }],
            },
        ];

        const res = await retryOperation(() => geminiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents,
        }));

        if (res.usageMetadata) {
            logUsage("gemini", {
                prompt: res.usageMetadata.promptTokenCount ?? 0,
                completion: res.usageMetadata.candidatesTokenCount ?? 0,
                total: res.usageMetadata.totalTokenCount ?? 0,
            });
        }

        const text = res.text ?? "";
        const grounding = res.candidates?.[0]?.groundingMetadata;
        const citations = formatGeminiCitations(grounding?.groundingChunks);
        return citations ? `${text}\n\n${citations}` : text;
    } else {
        console.log("🤖 [MODELO] Chat conversacional → GPT-5.2 (Responses API)");
        // Use GPT-5.2 Responses API for conversational chat
        const { generateResponseGPT52 } = await import("./ai-service-gpt52");

        return await generateResponseGPT52({
            message,
            history: history.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content
            })),
            systemPrompt: system,
            vectorStoreId: process.env.OPENAI_VECTOR_STORE_ID!,
        });
    }
}

/**
 * Unified Quiz Generation
 */
export async function generateQuiz(params: {
    area: string;
    difficulty: string;
    count: number;
}) {
    const { area, difficulty, count } = params;
    const prompt = `Genera un TEST de Derecho ${area.toUpperCase()} (Dificultad: ${difficulty.toUpperCase()}) con ${count} preguntas tipo test.
    IMPORTANTE: Debes basarte EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO (documentos adjuntos) para generar las preguntas.
    Devuelve JSON con "questions": Array de objetos:
    - id: number, text: string, options: string[], correctIndex: number, explanation: string.
    Legislación española vigente. Responde ÚNICAMENTE con el JSON válido.`;

    if (isGemini) {
        console.log("🤖 [MODELO] Generación Quiz → Gemini 1.5 Flash (generateContent API + File Search)");
        const res = await retryOperation(() => geminiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID] } }]
            }
        }));

        if (res.usageMetadata) {
            logUsage("gemini", {
                prompt: res.usageMetadata.promptTokenCount ?? 0,
                completion: res.usageMetadata.candidatesTokenCount ?? 0,
                total: res.usageMetadata.totalTokenCount ?? 0,
            });
        }

        const raw = res.text || "{}";
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const generated = JSON.parse(cleaned);
        const grounding = res.candidates?.[0]?.groundingMetadata;

        // Extract sources
        const sources: string[] = [];
        if (grounding?.groundingChunks) {
            grounding.groundingChunks.forEach((chunk: any) => {
                if (chunk.retrievedContext?.title) {
                    sources.push(chunk.retrievedContext.title);
                } else if (chunk.web?.title) {
                    sources.push(chunk.web.title);
                }
            });
        }

        return {
            questions: generated.questions,
            ragUsed: (grounding?.groundingChunks?.length || 0) > 0,
            sources: Array.from(new Set(sources))
        };
    } else {
        console.log("🤖 [MODELO] Generación Quiz → GPT-4o (Assistants API + File Search)");
        const thread = await openaiClient.beta.threads.create();
        await openaiClient.beta.threads.messages.create(thread.id, { role: "user", content: prompt });
        const run = await openaiClient.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: OPENAI_ASSISTANT_ID,
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        });

        if (run.usage) {
            logUsage("openai", {
                prompt: run.usage.prompt_tokens,
                completion: run.usage.completion_tokens,
                total: run.usage.total_tokens,
            });
        }

        const messages = await openaiClient.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data[0];
        let text = "";
        let annotations: any[] = [];
        if (assistantMessage.content[0].type === "text") {
            text = assistantMessage.content[0].text.value;
            annotations = assistantMessage.content[0].text.annotations;
        }

        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Extract sources
        const sources: string[] = [];
        if (annotations) {
            const fileIds = new Set<string>();
            annotations.forEach((ann: any) => {
                if (ann.type === 'file_citation') {
                    fileIds.add(ann.file_citation.file_id);
                }
            });

            // Resolve filenames
            for (const fileId of fileIds) {
                try {
                    const file = await openaiClient.files.retrieve(fileId);
                    if (file.filename) {
                        sources.push(file.filename);
                    } else {
                        sources.push(`Documento ${fileId.slice(-4)}`);
                    }
                } catch (e) {
                    sources.push(`Documento ${fileId.slice(-4)}`);
                }
            }
        }

        return {
            questions: JSON.parse(cleaned).questions,
            ragUsed: (annotations?.length || 0) > 0,
            sources: Array.from(new Set(sources))
        };
    }
}

/**
 * Unified Exam Generation
 */
export async function generateExam(params: {
    area: string;
    difficulty: string;
    count: number;
}) {
    const { area, difficulty, count } = params;
    const prompt = `Genera un EXAMEN DE DESARROLLO de Derecho ${area.toUpperCase()} (Dificultad: ${difficulty.toUpperCase()}) con ${count} preguntas abiertas.
    IMPORTANTE: Debes basarte EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO.
    Output JSON (Strict): { "questions": [{ "id": 1, "text": "Enunciado de la pregunta..." }], "rubric": { "1": "Criterios de evaluación..." } }
    Legislación española vigente. Responde ÚNICAMENTE con el JSON válido.`;

    if (isGemini) {
        console.log("🤖 [MODELO] Generación Exam → Gemini 1.5 Flash (generateContent API + File Search)");
        const res = await retryOperation(() => geminiClient.models.generateContent({
            model: "gemini-flash-latest",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID] } }]
            }
        }));
        if (res.usageMetadata) {
            logUsage("gemini", {
                prompt: res.usageMetadata.promptTokenCount ?? 0,
                completion: res.usageMetadata.candidatesTokenCount ?? 0,
                total: res.usageMetadata.totalTokenCount ?? 0,
            });
        }

        const raw = res.text || "{}";
        const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
        const grounding = res.candidates?.[0]?.groundingMetadata;

        // Extract sources
        const sources: string[] = [];
        if (grounding?.groundingChunks) {
            grounding.groundingChunks.forEach((chunk: any) => {
                if (chunk.retrievedContext?.title) {
                    sources.push(chunk.retrievedContext.title);
                } else if (chunk.web?.title) {
                    sources.push(chunk.web.title);
                }
            });
        }

        return {
            ...JSON.parse(cleaned),
            ragUsed: (grounding?.groundingChunks?.length || 0) > 0,
            sources: Array.from(new Set(sources)) // Unique sources
        };
    } else {
        console.log("🤖 [MODELO] Generación Exam → GPT-4o (Assistants API + File Search)");
        const thread = await openaiClient.beta.threads.create();
        await openaiClient.beta.threads.messages.create(thread.id, { role: "user", content: prompt });
        const run = await openaiClient.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: OPENAI_ASSISTANT_ID,
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        });

        if (run.usage) {
            logUsage("openai", {
                prompt: run.usage.prompt_tokens,
                completion: run.usage.completion_tokens,
                total: run.usage.total_tokens,
            });
        }

        const messages = await openaiClient.beta.threads.messages.list(thread.id);
        const assistantMessage = messages.data[0];
        const text = (assistantMessage.content[0] as any).text.value;
        const annotations = (assistantMessage.content[0] as any).text.annotations;
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();

        // Extract sources
        const sources: string[] = [];
        if (annotations) {
            const fileIds = new Set<string>();
            annotations.forEach((ann: any) => {
                if (ann.type === 'file_citation') {
                    fileIds.add(ann.file_citation.file_id);
                }
            });

            // Resolve filenames
            for (const fileId of fileIds) {
                try {
                    const file = await openaiClient.files.retrieve(fileId);
                    if (file.filename) {
                        sources.push(file.filename);
                    } else {
                        sources.push(`Documento ${fileId.slice(-4)}`);
                    }
                } catch (e) {
                    sources.push(`Documento ${fileId.slice(-4)}`);
                }
            }
        }

        return {
            ...JSON.parse(cleaned),
            ragUsed: true, // Always true for verify-kdb exams
            sources: Array.from(new Set(sources))
        };
    }
}

/**
 * Unified Exam Grading
 */
export async function gradeExam(params: {
    questions: any[];
    answers: Record<string, string>;
    rubric: any;
}) {
    const { questions, answers, rubric } = params;
    const inputList = questions.map((q: any) => ({
        id: q.id,
        question: q.text,
        rubric: (rubric as any)[String(q.id)],
        student_answer: answers[String(q.id)] || "(NO CONTESTÓ)"
    }));

    const prompt = `[SYSTEM]
    Eres un corrector académico de Derecho. Evalúas con honestidad estricta.
    Calibración: 5-6/10 aceptable, 7/10 bien, 8+/10 sólida, 9-10/10 excelente.
    Rúbrica (10 pts): Exactitud (4), razonamiento (3), claridad (2), adecuación (1).
    Devuelve JSON válido: { "questions": [...], "attempt": { "finalScore": ... } }
    INPUT: ${JSON.stringify(inputList)}`;

    if (isGemini) {
        console.log("🤖 [MODELO] Grading Exam → Gemini 2.0 Flash (generateContent API)");
        const res = await retryOperation(() => geminiClient.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            }
        }));

        if (res.usageMetadata) {
            logUsage("gemini", {
                prompt: res.usageMetadata.promptTokenCount ?? 0,
                completion: res.usageMetadata.candidatesTokenCount ?? 0,
                total: res.usageMetadata.totalTokenCount ?? 0,
            });
        }

        return JSON.parse(res.text || "{}");
    } else {
        console.log("🤖 [MODELO] Grading Exam → GPT-4o (Chat Completions API)");
        const completion = await openaiClient.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a strict academic grader." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        if (completion.usage) {
            logUsage("openai", {
                prompt: completion.usage.prompt_tokens,
                completion: completion.usage.completion_tokens,
                total: completion.usage.total_tokens,
            });
        }

        return JSON.parse(completion.choices[0].message.content || "{}");
    }
}

/**
 * Unified Audio Response (Gemini Only)
 */
export async function generateAudioResponse(params: {
    base64Audio: string;
    prompt: string;
}) {
    const { base64Audio, prompt } = params;

    // Hybrid Mode: Always allow Gemini for audio, even if AI_PROVIDER is openai.
    // if (!isGemini) {
    //    throw new Error("Audio processing is only supported with Gemini provider");
    // }

    const res = await geminiClient.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{
            role: "user",
            parts: [
                { text: prompt },
                { inlineData: { mimeType: "audio/webm", data: base64Audio } }
            ]
        }],
        config: {
            tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID] } }],
        },
    });

    if (res.usageMetadata) {
        logUsage("gemini", {
            prompt: res.usageMetadata.promptTokenCount ?? 0,
            completion: res.usageMetadata.candidatesTokenCount ?? 0,
            total: res.usageMetadata.totalTokenCount ?? 0,
        });
    }

    const text = res.text ?? "";
    const grounding = res.candidates?.[0]?.groundingMetadata;
    const citations = formatGeminiCitations(grounding?.groundingChunks);

    return citations ? `${text}\n\n${citations}` : text;
}
