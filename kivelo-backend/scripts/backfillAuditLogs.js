import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import AuditLog from '../models/AuditLog.js';

/*
  Backfill legacy AuditLog documents so they conform to the canonical schema:
  - Set actor.id/model/ip when only userId existed
  - Set target.id/model when only targetUserId existed
  - Set timestamp from createdAt if missing
  - Move description/details into metadata; place ipAddress into actor.ip; userAgent into request
  - Optionally unset legacy fields userId/targetUserId

  Usage:
    DRY_RUN=true node kivelo-backend/scripts/backfillAuditLogs.js
    node kivelo-backend/scripts/backfillAuditLogs.js
*/

const DRY_RUN = /^true$/i.test(process.env.DRY_RUN || 'false');
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500', 10);

function decideActorModel(doc) {
  // Heuristic: if both userId and targetUserId exist, this came from admin action → Admin actor
  // Else if only userId exists, assume User; adjust as needed for your dataset
  if (doc.userId && doc.targetUserId) return 'Admin';
  return 'User';
}

async function buildUpdate(doc) {
  const set = {};
  const unset = {};

  // Ensure timestamp
  if (!doc.timestamp) {
    set.timestamp = doc.createdAt ? new Date(doc.createdAt) : new Date();
  }

  // Actor
  if (!doc.actor || !doc.actor.id) {
    if (doc.userId) {
      set['actor'] = {
        ...(doc.actor || {}),
        id: doc.userId,
        model: doc.actor?.model || decideActorModel(doc),
        ip: doc.ipAddress || doc.actor?.ip || undefined,
      };
    } else if (doc.ipAddress && doc.actor && !doc.actor.ip) {
      set['actor'] = { ...doc.actor, ip: doc.ipAddress };
    }
  } else if (doc.ipAddress && !doc.actor.ip) {
    set['actor'] = { ...doc.actor, ip: doc.ipAddress };
  }

  // Target
  if (!doc.target || !doc.target.id) {
    if (doc.targetUserId) {
      set['target'] = {
        ...(doc.target || {}),
        id: doc.targetUserId,
        model: doc.target?.model || 'User',
      };
    }
  }

  // Request / userAgent
  if (doc.userAgent) {
    set['request'] = {
      ...(doc.request || {}),
      userAgent: doc.userAgent,
      method: doc.request?.method || doc.method || undefined,
      path: doc.request?.path || doc.path || undefined,
    };
  }

  // Description / details → metadata
  if (doc.description || doc.details) {
    set['metadata'] = {
      ...(doc.metadata || {}),
      ...(doc.details ? { details: doc.details } : {}),
      ...(doc.description ? { description: doc.description } : {}),
    };
  }

  // Clean up legacy fields after migration
  if (doc.userId) unset['userId'] = '';
  if (doc.targetUserId) unset['targetUserId'] = '';
  if (doc.ipAddress) unset['ipAddress'] = '';
  if (doc.userAgent) unset['userAgent'] = '';
  if (doc.method) unset['method'] = '';
  if (doc.path) unset['path'] = '';
  if (doc.description) unset['description'] = '';
  if (doc.details) unset['details'] = '';

  const update = {};
  if (Object.keys(set).length) update['$set'] = set;
  if (Object.keys(unset).length) update['$unset'] = unset;
  return update;
}

async function run() {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Identify legacy/misaligned docs:
    // - Missing actor.id or target.id or timestamp
    // - AND have legacy fields indicating mapping is possible (userId/targetUserId or other legacy fields)
    const query = {
      $and: [
        { $or: [ { 'actor.id': { $exists: false } }, { 'target.id': { $exists: false } }, { timestamp: { $exists: false } } ] },
        { $or: [ { userId: { $exists: true } }, { targetUserId: { $exists: true } }, { ipAddress: { $exists: true } }, { userAgent: { $exists: true } }, { description: { $exists: true } }, { details: { $exists: true } } ] }
      ]
    };

    const totalToProcess = await AuditLog.countDocuments(query);
    console.log(`Found ${totalToProcess} audit logs to backfill`);

    if (totalToProcess === 0) {
      console.log('Nothing to backfill. Exiting.');
      await mongoose.connection.close();
      process.exit(0);
    }

    const cursor = AuditLog.find(query)
      .select('_id actor target timestamp createdAt userId targetUserId ipAddress userAgent description details request method path metadata')
      .lean()
      .cursor();

    let processed = 0;
    let updated = 0;
    let batch = [];

    for await (const doc of cursor) {
      processed += 1;
      const update = await buildUpdate(doc);
      if (Object.keys(update).length) {
        batch.push({ updateOne: { filter: { _id: doc._id }, update } });
      }

      if (batch.length >= BATCH_SIZE) {
        if (DRY_RUN) {
          console.log(`[DRY_RUN] Would apply ${batch.length} updates (processed ${processed}/${totalToProcess})`);
        } else {
          const res = await AuditLog.bulkWrite(batch, { ordered: false });
          updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
          console.log(`Applied ${batch.length} updates (processed ${processed}/${totalToProcess})`);
        }
        batch = [];
      }
    }

    if (batch.length) {
      if (DRY_RUN) {
        console.log(`[DRY_RUN] Would apply final ${batch.length} updates`);
      } else {
        const res = await AuditLog.bulkWrite(batch, { ordered: false });
        updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
        console.log(`Applied final ${batch.length} updates`);
      }
    }

    console.log(`Backfill complete. Processed: ${processed}, Updated: ${updated}${DRY_RUN ? ' (dry-run)' : ''}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await mongoose.connection.close(); } catch {}
    process.exit(1);
  }
}

run();
