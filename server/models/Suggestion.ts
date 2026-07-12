import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISuggestion extends Document {
  userId: string; // References User
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
  date: Date;
}

const SuggestionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true }, // We support both MongoDB ObjectId and Mock string IDs
    userName: { type: String, required: true },
    age: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    bmi: { type: Number, required: true },
    suggestion: { type: String, required: true },
    foods: [{ type: String }],
    timing: { type: String, required: true },
    walk: { type: String, required: true },
    calorieIntake: { type: Number, required: true },
    carbohydrateNeeds: { type: Number, required: true },
    proteinNeeds: { type: Number, required: true },
    weightGain: {
      type: String,
      enum: ['Weight Loss', 'Maintain Weight', 'Weight Gain'],
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SuggestionModel: Model<ISuggestion> = (mongoose.models.Suggestion as Model<ISuggestion>) || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);
