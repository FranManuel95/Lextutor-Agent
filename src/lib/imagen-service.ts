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

const IMAGE_MODEL = "imagen-4.0-generate-001";

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
SECTION ${index + 1} — ${section.title.toUpperCase()}:
  Style: ${containerStyle}
  Text: "${section.content}"
`;
  });

  const prompt = `Professional vertical legal study cheat sheet. Modern Legal Scrapbook style.

BACKGROUND: Textured kraft paper / vintage paper texture.
LAYOUT: Grid system. All info inside distinct cut-out paper boxes or sticky notes. Dashed lines or tape effects between sections. No overlaps. 10% empty margins on all edges — do NOT cut off text.

CONTENT (render exactly as written):

HEADER TAG (small, top): "LexTutor Agent"
MAIN TITLE (large bold sticker style): "${topic}"

${dynamicContentBlocks}
FOOTER STRIP (bottom tag): "${footer_context}"

TYPOGRAPHY: Spanish only. Headings — bold uppercase serif. Body — dark gray (#333333) readable sans-serif 10-12pt. Use paragraphs or bullet lists as needed.

QUALITY: No invented symbols. No cut-off text. Flat professional vector icons only, no photorealism.`;

  let lastError = "Error desconocido al generar la imagen.";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        logger.info("[imagen-service] Reintentando generación de imagen", {
          attempt,
          maxRetries: MAX_RETRIES,
        });
      }

      const response = await geminiClient.models.generateImages({
        model: IMAGE_MODEL,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio: "9:16",
          includeRaiReason: true,
        },
      });

      logger.info("[imagen-service] API call complete. Processing response...");

      const generated = response?.generatedImages?.[0];

      if (!generated) {
        logger.warn("[imagen-service] La API no devolvió ninguna imagen generada.");
        return {
          data: null,
          error:
            "La API de Imagen respondió pero no generó ninguna imagen. Es posible que el contenido haya sido filtrado.",
        };
      }

      if (!generated.image?.imageBytes) {
        const reason = generated.raiFilteredReason ?? "desconocido";
        logger.warn("[imagen-service] Imagen filtrada por RAI", { reason });
        return {
          data: null,
          error: `El contenido fue bloqueado por los filtros de seguridad. Motivo: ${reason}`,
        };
      }

      logger.info("[imagen-service] Imagen recibida correctamente.");
      const mimeType = generated.image.mimeType ?? "image/png";
      return {
        data: `data:${mimeType};base64,${generated.image.imageBytes}`,
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
