import { Response } from 'express';
import { isMongoConnected } from '../db/config';
import { SuggestionModel } from '../models/Suggestion';
import { UserModel } from '../models/User';
import { localDb } from '../db/localDb';
import { AuthRequest } from '../middlewares/authMiddleware';
import { generateNutritionPlan } from '../utils/suggestNutrition';

export async function createSuggestion(req: AuthRequest, res: Response): Promise<void> {
  const { age, height, weight, activityLevel, weightGoal } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!weightGoal) {
      res.status(400).json({ message: 'Weight goal is required' });
      return;
    }

    // Retrieve full user profile for generating high-fidelity plans
    let userProfile: any = null;
    if (isMongoConnected) {
      userProfile = await UserModel.findById(req.user.id);
    } else {
      userProfile = localDb.findUserById(req.user.id);
    }

    if (!userProfile) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }

    // Use values provided in the request body, or default to the user profile's current values
    const finalAge = Number(age || userProfile.age);
    const finalHeight = Number(height || userProfile.height);
    const finalWeight = Number(weight || userProfile.weight);
    const finalActivityLevel = activityLevel || userProfile.activityLevel;
    const gender = userProfile.gender;
    const name = userProfile.name;

    if (!finalAge || !finalHeight || !finalWeight || !finalActivityLevel) {
      res.status(400).json({ message: 'Please provide missing age, height, weight, or activity level.' });
      return;
    }

    // Generate BMR + Macro + Gemini Plan
    const rawPlan = await generateNutritionPlan({
      name,
      age: finalAge,
      gender,
      height: finalHeight,
      weight: finalWeight,
      activityLevel: finalActivityLevel,
      weightGoal,
    });

    let savedSuggestion: any = null;

    const suggestionPayload = {
      userId: req.user.id,
      userName: name,
      age: finalAge,
      height: finalHeight,
      weight: finalWeight,
      bmi: rawPlan.bmi,
      suggestion: rawPlan.suggestion,
      foods: rawPlan.foods,
      timing: rawPlan.timing,
      walk: rawPlan.walk,
      calorieIntake: rawPlan.calorieIntake,
      carbohydrateNeeds: rawPlan.carbohydrateNeeds,
      proteinNeeds: rawPlan.proteinNeeds,
      weightGain: weightGoal, // Mapping weightGoal to weightGain column
    };

    if (isMongoConnected) {
      const newSuggestion = new SuggestionModel(suggestionPayload);
      savedSuggestion = await newSuggestion.save();
    } else {
      savedSuggestion = localDb.createSuggestion(suggestionPayload);
    }

    res.status(201).json(savedSuggestion);
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({ message: 'Server error generating or saving nutrition plan' });
  }
}

export async function getUserSuggestions(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Verify requesting user is the owner, or is an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Access Denied: You cannot view another user\'s history.' });
      return;
    }

    let suggestions: any[] = [];

    if (isMongoConnected) {
      suggestions = await SuggestionModel.find({ userId: id }).sort({ date: -1 });
    } else {
      suggestions = localDb.findSuggestionsByUserId(id).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Fetch user suggestions error:', error);
    res.status(500).json({ message: 'Server error retrieving suggestion history' });
  }
}

export async function getAllSuggestions(req: AuthRequest, res: Response): Promise<void> {
  try {
    let suggestions: any[] = [];

    if (isMongoConnected) {
      suggestions = await SuggestionModel.find({}).sort({ date: -1 });
    } else {
      suggestions = localDb.getSuggestions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Fetch all suggestions error:', error);
    res.status(500).json({ message: 'Server error fetching suggestions' });
  }
}

export async function deleteSuggestion(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    let deleted = false;

    if (isMongoConnected) {
      const suggestion = await SuggestionModel.findById(id);
      if (!suggestion) {
        res.status(404).json({ message: 'Suggestion not found' });
        return;
      }

      // Verify ownership (only owner or admin can delete)
      if (req.user?.id !== suggestion.userId && req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Access Denied: Unauthorized deletion' });
        return;
      }

      const result = await SuggestionModel.findByIdAndDelete(id);
      deleted = result !== null;
    } else {
      const suggestions = localDb.getSuggestions();
      const item = suggestions.find(s => s._id === id);
      if (!item) {
        res.status(404).json({ message: 'Suggestion not found' });
        return;
      }

      // Verify ownership
      if (req.user?.id !== item.userId && req.user?.role !== 'admin') {
        res.status(403).json({ message: 'Access Denied: Unauthorized deletion' });
        return;
      }

      const filtered = suggestions.filter(s => s._id !== id);
      localDb.saveSuggestions(filtered);
      deleted = true;
    }

    if (!deleted) {
      res.status(404).json({ message: 'Suggestion not found' });
      return;
    }

    res.json({ message: 'Suggestion deleted successfully' });
  } catch (error) {
    console.error('Delete suggestion error:', error);
    res.status(500).json({ message: 'Server error deleting suggestion' });
  }
}

export async function getSingleSuggestion(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    let suggestion: any = null;

    if (isMongoConnected) {
      suggestion = await SuggestionModel.findById(id);
    } else {
      suggestion = localDb.getSuggestions().find(s => s._id === id);
    }

    if (!suggestion) {
      res.status(404).json({ message: 'Suggestion plan not found' });
      return;
    }

    // Verify ownership (only owner or admin can retrieve)
    if (req.user?.id !== suggestion.userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Access Denied: Unauthorized to view this plan' });
      return;
    }

    res.json(suggestion);
  } catch (error) {
    console.error('Fetch single suggestion error:', error);
    res.status(500).json({ message: 'Server error fetching suggestion details' });
  }
}

