
const { GoogleGenAI } = require("@google/genai");

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log("Listing models...");
        const response = await geminiClient.models.list();

        console.log("Available Models:");
        response.models.forEach(model => {
            console.log(`- ${model.name} (Capabilities: ${JSON.stringify(model.supportedGenerationMethods)})`);
        });

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
