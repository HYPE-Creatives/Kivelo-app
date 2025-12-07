import Mood from '../models/MoodCheckin.js';
import User from '../models/User.js';
import Child from '../models/Child.js';
import { resolveChildAccess } from "../utils/resolveChildAccess.js";
import { updateStreak } from '../services/streakService.js';
import { analyzeMoodForParent } from '../services/moodAnalysisService.js';

// Helper function for trust zone calculation
const calculateTrustZone = (score) => {
  if (score >= 8) return 'green';
  if (score >= 6) return 'yellow';
  if (score >= 4) return 'orange';
  return 'red';
};

// Helper: Calculate mood statistics
const calculateMoodStats = (moods) => {
  if (moods.length === 0) {
    return {
      averageScore: 0,
      totalEntries: 0,
      trustZoneDistribution: {},
      frequentEmojis: {}
    };
  }

  const totalScore = moods.reduce((sum, mood) => sum + (mood.moodScore || 5), 0);
  const averageScore = totalScore / moods.length;

  const zoneDistribution = moods.reduce((dist, mood) => {
    const zone = mood.trustZone || calculateTrustZone(mood.moodScore || 5);
    dist[zone] = (dist[zone] || 0) + 1;
    return dist;
  }, {});

  const emojiDistribution = moods.reduce((dist, mood) => {
    if (mood.emoji) {
      dist[mood.emoji] = (dist[mood.emoji] || 0) + 1;
    }
    return dist;
  }, {});

  return {
    averageScore: parseFloat(averageScore.toFixed(2)),
    totalEntries: moods.length,
    trustZoneDistribution: zoneDistribution,
    frequentEmojis: emojiDistribution,
    currentTrustZone: calculateTrustZone(averageScore)
  };
};

// Helper: Generate mood insights
const generateMoodInsights = (moods, stats) => {
  const insights = [];

  if (stats.averageScore < 5) {
    insights.push({
      type: 'warning',
      message: 'Your average mood is lower than usual. Consider trying some relaxing activities.',
      suggestion: 'Try the AI helper for activity suggestions'
    });
  }

  if (stats.trustZoneDistribution.red > 0) {
    insights.push({
      type: 'alert',
      message: 'You had some difficult days recently. Remember, it\'s okay to ask for help.',
      suggestion: 'Share your feelings with a trusted adult'
    });
  }

  return insights;
};

// ==================== EXPORTED CONTROLLER FUNCTIONS ====================

/**
 * Submit a mood check-in (PRD: Simple daily logging - emoji, voice, drawing, or short text)
 */
export const submitMoodCheckin = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      emoji,
      textNote,
      voiceNote,
      drawing,
      moodScore,
      tags,
      context
    } = req.body;

    // Determine type based on input
    let type = 'combined';
    if (emoji && !textNote && !voiceNote && !drawing) type = 'emoji';
    else if (textNote && !emoji && !voiceNote && !drawing) type = 'text';
    else if (voiceNote && !emoji && !textNote && !drawing) type = 'voice';
    else if (drawing && !emoji && !textNote && !voiceNote) type = 'drawing';

    // Create mood check-in
    const moodCheckin = await Mood.create({
      child: userId,
      type,
      emoji,
      textNote,
      voiceNote,
      drawing,
      moodScore: moodScore || 5,
      tags,
      context,
      trustZone: calculateTrustZone(moodScore || 5)
    });

    // Update user's streak
    await updateStreak(userId);

    // Award points for mood check-in
    await User.findByIdAndUpdate(userId, {
      $inc: { points: 10 }
    });

    // Analyze mood for parent notifications if needed
    if (moodScore <= 4) {
      await analyzeMoodForParent(userId, moodCheckin);
    }

    res.status(201).json({
      success: true,
      data: moodCheckin,
      message: 'Mood recorded successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get mood history with filters
 */
export const getMoodHistory = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const { period = "week", limit = 50 } = req.query;
    const childId = req.params.childId;   // <-- coming from /child/:childId/history

    let targetUserId = requesterId;

    // If parent requesting child's history
    if (childId && childId !== requesterId.toString()) {

      if (req.user.role !== "parent") {
        return res.status(403).json({
          success: false,
          message: "Only parents can access this resource"
        });
      }

      const resolved = await resolveChildAccess(requesterId, childId);

      if (!resolved) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource"
        });
      }

      targetUserId = resolved.userId;
    }

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case 'day': startDate.setDate(startDate.getDate() - 1); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const moods = await Mood.find({
      child: targetUserId,
      createdAt: { $gte: startDate }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = calculateMoodStats(moods);

    return res.json({
      success: true,
      childId: targetUserId,
      data: moods,
      stats,
      insights: generateMoodInsights(moods, stats)
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * Get mood insights and AI-generated suggestions
 */
export const getMoodInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moods = await Mood.find({
      child: userId,
      createdAt: { $gte: startDate }
    });

    if (moods.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Not enough data for insights',
          suggestions: ['Try checking in more regularly!']
        }
      });
    }

    const stats = calculateMoodStats(moods);
    const insights = generateMoodInsights(moods, stats);

    res.json({
      success: true,
      data: {
        stats,
        insights
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get mood statistics
 */
export const getMoodStats = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const targetId = req.query.childId || requesterId.toString();

    let targetUserId = targetId;

    // If parent is accessing child stats
    if (targetId !== requesterId.toString()) {
      if (req.user.role !== "parent") {
        return res.status(403).json({
          success: false,
          message: "Only parents can access this resource"
        });
      }

      const resolved = await resolveChildAccess(requesterId, targetId);
      if (!resolved) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource"
        });
      }

      targetUserId = resolved.userId;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moods = await Mood.find({
      child: targetUserId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const stats = calculateMoodStats(moods);

    const user = await User.findById(targetUserId).select('streakCount points');

    return res.json({
      success: true,
      data: {
        ...stats,
        streakCount: user?.streakCount || 0,
        points: user?.points || 0,
        childId: targetUserId
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * Get today's mood check-in
 */
export const getTodayMood = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMood = await Mood.findOne({
      child: userId,
      createdAt: { $gte: today }
    });

    res.json({
      success: true,
      data: todayMood,
      hasCheckedInToday: !!todayMood
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get mood trends for charts
 */
export const getMoodTrends = async (req, res) => {
  try {
    const requesterId = req.user._id;
    const targetId = req.query.childId || requesterId.toString();
    const range = parseInt(req.query.range) || 7;

    let targetUserId = targetId;

    // Parent trying to access child's mood trends
    if (targetId !== requesterId.toString()) {
      if (req.user.role !== "parent") {
        return res.status(403).json({
          success: false,
          message: "Only parents can access this resource"
        });
      }

      const resolved = await resolveChildAccess(requesterId, targetId);
      if (!resolved) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource"
        });
      }

      targetUserId = resolved.userId;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);

    const trends = await Mood.aggregate([
      {
        $match: {
          child: targetUserId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          averageScore: { $avg: "$moodScore" },
          count: { $sum: 1 },
          emojis: { $push: "$emoji" },
          trustZones: { $push: "$trustZone" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.json({
      success: true,
      data: trends,
      range
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * Update mood entry (only text/notes allowed)
 */
export const updateMoodEntry = async (req, res) => {
  try {
    const { moodId } = req.params;
    const { textNote, tags } = req.body;
    const userId = req.user._id;

    const mood = await Mood.findOne({
      _id: moodId,
      child: userId
    });

    if (!mood) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    // Only allow updates to text notes and tags
    if (textNote !== undefined) mood.textNote = textNote;
    if (tags !== undefined) mood.tags = tags;

    await mood.save();

    res.json({
      success: true,
      data: mood,
      message: 'Mood entry updated'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete mood entry
 */
export const deleteMoodEntry = async (req, res) => {
  try {
    const { moodId } = req.params;
    const userId = req.user._id;

    const mood = await Mood.findOneAndDelete({
      _id: moodId,
      child: userId
    });

    if (!mood) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Mood entry deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get trust zone summary for a child (Parent access)
 */
export const getTrustZoneSummary = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user._id;

    if (req.user.role !== "parent") {
      return res.status(403).json({
        success: false,
        message: "Only parents can access this resource"
      });
    }

    const resolved = await resolveChildAccess(parentId, childId);
    if (!resolved) {
      return res.status(403).json({
        success: false,
        message: "Access denied - child not found or does not belong to this parent"
      });
    }

    const targetUserId = resolved.userId;
    const childName = resolved.name;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moods = await Mood.find({
      child: targetUserId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 });

    const zoneCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
    let totalScore = 0;

    moods.forEach(mood => {
      const zone = mood.trustZone || calculateTrustZone(mood.moodScore || 5);
      zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
      totalScore += mood.moodScore || 5;
    });

    const averageScore = moods.length > 0 ? totalScore / moods.length : 0;
    const currentZone = calculateTrustZone(averageScore);

    return res.json({
      success: true,
      data: {
        childId: targetUserId,
        childName,
        averageScore: parseFloat(averageScore.toFixed(2)),
        currentZone,
        zoneDistribution: zoneCounts,
        totalEntries: moods.length,
        lastUpdated: new Date(),
        recentMoods: moods.slice(0, 5).map(m => ({
          id: m._id,
          emoji: m.emoji,
          moodScore: m.moodScore,
          date: m.createdAt,
          hasNote: !!m.textNote
        }))
      }
    });

  } catch (error) {
    console.error("Error in getTrustZoneSummary:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/**
 * Get mood by ID (single entry)
 */
export const getMoodById = async (req, res) => {
  try {
    const { moodId } = req.params;
    const userId = req.user._id;

    const mood = await Mood.findOne({
      _id: moodId,
      child: userId
    });

    if (!mood) {
      return res.status(404).json({
        success: false,
        message: 'Mood entry not found'
      });
    }

    res.json({
      success: true,
      data: mood
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get recent moods (for quick view)
 */
export const getRecentMoods = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const moods = await Mood.find({
      child: userId
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('emoji moodScore trustZone createdAt textNote');

    res.json({
      success: true,
      data: moods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== LEGACY EXPORTS (Backward Compatibility) ====================

// These are for your existing routes that might be using different function names
export const createMood = submitMoodCheckin; // Alias for backward compatibility
export const getAllMoods = getMoodHistory;   // Alias for backward compatibility