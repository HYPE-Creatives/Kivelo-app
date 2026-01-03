import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing.');
  process.exit(1);
}

async function fixAuditLogs() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Find legacy logs with timestamp but missing createdAt
    const cursor = AuditLog.collection.find({
      createdAt: { $exists: false },
      timestamp: { $exists: true }
    });

    let fixedCount = 0;

    while (await cursor.hasNext()) {
      const log = await cursor.next();

      await AuditLog.collection.updateOne(
        { _id: log._id },
        {
          $set: {
            createdAt: log.timestamp,
            updatedAt: log.timestamp
          },
          $unset: {
            timestamp: ''
          }
        }
      );

      fixedCount++;
    }

    console.log(`✅ Fixed ${fixedCount} audit logs`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Audit log fix failed:', error);
    process.exit(1);
  }
}

fixAuditLogs();
