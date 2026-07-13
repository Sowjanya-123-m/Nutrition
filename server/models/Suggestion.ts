import mongoose, { Schema, Document, Model } from 'mongoose';
import { localDb } from '../db/localDb';
import { firebaseDb } from '../db/firebaseDb';

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

class MockQuery<T> {
  private promise: Promise<T>;
  constructor(promise: Promise<T>) {
    this.promise = promise;
  }
  sort() { return this; }
  select() { return this; }
  limit() { return this; }
  skip() { return this; }
  async exec() { return this.promise; }
  then(onfulfilled?: (value: T) => any, onrejected?: (reason: any) => any) {
    return this.promise.then(onfulfilled, onrejected);
  }
}

function wrapId<T extends { _id?: any }>(obj: T): any {
  if (!obj) return obj;
  const idStr = String(obj._id);
  const wrapped = { ...obj };
  wrapped._id = {
    toString: () => idStr,
    valueOf: () => idStr,
    equals: (other: any) => String(other) === idStr,
  };
  return wrapped;
}

class MockSuggestionModelClass {
  _id: any;
  userId: string = '';
  userName: string = '';
  age: number = 0;
  height: number = 0;
  weight: number = 0;
  bmi: number = 0;
  suggestion: string = '';
  foods: string[] = [];
  timing: string = '';
  walk: string = '';
  calorieIntake: number = 0;
  carbohydrateNeeds: number = 0;
  proteinNeeds: number = 0;
  weightGain: 'Weight Loss' | 'Maintain Weight' | 'Weight Gain' = 'Maintain Weight';
  date: Date = new Date();

  constructor(data: any) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = 'sug_' + Math.random().toString(36).substr(2, 9);
    }
    const idStr = String(this._id);
    this._id = {
      toString: () => idStr,
      valueOf: () => idStr,
      equals: (other: any) => String(other) === idStr,
    };
  }

  async save() {
    const rawData = {
      userId: this.userId,
      userName: this.userName,
      age: Number(this.age),
      height: Number(this.height),
      weight: Number(this.weight),
      bmi: Number(this.bmi),
      suggestion: this.suggestion,
      foods: this.foods,
      timing: this.timing,
      walk: this.walk,
      calorieIntake: Number(this.calorieIntake),
      carbohydrateNeeds: Number(this.carbohydrateNeeds),
      proteinNeeds: Number(this.proteinNeeds),
      weightGain: this.weightGain,
      date: (this.date || new Date()).toISOString()
    };

    if (firebaseDb.isAvailable()) {
      const suggestions = await firebaseDb.getSuggestions(this.userId);
      const existing = suggestions.find(s => 
        String(s.userId) === String(this.userId) && 
        Number(s.calorieIntake) === Number(this.calorieIntake)
      );
      if (existing) {
        return wrapId(existing);
      }
      const saved = await firebaseDb.createSuggestion(String(this._id.valueOf()), rawData);
      return wrapId(saved);
    } else {
      const suggestions = localDb.getSuggestions();
      const existing = suggestions.find(s => 
        String(s.userId) === String(this.userId) && 
        Number(s.calorieIntake) === Number(this.calorieIntake)
      );
      if (existing) {
        return wrapId(existing);
      }
      const saved = localDb.createSuggestion(rawData);
      return wrapId(saved);
    }
  }

  static findOne(query: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const userId = query?.userId ? String(query.userId) : undefined;
        const suggestions = await firebaseDb.getSuggestions(userId);
        let found = suggestions.find(s => {
          if (query?._id && String(s._id) !== String(query._id)) return false;
          if (query?.userId && String(s.userId) !== String(query.userId)) return false;
          if (query?.calorieIntake && Number(s.calorieIntake) !== Number(query.calorieIntake)) return false;
          return true;
        });
        return found || null;
      } else {
        const suggestions = localDb.getSuggestions();
        let found = suggestions.find(s => {
          if (query?.userId && String(s.userId) !== String(query.userId)) return false;
          if (query?.calorieIntake && Number(s.calorieIntake) !== Number(query.calorieIntake)) return false;
          return true;
        });
        return found || null;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }

  static find(query: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const userId = query?.userId ? String(query.userId) : undefined;
        return await firebaseDb.getSuggestions(userId);
      } else {
        let suggestions = localDb.getSuggestions();
        if (query?.userId) {
          suggestions = suggestions.filter(s => String(s.userId) === String(query.userId));
        }
        return suggestions;
      }
    })();
    return new MockQuery(promise.then(suggestions => suggestions.map(wrapId)));
  }

  static findById(id: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const suggestions = await firebaseDb.getSuggestions();
        return suggestions.find(s => String(s._id) === String(id)) || null;
      } else {
        const suggestions = localDb.getSuggestions();
        return suggestions.find(s => String(s._id) === String(id)) || null;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }

  static findByIdAndDelete(id: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const suggestions = await firebaseDb.getSuggestions();
        const found = suggestions.find(s => String(s._id) === String(id));
        if (found) {
          await firebaseDb.deleteSuggestion(String(id));
        }
        return found || null;
      } else {
        const suggestions = localDb.getSuggestions();
        const index = suggestions.findIndex(s => String(s._id) === String(id));
        if (index !== -1) {
          const removed = suggestions.splice(index, 1)[0];
          localDb.saveSuggestions(suggestions);
          return removed;
        }
        return null;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }
}

const RealSuggestionModel: Model<ISuggestion> = (mongoose.models.Suggestion as Model<ISuggestion>) || mongoose.model<ISuggestion>('Suggestion', SuggestionSchema);

export const SuggestionModel: Model<ISuggestion> = process.env.MONGODB_URI 
  ? RealSuggestionModel 
  : (MockSuggestionModelClass as any);

