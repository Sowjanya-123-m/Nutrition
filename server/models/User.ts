import mongoose, { Schema, Document, Model } from 'mongoose';
import { localDb } from '../db/localDb';
import { firebaseDb } from '../db/firebaseDb';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string; // Storing hashed password securely
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
    activityLevel: {
      type: String,
      enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'],
      required: true,
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
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

class MockUserModelClass {
  _id: any;
  name: string = '';
  email: string = '';
  passwordHash: string = '';
  age: number = 0;
  gender: 'Male' | 'Female' | 'Other' = 'Male';
  height: number = 0;
  weight: number = 0;
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active' = 'Sedentary';
  role: 'user' | 'admin' = 'user';
  createdAt: Date = new Date();

  constructor(data: any) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = 'user_' + Math.random().toString(36).substr(2, 9);
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
      name: this.name,
      email: this.email,
      passwordHash: this.passwordHash,
      age: Number(this.age),
      gender: this.gender,
      height: Number(this.height),
      weight: Number(this.weight),
      activityLevel: this.activityLevel,
      role: this.role,
    };

    if (firebaseDb.isAvailable()) {
      const existing = await firebaseDb.getUserByEmail(this.email);
      if (existing) {
        return wrapId(existing);
      }
      const saved = await firebaseDb.createUser(String(this._id.valueOf()), rawData);
      return wrapId(saved);
    } else {
      const existing = localDb.findUserByEmail(this.email);
      if (existing) {
        return wrapId(existing);
      }
      const saved = localDb.createUser(rawData);
      return wrapId(saved);
    }
  }

  static findOne(query: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        if (query?.email) {
          const emailToFind = typeof query.email === 'string' ? query.email.toLowerCase() : String(query.email);
          return await firebaseDb.getUserByEmail(emailToFind);
        } else if (query?._id) {
          return await firebaseDb.getUser(String(query._id));
        }
        return null;
      } else {
        const users = localDb.getUsers();
        let found: any = null;
        if (query?.email) {
          const emailToFind = typeof query.email === 'string' ? query.email.toLowerCase() : String(query.email);
          found = users.find(u => u.email.toLowerCase() === emailToFind);
        } else if (query?._id) {
          found = users.find(u => String(u._id) === String(query._id));
        }
        return found;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }

  static findById(id: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        return await firebaseDb.getUser(String(id));
      } else {
        const users = localDb.getUsers();
        return users.find(u => String(u._id) === String(id));
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }

  static find(query?: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        return await firebaseDb.getUsers();
      } else {
        return localDb.getUsers();
      }
    })();
    return new MockQuery(promise.then(users => users.map(wrapId)));
  }

  static findByIdAndUpdate(id: any, updates: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        return await firebaseDb.updateUser(String(id), updates);
      } else {
        return localDb.updateUser(String(id), updates);
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }

  static findByIdAndDelete(id: any) {
    const promise = (async () => {
      if (firebaseDb.isAvailable()) {
        const found = await firebaseDb.getUser(String(id));
        if (found) {
          await firebaseDb.deleteUser(String(id));
        }
        return found;
      } else {
        const users = localDb.getUsers();
        const index = users.findIndex(u => String(u._id) === String(id));
        if (index !== -1) {
          const removed = users.splice(index, 1)[0];
          localDb.saveUsers(users);
          return removed;
        }
        return null;
      }
    })();
    return new MockQuery(promise.then(wrapId));
  }
}

// Prevent compiling model multiple times in serverless/HMR environments and cast cleanly
const RealUserModel: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export const UserModel: Model<IUser> = process.env.MONGODB_URI 
  ? RealUserModel 
  : (MockUserModelClass as any);

