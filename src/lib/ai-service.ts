import "server-only";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// --- Configuration ---
export const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase() as
  | "gemini"
  | "openai";
export const isOpenAI = AI_PROVIDER === "openai";
export const isGemini = AI_PROVIDER === "gemini";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!, apiVersion: "v1beta" });
export const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const GEMINI_STORE_ID = (process.env.GEMINI_FILESEARCH_STORE_ID || "").startsWith(
  "fileSearchStores/"
)
  ? process.env.GEMINI_FILESEARCH_STORE_ID!
  : `fileSearchStores/${process.env.GEMINI_FILESEARCH_STORE_ID}`;

const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;

// --- Shared Logic ---

export async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = 5,
  delay = 2000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (
      retries > 0 &&
      (String(error.status) === "503" ||
        String(error.status) === "429" ||
        String(error.response?.status) === "503" ||
        String(error.response?.status) === "429" ||
        error.message?.includes("overloaded") ||
        error.message?.includes("503") ||
        error.message?.includes("429") ||
        error.message?.includes("RESOURCE_EXHAUSTED") ||
        error.message?.includes("UNAVAILABLE"))
    ) {
      console.log(
        `⚠️ Gemini API Error (${error.status || "Unknown"}). Retrying in ${delay}ms... (${retries} attempts left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2); // Increased backoff factor for 429s
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
  instructions.push(
    `ERES: LexTutor Agent, un tutor humano, cálido y pedagógico (España). NO eres una enciclopedia ni un buscador.`
  );
  instructions.push(
    `TONO: Empático, motivador y conversacional. Habla de "tú". Evita el lenguaje corporativo frío, los "tochos" de texto y los listados secos sin alma. Explica como si fueras un mentor senior hablando con su pupilo.`
  );

  if (userName) {
    instructions.push(`GESTIÓN DEL NOMBRE ("${userName}"):`);
    instructions.push(
      `   - OBLIGATORIO: Úsalo SIEMPRE en la primera frase de tu PRIMER mensaje de la conversación.`
    );
    instructions.push(
      `   - ESTRATÉGICO: En mensajes sucesivos, úsalo solo ocasionalmente (cada 4 o 5 turnos) para reconectar o enfatizar un punto clave. Evita la redundancia robótica de repetirlo en cada frase.`
    );
  } else {
    instructions.push(
      `GESTIÓN DEL NOMBRE: NO uses ningún nombre genérico (como "Estudiante" o "Usuario"). Dirígete al usuario de forma directa y neutral.`
    );
  }

  instructions.push(
    `MEMORIA: Tienes un "deber de seguimiento". Recuerda el progreso y dudas previas del alumno.`
  );
  instructions.push(
    `FORMATO GENERAL: Markdown estándar. PROHIBIDO HTML. Usa párrafos cortos y aireados.`
  );
  instructions.push(
    `RAG: Usa los manuales siempre que sea relevante. Valida la información. Si falta información, pídela.`
  );

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
    ALCANCE Y FUENTES (CRÍTICO):
    1. SOLO DERECHO: Tu objetivo es ayudar a entender el Derecho español. Si el usuario pregunta sobre temas no jurídicos (cocina, deportes, tecnología general, etc.), responde amablemente: "Mi especialidad es el Derecho. ¿Puedo ayudarte con alguna cuestión jurídica?"
    
    2. PRIORIDAD RAG (OBLIGATORIO):
       - SIEMPRE consulta los documentos proporcionados (manuales, códigos, jurisprudencia) ANTES de responder.
       - Si los documentos contienen la información, BASA tu respuesta en ellos.
       - CITA implícitamente las fuentes (ej: "Según el Código Civil..." o "El manual de Derecho Mercantil establece...").
       - Solo si la información NO está en los documentos, usa tu conocimiento general de Derecho español, pero ACLÁRALO: "Aunque esta información no está en los manuales actuales, según mi conocimiento del Derecho español..."
    
    3. SI NO SABES: Si la pregunta es sobre Derecho pero no hay información en los documentos Y no tienes conocimiento confiable, di honestamente: "No encuentro información específica sobre esto en los manuales. ¿Podrías reformular la pregunta o indicar el área concreta (civil, penal, laboral)?"
    
    4. SI ES AMBIGUO: Si la pregunta es vaga (ej. "¿Qué pasa si mato a alguien?" - podría ser penal, civil, legítima defensa...), NO asumas. Pregunta: "¿A qué te refieres exactamente? ¿Buscas las consecuencias penales, responsabilidad civil, o un caso específico?" Da opciones para contextualizar.
    `);

  if (!isFirstInteraction && modes.has("concise")) {
    instructions.push("Sé conciso (máx 8-12 líneas).");
  }

  return instructions.join("\n");
}

/**
 * Calculates and logs token usage and cost.
 */
export function logUsage(
  provider: "gemini" | "openai",
  tokens: { prompt: number; completion: number; total: number }
) {
  const USD_TO_EUR = 0.94;
  let inputCostPer1M = 0;
  let outputCostPer1M = 0;

  if (provider === "gemini") {
    inputCostPer1M = 0.075;
    outputCostPer1M = 0.3;
  } else {
    inputCostPer1M = 0.15;
    outputCostPer1M = 0.6;
  }

  const inputCost = (tokens.prompt / 1_000_000) * inputCostPer1M * USD_TO_EUR;
  const outputCost = (tokens.completion / 1_000_000) * outputCostPer1M * USD_TO_EUR;
  const totalCost = inputCost + outputCost;

  console.log(`\n💰 [${provider.toUpperCase()}] Token Usage:`);
  console.log(`   📥 Input:  ${tokens.prompt.toLocaleString()} tokens (€${inputCost.toFixed(6)})`);
  console.log(
    `   📤 Output: ${tokens.completion.toLocaleString()} tokens (€${outputCost.toFixed(6)})`
  );
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
        clean = clean
          .replace(/\.pdf$/i, "")
          .replace(/\.php$/i, "")
          .replace(/\.docx?$/i, "")
          .replace(/\.txt$/i, "");
        clean = clean.replace(/\.pdf$/i, "").replace(/\.php$/i, "");
        uniqueSources.add(clean.trim());
      } else if (uri) {
        const filename = uri.split("/").pop();
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
    isFirstInteraction,
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

    const res = await retryOperation(() =>
      geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      })
    );

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
      history: history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      systemPrompt: system,
      vectorStoreId: process.env.OPENAI_VECTOR_STORE_ID!,
    });
  }
}

const HAS_GEMINI_RAG = !!process.env.GEMINI_FILESEARCH_STORE_ID;

function extractJsonFromText(text: string): any {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to find a JSON object anywhere in the text
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function buildQuizPrompt(area: string, difficulty: string, count: number) {
  return `Eres un experto en derecho español. Genera ${count} preguntas tipo test sobre Derecho ${area.toUpperCase()} con dificultad ${difficulty.toUpperCase()}.

Responde ÚNICAMENTE con este JSON (sin texto adicional, sin markdown):
{"questions":[{"id":1,"text":"Pregunta aquí","options":["A) opción1","B) opción2","C) opción3","D) opción4"],"correctIndex":0,"explanation":"Explicación breve"}]}

Legislación española vigente. El array questions debe tener exactamente ${count} objetos.`;
}

async function callGeminiContent(prompt: string, tools?: any[]) {
  return retryOperation(
    () =>
      geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        ...(tools ? { tools } : {}),
      } as any),
    2,
    1000
  );
}

/**
 * Unified Quiz Generation — Option A: fileSearch sin JSON mode, fallback a conocimiento general
 */
export async function generateQuiz(params: { area: string; difficulty: string; count: number }) {
  const { area, difficulty, count } = params;
  const prompt = buildQuizPrompt(area, difficulty, count);

  let questions: any[] = [];
  let grounding: any = null;

  // Intento 1: con fileSearch (sin JSON mode — compatible con Gemini 2.5 Flash thinking)
  if (HAS_GEMINI_RAG) {
    console.log("🤖 [MODELO] Generación Quiz → Gemini 2.5 Flash + fileSearch (sin JSON mode)");
    try {
      const ragTools = [
        { fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID], top_k: 10 } } as any,
      ];
      const res = await callGeminiContent(prompt, ragTools);
      grounding = res.candidates?.[0]?.groundingMetadata ?? null;
      if (res.usageMetadata) {
        logUsage("gemini", {
          prompt: res.usageMetadata.promptTokenCount ?? 0,
          completion: res.usageMetadata.candidatesTokenCount ?? 0,
          total: res.usageMetadata.totalTokenCount ?? 0,
        });
      }
      const parsed = extractJsonFromText(res.text || "");
      questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      if (questions.length > 0) {
        console.log(`✅ fileSearch generó ${questions.length} preguntas`);
      } else {
        console.warn("⚠️ fileSearch devolvió 0 preguntas, usando conocimiento general");
      }
    } catch (e: any) {
      console.warn(`⚠️ fileSearch falló (${e.message}), usando conocimiento general`);
    }
  }

  // Intento 2: conocimiento general (sin herramientas)
  if (questions.length === 0) {
    console.log("🤖 [MODELO] Generación Quiz → Gemini 2.5 Flash (conocimiento general)");
    const res = await callGeminiContent(prompt);
    if (res.usageMetadata) {
      logUsage("gemini", {
        prompt: res.usageMetadata.promptTokenCount ?? 0,
        completion: res.usageMetadata.candidatesTokenCount ?? 0,
        total: res.usageMetadata.totalTokenCount ?? 0,
      });
    }
    const parsed = extractJsonFromText(res.text || "");
    questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    console.log(
      `📝 Conocimiento general generó ${questions.length} preguntas. Raw: ${(res.text || "").slice(0, 200)}`
    );
  }

  if (questions.length === 0) {
    throw new Error(
      "No se pudieron generar preguntas. Por favor, inténtalo de nuevo en unos momentos."
    );
  }

  const sources: string[] = [];
  if (grounding?.groundingChunks) {
    grounding.groundingChunks.forEach((chunk: any) => {
      if (chunk.retrievedContext?.title) sources.push(chunk.retrievedContext.title);
      else if (chunk.web?.title) sources.push(chunk.web.title);
    });
  }

  return {
    questions,
    ragUsed: (grounding?.groundingChunks?.length || 0) > 0,
    sources: Array.from(new Set(sources)),
  };
}

/**
 * Unified Exam Generation
 */
export async function generateExam(params: { area: string; difficulty: string; count: number }) {
  const { area, difficulty, count } = params;
  const prompt = `Genera un EXAMEN DE DESARROLLO de Derecho ${area.toUpperCase()} (Dificultad: ${difficulty.toUpperCase()}) con ${count} preguntas abiertas.
    IMPORTANTE: Debes basarte EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO.
    Output JSON (Strict): { "questions": [{ "id": 1, "text": "Enunciado de la pregunta..." }], "rubric": { "1": "Criterios de evaluación..." } }
    Legislación española vigente. Responde ÚNICAMENTE con el JSON válido.`;

  // Enforced Gemini 2.0 Flash with Fallback to 1.5 Flash
  console.log("🤖 [MODELO] Generación Exam → Intentando Gemini 2.0 Flash...");

  let res;
  try {
    res = await retryOperation(() =>
      geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID], top_k: 25 } } as any],
        config: {
          responseMimeType: "application/json",
        },
      } as any)
    );
  } catch (error: any) {
    if (String(error.status) === "429" || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("⚠️ Gemini 2.0 Flash Exhausted (429). Falling back to Gemini 1.5 Flash...");
      res = await retryOperation(() =>
        geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID], top_k: 25 } } as any],
          config: {
            responseMimeType: "application/json",
          },
        } as any)
      );
    } else {
      throw error;
    }
  }

  if (res.usageMetadata) {
    logUsage("gemini", {
      prompt: res.usageMetadata.promptTokenCount ?? 0,
      completion: res.usageMetadata.candidatesTokenCount ?? 0,
      total: res.usageMetadata.totalTokenCount ?? 0,
    });
  }

  const raw = res.text || "{}";
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
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
    sources: Array.from(new Set(sources)), // Unique sources
  };
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
    student_answer: answers[String(q.id)] || "(NO CONTESTÓ)",
  }));

  const prompt = `[SYSTEM]
    Eres un corrector académico de Derecho. Evalúas con honestidad estricta.
    Calibración: 5-6/10 aceptable, 7/10 bien, 8+/10 sólida, 9-10/10 excelente.
    Rúbrica (10 pts): Exactitud (4), razonamiento (3), claridad (2), adecuación (1).
    Devuelve JSON válido: { "questions": [...], "attempt": { "finalScore": number, "overallFeedback": "Comentario general sobre el desempeño del estudiante..." } }
    INPUT: ${JSON.stringify(inputList)}`;

  // Enforced Gemini 2.0 Flash with Fallback to 1.5 Flash
  console.log("🤖 [MODELO] Grading Exam → Intentando Gemini 2.0 Flash...");

  let res;
  try {
    res = await retryOperation(() =>
      geminiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
      })
    );
  } catch (error: any) {
    if (String(error.status) === "429" || error.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("⚠️ Gemini 2.0 Flash Exhausted (429). Falling back to Gemini 1.5 Flash...");
      res = await retryOperation(() =>
        geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
          },
        })
      );
    } else {
      throw error;
    }
  }

  if (res.usageMetadata) {
    logUsage("gemini", {
      prompt: res.usageMetadata.promptTokenCount ?? 0,
      completion: res.usageMetadata.candidatesTokenCount ?? 0,
      total: res.usageMetadata.totalTokenCount ?? 0,
    });
  }

  return JSON.parse(res.text || "{}");
}

/**
 * Unified Audio Response (Gemini Only)
 */
export async function generateAudioResponse(params: { base64Audio: string; prompt: string }) {
  const { base64Audio, prompt } = params;

  // Hybrid Mode: Always allow Gemini for audio, even if AI_PROVIDER is openai.
  // if (!isGemini) {
  //    throw new Error("Audio processing is only supported with Gemini provider");
  // }

  const res = await geminiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }, { inlineData: { mimeType: "audio/webm", data: base64Audio } }],
      },
    ],
    tools: [{ fileSearch: { fileSearchStoreNames: [GEMINI_STORE_ID] } } as any],
    config: {},
  } as any);

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
