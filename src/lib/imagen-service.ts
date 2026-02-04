import { GoogleGenAI } from "@google/genai";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generates a highly detailed vertical educational infographic in a 'Flat Design Editorial' style.
 * Uses Google Imagen 4 via Gemini API.
 * 
 * @param topic The central legal topic for the infographic.
 * @returns The Base64 encoded image string or null if failed.
 */


export interface InfographicContent {
    topic: string;
    sections: { title: string; content: string }[];
    footer_context: string;
}

export async function generateLegalInfographic(content: InfographicContent): Promise<string | null> {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY_MS = 2000;

    const { topic, sections, footer_context } = content;
    console.log(`🎨 Generando Infografía Legal Detallada sobre: ${topic}... (Gemini 3 Pro Image Preview)`);

    // Dynamically build content blocks
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

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`🔄 Reintentando generación de imagen (Intento ${attempt}/${MAX_RETRIES})...`);
            }

            // Using gemini-3-pro-image-preview (Nano Banana Pro) for professional quality and text rendering
            const response: any = await geminiClient.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: [{
                    role: "user",
                    parts: [{ text: prompt }]
                }],
            });

            console.log("✅ Nano Banana Pro API call complete. Processing response...");

            // Parse response structure for gemini-2.5-flash-image (inlineData)
            if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        console.log("📸 Professional Image received.");
                        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                    }
                }
            }

            console.warn("⚠️ No inline image data found in Nano Banana Pro response. Raw candidates:", JSON.stringify(response.candidates, null, 2));
            return null; // Don't retry if we got a valid response but no image (likely content filter or format issue)

        } catch (error: any) {
            console.error(`❌ Error generando infografía legal (Intento ${attempt}/${MAX_RETRIES}):`, error.message);

            // Check for 503 Overloaded or 429 Too Many Requests
            const isOverloaded = error.code === 503 || error.message?.includes('503') || error.message?.includes('overloaded');
            const isRateLimit = error.code === 429 || error.message?.includes('429');

            if ((isOverloaded || isRateLimit) && attempt < MAX_RETRIES) {
                const delayMs = INITIAL_RETRY_DELAY_MS * (2 ** (attempt - 1)); // Exponential backoff: 2s, 4s
                console.log(`⏳ Esperando ${delayMs}ms antes de reintentar...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
                continue;
            }

            if (error.response) {
                console.error("Error Response:", JSON.stringify(error.response, null, 2));
            }
            // If it's the last attempt or a non-retriable error, return null
            if (attempt === MAX_RETRIES) return null;
        }
    }

    return null;
}
