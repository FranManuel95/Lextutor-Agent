"use server";

import { generateLegalInfographic } from "@/lib/imagen-service";
import { createClient } from "@/utils/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateInfographicAction(
  chatId: string
): Promise<{ success: boolean; imageUrl?: string; topic?: string; error?: string }> {
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
      .limit(30); // Expanded context window (30 messages)

    if (!messages || messages.length === 0) {
      return { success: false, error: "No messages found to summarize." };
    }

    // Reverse to chronological order for the AI analysis
    const recentHistory = [...messages]
      .reverse()
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    // 2. Extract Visual Brief using Gemini (Text Model)
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

    let contentData = {
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

    // 3. Generate Infographic
    const imageUrl = await generateLegalInfographic(contentData);

    if (imageUrl) {
      logger.info("[generate-infographic] Success, returning image URL.");
      return { success: true, imageUrl, topic: contentData.topic };
    } else {
      logger.error("[generate-infographic] Image URL is null.");
      return { success: false, error: "Failed to generate image" };
    }
  } catch (error) {
    logger.error("Error in generateInfographicAction", error);
    return { success: false, error: "Internal server error" };
  }
}
