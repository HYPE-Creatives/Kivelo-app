import User from '../models/User.js';
import Badge from '../models/Badge.js';
import Notification from '../models/Notification.js';
import { updateStreak } from '../services/streakService.js';

// Get user streak and points
export const getGamificationStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .select('points streakCount badges')
      .populate('badges.badgeId', 'name iconUrl description');
    
    res.json({
      success: true,
      data: {
        points: user.points,
        streakCount: user.streakCount,
        badges: user.badges,
        level: Math.floor(user.points / 100) + 1,
        nextLevelPoints: (Math.floor(user.points / 100) + 1) * 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Award points to user
export const awardPoints = async (req, res) => {
  try {
    const { childId, points, reason } = req.body;
    
    if (!childId) {
      return res.status(400).json({
        success: false,
        message: 'childId is required'
      });
    }
    
    const user = await User.findById(childId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Child user not found'
      });
    }
    
    // Update points
    user.points = (user.points || 0) + points;
    await user.save();
    
    // Check for badge achievements (skip notifications for now)
    await checkForBadgesSimple(childId, user.points);
    
    res.json({
      success: true,
      data: { 
        points: user.points,
        message: `${points} points awarded successfully to ${user.name}`
      }
    });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Simple version without notifications
const checkForBadgesSimple = async (userId, points) => {
  const badges = await Badge.find({
    pointsRequired: { $lte: points },
    isActive: true
  });
  
  const user = await User.findById(userId);
  let earnedNewBadge = false;
  
  for (const badge of badges) {
    const hasBadge = user.badges.some(b => 
      b.badgeId.toString() === badge._id.toString()
    );
    
    if (!hasBadge) {
      user.badges.push({
        badgeId: badge._id,
        earnedAt: new Date(),
        progress: 100
      });
      earnedNewBadge = true;
    }
  }
  
  if (earnedNewBadge) {
    await user.save();
  }
};

// Get all available badges
export const getAvailableBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true });
    
    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to check for badges
const checkForBadges = async (userId, points) => {
  const badges = await Badge.find({
    pointsRequired: { $lte: points },
    isActive: true
  });
  
  const user = await User.findById(userId);
  
  for (const badge of badges) {
    const hasBadge = user.badges.some(b => 
      b.badgeId.toString() === badge._id.toString()
    );
    
    if (!hasBadge) {
      user.badges.push({
        badgeId: badge._id,
        earnedAt: new Date(),
        progress: 100
      });
      
      // Create notification
      await Notification.create({
        user: userId,
        type: 'badge_earned',
        title: 'New Badge Earned!',
        message: `Congratulations! You earned the ${badge.name} badge!`,
        data: { badgeId: badge._id }
      });
    }
  }
  
  await user.save();
};

// Update streak (called from mood/journal controllers)
export const updateUserStreak = async (userId) => {
  return await updateStreak(userId);
};

// Redeem reward with points
export const redeemReward = async (req, res) => {
  try {
    const { rewardId } = req.body;
    const userId = req.user._id;
    
    // For now, return a placeholder response
    // In a full implementation, you would:
    // 1. Check if reward exists and is active
    // 2. Check if user has enough points
    // 3. Deduct points and mark reward as redeemed
    // 4. Add reward to user's rewards array
    
    res.json({
      success: true,
      message: 'Reward redemption endpoint. Implement reward logic when Reward model is created.',
      data: {
        rewardId,
        pointsSpent: 0,
        remainingPoints: req.user.points || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};