import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as aiService from '../services/aiService';

/**
 * Handles general chatbot conversation
 * POST /api/ai/chat
 */
export async function chatWithNutriBot(req: AuthRequest, res: Response): Promise<void> {
  const { message, history } = req.body;

  if (!req.user) {
    res.status(401).json({ message: 'Access Denied: Unauthenticated' });
    return;
  }

  if (!message || typeof message !== 'string') {
    res.status(400).json({ message: 'Please provide a valid query message.' });
    return;
  }

  try {
    const reply = await aiService.getChatResponse(req.user.id, message, history || []);
    res.json({ reply });
  } catch (error: any) {
    console.error('aiController.chatWithNutriBot Error:', error);
    res.status(500).json({ 
      message: 'NutriBot encountered a momentary glitch. Please try asking your question again.',
      details: error.message || 'Unknown LLM Error'
    });
  }
}

/**
 * Handles specialized, structured nutrition feature queries
 * POST /api/ai/feature
 */
export async function querySpecializedFeature(req: AuthRequest, res: Response): Promise<void> {
  const { feature } = req.body;

  if (!req.user) {
    res.status(401).json({ message: 'Access Denied: Unauthenticated' });
    return;
  }

  if (!feature || typeof feature !== 'string') {
    res.status(400).json({ message: 'A valid specialized feature name is required.' });
    return;
  }

  const allowedFeatures = [
    'weekly_meal_plan',
    'healthy_alternatives',
    'water_and_exercise',
    'nutrients_explained',
    'motivational_tips'
  ];

  if (!allowedFeatures.includes(feature)) {
    res.status(400).json({ message: `Invalid feature name. Allowed features are: ${allowedFeatures.join(', ')}` });
    return;
  }

  try {
    const reply = await aiService.getSpecializedFeature(req.user.id, feature);
    res.json({ reply, feature });
  } catch (error: any) {
    console.error(`aiController.querySpecializedFeature [${feature}] Error:`, error);
    res.status(500).json({ 
      message: `Failed to load specialized suggestion for ${feature}. Please try again later.`,
      details: error.message || 'Unknown LLM Error'
    });
  }
}
