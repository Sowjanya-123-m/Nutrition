import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { chatWithNutriBot, querySpecializedFeature } from '../controllers/aiController';

const router = Router();

// Apply authentication gate on all AI routes
router.post('/chat', authMiddleware, chatWithNutriBot);
router.post('/feature', authMiddleware, querySpecializedFeature);

export default router;
