import User from '../models/User.js';
import Child from '../models/Child.js';
import Mood from '../models/MoodCheckin.js';

export const updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check for today's mood check-in
    const todayMood = await Mood.findOne({
      child: userId,
      createdAt: { $gte: today }
    });
    
    if (!todayMood) return; // No check-in today
    
    // Check for yesterday's mood
    const yesterdayMood = await Mood.findOne({
      child: userId,
      createdAt: { $gte: yesterday, $lt: today }
    });
    
    if (yesterdayMood) {
      // Continue streak
      user.streakCount += 1;
    } else {
      // Check last check-in
      const lastMood = await Mood.findOne({
        child: userId,
        createdAt: { $lt: today }
      }).sort({ createdAt: -1 });
      
      if (lastMood) {
        const lastDate = new Date(lastMood.createdAt);
        lastDate.setHours(0, 0, 0, 0);
        const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (daysSince > 1) {
          // Streak broken
          user.streakCount = 1;
        } else {
          // Missed one day
          user.streakCount += 1;
        }
      } else {
        // First check-in
        user.streakCount = 1;
      }
    }
    
    // Award bonus points for streaks
    let bonusPoints = 0;
    if (user.streakCount === 7) bonusPoints = 50; // Weekly bonus
    if (user.streakCount === 30) bonusPoints = 200; // Monthly bonus
    
    if (bonusPoints > 0) {
      user.points += bonusPoints;
    }
    
    await user.save();
    
    // Also update Child model with streak data
    await Child.findOneAndUpdate(
      { user: userId },
      {
        streakCount: user.streakCount,
        'moodStats.currentStreak': user.streakCount
      }
    );
    
    return user.streakCount;
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};