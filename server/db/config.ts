import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export let isMongoConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables. Falling back to high-fidelity local JSON database store.');
    isMongoConnected = false;
    return;
  }

  try {
    // Attempt connection with a 5-second timeout to avoid hanging the server startup
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully via Mongoose.');
  } catch (error) {
    console.error('❌ MongoDB Connection failed:', error instanceof Error ? error.message : error);
    console.warn('⚠️ Falling back to local JSON database store for session stability.');
    isMongoConnected = false;
  }
}
