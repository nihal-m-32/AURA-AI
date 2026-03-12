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
