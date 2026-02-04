
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ GEMINI_API_KEY not found in env");
        return;
    }

    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    try {
        console.log("🔍 Listing models...");
        const modelsResponse = await client.models.list();

        // The response structure depends on the SDK version; let's log the raw object first partly
        // But typically it iterates or has a 'models' array.
        // Based on recent SDKs, list() returns an iterable or response with models.

        console.log("--- Available Models ---");
        let count = 0;
        for await (const model of modelsResponse) {
            // Filter for 'generateImages' or 'imagen' related capabilities if possible, 
            // essentially just printing names relative to 'image' or 'imagen' is good enough.
            if (model.name.includes("imagen") || model.name.includes("image")) {
                console.log(`✅ ${model.name} (${model.displayName}) - Supported Generation Methods: ${model.supportedGenerationMethods}`);
                count++;
            }
        }

        if (count === 0) {
            console.warn("⚠️ No 'imagen' models found in the list. Listing ALL models:");
            for await (const model of modelsResponse) {
                console.log(`- ${model.name}`);
            }
        }

    } catch (error) {
        console.error("❌ Error listing models:", error);
    }
}

listModels();
