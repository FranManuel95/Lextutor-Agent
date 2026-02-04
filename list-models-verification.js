
const { GoogleGenAI } = require("@google/genai");

const geminiClient = new GoogleGenAI({ apiKey: "AIzaSyBa8BLQO7qryEKYWgn3Iw0Zzjt-r1ABoRY" });

async function listModels() {
    try {
        console.log("Listing models...");
        const response = await geminiClient.models.list();
        console.log("Response Object:", JSON.stringify(response, null, 2));

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
