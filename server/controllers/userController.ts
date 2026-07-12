import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isMongoConnected } from '../db/config';
import { UserModel } from '../models/User';
import { SuggestionModel } from '../models/Suggestion';
import { MealModel } from '../models/Meal';
import { localDb } from '../db/localDb';
import { AuthRequest } from '../middlewares/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'nutrition_assistant_super_secret_key';

// Helper to sign JWT
const generateToken = (id: string, email: string, role: 'user' | 'admin') => {
  return jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '30d' });
};

export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password, age, gender, height, weight, activityLevel, role } = req.body;

  try {
    if (!name || !email || !password || !age || !gender || !height || !weight || !activityLevel) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Determine role - automatically make anyone with 'admin' in email or explicit 'admin' role an admin
    let userRole: 'user' | 'admin' = 'user';
    if (role === 'admin' || email.toLowerCase().includes('admin') || email.toLowerCase() === 'mulamurisowjanya31@gmail.com') {
      userRole = 'admin';
    }

    // Ensure we check for duplicate email across BOTH databases to prevent conflicts
    let existingUser: any = null;
    try {
      if (isMongoConnected) {
        existingUser = await UserModel.findOne({ email });
      }
    } catch (e) {
      console.warn('MongoDB duplicate email check failed:', e);
    }
    if (!existingUser) {
      existingUser = localDb.findUserByEmail(email);
    }

    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    // Always create local user first as a persistent local fallback backup
    const localSavedUser = localDb.createUser({
      name,
      email,
      passwordHash,
      age: Number(age),
      gender,
      height: Number(height),
      weight: Number(weight),
      activityLevel,
      role: userRole,
    });

    let savedUser: any = localSavedUser;
    let userIdStr = localSavedUser._id;

    if (isMongoConnected) {
      try {
        const newUser = new UserModel({
          name,
          email,
          passwordHash,
          age: Number(age),
          gender,
          height: Number(height),
          weight: Number(weight),
          activityLevel,
          role: userRole,
        });

        const savedMongoUser = await newUser.save();
        savedUser = savedMongoUser;
        userIdStr = savedMongoUser._id.toString();
      } catch (mongoError) {
        console.error('Failed to save to MongoDB, continuing with local backup:', mongoError);
      }
    }

    const token = generateToken(userIdStr, savedUser.email, savedUser.role);

    res.status(201).json({
      token,
      user: {
        id: userIdStr,
        name: savedUser.name,
        email: savedUser.email,
        age: savedUser.age,
        gender: savedUser.gender,
        height: savedUser.height,
        weight: savedUser.weight,
        activityLevel: savedUser.activityLevel,
        role: savedUser.role,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    let user: any = null;
    let foundInMongo = false;

    if (isMongoConnected) {
      try {
        user = await UserModel.findOne({ email });
        if (user) {
          foundInMongo = true;
        } else {
          // Check local fallback
          user = localDb.findUserByEmail(email);
        }
      } catch (err) {
        console.warn('MongoDB lookup failed, searching local fallback:', err);
        user = localDb.findUserByEmail(email);
      }
    } else {
      user = localDb.findUserByEmail(email);
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // On-the-fly replication: If MongoDB is connected and user only exists in localDb, save to MongoDB
    if (isMongoConnected && !foundInMongo) {
      try {
        const newMongoUser = new UserModel({
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          age: Number(user.age),
          gender: user.gender,
          height: Number(user.height),
          weight: Number(user.weight),
          activityLevel: user.activityLevel,
          role: user.role,
        });
        const savedMongoUser = await newMongoUser.save();
        user = savedMongoUser;
        foundInMongo = true;
      } catch (replicateError) {
        console.warn('On-the-fly replication to MongoDB failed:', replicateError);
      }
    }

    // On-the-fly replication: If user exists in Mongo but not in localDb, save to localDb
    if (foundInMongo) {
      try {
        const localUserExists = localDb.findUserByEmail(user.email);
        if (!localUserExists) {
          localDb.createUser({
            name: user.name,
            email: user.email,
            passwordHash: user.passwordHash,
            age: Number(user.age),
            gender: user.gender,
            height: Number(user.height),
            weight: Number(user.weight),
            activityLevel: user.activityLevel,
            role: user.role,
          });
        }
      } catch (localReplicateError) {
        console.warn('On-the-fly replication to local DB failed:', localReplicateError);
      }
    }

    const userIdStr = foundInMongo ? user._id.toString() : user._id;
    const token = generateToken(userIdStr, user.email, user.role);

    res.json({
      token,
      user: {
        id: userIdStr,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}

export async function getUserProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let user: any = null;

    if (isMongoConnected) {
      try {
        user = await UserModel.findById(req.user.id);
        if (!user && req.user.email) {
          user = await UserModel.findOne({ email: req.user.email });
        }
      } catch (err) {
        console.warn('MongoDB profile fetch failed, using local backup:', err);
      }
      if (!user && req.user.email) {
        user = localDb.findUserByEmail(req.user.email);
      }
    } else {
      user = localDb.findUserById(req.user.id);
      if (!user && req.user.email) {
        user = localDb.findUserByEmail(req.user.email);
      }
    }

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userIdStr = isMongoConnected ? user._id.toString() : user._id;
    res.json({
      id: userIdStr,
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      role: user.role,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
}

export async function updateUserProfile(req: AuthRequest, res: Response): Promise<void> {
  const { name, age, gender, height, weight, activityLevel } = req.body;

  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const updates = {
      name,
      age: age ? Number(age) : undefined,
      gender,
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      activityLevel,
    };

    // Filter undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    let updatedUser: any = null;

    if (isMongoConnected) {
      try {
        updatedUser = await UserModel.findByIdAndUpdate(
          req.user.id,
          { $set: cleanUpdates },
          { new: true }
        );
        if (!updatedUser && req.user.email) {
          const fallbackUser = await UserModel.findOne({ email: req.user.email });
          if (fallbackUser) {
            updatedUser = await UserModel.findByIdAndUpdate(
              fallbackUser._id,
              { $set: cleanUpdates },
              { new: true }
            );
          }
        }
      } catch (err) {
        console.warn('MongoDB profile update failed, using local backup:', err);
      }

      // Also sync profile updates to localDb for consistency
      if (req.user.email) {
        try {
          const localUser = localDb.findUserByEmail(req.user.email);
          if (localUser) {
            const localUpdate = localDb.updateUser(localUser._id, cleanUpdates);
            if (!updatedUser) {
              updatedUser = localUpdate;
            }
          }
        } catch (localErr) {
          console.warn('Local DB profile sync update failed:', localErr);
        }
      }
    } else {
      updatedUser = localDb.updateUser(req.user.id, cleanUpdates);
      if (!updatedUser && req.user.email) {
        const localUser = localDb.findUserByEmail(req.user.email);
        if (localUser) {
          updatedUser = localDb.updateUser(localUser._id, cleanUpdates);
        }
      }
    }

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const userIdStr = isMongoConnected ? updatedUser._id.toString() : updatedUser._id;
    res.json({
      id: userIdStr,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      gender: updatedUser.gender,
      height: updatedUser.height,
      weight: updatedUser.weight,
      activityLevel: updatedUser.activityLevel,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
}

// --- ADMIN CONTROLLERS ---

export async function getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    let users: any[] = [];

    if (isMongoConnected) {
      const dbUsers = await UserModel.find({}, '-passwordHash');
      users = dbUsers.map(u => {
        const doc = u.toObject();
        return {
          id: doc._id.toString(),
          _id: doc._id.toString(),
          ...doc,
        };
      });
    } else {
      users = localDb.getUsers().map(({ passwordHash, ...rest }) => ({
        id: rest._id,
        _id: rest._id,
        ...rest,
      }));
    }

    res.json(users);
  } catch (error) {
    console.error('Fetch all users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    let deleted = false;

    if (isMongoConnected) {
      const result = await UserModel.findByIdAndDelete(id);
      deleted = result !== null;
    } else {
      const users = localDb.getUsers();
      const filtered = users.filter(u => u._id !== id);
      if (filtered.length !== users.length) {
        localDb.saveUsers(filtered);
        deleted = true;
      }
    }

    if (!deleted) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
}

export async function syncLocalToMongo(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!isMongoConnected) {
      res.status(400).json({
        success: false,
        message: 'MongoDB is not connected. Database sync is only possible when a live MongoDB Atlas instance is connected.'
      });
      return;
    }

    const localUsers = localDb.getUsers();
    const localSuggestions = localDb.getSuggestions();
    const localMeals = localDb.getMeals();

    let usersSynced = 0;
    let suggestionsSynced = 0;
    let mealsSynced = 0;
    const idMap: Record<string, string> = {};

    // 1. Sync Users
    for (const user of localUsers) {
      let dbUser = await UserModel.findOne({ email: user.email });
      if (!dbUser) {
        const newUser = new UserModel({
          name: user.name,
          email: user.email,
          passwordHash: user.passwordHash,
          age: user.age,
          gender: user.gender,
          height: user.height,
          weight: user.weight,
          activityLevel: user.activityLevel,
          role: user.role,
          createdAt: new Date(user.createdAt),
        });
        dbUser = await newUser.save();
        usersSynced++;
      }
      idMap[user._id] = dbUser._id.toString();
    }

    // 2. Sync Suggestions
    for (const sug of localSuggestions) {
      const targetUserId = idMap[sug.userId] || sug.userId;
      
      const existingSug = await SuggestionModel.findOne({
        userId: targetUserId,
        calorieIntake: sug.calorieIntake,
        date: new Date(sug.date),
      });

      if (!existingSug) {
        const newSug = new SuggestionModel({
          userId: targetUserId,
          userName: sug.userName,
          age: sug.age,
          height: sug.height,
          weight: sug.weight,
          bmi: sug.bmi,
          suggestion: sug.suggestion,
          foods: sug.foods,
          timing: sug.timing,
          walk: sug.walk,
          calorieIntake: sug.calorieIntake,
          carbohydrateNeeds: sug.carbohydrateNeeds,
          proteinNeeds: sug.proteinNeeds,
          weightGain: sug.weightGain,
          date: new Date(sug.date),
        });
        await newSug.save();
        suggestionsSynced++;
      }
    }

    // 3. Sync Meals
    for (const meal of localMeals) {
      const targetUserId = idMap[meal.userId] || meal.userId;

      const existingMeal = await MealModel.findOne({
        userId: targetUserId,
        mealName: meal.mealName,
        description: meal.description,
        date: new Date(meal.date),
      });

      if (!existingMeal) {
        const newMeal = new MealModel({
          userId: targetUserId,
          mealName: meal.mealName,
          description: meal.description,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          date: new Date(meal.date),
        });
        await newMeal.save();
        mealsSynced++;
      }
    }

    res.json({
      success: true,
      message: 'Database synchronization completed successfully.',
      summary: {
        totalLocalUsers: localUsers.length,
        totalLocalSuggestions: localSuggestions.length,
        totalLocalMeals: localMeals.length,
        usersSynced,
        suggestionsSynced,
        mealsSynced,
      }
    });
  } catch (error) {
    console.error('Database Sync Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during database synchronization.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
