import "server-only";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
    const INPUT_COST_PER_1M = 2.00;  // $2.00 per 1M input tokens
    const OUTPUT_COST_PER_1M = 8.00; // $8.00 per 1M output tokens

    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_1M * USD_TO_EUR;
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_1M * USD_TO_EUR;
    const totalCost = inputCost + outputCost;
    const totalTokens = usage.input_tokens + usage.output_tokens;

    console.log(`\n💰 [GPT-5.2] Token Usage:`);
    console.log(`   📥 Input:  ${usage.input_tokens.toLocaleString()} tokens (€${inputCost.toFixed(6)})`);
    console.log(`   📤 Output: ${usage.output_tokens.toLocaleString()} tokens (€${outputCost.toFixed(6)})`);
    console.log(`   📊 Total:  ${totalTokens.toLocaleString()} tokens (€${totalCost.toFixed(6)})`);
    console.log(`   💵 Costo estimado: €${totalCost.toFixed(6)} EUR\n`);
}

/**
 * Extracts and formats citations from file_search results.
 */
function formatGPT52Citations(fileSearchResults?: any[]): string | null {
    if (!fileSearchResults || fileSearchResults.length === 0) return null;

    const uniqueSources = new Set<string>();

    fileSearchResults.forEach((result: any) => {
        if (result.file_name) {
            // Clean filename (remove extension, sanitize)
            let clean = result.file_name.replace(/\.(pdf|docx?|txt)$/i, "");
            clean = clean.replace(/[_-]/g, " ").trim();
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
        console.log("🟣 Calling GPT-5.2 Responses API...");
        console.log(`📝 History messages: ${history.length}`);

        const response = await openai.responses.create({
            model: "gpt-5.2",
            reasoning: {
                effort: "medium"  // Options: "low", "medium", "high"
            },
            input: fullPrompt,
            // NOTE: Responses API does NOT support the `messages` parameter
            // All context must be in the `input` parameter
            tools: [{
                type: "file_search",
                vector_store_ids: [vectorStoreId],
                max_num_results: 5,  // Retrieve top 5 most relevant chunks
            }],
            include: ["file_search_call.results"],  // Include RAG results in response
        } as any);

        console.log("✅ GPT-5.2 Response received");

        // Extract text
        const text = (response as any).output_text || "";

        // Log usage if available
        if ((response as any).usage) {
            logGPT52Usage({
                input_tokens: (response as any).usage.input_tokens || 0,
                output_tokens: (response as any).usage.output_tokens || 0,
            });
        }

        // Extract sources from file_search results
        const sources: string[] = [];

        // CORRECT LOCATION: GPT-5.2 returns file_search results in output[] array
        if ((response as any).output && Array.isArray((response as any).output)) {
            (response as any).output.forEach((item: any) => {
                // Method 1: Extract from file_search_call results
                if (item.type === 'file_search_call' && item.results) {
                    item.results.forEach((result: any) => {
                        if (result.filename) {
                            // Clean filename (remove extension)
                            let clean = result.filename.replace(/\.(pdf|docx?|txt)$/i, "");
                            clean = clean.replace(/[_-]/g, " ").trim();
                            sources.push(clean);
                        }
                    });
                }

                // Method 2: Also extract from message annotations
                if (item.type === 'message' && item.content) {
                    item.content.forEach((content: any) => {
                        if (content.annotations) {
                            content.annotations.forEach((ann: any) => {
                                if (ann.type === 'file_citation' && ann.filename) {
                                    let clean = ann.filename.replace(/\.(pdf|docx?|txt)$/i, "");
                                    clean = clean.replace(/[_-]/g, " ").trim();
                                    sources.push(clean);
                                }
                            });
                        }
                    });
                }
            });
        }

        // Get unique sources
        const uniqueSources = Array.from(new Set(sources));

        console.log("📚 [GPT-5.2] Sources found:", uniqueSources.length);
        if (uniqueSources.length > 0) {
            console.log("📚 [GPT-5.2] Source filenames:", uniqueSources.join(", "));
        }

        // Format citations
        let citations: string | null = null;
        if (uniqueSources.length > 0) {
            citations = `_(🔍 Fuente: Documentos de Estudiante Elite → ${uniqueSources.join(", ")})_`;
        }

        return citations ? `${text}\n\n${citations}` : text;

    } catch (error: any) {
        console.error("❌ GPT-5.2 Error:", error?.message || error);

        // Provide helpful error messages
        if (error?.status === 400) {
            throw new Error("GPT-5.2 configuración inválida. Verifica que OPENAI_VECTOR_STORE_ID esté configurado correctamente.");
        }

        throw new Error(`GPT-5.2 Error: ${error?.message || "Unknown error"}`);
    }
}
