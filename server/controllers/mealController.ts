import { Request, Response } from 'express';
import { isMongoConnected } from '../db/config';
import { MealModel } from '../models/Meal';
import { localDb } from '../db/localDb';
import { AuthRequest } from '../middlewares/authMiddleware';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

// Function to estimate nutritional values of a meal using Gemini
async function estimateNutrients(description: string) {
  if (!ai) {
    console.warn('⚠️ GEMINI_API_KEY is not configured. Using fallback nutritional estimation.');
    return fallbackEstimation(description);
  }

  const prompt = `Analyze the following meal description: "${description}". 
Estimate its total calories (in kcal), protein (in grams), carbohydrates (in grams), and fat (in grams). 
Be realistic and accurate based on standard nutritional science. 
Provide your response in strict JSON format matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.INTEGER, description: 'Total estimated calories in kcal.' },
            protein: { type: Type.INTEGER, description: 'Estimated protein in grams.' },
            carbs: { type: Type.INTEGER, description: 'Estimated carbohydrates in grams.' },
            fat: { type: Type.INTEGER, description: 'Estimated fat in grams.' },
          },
          required: ['calories', 'protein', 'carbs', 'fat'],
        },
      },
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    return {
      calories: Number(data.calories) || 350,
      protein: Number(data.protein) || 12,
      carbs: Number(data.carbs) || 40,
      fat: Number(data.fat) || 10,
    };
  } catch (error) {
    console.error('❌ Gemini nutrition estimation failed, using fallback:', error);
    return fallbackEstimation(description);
  }
}

// Smart local fallback parser based on text analysis
function fallbackEstimation(description: string) {
  const descLower = description.toLowerCase();
  let calories = 350;
  let protein = 12;
  let carbs = 40;
  let fat = 10;

  if (descLower.includes('egg') || descLower.includes('scrambled')) {
    calories = 220; protein = 14; carbs = 5; fat = 15;
  } else if (descLower.includes('chicken') || descLower.includes('turkey') || descLower.includes('meat') || descLower.includes('beef')) {
    calories = 450; protein = 35; carbs = 20; fat = 18;
  } else if (descLower.includes('salad') || descLower.includes('veg') || descLower.includes('greens')) {
    calories = 150; protein = 5; carbs = 12; fat = 8;
  } else if (descLower.includes('shake') || descLower.includes('smoothie') || descLower.includes('protein powder')) {
    calories = 280; protein = 25; carbs = 30; fat = 3;
  } else if (descLower.includes('oat') || descLower.includes('porridge') || descLower.includes('cereal')) {
    calories = 300; protein = 8; carbs = 55; fat = 5;
  } else if (descLower.includes('rice') || descLower.includes('pasta') || descLower.includes('noodle')) {
    calories = 500; protein = 12; carbs = 85; fat = 7;
  } else if (descLower.includes('fish') || descLower.includes('salmon') || descLower.includes('tuna')) {
    calories = 380; protein = 28; carbs = 5; fat = 14;
  } else if (descLower.includes('apple') || descLower.includes('banana') || descLower.includes('fruit') || descLower.includes('snack')) {
    calories = 120; protein = 1; carbs = 28; fat = 0;
  }

  return { calories, protein, carbs, fat };
}

// Create a new meal log
export async function logMeal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized user context.' });
      return;
    }

    const { mealName, description, calories, protein, carbs, fat, date } = req.body;

    if (!mealName || !description) {
      res.status(400).json({ message: 'Meal name and description are required.' });
      return;
    }

    let finalCalories = Number(calories);
    let finalProtein = Number(protein);
    let finalCarbs = Number(carbs);
    let finalFat = Number(fat);

    // If user didn't specify calories or requested AI estimation (calories <= 0)
    if (!finalCalories || finalCalories <= 0) {
      const estimate = await estimateNutrients(description);
      finalCalories = estimate.calories;
      finalProtein = finalProtein || estimate.protein;
      finalCarbs = finalCarbs || estimate.carbs;
      finalFat = finalFat || estimate.fat;
    }

    const mealDate = date ? new Date(date) : new Date();

    let savedMeal: any;

    if (isMongoConnected) {
      const newMeal = new MealModel({
        userId,
        mealName,
        description,
        calories: finalCalories,
        protein: finalProtein,
        carbs: finalCarbs,
        fat: finalFat,
        date: mealDate,
      });
      const dbMeal = await newMeal.save();
      savedMeal = {
        id: dbMeal._id.toString(),
        _id: dbMeal._id.toString(),
        ...dbMeal.toObject(),
      };
    } else {
      const localMeal = localDb.createMeal({
        userId,
        mealName,
        description,
        calories: finalCalories,
        protein: finalProtein,
        carbs: finalCarbs,
        fat: finalFat,
        date: mealDate.toISOString(),
      });
      savedMeal = {
        id: localMeal._id,
        _id: localMeal._id,
        ...localMeal,
      };
    }

    res.status(201).json({
      success: true,
      message: 'Meal logged successfully.',
      meal: savedMeal,
    });
  } catch (error) {
    console.error('Error logging meal:', error);
    res.status(500).json({ message: 'Server error logging meal.' });
  }
}

// Get all meals of authenticated user
export async function getMyMeals(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized user context.' });
      return;
    }

    let meals: any[] = [];

    if (isMongoConnected) {
      const dbMeals = await MealModel.find({ userId }).sort({ date: -1 });
      meals = dbMeals.map(m => ({
        id: m._id.toString(),
        _id: m._id.toString(),
        ...m.toObject(),
      }));
    } else {
      const localMeals = localDb.findMealsByUserId(userId);
      meals = localMeals
        .map(m => ({
          id: m._id,
          _id: m._id,
          ...m,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    res.json(meals);
  } catch (error) {
    console.error('Error getting user meals:', error);
    res.status(500).json({ message: 'Server error getting meals.' });
  }
}

// Delete a meal
export async function deleteUserMeal(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized user context.' });
      return;
    }

    let deleted = false;

    if (isMongoConnected) {
      const meal = await MealModel.findOne({ _id: id, userId });
      if (meal) {
        await MealModel.deleteOne({ _id: id });
        deleted = true;
      }
    } else {
      const meal = localDb.getMeals().find(m => m._id === id && m.userId === userId);
      if (meal) {
        deleted = localDb.deleteMeal(id);
      }
    }

    if (!deleted) {
      res.status(404).json({ message: 'Meal log not found or unauthorized.' });
      return;
    }

    res.json({ success: true, message: 'Meal log deleted successfully.' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: 'Server error deleting meal log.' });
  }
}
