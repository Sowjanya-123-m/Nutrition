import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global Firebase state
let db: any = null;
let isFirestoreAvailable = false;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firestore from config file
try {
  const fbConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbConfigPath)) {
    const configContent = fs.readFileSync(fbConfigPath, 'utf-8');
    const firebaseConfig = JSON.parse(configContent);
    
    if (firebaseConfig && firebaseConfig.projectId) {
      console.log('🔥 Initializing Firebase Client SDK with project ID:', firebaseConfig.projectId);
      const app = initializeApp(firebaseConfig);
      // The app will break or use default database if we don't specify databaseId when using multi-database
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId || undefined);
      isFirestoreAvailable = true;
      console.log('✅ Firebase Firestore client initialized and connected.');
    } else {
      console.warn('⚠️ firebase-applet-config.json exists but is empty or missing projectId.');
    }
  } else {
    console.warn('⚠️ firebase-applet-config.json not found at:', fbConfigPath);
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Firestore client:', e);
}

export const firebaseDb = {
  isAvailable(): boolean {
    return isFirestoreAvailable && db !== null;
  },

  // --- USERS ---
  async getUsers(): Promise<any[]> {
    if (!this.isAvailable()) return [];
    const pathName = 'users';
    try {
      const q = query(collection(db, pathName));
      const snapshot = await getDocs(q);
      const users: any[] = [];
      snapshot.forEach(doc => {
        users.push({ _id: doc.id, ...(doc.data() as any) });
      });
      return users;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathName);
      return [];
    }
  },

  async createUser(userId: string, data: any): Promise<any> {
    if (!this.isAvailable()) throw new Error('Firestore not initialized');
    const pathName = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      const payload = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString()
      };
      await setDoc(docRef, payload);
      return { _id: userId, ...payload };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathName);
    }
  },

  async getUser(userId: string): Promise<any | null> {
    if (!this.isAvailable()) return null;
    const pathName = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { _id: userId, ...(docSnap.data() as any) };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, pathName);
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<any | null> {
    if (!this.isAvailable()) return null;
    const pathName = 'users';
    try {
      const q = query(collection(db, pathName), where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firstDoc = snapshot.docs[0];
        return { _id: firstDoc.id, ...(firstDoc.data() as any) };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, pathName);
      return null;
    }
  },

  async updateUser(userId: string, updates: any): Promise<any | null> {
    if (!this.isAvailable()) return null;
    const pathName = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, updates);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { _id: userId, ...(docSnap.data() as any) };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, pathName);
      return null;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const pathName = `users/${userId}`;
    try {
      const docRef = doc(db, 'users', userId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathName);
      return false;
    }
  },

  // --- MEALS ---
  async getMeals(userId?: string): Promise<any[]> {
    if (!this.isAvailable()) return [];
    const pathName = 'meals';
    try {
      let q;
      if (userId) {
        q = query(collection(db, pathName), where('userId', '==', userId));
      } else {
        q = query(collection(db, pathName));
      }
      const snapshot = await getDocs(q);
      const meals: any[] = [];
      snapshot.forEach(doc => {
        meals.push({ _id: doc.id, ...(doc.data() as any) });
      });
      return meals;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathName);
      return [];
    }
  },

  async createMeal(mealId: string, data: any): Promise<any> {
    if (!this.isAvailable()) throw new Error('Firestore not initialized');
    const pathName = `meals/${mealId}`;
    try {
      const docRef = doc(db, 'meals', mealId);
      await setDoc(docRef, data);
      return { _id: mealId, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathName);
    }
  },

  async deleteMeal(mealId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const pathName = `meals/${mealId}`;
    try {
      const docRef = doc(db, 'meals', mealId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathName);
      return false;
    }
  },

  // --- SUGGESTIONS ---
  async getSuggestions(userId?: string): Promise<any[]> {
    if (!this.isAvailable()) return [];
    const pathName = 'suggestions';
    try {
      let q;
      if (userId) {
        q = query(collection(db, pathName), where('userId', '==', userId));
      } else {
        q = query(collection(db, pathName));
      }
      const snapshot = await getDocs(q);
      const suggestions: any[] = [];
      snapshot.forEach(doc => {
        suggestions.push({ _id: doc.id, ...(doc.data() as any) });
      });
      return suggestions;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathName);
      return [];
    }
  },

  async createSuggestion(suggestionId: string, data: any): Promise<any> {
    if (!this.isAvailable()) throw new Error('Firestore not initialized');
    const pathName = `suggestions/${suggestionId}`;
    try {
      const docRef = doc(db, 'suggestions', suggestionId);
      await setDoc(docRef, data);
      return { _id: suggestionId, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathName);
    }
  },

  async deleteSuggestion(suggestionId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    const pathName = `suggestions/${suggestionId}`;
    try {
      const docRef = doc(db, 'suggestions', suggestionId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathName);
      return false;
    }
  }
};
