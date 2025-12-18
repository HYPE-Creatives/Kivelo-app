// controllers/journalController.js

import Journal from '../models/JournalEntry.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import { journalSchema } from '../middleware/validators.js';
import { updateUserStreak } from '../controllers/gamificationController.js';
import Notification from '../models/Notification.js';
import { resolveChildAccess } from '../utils/resolveChildAccess.js';
import mongoose from 'mongoose';

const toObjectId = id => (mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : null);

/**
 * createJournal
 * - child (User._id) is the canonical stored field
 * - childId (Child._id) also stored for convenience
 */
export async function createJournal(req, res, next) {
  try {
    const { error, value } = journalSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    let targetChildUserId;
    let childDoc;

    // CHILD creating for themself
    if (req.user.role === 'child') {
      childDoc = await Child.findOne({ user: req.user._id });
      if (!childDoc) return res.status(404).json({ success: false, message: 'Child profile not found' });

      targetChildUserId = req.user._id; // child user id
    }
    // PARENT creating for child
    else if (req.user.role === 'parent') {
      if (!value.childId) {
        return res.status(400).json({ success: false, message: 'childId is required for parents' });
      }

      // Resolve access (accepts Child._id or User._id)
      const resolved = await resolveChildAccess(req.user._id, value.childId);
      if (!resolved) {
        return res.status(403).json({ success: false, message: 'Access denied - child not found or not yours' });
      }

      targetChildUserId = resolved.userId;
      // fetch childDoc for additional metadata (if needed)
      childDoc = await Child.findOne({ user: targetChildUserId });
    } else {
      return res.status(403).json({ success: false, message: 'Access denied - invalid role' });
    }

    // Build journal object (primary child field is user id)
    const journalData = {
      child: targetChildUserId,                  // canonical user id
      childId: childDoc?._id || null,           // child document id if available
      childName: value.childName || undefined,  // allow override if provided
      type: value.type,
      title: value.title || 'Untitled',
      content: value.content,
      assets: value.assets || [],
      visibility: value.visibility || 'parent-only',
      mood: value.mood || 'neutral',
      moodIntensity: value.moodIntensity || 5,
      tags: value.tags || [],
      isPrivate: (value.visibility || 'parent-only') === 'private',
      aiAnalysis: value.aiAnalysis || {}
    };

    const journal = await Journal.create(journalData);

    // If a child created the journal, award points & update streak
    if (req.user.role === 'child') {
      try {
        await updateUserStreak(req.user._id);
      } catch (e) {
        console.warn('Failed to update user streak:', e.message);
      }

      const pointsToAward = 15;
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsToAward } });

      // add meta for response
      journal.pointsEarned = pointsToAward;
      journal.streakUpdated = true;
    }

    // Notify parent unless private / no parent set
    if (!journal.isPrivate && childDoc?.parent) {
      try {
        const childUser = await User.findById(targetChildUserId).select('name avatar');
        const childName = childUser?.name || 'Your child';
        const childAvatar = childUser?.avatar?.url || null;

        await Notification.create({
          userId: childDoc.parent, // parent user id
          type: 'new_journal',
          title: 'New Journal Entry',
          message: `${childName} created a new journal entry: "${journal.title}"`,
          data: {
            journalId: journal._id,
            childId: childDoc.user,
            childName,
            childAvatar
          }
        });
      } catch (notifErr) {
        console.warn('Failed to create notification:', notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: journal,
      pointsEarned: req.user.role === 'child' ? 15 : 0,
      message: 'Journal entry created successfully'
    });

  } catch (err) {
    console.error('Error in createJournal:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * getChildJournals (parent views a child's journals)
 * - childId in params may be Child._id OR User._id; resolve via resolveChildAccess
 * - queries journals by journal.child (User._id)
 */
export const getChildJournals = async (req, res) => {
  try {
    const rawChildId = req.params.childId;
    const parentId = req.user._id;

    // Resolve access
    const resolved = await resolveChildAccess(parentId, rawChildId);
    if (!resolved) {
      return res.status(403).json({ success: false, message: 'Access denied - child not found or does not belong to you' });
    }

    const targetChildUserId = resolved.userId;
    const childDoc = await Child.findOne({ user: targetChildUserId });
    const childUser = await User.findById(targetChildUserId).select('name');

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const { type, visibility, dateFrom, dateTo } = req.query;
    const query = { child: targetChildUserId };

    if (type && type !== 'all') query.type = type;
    if (visibility && visibility !== 'all') query.visibility = visibility;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const [journals, total] = await Promise.all([
      Journal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Journal.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        journals,
        childInfo: {
          id: childDoc?._id || null,
          userId: targetChildUserId,
          name: childUser?.name || null
        }
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error in getChildJournals:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * getMyJournals (child only)
 * - child queries by journal.child (User._id)
 */
export const getMyJournals = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({ success: false, message: 'Access denied. Child only.' });
    }

    const childProfile = await Child.findOne({ user: req.user._id });
    if (!childProfile) return res.status(404).json({ success: false, message: 'Child profile not found' });

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const { type = 'all', visibility = 'all' } = req.query;
    const query = { child: req.user._id };

    if (type !== 'all') query.type = type;
    if (visibility !== 'all') query.visibility = visibility;

    const [journals, total, typeStats, visibilityStats] = await Promise.all([
      Journal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Journal.countDocuments(query),
      Journal.aggregate([{ $match: { child: req.user._id } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
      Journal.aggregate([{ $match: { child: req.user._id } }, { $group: { _id: '$visibility', count: { $sum: 1 } } }])
    ]);

    res.json({
      success: true,
      data: journals,
      stats: { byType: typeStats, byVisibility: visibilityStats },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (err) {
    console.error('Error in getMyJournals:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * getJournal (single)
 * - child can only access their own journal
 * - parent must own the child and journal must not be private
 */
export const getJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const journal = await Journal.findById(journalId);
    if (!journal) return res.status(404).json({ success: false, message: 'Journal entry not found' });

    if (req.user.role === 'child') {
      if (journal.child.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied - this is not your journal' });
      }
    } else if (req.user.role === 'parent') {
      // Resolve the parent-child relation
      const resolved = await resolveChildAccess(req.user._id, journal.child);
      if (!resolved) return res.status(403).json({ success: false, message: 'Access denied - this child is not under your care' });

      if (journal.visibility === 'private') {
        return res.status(403).json({ success: false, message: 'This journal is marked as private' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: journal });

  } catch (err) {
    console.error('Error in getJournal:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * updateJournal (child updates their own journal)
 */
export const updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    // Only the child who owns the journal can update via this endpoint
    const journal = await Journal.findOne({ _id: journalId, child: req.user._id });
    if (!journal) return res.status(404).json({ success: false, message: 'Journal entry not found or access denied' });

    const { error, value } = journalSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        journal[key] = value[key];
      }
    });

    if (value.visibility !== undefined) {
      journal.isPrivate = value.visibility === 'private';
    }

    await journal.save();

    return res.json({ success: true, data: journal, message: 'Journal entry updated successfully' });

  } catch (err) {
    console.error('Error in updateJournal:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * deleteJournal (child deletes their own journal)
 */
export const deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const journal = await Journal.findOneAndDelete({ _id: journalId, child: req.user._id });
    if (!journal) return res.status(404).json({ success: false, message: 'Journal entry not found or access denied' });

    return res.json({ success: true, message: 'Journal entry deleted successfully' });

  } catch (err) {
    console.error('Error in deleteJournal:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * getJournalStats (parent)
 * - resolves child then computes stats (non-private journals)
 */
export const getJournalStats = async (req, res) => {
  try {
    const rawChildId = req.params.childId;
    const parentId = req.user._id;

    const resolved = await resolveChildAccess(parentId, rawChildId);
    if (!resolved) return res.status(403).json({ success: false, message: 'Access denied' });

    const targetChildUserId = resolved.userId;
    const childDoc = await Child.findOne({ user: targetChildUserId });
    const childUser = await User.findById(targetChildUserId).select('name');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const frequencyStats = await Journal.aggregate([
      { $match: { child: targetChildUserId, createdAt: { $gte: thirtyDaysAgo }, visibility: { $ne: 'private' } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const typeDistribution = await Journal.aggregate([
      { $match: { child: targetChildUserId, visibility: { $ne: 'private' } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const visibilityDistribution = await Journal.aggregate([
      { $match: { child: targetChildUserId } },
      { $group: { _id: '$visibility', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentJournals = await Journal.find({ child: targetChildUserId, visibility: { $ne: 'private' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type visibility createdAt');

    return res.json({
      success: true,
      data: {
        childInfo: { id: childDoc?._id || null, userId: targetChildUserId, name: childUser?.name || null },
        frequencyStats,
        typeDistribution,
        visibilityDistribution,
        recentJournals,
        summary: {
          totalJournals: typeDistribution.reduce((sum, item) => sum + item.count, 0),
          activeDays: frequencyStats.length,
          mostCommonType: typeDistribution[0]?._id || 'none'
        }
      }
    });

  } catch (err) {
    console.error('Error in getJournalStats:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * searchJournals (parent or child)
 * - parent must resolve ownership of childId when provided
 */
export const searchJournals = async (req, res) => {
  try {
    const { q, childId, type, visibility, limit = 20 } = req.query;

    if (!q) return res.status(400).json({ success: false, message: 'Search query is required' });

    const query = {};
    if (childId) {
      if (req.user.role !== 'parent') return res.status(403).json({ success: false, message: 'Access denied' });
      const resolved = await resolveChildAccess(req.user._id, childId);
      if (!resolved) return res.status(403).json({ success: false, message: 'Access denied' });
      query.child = resolved.userId;
      query.visibility = { $ne: 'private' };
    } else if (req.user.role === 'child') {
      query.child = req.user._id;
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (type && type !== 'all') query.type = type;
    if (visibility && visibility !== 'all') query.visibility = visibility;

    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } }
    ];

    const journals = await Journal.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));

    return res.json({ success: true, data: journals, count: journals.length, query: q });

  } catch (err) {
    console.error('Error in searchJournals:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * getJournalPrompts (child)
 */
export const getJournalPrompts = async (req, res) => {
  try {
    if (req.user.role !== 'child') return res.status(403).json({ success: false, message: 'Only children can get journal prompts' });

    const prompts = [
      "What made you smile today?",
      "Describe a challenge you faced and how you handled it",
      "What are you grateful for today?",
      "Write about someone who inspires you",
      "Describe your perfect day",
      "What's something new you learned recently?",
      "Write about a time you felt proud of yourself",
      "What are your favorite hobbies and why?",
      "Describe a dream you remember",
      "What makes you feel safe and happy?",
      "What would you do if you had a superpower?",
      "Write about your best friend and why they're special",
      "What's your favorite memory from this week?",
      "If you could travel anywhere, where would you go?",
      "What's something you want to learn how to do?"
    ];

    const shuffled = [...prompts].sort(() => 0.5 - Math.random());
    const randomPrompts = shuffled.slice(0, 3);

    return res.json({ success: true, data: { prompts: randomPrompts, totalAvailable: prompts.length } });

  } catch (err) {
    console.error('Error in getJournalPrompts:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * exportJournals (parent)
 * - exports non-private journals for a child (childId param may be Child._id or User._id)
 */
export const exportJournals = async (req, res) => {
  try {
    const { childId, format = 'json', startDate, endDate } = req.query;

    if (!childId) return res.status(400).json({ success: false, message: 'Child ID is required' });

    const resolved = await resolveChildAccess(req.user._id, childId);
    if (!resolved) return res.status(403).json({ success: false, message: 'Access denied - child not found or not yours' });

    const targetChildUserId = resolved.userId;
    const childDoc = await Child.findOne({ user: targetChildUserId });
    const childUser = await User.findById(targetChildUserId).select('name email');

    const query = { child: targetChildUserId, visibility: { $ne: 'private' } };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const journals = await Journal.find(query).sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = journals.map(j => ({
        Date: j.createdAt.toISOString().split('T')[0],
        Title: j.title || 'Untitled',
        Type: j.type,
        Content: (j.content || '').substring(0, 200).replace(/"/g, '""') + ((j.content || '').length > 200 ? '...' : ''),
        Mood: j.mood || 'neutral',
        'Mood Intensity': j.moodIntensity || 5,
        Visibility: j.visibility,
        Tags: (j.tags || []).join(', '),
        'Word Count': j.wordCount || 0
      }));

      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const csvContent = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=journals_${childUser?.name || 'child'}_${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvContent);
    }

    // Default JSON
    return res.json({
      success: true,
      data: {
        child: { id: childDoc?._id || null, userId: targetChildUserId, name: childUser?.name, email: childUser?.email },
        journals: journals.map(j => ({
          id: j._id,
          title: j.title,
          type: j.type,
          content: j.content,
          mood: j.mood,
          moodIntensity: j.moodIntensity,
          visibility: j.visibility,
          tags: j.tags,
          createdAt: j.createdAt,
          wordCount: j.wordCount,
          assets: j.assets
        })),
        exportInfo: { format: 'json', exportDate: new Date(), totalJournals: journals.length, dateRange: startDate || endDate ? { start: startDate, end: endDate } : 'all time' }
      }
    });

  } catch (err) {
    console.error('Error in exportJournals:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
