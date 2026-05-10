import "server-only";
import OpenAI from "openai";
import type {
  Response as OpenAIResponse,
  ResponseFileSearchToolCall,
  ResponseOutputMessage,
  ResponseOutputText,
} from "openai/resources/responses/responses";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

/**
 * GPT-5.2 Responses API Integration
 *
 * This module implements chat functionality using OpenAI's Responses API with GPT-5.2.
 *
 * Key Features:
 * - Chain-of-thought reasoning with configurable effort
 * - RAG via OpenAI Vector Stores (file_search tool)
 * - Manual history management (stateless)
 * - Citation extraction from file_search results
 *
 * Limitations:
 * - Cannot use response_format: json_object with reasoning enabled
 * - Higher latency due to reasoning overhead (~3-5s)
 * - 13x more expensive than GPT-4o
 */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GPT52Params {
  message: string;
  history?: Message[];
  systemPrompt: string;
  vectorStoreId: string;
}

/**
 * Calculates and logs GPT-5.2 token usage and cost.
 */
function logGPT52Usage(usage: { input_tokens: number; output_tokens: number }) {
  const USD_TO_EUR = 0.94;
  const INPUT_COST_PER_1M = 2.0; // $2.00 per 1M input tokens
  const OUTPUT_COST_PER_1M = 8.0; // $8.00 per 1M output tokens

  const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
  const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
  const totalCost = inputCost + outputCost;
  const totalTokens = usage.input_tokens + usage.output_tokens;

  logger.debug("[GPT-5.2] Token Usage", {
    inputTokens: usage.input_tokens,
    inputCostEur: inputCost.toFixed(6),
    outputTokens: usage.output_tokens,
    outputCostEur: outputCost.toFixed(6),
    totalTokens,
    totalCostEur: totalCost.toFixed(6),
  });
}

/**
 * Extracts and formats citations from file_search results.
 */
function formatGPT52Citations(
  fileSearchResults?: ResponseFileSearchToolCall.Result[] | null
): string | null {
  if (!fileSearchResults || fileSearchResults.length === 0) return null;

  const uniqueSources = new Set<string>();

  fileSearchResults.forEach((result) => {
    if (result.filename) {
      // Clean filename (remove extension, sanitize)
      const clean = result.filename
        .replace(/\.(pdf|docx?|txt)$/i, "")
        .replace(/[_-]/g, " ")
        .trim();
      uniqueSources.add(clean);
    }
  });

  if (uniqueSources.size > 0) {
    return `_(🔍 Fuente: Documentos de Estudiante Elite → ${Array.from(uniqueSources).join(", ")})_`;
  }

  return `_(🔍 Fuente: Documentos de Estudiante Elite - ${fileSearchResults.length} referencias procesadas)_`;
}

/**
 * Generates a chat response using GPT-5.2 with Responses API.
 *
 * @param params - Configuration including message, history, system prompt, and vector store ID
 * @returns The assistant's response text with optional citations
 */
export async function generateResponseGPT52(params: GPT52Params): Promise<string> {
  const { message, history = [], systemPrompt, vectorStoreId } = params;

  // Format conversation history as text (Responses API doesn't support messages array)
  let historyText = "";
  if (history.length > 0) {
    historyText = "HISTORIAL DE CONVERSACIÓN:\n";
    history.forEach((msg) => {
      const role = msg.role === "user" ? "Usuario" : "Asistente";
      historyText += `${role}: ${msg.content}\n\n`;
    });
    historyText += "---\n\n";
  }

  // Combine system prompt, history, and current message into single input
  const fullPrompt = `${systemPrompt}\n\n${historyText}MENSAJE ACTUAL:\n${message}`;

  try {
    logger.debug("Calling GPT-5.2 Responses API...", { historyMessages: history.length });

    // NOTE: `gpt-5.2` is accepted by ResponsesModel as it matches `string & {}`
    const response: OpenAIResponse = await openai.responses.create({
      model: "gpt-5.2",
      reasoning: {
        effort: "medium", // Options: "low", "medium", "high"
      },
      input: fullPrompt,
      // NOTE: Responses API does NOT support the `messages` parameter
      // All context must be in the `input` parameter
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
          max_num_results: 5, // Retrieve top 5 most relevant chunks
        },
      ],
      include: ["file_search_call.results"], // Include RAG results in response
    });

    logger.debug("GPT-5.2 Response received");

    // Extract text — `output_text` is a first-class property on the Response type
    const text = response.output_text || "";

    // Log usage if available
    if (response.usage) {
      logGPT52Usage({
        input_tokens: response.usage.input_tokens || 0,
        output_tokens: response.usage.output_tokens || 0,
      });
    }

    // Extract sources from file_search results
    // CORRECT LOCATION: GPT-5.2 returns file_search results in output[] array

    // Method 1: Collect file_search_call results (includes filenames when `include` is set)
    let fileSearchResults: ResponseFileSearchToolCall.Result[] = [];
    const annotationSources: string[] = [];

    response.output.forEach((item) => {
      if (item.type === "file_search_call") {
        const fileSearchItem = item as ResponseFileSearchToolCall;
        if (fileSearchItem.results) {
          fileSearchResults = fileSearchResults.concat(fileSearchItem.results);
        }
      }

      // Method 2: Also extract from message annotations
      if (item.type === "message") {
        const msgItem = item as ResponseOutputMessage;
        msgItem.content.forEach((contentPart) => {
          if (contentPart.type === "output_text") {
            const textPart = contentPart as ResponseOutputText;
            textPart.annotations.forEach((ann) => {
              if (ann.type === "file_citation") {
                // ResponseOutputText.FileCitation has file_id, not filename
                // Use file_id suffix as source identifier
                annotationSources.push(`Documento ${ann.file_id.slice(-8)}`);
              }
            });
          }
        });
      }
    });

    // Build citations: prefer filenames from file_search results; fall back to annotation IDs
    const citations =
      formatGPT52Citations(fileSearchResults.length > 0 ? fileSearchResults : null) ??
      (annotationSources.length > 0
        ? `_(🔍 Fuente: Documentos de Estudiante Elite → ${Array.from(new Set(annotationSources)).join(", ")})_`
        : null);

    const uniqueCount = fileSearchResults.length || annotationSources.length;
    logger.debug("[GPT-5.2] Sources found", { count: uniqueCount });

    return citations ? `${text}\n\n${citations}` : text;
  } catch (error: unknown) {
    logger.error("GPT-5.2 Error", error instanceof Error ? error : new Error(String(error)));

    // Provide helpful error messages
    if ((error as { status?: number })?.status === 400) {
      throw new Error(
        "GPT-5.2 configuración inválida. Verifica que OPENAI_VECTOR_STORE_ID esté configurado correctamente."
      );
    }

    throw new Error(`GPT-5.2 Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
