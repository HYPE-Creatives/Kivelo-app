// controllers/journalController.js
import Journal from '../models/JournalEntry.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import Parent from '../models/Parent.js';
import { journalSchema } from '../middleware/validators.js';
import { updateUserStreak } from '../controllers/gamificationController.js';
import Notification from '../models/Notification.js';

// ✅ Function 1: createJournal (your existing function)
export async function createJournal(req, res, next) {
  try {
    const { error, value } = journalSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const child = await Child.findById(value.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // When a child creates a journal, notify parent
    if (!isPrivate && child.parent) {
      await Notification.create({
        userId: child.parent,
        type: 'new_journal',
        title: 'New Journal Entry',
        message: `${child.user.name} created a new journal entry: "${title}"`,
        data: {
          journalId: journal._id,
          childId: child.user._id,
          childName: child.user.name
        }
      });
    };

    // Authorization check
    if (req.user.role === 'parent') {
      if (String(child.parent) !== String(req.user._id)) {
        return res.status(403).json({
          error: 'Access denied - not your child'
        });
      }
    } else if (req.user.role === 'child') {
      const childProfile = await Child.findOne({ user: req.user._id });
      if (!childProfile || String(childProfile._id) !== String(value.childId)) {
        return res.status(403).json({
          error: 'You can only create journals for yourself'
        });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const journalData = {
      child: child.user,
      type: value.type,
      content: value.content,
      assets: value.assets,
      visibility: value.visibility,
      title: value.title || 'Untitled',
      mood: value.mood || 'neutral',
      moodIntensity: value.moodIntensity || 5,
      tags: value.tags || [],
      isPrivate: value.visibility === 'private' || false,
      aiAnalysis: value.aiAnalysis
    };

    const journal = await Journal.create(journalData);

    // Award points if child is creating
    if (req.user.role === 'child') {
      await updateUserStreak(req.user._id);
      const pointsToAward = 15;
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { points: pointsToAward }
      });
    }

    // Notify parent if not private
    if (journalData.visibility !== 'private' && child.parent) {
      try {
        await Notification.create({
          userId: child.parent,
          type: 'journal_created',
          title: 'New Journal Entry',
          message: `${child.user.name || 'Your child'} created a new journal entry`,
          data: {
            journalId: journal._id,
            childId: child.user._id
          }
        });
      } catch (notifError) {
        console.log('Failed to create notification:', notifError.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: journal,
      message: 'Journal entry created successfully'
    });
  } catch (err) {
    console.error('Error in createJournal:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
}

// ✅ Function 2: getChildJournals
export const getChildJournals = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });

    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - child not found or does not belong to you'
      });
    }

    const { page = 1, limit = 10, type, visibility, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    const query = { child: child.user };

    if (type && type !== 'all') query.type = type;

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const journals = await Journal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments(query);

    const childUser = await User.findById(child.user).select('name');

    res.json({
      success: true,
      data: {
        journals,
        childInfo: {
          id: child._id,
          userId: child.user,
          name: childUser?.name
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getChildJournals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 3: getMyJournals
export const getMyJournals = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Child only.'
      });
    }

    const childProfile = await Child.findOne({ user: req.user._id });
    if (!childProfile) {
      return res.status(404).json({
        success: false,
        message: 'Child profile not found'
      });
    }

    const { page = 1, limit = 10, type = 'all', visibility = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const query = { child: req.user._id };

    if (type !== 'all') query.type = type;

    if (visibility !== 'all') {
      query.visibility = visibility;
    }

    const journals = await Journal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments(query);

    const typeStats = await Journal.aggregate([
      { $match: { child: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const visibilityStats = await Journal.aggregate([
      { $match: { child: req.user._id } },
      {
        $group: {
          _id: '$visibility',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: journals,
      stats: {
        byType: typeStats,
        byVisibility: visibilityStats
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getMyJournals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 4: getJournal
export const getJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const journal = await Journal.findById(journalId);

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Check permissions
    if (req.user.role === 'child') {
      if (journal.child.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - this is not your journal'
        });
      }
    } else if (req.user.role === 'parent') {
      const childProfile = await Child.findOne({
        user: journal.child,
        parent: req.user._id
      });

      if (!childProfile) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - this child is not under your care'
        });
      }

      if (journal.visibility === 'private') {
        return res.status(403).json({
          success: false,
          message: 'This journal is marked as private'
        });
      }
    }

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    console.error('Error in getJournal:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 5: updateJournal
export const updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const journal = await Journal.findOne({
      _id: journalId,
      child: req.user._id
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found or access denied'
      });
    }

    const { error, value } = journalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        journal[key] = value[key];
      }
    });

    if (value.visibility !== undefined) {
      journal.isPrivate = value.visibility === 'private';
    }

    await journal.save();

    res.json({
      success: true,
      data: journal,
      message: 'Journal entry updated successfully'
    });
  } catch (error) {
    console.error('Error in updateJournal:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 6: deleteJournal
export const deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    const journal = await Journal.findOneAndDelete({
      _id: journalId,
      child: req.user._id
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteJournal:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 7: getJournalStats
export const getJournalStats = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    const child = await Child.findOne({
      _id: childId,
      parent: parentId
    });

    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const childUser = await User.findById(child.user).select('name');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const frequencyStats = await Journal.aggregate([
      {
        $match: {
          child: child.user,
          createdAt: { $gte: thirtyDaysAgo },
          visibility: { $ne: 'private' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const typeDistribution = await Journal.aggregate([
      {
        $match: {
          child: child.user,
          visibility: { $ne: 'private' }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const visibilityDistribution = await Journal.aggregate([
      { $match: { child: child.user } },
      {
        $group: {
          _id: '$visibility',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentJournals = await Journal.find({
      child: child.user,
      visibility: { $ne: 'private' }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title type visibility createdAt');

    res.json({
      success: true,
      data: {
        childInfo: {
          id: child._id,
          userId: child.user,
          name: childUser?.name
        },
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
  } catch (error) {
    console.error('Error in getJournalStats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 8: searchJournals
export const searchJournals = async (req, res) => {
  try {
    const { q, childId, type, visibility, limit = 20 } = req.query;
    const parentId = req.user._id;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let query = {};

    if (childId && req.user.role === 'parent') {
      const child = await Child.findOne({ _id: childId, parent: parentId });
      if (!child) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      query.child = child.user;
      query.visibility = { $ne: 'private' };
    } else if (req.user.role === 'child') {
      query.child = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (type && type !== 'all') query.type = type;

    if (visibility && visibility !== 'all') {
      query.visibility = visibility;
    }

    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { content: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } }
    ];

    const journals = await Journal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: journals,
      count: journals.length,
      query: q
    });
  } catch (error) {
    console.error('Error in searchJournals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 9: getJournalPrompts (MISSING FUNCTION - ADDED)
export const getJournalPrompts = async (req, res) => {
  try {
    if (req.user.role !== 'child') {
      return res.status(403).json({
        success: false,
        message: 'Only children can get journal prompts'
      });
    }

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

    // Get 3 random prompts
    const shuffled = [...prompts].sort(() => 0.5 - Math.random());
    const randomPrompts = shuffled.slice(0, 3);

    res.json({
      success: true,
      data: {
        prompts: randomPrompts,
        totalAvailable: prompts.length
      }
    });
  } catch (error) {
    console.error('Error in getJournalPrompts:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Function 10: exportJournals (MISSING FUNCTION - ADDED)
export const exportJournals = async (req, res) => {
  try {
    const { childId, format = 'json', startDate, endDate } = req.query;

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID is required'
      });
    }

    // Verify parent access
    const child = await Child.findOne({
      _id: childId,
      parent: req.user._id
    });

    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - child not found or not yours'
      });
    }

    // Build query
    const query = {
      child: child.user,
      visibility: { $ne: 'private' } // Only export non-private journals
    };

    // Add date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const journals = await Journal.find(query)
      .sort({ createdAt: -1 });

    const childUser = await User.findById(child.user).select('name email');

    if (format === 'csv') {
      // Prepare CSV data
      const csvData = journals.map(journal => ({
        Date: journal.createdAt.toISOString().split('T')[0],
        Title: journal.title || 'Untitled',
        Type: journal.type,
        Content: journal.content.substring(0, 200).replace(/"/g, '""') + (journal.content.length > 200 ? '...' : ''),
        Mood: journal.mood || 'neutral',
        'Mood Intensity': journal.moodIntensity || 5,
        Visibility: journal.visibility,
        Tags: journal.tags.join(', '),
        'Word Count': journal.wordCount || 0
      }));

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {}).join(',');
      const rows = csvData.map(row =>
        Object.values(row).map(value =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition',
        `attachment; filename=journals_${childUser?.name || 'child'}_${new Date().toISOString().split('T')[0]}.csv`);

      res.send(csvContent);
    } else {
      // JSON format (default)
      res.json({
        success: true,
        data: {
          child: {
            id: child._id,
            userId: child.user,
            name: childUser?.name,
            email: childUser?.email
          },
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
          exportInfo: {
            format: 'json',
            exportDate: new Date(),
            totalJournals: journals.length,
            dateRange: startDate || endDate ? {
              start: startDate,
              end: endDate
            } : 'all time'
          }
        }
      });
    }
  } catch (error) {
    console.error('Error in exportJournals:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};