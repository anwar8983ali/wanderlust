// testGemini.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing. Add it to your .env file.");
    return;
  }
  console.log("🔑 Gemini API Key loaded: YES");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the latest available model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Hello, how are you?";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ Gemini response:", text);
  } catch (err) {
    console.error("❌ Error testing Gemini API:", err.message);
  }
}

testGemini();


