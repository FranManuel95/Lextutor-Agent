import "server-only";
import { GoogleGenAI } from "@google/genai";
import { constructEliteSystemPrompt, formatGeminiCitations, retryOperation, AI_PROVIDER, isOpenAI, openaiClient } from "./ai-service";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generates AI response with STREAMING support for Gemini or OpenAI
 */
export async function generateResponseStream(params: {
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

    // --- OpenAI Logic ---
    // --- OpenAI Logic ---
    if (isOpenAI) {
        console.log("🤖 [MODELO] Chat conversacional → OpenAI GPT-4o (Assistants API + RAG)");

        const system = constructEliteSystemPrompt({
            userName: options?.userName || "",
            modes: new Set(settings.modes || []),
            summary: settings.summary,
            area: settings.area || "general",
            isFirstInteraction: options?.isFirstInteraction
        });

        // Ensure we have an assistant ID
        const assistantId = process.env.OPENAI_ASSISTANT_ID;
        const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

        if (!assistantId) throw new Error("OPENAI_ASSISTANT_ID is missing.");

        try {
            // Use Assistants API for RAG support
            const stream = openaiClient.beta.threads.createAndRunStream({
                assistant_id: assistantId,
                thread: {
                    messages: [
                        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
                        { role: "user", content: `ÁREA: ${(settings.area || "general").toUpperCase()}\nMENSAJE ACTUAL:\n${message}` }
                    ]
                },
                instructions: system, // Override system prompt
                model: "gpt-4o",
                tools: [{ type: "file_search" }], // Explicitly enable file search
                tool_resources: vectorStoreId ? {
                    file_search: {
                        vector_store_ids: [vectorStoreId]
                    }
                } : undefined
            });

            // Wrap OpenAI stream to match Gemini interface
            return (async function* () {
                let fileIds = new Set<string>();

                for await (const event of stream) {
                    // Handle Text Deltas
                    if (event.event === 'thread.message.delta') {
                        const content = event.data.delta.content?.[0];
                        if (content?.type === 'text' && content.text?.value) {
                            yield { text: content.text.value };

                            // Capture annotations (citations) from delta if present? 
                            // Usually annotations come in the text delta or need to be parsed from the final message.
                            // Better to wait for message completion for robust annotation parsing.
                        }
                    }

                    // Capture citations from Completed Message
                    if (event.event === 'thread.message.completed') {
                        const message = event.data;
                        if (message.content[0].type === "text") {
                            const annotations = message.content[0].text.annotations;
                            annotations?.forEach((ann: any) => {
                                if (ann.type === 'file_citation' && ann.file_citation) {
                                    fileIds.add(ann.file_citation.file_id);
                                }
                            });
                        }
                    }
                }

                // Append Footnotes/Citations if sources found
                if (fileIds.size > 0) {
                    // Resolve File IDs to Names
                    const fileNames: string[] = [];
                    for (const fileId of Array.from(fileIds)) {
                        try {
                            const file = await openaiClient.files.retrieve(fileId);
                            if (file.filename) {
                                const cleanName = file.filename.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]/g, " ").trim();
                                fileNames.push(cleanName);
                            }
                        } catch (e) {
                            console.error(`Failed to retrieve file ${fileId}`, e);
                        }
                    }

                    if (fileNames.length > 0) {
                        yield { text: `\n\n_(🔍 Fuente: ${fileNames.join(", ")})_` };
                    } else {
                        yield { text: `\n\n_(🔍 Fuente: Documentos de Estudiante Elite)_` };
                    }
                }
            })();
        } catch (error) {
            console.error("OpenAI Streaming Error:", error);
            throw error || new Error("Unknown OpenAI streaming error");
        }
    }

    // --- Gemini Logic ---
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

    console.log("🤖 [MODELO] Chat conversacional → Gemini 1.5 Flash (STREAMING)");

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

    try {
        const streamResponse = await retryOperation(() =>
            geminiClient.models.generateContentStream({
                model: "gemini-1.5-flash-latest",
                contents,
            }), 2, 800
        );
        return streamResponse;
    } catch (error) {
        console.warn("⚠️ Gemini Flash overloaded, switching to Gemini 1.5 Pro (Fallback)...");

        // Fallback to Pro model (using 002 as stable version)
        const streamResponse = await retryOperation(() =>
            geminiClient.models.generateContentStream({
                model: "gemini-1.5-pro-002",
                contents,
            })
        );
        return streamResponse;
    }
}

/**
 * ⚡️ GENERATE AUDIO RESPONSE STREAM (Tech Lead Implementation)
 * Stream real-time text response from Audio Input using Gemini 2.0 Flash
 */
export async function generateAudioResponseStream(params: {
    base64Audio: string;
    mimeType: string;
    prompt: string;
}) {
    const { base64Audio, mimeType, prompt } = params;

    console.log("🎙️ [MODELO] Audio Streaming → Gemini 2.0 Flash");

    try {
        const result = await retryOperation(() =>
            geminiClient.models.generateContentStream({
                model: "gemini-2.0-flash", // Usar el modelo más rápido
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Audio
                                }
                            }
                        ]
                    }
                ]
            }), 2, 500
        );

        return result;

    } catch (error) {
        console.error("❌ Error en generateAudioResponseStream:", error);
        // Fallback robusto a 1.5 Flash si 2.0 falla
        console.warn("⚠️ Fallback a Gemini 1.5 Flash...");
        const fallback = await geminiClient.models.generateContentStream({
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Audio
                            }
                        }
                    ]
                }
            ]
        });
        return fallback;
    }
}
