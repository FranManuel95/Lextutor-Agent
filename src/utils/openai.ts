// src/utils/openai.ts (SERVER-ONLY)
import "server-only";
import OpenAI from "openai";
import { env } from "@/lib/env";

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY! });
const ASSISTANT_ID = env.OPENAI_ASSISTANT_ID!;
const VECTOR_STORE_ID = env.OPENAI_VECTOR_STORE_ID!;

// COPIADO EXACTAMENTE de gemini.ts - Shared Elite Agent Prompt Logic
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
    `RAG: Usa los manuales siempre que sea relevante. Valida la información.Si falta información, písela.`
  );

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
    userName?: string;
    isFirstInteraction?: boolean;
  }
) {
  const modes = new Set(settings.modes || []);
  const area = settings.area || "general";
  const userName = options?.userName || "";
  const isFirstInteraction = options?.isFirstInteraction ?? false;

  const system = constructEliteSystemPrompt({
    userName,
    modes,
    area,
    isFirstInteraction,
  });

  const prompt = [
    system,
    `ÁREA SUGERIDA: ${area.toUpperCase()}`,
    `PREGUNTA DEL ALUMNO: ${message}`,
  ].join("\n");

  console.log(`\n🤖 [OpenAI] Generando respuesta...`);
  console.log(`   📝 Modelo: ${process.env.OPENAI_MODEL || "gpt-4o-mini"}`);
  console.log(`   👤 Usuario: ${userName || "Anónimo"}`);

  // Usar Assistants API con File Search
  const thread = await client.beta.threads.create();

  await client.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: ASSISTANT_ID,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });

  // 📊 TOKEN USAGE TRACKING
  if (run.usage) {
    const { prompt_tokens, completion_tokens, total_tokens } = run.usage;

    // Costos aproximados para gpt-4o-mini (USD por 1M tokens)
    const INPUT_COST_PER_1M = 0.15; // $0.150 / 1M input tokens
    const OUTPUT_COST_PER_1M = 0.6; // $0.600 / 1M output tokens
    const USD_TO_EUR = 0.94; // Tasa de cambio aproximada USD → EUR

    const inputCost = (prompt_tokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
    const outputCost = (completion_tokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
    const totalCost = inputCost + outputCost;

    console.log(`\n💰 [OpenAI] Token Usage:`);
    console.log(
      `   📥 Input:  ${prompt_tokens.toLocaleString()} tokens (€${inputCost.toFixed(6)})`
    );
    console.log(
      `   📤 Output: ${completion_tokens.toLocaleString()} tokens (€${outputCost.toFixed(6)})`
    );
    console.log(`   📊 Total:  ${total_tokens.toLocaleString()} tokens (€${totalCost.toFixed(6)})`);
    console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
  }

  const messages = await client.beta.threads.messages.list(thread.id);
  const assistantMessage = messages.data[0];

  let text = "";
  if (assistantMessage.content[0].type === "text") {
    text = assistantMessage.content[0].text.value;
  }

  // Formatear citations (similar a Gemini)
  const annotations =
    assistantMessage.content[0].type === "text" ? assistantMessage.content[0].text.annotations : [];

  const sourcesText = formatCitationsFromAnnotations(annotations);

  if (sourcesText) {
    return text + `\n\n${sourcesText}`;
  }

  return text;
}

export function formatCitationsFromAnnotations(annotations: any[]): string | null {
  if (!annotations || annotations.length === 0) return null;

  const uniqueSources = new Set<string>();

  annotations.forEach((ann: any) => {
    if (ann.type === "file_citation") {
      const fileId = ann.file_citation.file_id;
      uniqueSources.add(`Documento ${fileId.slice(-8)}`);
    }
  });

  if (uniqueSources.size > 0) {
    const sourcesString = Array.from(uniqueSources).join(", ");
    return `_(🔍 Fuente: Documentos de Estudiante Elite → ${sourcesString})_`;
  }

  return annotations.length > 0
    ? `_(🔍 Fuente: Documentos de Estudiante Elite - ${annotations.length} referencias)_`
    : null;
}

// Alias para compatibilidad con gemini.ts
export const formatCitationsFromChunks = formatCitationsFromAnnotations;

export async function generateQuiz(params: { area: string; difficulty: string; count: number }) {
  const { area, difficulty, count } = params;

  const prompt = `Genera un TEST de Derecho ${area.toUpperCase()} (Dificultad: ${difficulty.toUpperCase()}) con ${count} preguntas tipo test.
        
    IMPORTANTE: Debes basarte EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO (documentos adjuntos) para generar las preguntas. Si no encuentras información suficiente, usa conocimiento general pero PRIORIZA SIEMPRE los documentos.

    Devuelve JSON con "questions": Array de objetos:
    - id: number
    - text: string
    - options: string[] (Siempre 4 opciones)
    - correctIndex: number (0-3)
    - explanation: string (Breve explicación de por qué es la correcta).
    
    Legislación española vigente.
    
    Responde ÚNICAMENTE con el JSON válido.`;

  console.log(`\n🤖 [OpenAI - Quiz] Generando test...`);
  console.log(`   📝 Área: ${area.toUpperCase()}`);
  console.log(`   🎯 Dificultad: ${difficulty}`);
  console.log(`   📋 Preguntas: ${count}`);

  // Create Thread
  const thread = await client.beta.threads.create();

  // Add Message
  await client.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  // Run Assistant (Using defined Assistant which should have access to Vector Store)
  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: ASSISTANT_ID,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    // Force JSON output if possible via instructions, strictly
  });

  // 📊 TOKEN USAGE TRACKING
  if (run.usage) {
    const { prompt_tokens, completion_tokens, total_tokens } = run.usage;
    const INPUT_COST_PER_1M = 0.15;
    const OUTPUT_COST_PER_1M = 0.6;
    const USD_TO_EUR = 0.94;

    const inputCost = (prompt_tokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
    const outputCost = (completion_tokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
    const totalCost = inputCost + outputCost;

    console.log(`\n💰 [OpenAI - Quiz] Token Usage:`);
    console.log(
      `   📥 Input:  ${prompt_tokens.toLocaleString()} tokens (€${inputCost.toFixed(6)})`
    );
    console.log(
      `   📤 Output: ${completion_tokens.toLocaleString()} tokens (€${outputCost.toFixed(6)})`
    );
    console.log(`   📊 Total:  ${total_tokens.toLocaleString()} tokens (€${totalCost.toFixed(6)})`);
    console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
  }

  const messages = await client.beta.threads.messages.list(thread.id);
  const assistantMessage = messages.data[0];

  let text = "";
  if (assistantMessage.content[0].type === "text") {
    text = assistantMessage.content[0].text.value;
  }

  // Clean markdown if present
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  // Parse
  try {
    const generated = JSON.parse(cleaned);

    // Check RAG usage via annotations
    const annotations =
      assistantMessage.content[0].type === "text"
        ? assistantMessage.content[0].text.annotations
        : [];

    // Optional: Log citations if curious
    if (annotations?.length > 0) {
      console.log(`   🔍 Quiz RAG refs: ${annotations.length}`);
    }

    return generated;
  } catch (e) {
    console.error("OpenAI Quiz Parse Error:", text);
    throw new Error("Failed to parse OpenAI Quiz response");
  }
}

export async function generateExam(params: { area: string; difficulty: string; count: number }) {
  const { area, difficulty, count } = params;

  const prompt = `Genera un EXAMEN DE DESARROLLO de Derecho ${area.toUpperCase()} (Dificultad: ${difficulty.toUpperCase()}) con ${count} preguntas abiertas.

    IMPORTANTE: Debes basarte EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO (Vector Store adjunto).
    
    Output JSON (Strict):
    {
        "questions": [
            { "id": 1, "text": "Enunciado del caso o pregunta...", "topic": "Tema principal" }
        ],
        "rubric": {
            "1": "Criterios específicos de corrección para la pregunta 1 (artículos clave, jurisprudencia, puntos obligatorios)."
        }
    }
    
    Legislación española vigente.
    Responde ÚNICAMENTE con el JSON válido.`;

  console.log(`\n🤖 [OpenAI - Exam Generate] Generando examen...`);
  console.log(`   📝 Área: ${area.toUpperCase()}`);

  const thread = await client.beta.threads.create();

  await client.beta.threads.messages.create(thread.id, {
    role: "user",
    content: prompt,
  });

  const run = await client.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: ASSISTANT_ID,
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  });

  const messages = await client.beta.threads.messages.list(thread.id);
  const assistantMessage = messages.data[0];

  let text = "";
  if (assistantMessage.content[0].type === "text") {
    text = assistantMessage.content[0].text.value;
  }

  // Clean markdown if present
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim()
    .replace(/,(\s*[\]}])/g, "$1");

  try {
    const generated = JSON.parse(cleaned);

    // Check RAG usage via annotations
    const annotations =
      assistantMessage.content[0].type === "text"
        ? assistantMessage.content[0].text.annotations
        : [];

    return {
      ...generated,
      ragUsed: annotations.length > 0,
    };
  } catch (e) {
    console.error("OpenAI Exam Parse Error:", text);
    throw new Error("Failed to parse OpenAI Exam response");
  }
}

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
Eres un corrector académico de Derecho. Evalúas con honestidad estricta y consistencia. No inflas notas.
Evalúa SOLO con base en la pregunta y el texto del alumno. No asumas nada no escrito.

Calibración:
- 5–6/10: media aceptable con carencias
- 7/10: bien pero faltan matices/fundamento
- 8+/10: solo si sólida y completa
- 9–10/10: excelente (raro), precisa, estructurada, sin fallos relevantes
- 0–2/10: irrelevante o ausente
- 3–4/10: muy incompleta o con errores graves

Rúbrica (10 puntos):
- Exactitud jurídica (0–4)
- Fundamentación/razonamiento (0–3)
- Estructura y claridad (0–2)
- Concreción/adecuación (0–1)

Devuelve SIEMPRE JSON válido. Sin markdown. Sin texto fuera del JSON.

[USER INPUT]
Te daré una lista de preguntas y respuestas del alumno. Devuelve:
- Por pregunta: perQuestionScore, rubricScores, feedback (max 6 líneas), missingPoints[], improvementTips[], confidence (0..1)
- Para el intento: finalScore (0..10, 1 decimal), overallFeedback (max 8 líneas), strengths[], weaknesses[], nextStudySteps[]
        
        INPUT DEL EXAMEN (LISTA ORDENADA):
        ${JSON.stringify(inputList)}

        FORMATO JSON ESPERADO (Strict):
        {
          "questions": [...],
          "attempt": { ... }
        }`;

  console.log(`\n🤖[OpenAI - Exam Grade] Evaluando examen...`);
  console.log(`   📝 Preguntas: ${questions.length} `);

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a strict academic grader." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  // 📊 TOKEN USAGE TRACKING
  if (completion.usage) {
    const { prompt_tokens, completion_tokens, total_tokens } = completion.usage;
    const INPUT_COST_PER_1M = 0.15;
    const OUTPUT_COST_PER_1M = 0.6;
    const USD_TO_EUR = 0.94;

    const inputCost = (prompt_tokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
    const outputCost = (completion_tokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
    const totalCost = inputCost + outputCost;

    console.log(`\n💰[OpenAI - Exam Grade] Token Usage: `);
    console.log(`   📥 Input:  ${prompt_tokens.toLocaleString()} tokens(€${inputCost.toFixed(6)})`);
    console.log(
      `   📤 Output: ${completion_tokens.toLocaleString()} tokens(€${outputCost.toFixed(6)})`
    );
    console.log(`   📊 Total:  ${total_tokens.toLocaleString()} tokens(€${totalCost.toFixed(6)})`);
    console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
  }

  const content = completion.choices[0].message.content || "{}";

  try {
    return JSON.parse(content);
  } catch (e) {
    console.error("OpenAI Grading Parse Error:", content);
    throw new Error("Failed to parse OpenAI grading response");
  }
}
