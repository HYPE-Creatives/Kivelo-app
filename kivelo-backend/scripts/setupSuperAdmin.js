import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const setupSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      console.log(`Email: ${existingSuperAdmin.email}`);
      process.exit(0);
    }
    // Create super admin if not exists 
    const superAdmin = await Admin.create({
      email: 'superadmin@Kivelo.com',
      password: 'Admin123!', // More secure default
      name: 'Super Administrator',
      role: 'super_admin',
      permissions: {
        users: true,
        parents: true,
        children: true,
        activities: true,
        analytics: true,
        settings: true
      }
    });

    console.log('✅ Super admin created successfully!');
    console.log('Email: superadmin@Kivelo.com');
    console.log('Password: Admin123!');
    console.log('⚠️  IMPORTANT: Change the password immediately after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

setupSuperAdmin();


// I created the super admin account successfully by running this script.
// I removed duplicate index definitions from the models to avoid redundancy and potential conflicts.
// Now the models rely on Mongoose to create indexes based on schema definitions.
// Remember to run this script only once to avoid duplicate super admin accounts.
// it is done by simply running the command: node scripts/setupSuperAdmin.js