"use server";

import { InfographicContent } from "@/lib/imagen-service";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateInfographicAction(
  chatId: string
): Promise<{ success: boolean; content?: InfographicContent; topic?: string; error?: string }> {
  if (!chatId) {
    return { success: false, error: "Chat ID is required" };
  }

  try {
    // 1. Fetch Chat History
    const supabase = await createClient();
    const { data: messages } = await supabase
      .from("messages")
      .select("content, role")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!messages || messages.length === 0) {
      return { success: false, error: "No hay mensajes suficientes para generar un resumen." };
    }

    const recentHistory = [...messages]
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // 2. Extract structured content via Gemini text model
    logger.info(
      "[generate-infographic] Analizando historial para extraer Visual Brief estructurado..."
    );

    const briefPrompt = `
            Analyze the following conversation history between a law student and a tutor.
            Create a structured content brief for an educational infographic.

            HISTORY:
            ${recentHistory}

            OUTPUT INSTRUCTIONS:
            Return a purely JSON object (no markdown, no backticks) with the following structure:
            {
                "topic": "Main Legal Topic (Max 5 words)",
                "sections": [
                    {
                        "title": "Section Title (e.g. Concepto, Requisitos, Excepciones, Jurisprudencia)",
                        "content": "Detailed content for this section (20-40 words). Explaining the 'what', 'why' or 'how'."
                    }
                ],
                "footer_context": "Relevant article/law (e.g. 'Art 123 CP' or 'Doctrina TS') - Max 10 words"
            }

            CRITICAL:
            1. Extract ALL key topics discussed (Concept, Elements, Differences, Examples).
            2. Generate between 3 to 5 separate sections depending on complexity.
            3. Ensure all text is in SPANISH and accurately reflects the conversation details.
        `;

    const briefRes = await geminiClient.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: briefPrompt }] }],
    });

    let contentData: InfographicContent = {
      topic: "Conceptos Jurídicos",
      sections: [{ title: "Resumen", content: "Resumen de la sesión de estudio." }],
      footer_context: "LexTutor AI",
    };

    try {
      const text =
        briefRes.text
          ?.replace(/```json/g, "")
          .replace(/```/g, "")
          .trim() || "";
      const parsed = JSON.parse(text);
      contentData = {
        topic: parsed.topic || contentData.topic,
        sections:
          parsed.sections && Array.isArray(parsed.sections)
            ? parsed.sections
            : contentData.sections,
        footer_context: parsed.footer_context || contentData.footer_context,
      };
    } catch (e) {
      logger.error("[generate-infographic] Error parsing visual brief JSON", e);
    }

    logger.info("[generate-infographic] Visual Brief extraído", {
      sectionCount: contentData.sections.length,
      topic: contentData.topic,
    });

    return { success: true, content: contentData, topic: contentData.topic };
  } catch (error) {
    logger.error("Error in generateInfographicAction", error);
    return { success: false, error: "Error interno al generar el resumen." };
  }
}
