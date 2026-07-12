import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');
const MEALS_FILE = path.join(DATA_DIR, 'meals.json');

// Types definitions matching database models
export interface LocalMeal {
  _id: string;
  userId: string;
  mealName: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

export interface LocalUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  role: 'user' | 'admin';
  createdAt: string;
}

export interface LocalSuggestion {
  _id: string;
  userId: string;
  userName: string;
  age: number;
  height: number;
  weight: number;
  bmi: number;
  suggestion: string;
  foods: string[];
  timing: string;
  walk: string;
  calorieIntake: number;
  carbohydrateNeeds: number;
  proteinNeeds: number;
  weightGain: 'Weight Loss' | 'Maintain Weight' | 'Weight Gain';
  date: string;
}

// Initializers
function readJSONFile<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJSONFile<T>(filePath: string, data: T[]) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export const localDb = {
  // --- USERS TABLE ---
  getUsers(): LocalUser[] {
    return readJSONFile<LocalUser>(USERS_FILE);
  },

  saveUsers(users: LocalUser[]) {
    writeJSONFile<LocalUser>(USERS_FILE, users);
  },

  createUser(userData: Omit<LocalUser, '_id' | 'createdAt'>): LocalUser {
    const users = this.getUsers();
    const newUser: LocalUser = {
      ...userData,
      _id: 'user_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },

  findUserByEmail(email: string): LocalUser | undefined {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id: string): LocalUser | undefined {
    const users = this.getUsers();
    return users.find(u => u._id === id);
  },

  updateUser(id: string, updates: Partial<Omit<LocalUser, '_id' | 'email' | 'passwordHash' | 'role' | 'createdAt'>>): LocalUser | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updates,
    };
    this.saveUsers(users);
    return users[index];
  },

  // --- SUGGESTIONS TABLE ---
  getSuggestions(): LocalSuggestion[] {
    return readJSONFile<LocalSuggestion>(SUGGESTIONS_FILE);
  },

  saveSuggestions(suggestions: LocalSuggestion[]) {
    writeJSONFile<LocalSuggestion>(SUGGESTIONS_FILE, suggestions);
  },

  createSuggestion(suggestionData: Omit<LocalSuggestion, '_id' | 'date'>): LocalSuggestion {
    const suggestions = this.getSuggestions();
    const newSuggestion: LocalSuggestion = {
      ...suggestionData,
      _id: 'sug_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    suggestions.push(newSuggestion);
    this.saveSuggestions(suggestions);
    return newSuggestion;
  },

  findSuggestionsByUserId(userId: string): LocalSuggestion[] {
    const suggestions = this.getSuggestions();
    return suggestions.filter(s => s.userId === userId);
  },

  deleteSuggestion(id: string): boolean {
    const suggestions = this.getSuggestions();
    const filtered = suggestions.filter(s => s._id !== id);
    if (filtered.length === suggestions.length) return false;
    this.saveSuggestions(filtered);
    return true;
  },

  // --- MEALS TABLE ---
  getMeals(): LocalMeal[] {
    return readJSONFile<LocalMeal>(MEALS_FILE);
  },

  saveMeals(meals: LocalMeal[]) {
    writeJSONFile<LocalMeal>(MEALS_FILE, meals);
  },

  createMeal(mealData: Omit<LocalMeal, '_id'>): LocalMeal {
    const meals = this.getMeals();
    const newMeal: LocalMeal = {
      ...mealData,
      _id: 'meal_' + Math.random().toString(36).substr(2, 9),
    };
    meals.push(newMeal);
    this.saveMeals(meals);
    return newMeal;
  },

  findMealsByUserId(userId: string): LocalMeal[] {
    const meals = this.getMeals();
    return meals.filter(m => m.userId === userId);
  },

  deleteMeal(id: string): boolean {
    const meals = this.getMeals();
    const filtered = meals.filter(m => m._id !== id);
    if (filtered.length === meals.length) return false;
    this.saveMeals(filtered);
    return true;
  }
};
