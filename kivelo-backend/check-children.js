import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Child from './models/Child.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  
  // Check User model for children
  const childUsers = await User.find({ role: 'child' }).select('name email points streakCount moodStats');
  
  console.log('\n=== Child Users with points/streak ===\n');
  childUsers.forEach(u => {
    console.log('Name:', u.name);
    console.log('  Points:', u.points);
    console.log('  StreakCount:', u.streakCount);
    console.log('  MoodStats:', JSON.stringify(u.moodStats));
    console.log('');
  });
  
  console.log('\n=== Child Users with points/streak ===\n');
  childUsers.forEach(u => {
    console.log('Name:', u.name);
    console.log('  Points:', u.points);
    console.log('  StreakCount:', u.streakCount);
    console.log('  MoodStats:', JSON.stringify(u.moodStats));
    console.log('');
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
