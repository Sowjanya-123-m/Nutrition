export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  role: 'user' | 'admin';
}

export interface Suggestion {
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

export interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUserInContext: (updatedUser: User) => void;
  isLoading: boolean;
}
