import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Initialize server-side Gemini client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400).json({ message: 'Message is required' });
    return;
  }

  try {
    if (ai) {
      // Structure the conversation history into Gemini format: [{ role: 'user'|'model', parts: [{ text: '...' }] }]
      // Map history from client: { sender: 'user'|'ai', text: string }
      const formattedHistory = (history || []).map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      // Create a chat instance with fallback chain
      let response;
      try {
        const chat = ai.chats.create({
          model: 'gemini-3.5-flash',
          config: {
            systemInstruction: 'You are "NutriBot", an empathetic, highly knowledgeable clinical nutrition expert and fitness coach. Provide clear, medically backed, encouraging advice. Tailor your responses to food science, BMR, weight management goals, and clean eating. Refuse to talk about unrelated topics politely.',
          },
          // We can pass pre-existing history
          history: formattedHistory,
        });
        response = await chat.sendMessage({ message });
      } catch (firstError) {
        console.warn('⚠️ Primary chat model gemini-3.5-flash failed or busy. Retrying with gemini-3.1-flash-lite...', firstError);
        try {
          const chat = ai.chats.create({
            model: 'gemini-3.1-flash-lite',
            config: {
              systemInstruction: 'You are "NutriBot", an empathetic, highly knowledgeable clinical nutrition expert and fitness coach. Provide clear, medically backed, encouraging advice. Tailor your responses to food science, BMR, weight management goals, and clean eating. Refuse to talk about unrelated topics politely.',
            },
            history: formattedHistory,
          });
          response = await chat.sendMessage({ message });
        } catch (secondError) {
          console.error('❌ Fallback chat model gemini-3.1-flash-lite also failed. Reverting to static chatbot responses...', secondError);
          const fallbacks = [
            "A healthy diet is a journey, not a sprint. Focus on adding high-quality lean protein to your next meal!",
            "Staying hydrated (at least 3 liters of water daily) is essential to flush out metabolic waste and keep your cellular functions running smoothly.",
            "To maximize satiety while maintaining a calorie deficit, make sure at least half of your dinner plate consists of non-starchy fibrous greens.",
            "Remember, nutrition is 80% of the equation, but active circulation (like a brisk 15-minute walk after meals) dramatically optimizes insulin sensitivity.",
            "Consider prepping your meals on Sundays! It eliminates decision fatigue and guards you against low-blood-sugar convenience eating.",
            "Fats are not the enemy! Focus on clean monounsaturated fats like raw almonds, cold-pressed olive oil, and avocado for proper hormone synthesis."
          ];
          const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
          res.json({ reply: `[Offline Mode] ${randomReply}` });
          return;
        }
      }
      res.json({ reply: response.text });
      return;
    } else {
      // High-quality simulated conversational fallback
      const fallbacks = [
        "A healthy diet is a journey, not a sprint. Focus on adding high-quality lean protein to your next meal!",
        "Staying hydrated (at least 3 liters of water daily) is essential to flush out metabolic waste and keep your cellular functions running smoothly.",
        "To maximize satiety while maintaining a calorie deficit, make sure at least half of your dinner plate consists of non-starchy fibrous greens.",
        "Remember, nutrition is 80% of the equation, but active circulation (like a brisk 15-minute walk after meals) dramatically optimizes insulin sensitivity.",
        "Consider prepping your meals on Sundays! It eliminates decision fatigue and guards you against low-blood-sugar convenience eating.",
        "Fats are not the enemy! Focus on clean monounsaturated fats like raw almonds, cold-pressed olive oil, and avocado for proper hormone synthesis.",
        "To fuel your workouts and protect your muscles, aim to ingest some fast-digesting protein and complex carbs about 90 minutes before exercising."
      ];
      const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      res.json({
        reply: `[Demo Chat Mode] ${randomReply}\n\n(To unlock full real-time Gemini conversations, please configure a real GEMINI_API_KEY in the Secrets panel).`
      });
    }
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ message: 'Failed to generate response from NutriBot' });
  }
});

export default router;
