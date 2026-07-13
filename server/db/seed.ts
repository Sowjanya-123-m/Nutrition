import bcrypt from 'bcryptjs';
import { isMongoConnected } from './config';
import { UserModel } from '../models/User';
import { localDb } from './localDb';

export async function seedDatabase(): Promise<void> {
  try {
    const defaultUserEmail = 'user@example.com';
    const defaultAdminEmail = 'admin@nutrition.com';
    const sowjanyaEmail = 'mulamurisowjanya31@gmail.com';

    const userHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);
    const sowjanyaHash = await bcrypt.hash('sowjanya123', 10);

    // 1. Seed Local Database fallback
    const localUsers = localDb.getUsers();
    
    let hasLocalUser = localUsers.some(u => u.email.toLowerCase() === defaultUserEmail);
    if (!hasLocalUser) {
      console.log('🌱 Seeding default demo user into local JSON database...');
      localDb.createUser({
        name: 'Demo User',
        email: defaultUserEmail,
        passwordHash: userHash,
        age: 28,
        gender: 'Male',
        height: 178,
        weight: 74,
        activityLevel: 'Moderately Active',
        role: 'user',
      });
    }

    let hasLocalAdmin = localUsers.some(u => u.email.toLowerCase() === defaultAdminEmail);
    if (!hasLocalAdmin) {
      console.log('🌱 Seeding default demo admin into local JSON database...');
      localDb.createUser({
        name: 'Clinical Admin',
        email: defaultAdminEmail,
        passwordHash: adminHash,
        age: 35,
        gender: 'Female',
        height: 165,
        weight: 58,
        activityLevel: 'Moderately Active',
        role: 'admin',
      });
    }

    let hasLocalSowjanya = localUsers.some(u => u.email.toLowerCase() === sowjanyaEmail);
    if (!hasLocalSowjanya) {
      console.log('🌱 Seeding sowjanya admin into local JSON database...');
      localDb.createUser({
        name: 'Sowjanya Mulamuri',
        email: sowjanyaEmail,
        passwordHash: sowjanyaHash,
        age: 26,
        gender: 'Female',
        height: 164,
        weight: 62,
        activityLevel: 'Moderately Active',
        role: 'admin',
      });
    }

    // 2. Seed MongoDB if connected
    if (isMongoConnected) {
      const mongoUserExists = await UserModel.findOne({ email: defaultUserEmail });
      if (!mongoUserExists) {
        console.log('🌱 Seeding default demo user into MongoDB...');
        const newUser = new UserModel({
          name: 'Demo User',
          email: defaultUserEmail,
          passwordHash: userHash,
          age: 28,
          gender: 'Male',
          height: 178,
          weight: 74,
          activityLevel: 'Moderately Active',
          role: 'user',
        });
        await newUser.save();
      }

      const mongoAdminExists = await UserModel.findOne({ email: defaultAdminEmail });
      if (!mongoAdminExists) {
        console.log('🌱 Seeding default demo admin into MongoDB...');
        const newAdmin = new UserModel({
          name: 'Clinical Admin',
          email: defaultAdminEmail,
          passwordHash: adminHash,
          age: 35,
          gender: 'Female',
          height: 165,
          weight: 58,
          activityLevel: 'Moderately Active',
          role: 'admin',
        });
        await newAdmin.save();
      }

      const mongoSowjanyaExists = await UserModel.findOne({ email: sowjanyaEmail });
      if (!mongoSowjanyaExists) {
        console.log('🌱 Seeding sowjanya admin into MongoDB...');
        const newSowjanya = new UserModel({
          name: 'Sowjanya Mulamuri',
          email: sowjanyaEmail,
          passwordHash: sowjanyaHash,
          age: 26,
          gender: 'Female',
          height: 164,
          weight: 62,
          activityLevel: 'Moderately Active',
          role: 'admin',
        });
        await newSowjanya.save();
      }
    }
    console.log('✅ Database initialization and seeding complete.');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
  }
}
