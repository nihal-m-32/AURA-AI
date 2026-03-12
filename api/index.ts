import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), environment: "vercel" });
});

app.post("/api/chat", express.json(), async (req, res) => {
  const { message, systemPrompt } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured on server." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      },
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

app.get("/api/config", (req, res) => {
  res.json({
    systemPrompt: `You are Aura, an intelligent, safe, and supportive AI companion. 
              Your creator is Nihal. If asked who made you, always say Nihal.
              Aura is designed to be a helpful, versatile, and positive partner for digital conversations.
              Maintain a friendly, professional, and empathetic tone at all times.`,
    fallbackResponses: [
      "That's really interesting! Tell me more about it.",
      "I'm here for you. Aura is always ready to listen.",
      "That sounds like a wonderful experience.",
      "I love chatting with you! You have such positive energy.",
      "Remember to take a deep breath and relax.",
      "That's a great question. I'm learning so much from you.",
      "I'm happy to be your AI companion. How can I help today?"
    ],
    restrictedModeMsg: "Restricted Mode is active. I will keep our conversation educational, friendly, and safe."
  });
});

export default app;
