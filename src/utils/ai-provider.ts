// src/utils/ai-provider.ts
import "server-only";
import * as gemini from './gemini';
import * as openai from './openai';

export const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase() as "gemini" | "openai";

console.log(`🤖 AI Provider activo: ${AI_PROVIDER.toUpperCase()}`);

// Helper to determine active provider
export const isOpenAI = AI_PROVIDER === "openai";
export const isGemini = AI_PROVIDER === "gemini";

// Unified Interface
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
    if (isOpenAI) {
        return openai.generateResponseWithContext(message, settings, options);
    }
    return gemini.generateResponseWithContext(message, settings, options);
}

export function constructEliteSystemPrompt(params: any) {
    if (isOpenAI) {
        return openai.constructEliteSystemPrompt(params);
    }
    return gemini.constructEliteSystemPrompt(params);
}

export function formatCitationsFromChunks(chunks: any) {
    if (isOpenAI) {
        return openai.formatCitationsFromChunks(chunks);
    }
    return gemini.formatCitationsFromChunks(chunks);
}


