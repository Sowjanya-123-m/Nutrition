import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMeal extends Document {
  userId: string;
  mealName: string; // e.g. "Breakfast", "Lunch", "Dinner", "Snack"
  description: string; // details of the meal (e.g. "2 eggs, 1 toast")
  calories: number; // estimated or manual calorie count
  protein: number; // estimated or manual protein (g)
  carbs: number; // estimated or carbs (g)
  fat: number; // estimated or fat (g)
  date: Date; // date of consumption
}

const MealSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    mealName: { type: String, required: true },
    description: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MealModel: Model<IMeal> = (mongoose.models.Meal as Model<IMeal>) || mongoose.model<IMeal>('Meal', MealSchema);
