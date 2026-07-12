import { Router } from 'express';
import { logMeal, getMyMeals, deleteUserMeal } from '../controllers/mealController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.post('/create', authMiddleware, logMeal);
router.get('/my-meals', authMiddleware, getMyMeals);
router.delete('/:id', authMiddleware, deleteUserMeal);

export default router;
