import Mood from '../models/MoodCheckin.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import TrustZone from '../models/TrustZone.js';
// import { OpenAI } from 'openai'; // Assuming you have this installed

// Initialize OpenAI if you're using it
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * ANALYZES A CHILD'S MOOD FOR PARENTAL INSIGHTS
 * Called when a child submits a mood check-in, especially with low scores.
 * @param {string} childId - The ID of the child who submitted the mood
 * @param {Object} moodCheckin - The newly created Mood document
 */
export const analyzeMoodForParent = async (childId, moodCheckin) => {
  try {
    // 1. Get the child's parent
    const childUser = await User.findById(childId).populate('child.parent', '_id email');
    if (!childUser || !childUser.child?.parent) {
      console.log(`No parent found for child ${childId}. Skipping analysis.`);
      return;
    }
    const parentId = childUser.child.parent._id;

    // 2. Get TrustZone settings for this parent-child pair
    const trustZone = await TrustZone.findOne({ parentId, childId });
    const settings = trustZone?.settings || getDefaultTrustZoneSettings();

    // 3. Calculate the current trust zone for this single entry
    const currentZone = calculateTrustZone(moodCheckin.moodScore, settings);
    let shouldAlertParent = false;

    // 4. Analyze for concerning patterns with recent history
    const patternAnalysis = await checkForConcerningPatterns(childId, moodCheckin, settings);

    // 5. Perform AI Analysis on the mood content if needed (text, label, notes)
    let aiAnalysis = null;
    if (moodCheckin.textNote || moodCheckin.label || moodCheckin.notes) {
      aiAnalysis = await performSentimentAnalysis(moodCheckin);
      // Use AI to generate suggestions for parents [citation:8]
      aiAnalysis.suggestedResponses = generateCommunicationSuggestions(
        moodCheckin.moodScore,
        moodCheckin.label,
        aiAnalysis.sentiment
      );
    }

    // 6. Determine if an alert should be sent based on score, zone, or pattern
    if (currentZone === 'red' || currentZone === 'orange') {
      shouldAlertParent = true;
    }
    if (patternAnalysis.hasConsecutiveLowMood) {
      shouldAlertParent = true;
    }

    // 7. Create and save a notification for the parent if needed
    if (shouldAlertParent && settings.notificationsEnabled) {
      await createParentNotification(parentId, childId, moodCheckin, {
        currentZone,
        patternAnalysis,
        aiAnalysis
      });
    }

    // 8. Optionally, update the mood document with the AI analysis
    if (aiAnalysis) {
      await Mood.findByIdAndUpdate(moodCheckin._id, { aiAnalysis });
    }

    console.log(`Mood analysis completed for child ${childId}. Alert sent: ${shouldAlertParent}`);

  } catch (error) {
    console.error('Error in analyzeMoodForParent:', error);
    // In production, you might want to log this to an error tracking service
  }
};

/**
 * CHECKS FOR CONCERNING MOOD PATTERNS OVER THE LAST 7 DAYS
 * Implements step-by-step sentiment tracking over time[citation:1][citation:10].
 * @param {string} childId
 * @param {Object} currentMood
 * @param {Object} settings
 */
const checkForConcerningPatterns = async (childId, currentMood, settings) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMoods = await Mood.find({
    child: childId,
    createdAt: { $gte: sevenDaysAgo }
  }).sort({ createdAt: 1 }); // Oldest to newest to see progression

  if (recentMoods.length < 2) {
    return { hasConsecutiveLowMood: false, trend: 'insufficient_data' };
  }

  // Analyze for consecutive days with low mood scores
  let consecutiveLowDays = 0;
  let lastDate = null;

  // Include the current mood in the analysis
  const allMoods = [...recentMoods, currentMood];

  for (const mood of allMoods) {
    const moodDate = new Date(mood.createdAt).toDateString();

    // Only count once per calendar day
    if (moodDate !== lastDate) {
      // A low mood is defined by the parent's "orange" or "red" threshold
      const zoneForThisMood = calculateTrustZone(mood.moodScore, settings);
      if (zoneForThisMood === 'orange' || zoneForThisMood === 'red') {
        consecutiveLowDays++;
      } else {
        // Reset streak if a non-low mood day is found
        consecutiveLowDays = 0;
      }
      lastDate = moodDate;
    }
  }

  // Determine the trend
  const firstScore = recentMoods[0]?.moodScore || 5;
  const lastScore = currentMood.moodScore;
  const scoreTrend = lastScore < firstScore ? 'declining' : lastScore > firstScore ? 'improving' : 'stable';

  return {
    hasConsecutiveLowMood: consecutiveLowDays >= 3, // Alert after 3 consecutive low days
    consecutiveLowDays,
    averageScore: allMoods.reduce((sum, m) => sum + m.moodScore, 0) / allMoods.length,
    totalEntries: allMoods.length,
    trend: scoreTrend
  };
};

/**
 * PERFORM SENTIMENT ANALYSIS ON MOOD TEXT
 * Uses a simple dictionary-based approach or an external AI API[citation:4][citation:5].
 * @param {Object} moodCheckin
 */
const performSentimentAnalysis = async (moodCheckin) => {
  const textToAnalyze = [moodCheckin.textNote, moodCheckin.label, moodCheckin.notes]
    .filter(Boolean)
    .join(' ');

  if (!textToAnalyze.trim()) {
    return null;
  }

  // **OPTION A: Simple Rule-Based Sentiment (Good for starters, no API calls)**
  const simpleAnalysis = performSimpleSentimentAnalysis(textToAnalyze);

  // **OPTION B: OpenAI GPT Analysis (More powerful, provides context)**
  // const openAIAnalysis = await analyzeWithOpenAI(textToAnalyze);
  // return openAIAnalysis;

  return simpleAnalysis;
};

// **Helper: Simple Dictionary-Based Sentiment Analyzer [citation:4]**
const performSimpleSentimentAnalysis = (text) => {
  // A small sample of sentiment words. For production, use a full library like 'sentiment' npm package.
  const positiveWords = ['happy', 'good', 'great', 'excited', 'love', 'fun', 'best', 'joy', 'calm'];
  const negativeWords = ['sad', 'bad', 'angry', 'mad', 'hate', 'scared', 'worried', 'tired', 'alone', 'hurt'];

  const words = text.toLowerCase().split(/\W+/);
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });

  let sentiment = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  if (negativeCount > positiveCount) sentiment = 'negative';

  // Extract potential keywords (non-common words)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about'];
  const keywords = [...new Set(words.filter(word => word.length > 3 && !commonWords.includes(word)))];

  return {
    sentiment,
    confidence: Math.abs(positiveCount - negativeCount) / words.length || 0,
    keywords: keywords.slice(0, 5), // Top 5 keywords
    positiveCount,
    negativeCount
  };
};

// **Helper: AI-Powered Analysis using OpenAI [citation:5][citation:8]**
const analyzeWithOpenAI = async (text) => {
  /*
  // UNCOMMENT AND CONFIGURE IF YOU HAVE AN OPENAI API KEY
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a child psychologist assistant. Analyze the following text from a child's mood journal. Determine the primary sentiment (positive, negative, neutral), extract key emotional themes, and suggest 2-3 brief, compassionate ways a parent might respond. Return a JSON object with 'sentiment', 'themes' (array), and 'suggested_responses' (array)."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return {
      sentiment: result.sentiment,
      themes: result.themes,
      suggestedResponses: result.suggested_responses,
      source: 'openai_gpt'
    };
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    return performSimpleSentimentAnalysis(text); // Fallback
  }
  */
  // Placeholder return if OpenAI is not configured
  console.log('OpenAI analysis not configured. Using simple analysis.');
  return performSimpleSentimentAnalysis(text);
};

/**
 * GENERATES COMMUNICATION SUGGESTIONS FOR PARENTS
 * Based on mood score, label, and sentiment[citation:7].
 * @param {number} moodScore
 * @param {string} moodLabel
 * @param {string} sentiment
 */
const generateCommunicationSuggestions = (moodScore, moodLabel, sentiment) => {
  const suggestions = [];

  if (moodScore <= 4 || sentiment === 'negative') {
    suggestions.push(
      "Acknowledge their feeling: 'It sounds like you're having a tough time. I'm here for you.'",
      "Offer comfort: 'Would a hug help? Or maybe we can sit together quietly for a bit.'",
      "Ask an open-ended question: 'Is there anything you'd like to tell me or draw about how you're feeling?'"
    );
  } else if (moodScore >= 8 || sentiment === 'positive') {
    suggestions.push(
      "Share their joy: 'I love seeing you so happy! Tell me more about what made you feel good.'",
      "Celebrate: 'This calls for a little celebration! How about we do your favorite activity later?'",
      "Encourage expression: 'Would you like to draw a picture of this happy feeling?'"
    );
  } else {
    // Neutral or mid-range scores
    suggestions.push(
      "Check in gently: 'How is your heart feeling today?'",
      "Offer connection: 'I'm always here to talk, draw, or just hang out if you want.'"
    );
  }

  // Add label-specific suggestions
  if (moodLabel?.toLowerCase().includes('angry')) {
    suggestions.push("Help them name it: 'It's okay to feel angry. Sometimes I feel angry too. Let's find a safe way to let it out, like scribbling hard on paper.'");
  }
  if (moodLabel?.toLowerCase().includes('sad')) {
    suggestions.push("Offer comfort: 'When I'm sad, sometimes a cozy blanket and a story help. Would you like that?'");
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
};

/**
 * CALCULATES THE TRUST ZONE (GREEN, YELLOW, ORANGE, RED)
 * @param {number} score
 * @param {Object} settings
 */
const calculateTrustZone = (score, settings) => {
  if (score >= settings.greenThreshold) return 'green';
  if (score >= settings.yellowThreshold) return 'yellow';
  if (score >= settings.orangeThreshold) return 'orange';
  return 'red'; // score falls below redThreshold
};

/**
 * GET DEFAULT TRUST ZONE SETTINGS
 */
const getDefaultTrustZoneSettings = () => ({
  greenThreshold: 8,
  yellowThreshold: 6,
  orangeThreshold: 4,
  redThreshold: 0,
  notificationsEnabled: true
});

/**
 * CREATES A NOTIFICATION DOCUMENT FOR THE PARENT
 * @param {string} parentId
 * @param {string} childId
 * @param {Object} moodCheckin
 * @param {Object} analysisResults
 */
const createParentNotification = async (parentId, childId, moodCheckin, analysisResults) => {
  const { currentZone, patternAnalysis, aiAnalysis } = analysisResults;

  const child = await User.findById(childId).select('name avatar');
  const childName = child?.name || 'Your child';
  const childAvatar = child?.avatar?.url || null;

  let title, message;

  if (currentZone === 'red') {
    title = `🚨 High Concern: ${childName} is having a very difficult time`;
    message = `${childName}'s recent mood check-in shows they are in the RED trust zone (score: ${moodCheckin.moodScore}/10). Your attention and comfort are recommended.`;
  } else if (patternAnalysis.hasConsecutiveLowMood) {
    title = `📉 Pattern Alert: ${childName} has had several low mood days`;
    message = `${childName} has been in a low mood for ${patternAnalysis.consecutiveLowDays} consecutive days. They might need extra support or a check-in.`;
  } else {
    title = `ℹ️ Mood Update: ${childName} checked in`;
    message = `${childName} reported a mood score of ${moodCheckin.moodScore}/10 (${currentZone.toUpperCase()} zone).`;
  }

  // Add a snippet from AI analysis if available
  if (aiAnalysis?.keywords?.length > 0) {
    message += ` They mentioned themes like: ${aiAnalysis.keywords.join(', ')}.`;
  }

  const notification = await Notification.create({
    user: parentId,
    child: childId,
    type: 'parent_alert',
    title,
    message,
    priority: currentZone === 'red' ? 'high' : 'medium',
    data: {
      moodCheckinId: moodCheckin._id,
      childId,
      childName,
      childAvatar,
      moodScore: moodCheckin.moodScore,
      trustZone: currentZone,
      patternAnalysis,
      aiAnalysis
    },
    isRead: false
  });

  // Here you could also trigger a push notification or email via your notificationService.js
  // e.g., require('./notificationService').sendPushNotification(parentId, title, message);

  return notification;
};

// **Optional: A function to get a summary for the parent dashboard**
export const getMoodSummaryForDashboard = async (parentId, childId, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const moods = await Mood.find({
    child: childId,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: 1 });

  if (moods.length === 0) {
    return null;
  }

  const averageScore = moods.reduce((sum, m) => sum + m.moodScore, 0) / moods.length;
  const trustZone = calculateTrustZone(averageScore, getDefaultTrustZoneSettings());

  const zoneCounts = { green: 0, yellow: 0, orange: 0, red: 0 };
  moods.forEach(mood => {
    const zone = calculateTrustZone(mood.moodScore, getDefaultTrustZoneSettings());
    zoneCounts[zone]++;
  });

  // Get the most common mood label/emoji
  const moodLabels = moods.filter(m => m.label).map(m => m.label);
  const mostFrequentMood = moodLabels.length > 0
    ? moodLabels.sort((a, b) =>
        moodLabels.filter(v => v === a).length -
        moodLabels.filter(v => v === b).length
      ).pop()
    : null;

  return {
    averageScore: parseFloat(averageScore.toFixed(1)),
    trustZone,
    zoneDistribution: zoneCounts,
    totalEntries: moods.length,
    mostFrequentMood,
    trend: moods.length > 1 ? (moods[moods.length - 1].moodScore > moods[0].moodScore ? 'improving' : 'declining') : 'stable'
  };
};