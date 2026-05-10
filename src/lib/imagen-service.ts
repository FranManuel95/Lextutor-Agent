import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const geminiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export interface InfographicContent {
  topic: string;
  sections: { title: string; content: string }[];
  footer_context: string;
}

export interface InfographicResult {
  data: string | null;
  error?: string;
}

const IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation";

export async function generateLegalInfographic(
  content: InfographicContent
): Promise<InfographicResult> {
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY_MS = 2000;

  const { topic, sections, footer_context } = content;
  logger.info("[imagen-service] Generando Infografía Legal Detallada", {
    topic,
    model: IMAGE_MODEL,
  });

  let dynamicContentBlocks = "";
  sections.forEach((section, index) => {
    const isFirst = index === 0;
    const containerStyle = isFirst
      ? "Display inside a large wide note paper (lined paper style) for the definition."
      : "Display inside a distinct cut-out box or bordered card.";

    dynamicContentBlocks += `
${index + 3}. **SECTION ${index + 1} (${section.title.toUpperCase()})**:
    *   ${containerStyle}
    *   TEXT: "${section.content}"
    `;
  });

  const prompt = `Create a **professional vertical legal cheat sheet (9:16 aspect ratio)**.

**STRICT VISUAL STYLE: "MODERN LEGAL SCRAPBOOK"**
1.  **Background**: Use a textured **Kraft Paper** or "Vintage Paper" background.
2.  **Layout**: **GRID SYSTEM**. Info MUST be inside distinct **cut-out paper boxes** or **sticky notes**.
    *   Use **dashed lines** or **tape effects** to separate sections.
    *   **NO OVERLAPS**. Every text block must have its own clear container.
    *   **MARGINS**: Keep 10% empty space on all edges. Do not cut off text.

**CONTENT TO FILL (Use THIS text exactly, translate to visual blocks):**

1.  **BRANDING HEADER**: "LexTutor Agent" (Small tag at top).
2.  **MAIN TITLE**: "${topic}" (Large, Bold "Sticker Style").
${dynamicContentBlocks}
${sections.length + 3}. **FOOTER NOTE**:
    *   Display in a small bottom strip or tag.
    *   TEXT: "${footer_context}"

**TYPOGRAPHY RULES:**
*   **SPANISH ONLY**. Perfect spelling.
*   **Headings**: Bold, Uppercase, Serif Font (like a legal document).
*   **Body Text**: Dark Gray (#333333), highly readable Sans Serif. **Size: Small/Medium (10-12pt equivalent)** to fit more text.
*   **Format**: Use **paragraphs** or **lists** as appropriate for the content.

**CRITICAL QUALITY CONTROL:**
- **ZERO HALLUCINATIONS**: Do not invent glyphs.
- **NO CUT-OFF TEXT**: Resize text to fit containers.
- **Iconography**: Flat, professional vector icons. No photorealism.`;

  let lastError = "Error desconocido al generar la imagen.";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        logger.info("[imagen-service] Reintentando generación de imagen", {
          attempt,
          maxRetries: MAX_RETRIES,
        });
      }

      const response = await geminiClient.models.generateContent({
        model: IMAGE_MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseModalities: ["IMAGE"] },
      });

      logger.info("[imagen-service] API call complete. Processing response...");

      const candidate = response?.candidates?.[0];

      if (candidate?.finishReason && candidate.finishReason !== "STOP") {
        const reason = candidate.finishReason;
        logger.warn("[imagen-service] Candidate finished with non-STOP reason", { reason });
        if (reason === "SAFETY") {
          return {
            data: null,
            error:
              "El contenido fue bloqueado por los filtros de seguridad de la API. Intenta con un tema diferente.",
          };
        }
        return {
          data: null,
          error: `La API rechazó la solicitud (${reason}). Inténtalo de nuevo.`,
        };
      }

      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            logger.info("[imagen-service] Imagen recibida correctamente.");
            return {
              data: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
            };
          }
        }
      }

      logger.warn("[imagen-service] La API respondió pero no devolvió datos de imagen.", {
        candidateKeys: candidate ? Object.keys(candidate) : "sin candidato",
        parts: JSON.stringify(candidate?.content?.parts?.map((p) => Object.keys(p))),
      });
      return {
        data: null,
        error:
          "La API de Gemini respondió pero no generó ninguna imagen. Es posible que el modelo esté temporalmente no disponible.",
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: number; status?: number };
      const rawMsg = err.message ?? "Error desconocido";

      logger.error("[imagen-service] Error generando infografía legal", error, {
        attempt,
        maxRetries: MAX_RETRIES,
        rawMsg,
      });

      const isOverloaded =
        err.code === 503 ||
        err.status === 503 ||
        rawMsg.includes("503") ||
        rawMsg.toLowerCase().includes("overloaded");
      const isRateLimit = err.code === 429 || err.status === 429 || rawMsg.includes("429");
      const isNotFound =
        err.code === 404 || err.status === 404 || rawMsg.toLowerCase().includes("not found");

      if (isNotFound) {
        logger.error("[imagen-service] Modelo no encontrado.", { model: IMAGE_MODEL, rawMsg });
        return {
          data: null,
          error: `El modelo de generación de imágenes (${IMAGE_MODEL}) no está disponible. Detalle: ${rawMsg}`,
        };
      }

      if ((isOverloaded || isRateLimit) && attempt < MAX_RETRIES) {
        const delayMs = INITIAL_RETRY_DELAY_MS * 2 ** (attempt - 1);
        lastError = isRateLimit
          ? `Límite de peticiones alcanzado. Reintentando... (${rawMsg})`
          : `Servicio sobrecargado. Reintentando... (${rawMsg})`;
        logger.info("[imagen-service] Esperando antes de reintentar...", { delayMs, lastError });
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      lastError = rawMsg;
    }
  }

  return {
    data: null,
    error: `No se pudo generar la imagen tras ${MAX_RETRIES} intentos. ${lastError}`,
  };
}
