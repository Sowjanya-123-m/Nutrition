import mongoose, { Schema, Document, Model } from 'mongoose';
import { localDb } from '../db/localDb';
import { firebaseDb } from '../db/firebaseDb';

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

class MockMealModelClass {
  _id: any;
  userId: string = '';
  mealName: string = '';
  description: string = '';
  calories: number = 0;
  protein: number = 0;
  carbs: number = 0;
  fat: number = 0;
  date: Date = new Date();

  constructor(data: any) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = 'meal_' + Math.random().toString(36).substr(2, 9);
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
      mealName: this.mealName,
      description: this.description,
      calories: Number(this.calories),
      protein: Number(this.protein || 0),
      carbs: Number(this.carbs || 0),
      fat: Number(this.fat || 0),
      date: (this.date || new Date()).toISOString(),
    };

    if (firebaseDb.isAvailable()) {
      const meals = await firebaseDb.getMeals(this.userId);
      const existing = meals.find(m => 
        String(m.userId) === String(this.userId) && 
        m.mealName === this.mealName && 
        m.description === this.description
      );
      if (existing) {
        return wrapId(existing);
      }
      const saved = await firebaseDb.createMeal(String(this._id.valueOf()), rawData);
      return wrapId(saved);
    } else {
      const meals = localDb.getMeals();
      const existing = meals.find(m => 
        String(m.userId) === String(this.userId) && 
        m.mealName === this.mealName && 
        m.description === this.description
      );
      if (existing) {
        return wrapId(existing);
      }
      const saved = localDb.createMeal(rawData);
      return wrapId(saved);
    }
  }

  static findOne(query: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const userId = query?.userId ? String(query.userId) : undefined;
        const meals = await firebaseDb.getMeals(userId);
        let found = meals.find(m => {
          if (query?._id && String(m._id) !== String(query._id)) return false;
          if (query?.userId && String(m.userId) !== String(query.userId)) return false;
          if (query?.mealName && m.mealName !== query.mealName) return false;
          return true;
        });
        return found || null;
      } else {
        const meals = localDb.getMeals();
        let found = meals.find(m => {
          if (query?._id && String(m._id) !== String(query._id)) return false;
          if (query?.userId && String(m.userId) !== String(query.userId)) return false;
          if (query?.mealName && m.mealName !== query.mealName) return false;
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
        return await firebaseDb.getMeals(userId);
      } else {
        let meals = localDb.getMeals();
        if (query?.userId) {
          meals = meals.filter(m => String(m.userId) === String(query.userId));
        }
        return meals;
      }
    })();
    return new MockQuery(promise.then(meals => meals.map(wrapId)));
  }

  static deleteOne(query: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const userId = query?.userId ? String(query.userId) : undefined;
        const meals = await firebaseDb.getMeals(userId);
        const found = meals.find(m => {
          if (query?._id && String(m._id) !== String(query?._id)) return false;
          if (query?.userId && String(m.userId) !== String(query?.userId)) return false;
          return true;
        });
        if (found) {
          await firebaseDb.deleteMeal(String(found._id));
        }
        return found || null;
      } else {
        const meals = localDb.getMeals();
        const index = meals.findIndex(m => {
          if (query?._id && String(m._id) !== String(query._id)) return false;
          if (query?.userId && String(m.userId) !== String(query.userId)) return false;
          return true;
        });
        if (index !== -1) {
          const removed = meals.splice(index, 1)[0];
          localDb.saveMeals(meals);
          return removed;
        }
        return null;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }
}

const RealMealModel: Model<IMeal> = (mongoose.models.Meal as Model<IMeal>) || mongoose.model<IMeal>('Meal', MealSchema);

export const MealModel: Model<IMeal> = process.env.MONGODB_URI 
  ? RealMealModel 
  : (MockMealModelClass as any);

