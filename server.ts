import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/chat", express.json(), async (req, res) => {
    const { message, systemPrompt } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured on server." });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
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

  app.post("/api/chat/grok", express.json(), async (req, res) => {
    const { messages, systemPrompt } = req.body;
    
    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({ error: "xAI API key not configured on server." });
    }

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.XAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          stream: false,
          temperature: 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "xAI API error");
      }

      const data = await response.json();
      res.json({ text: data.choices[0].message.content });
    } catch (error: any) {
      console.error("Grok API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response from Grok" });
    }
  });

  app.post("/api/chat/huggingface", express.json(), async (req, res) => {
    const { messages, systemPrompt } = req.body;
    
    if (!process.env.HUGGINGFACE_API_KEY) {
      return res.status(500).json({ error: "Hugging Face API key not configured on server." });
    }

    try {
      // Using Mistral-7B-Instruct-v0.3 via Hugging Face Inference API
      const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${systemPrompt}\n\n${messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')}\n\nAssistant: [/INST]`,
          parameters: {
            max_new_tokens: 1000,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Hugging Face API error");
      }

      const data = await response.json();
      // Hugging Face returns an array for this model
      const text = Array.isArray(data) ? data[0].generated_text : data.generated_text;
      res.json({ text: text.trim() });
    } catch (error: any) {
      console.error("Hugging Face API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate response from Hugging Face" });
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Aura Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
