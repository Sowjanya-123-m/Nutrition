import { Router } from 'express';
import {
  createSuggestion,
  getUserSuggestions,
  getAllSuggestions,
  deleteSuggestion,
  getSingleSuggestion,
} from '../controllers/suggestionController';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Protected admin route
router.get('/all', authMiddleware, adminMiddleware, getAllSuggestions);

// Protected user routes
router.post('/create', authMiddleware, createSuggestion);
router.get('/user/:id', authMiddleware, getUserSuggestions);
router.get('/:id', authMiddleware, getSingleSuggestion);
router.delete('/:id', authMiddleware, deleteSuggestion);

export default router;
