// services/safetyMonitoringService.js
// Detects concerning language patterns in messages for child safety

// Concerning keywords/phrases organized by category
const SAFETY_PATTERNS = {
  self_harm: {
    keywords: [
      'hurt myself', 'kill myself', 'want to die', 'end my life', 
      'suicide', 'cutting', 'self harm', 'dont want to live',
      "don't want to live", 'better off dead', 'wish i was dead',
      'hate myself', 'worthless', 'nobody loves me', 'no point living'
    ],
    severity: 'high',
    parentAlert: true
  },
  bullying: {
    keywords: [
      'being bullied', 'kids are mean', 'they hit me', 'they hurt me',
      'scared of school', 'scared to go', 'nobody likes me', 'everyone hates me',
      'they call me names', 'pushing me', 'threatening me', 'leave me alone'
    ],
    severity: 'medium',
    parentAlert: true
  },
  abuse: {
    keywords: [
      'touched me', 'hits me', 'hurts me', 'scared of', 'dont tell anyone',
      "don't tell anyone", 'secret', 'bad touch', 'makes me uncomfortable',
      'threatened me', 'showed me things', 'inappropriate'
    ],
    severity: 'high',
    parentAlert: true
  },
  emotional_distress: {
    keywords: [
      'so sad', 'very sad', 'really sad', 'always sad', 'crying',
      'cant stop crying', "can't stop crying", 'feel alone', 'no friends',
      'scared', 'anxious', 'worried all the time', 'cant sleep', "can't sleep",
      'nightmares', 'panic', 'frightened'
    ],
    severity: 'low',
    parentAlert: false
  },
  family_issues: {
    keywords: [
      'parents fighting', 'mom and dad fight', 'divorce', 'moving away',
      'dad left', 'mom left', 'hate my parents', 'scared at home',
      'yelling', 'screaming at me'
    ],
    severity: 'medium',
    parentAlert: false // Sensitive - may need different handling
  },
  inappropriate_content: {
    keywords: [
      'naked', 'sex', 'porn', 'drugs', 'alcohol', 'cigarettes',
      'vape', 'marijuana', 'weed', 'pills', 'drunk'
    ],
    severity: 'medium',
    parentAlert: true
  }
};

// Positive affirmations to detect when child is doing well
const POSITIVE_PATTERNS = [
  'happy', 'great day', 'love my', 'best friend', 'fun',
  'excited', 'proud of', 'did well', 'helped', 'kind'
];

/**
 * Check a message for safety concerns
 * @param {string} content - The message content to check
 * @param {string} userId - The user who sent the message
 * @returns {Object} Safety check result
 */
export async function checkMessageSafety(content, userId) {
  const lowerContent = content.toLowerCase();
  const result = {
    flagged: false,
    category: null,
    severity: null,
    reason: null,
    matchedPatterns: [],
    isPositive: false,
    requiresParentAlert: false
  };

  // Check for concerning patterns
  for (const [category, config] of Object.entries(SAFETY_PATTERNS)) {
    for (const keyword of config.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        result.flagged = true;
        result.category = category;
        result.severity = config.severity;
        result.reason = `Message contains concerning content related to ${category.replace('_', ' ')}`;
        result.matchedPatterns.push(keyword);
        result.requiresParentAlert = config.parentAlert;
        
        // If high severity, stop checking and return immediately
        if (config.severity === 'high') {
          console.log(`⚠️ HIGH SEVERITY SAFETY FLAG: ${category} - User: ${userId}`);
          return result;
        }
      }
    }
  }

  // Check for positive content
  for (const positive of POSITIVE_PATTERNS) {
    if (lowerContent.includes(positive.toLowerCase())) {
      result.isPositive = true;
      break;
    }
  }

  // Log flagged content for monitoring
  if (result.flagged) {
    console.log(`🚨 Safety flag: ${result.category} (${result.severity}) - User: ${userId}`);
  }

  return result;
}

/**
 * Analyze conversation history for concerning trends
 * @param {Array} messages - Array of messages to analyze
 * @returns {Object} Trend analysis
 */
export function analyzeConversationTrends(messages) {
  const analysis = {
    concerningMessageCount: 0,
    positiveMessageCount: 0,
    categories: {},
    overallSentiment: 'neutral',
    recommendations: []
  };

  for (const msg of messages) {
    if (msg.role !== 'user' && msg.role !== 'child') continue;
    
    const lowerContent = msg.content.toLowerCase();

    // Count concerning patterns
    for (const [category, config] of Object.entries(SAFETY_PATTERNS)) {
      for (const keyword of config.keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          analysis.concerningMessageCount++;
          analysis.categories[category] = (analysis.categories[category] || 0) + 1;
        }
      }
    }

    // Count positive patterns
    for (const positive of POSITIVE_PATTERNS) {
      if (lowerContent.includes(positive.toLowerCase())) {
        analysis.positiveMessageCount++;
        break;
      }
    }
  }

  // Determine overall sentiment
  const total = analysis.concerningMessageCount + analysis.positiveMessageCount;
  if (total > 0) {
    const positiveRatio = analysis.positiveMessageCount / total;
    if (positiveRatio > 0.7) analysis.overallSentiment = 'positive';
    else if (positiveRatio < 0.3) analysis.overallSentiment = 'concerning';
  }

  // Generate recommendations
  if (analysis.categories.self_harm > 0) {
    analysis.recommendations.push('Consider having a supportive conversation about feelings');
    analysis.recommendations.push('Professional counseling may be beneficial');
  }
  if (analysis.categories.bullying > 0) {
    analysis.recommendations.push('Discuss school experiences and friendships');
    analysis.recommendations.push('Consider contacting school counselor');
  }
  if (analysis.categories.emotional_distress > 2) {
    analysis.recommendations.push('Child may benefit from emotional support activities');
    analysis.recommendations.push('Consider mood tracking to identify patterns');
  }

  return analysis;
}

/**
 * Get safety summary for parent dashboard
 * @param {string} childUserId - The child's user ID
 * @param {Array} conversations - Child's conversations
 * @returns {Object} Safety summary
 */
export function getSafetySummary(childUserId, conversations) {
  const summary = {
    totalFlaggedMessages: 0,
    unreviewedFlags: 0,
    categoryCounts: {},
    lastFlaggedAt: null,
    riskLevel: 'low', // low, medium, high
    requiresAttention: false
  };

  for (const conv of conversations) {
    if (conv.safetyFlags?.hasConcerningContent) {
      summary.totalFlaggedMessages += conv.safetyFlags.flagCount || 0;
      
      if (conv.safetyFlags.requiresReview) {
        summary.unreviewedFlags++;
      }

      if (!summary.lastFlaggedAt || conv.safetyFlags.lastFlaggedAt > summary.lastFlaggedAt) {
        summary.lastFlaggedAt = conv.safetyFlags.lastFlaggedAt;
      }
    }

    // Count by category from flagged messages
    for (const msg of conv.messages || []) {
      if (msg.flagged && msg.flagReason) {
        const category = extractCategoryFromReason(msg.flagReason);
        if (category) {
          summary.categoryCounts[category] = (summary.categoryCounts[category] || 0) + 1;
        }
      }
    }
  }

  // Determine risk level
  if (summary.categoryCounts.self_harm > 0 || summary.categoryCounts.abuse > 0) {
    summary.riskLevel = 'high';
    summary.requiresAttention = true;
  } else if (summary.totalFlaggedMessages > 5 || summary.categoryCounts.bullying > 0) {
    summary.riskLevel = 'medium';
    summary.requiresAttention = summary.unreviewedFlags > 0;
  }

  return summary;
}

/**
 * Extract category from flag reason string
 */
function extractCategoryFromReason(reason) {
  const categories = Object.keys(SAFETY_PATTERNS);
  for (const cat of categories) {
    if (reason.toLowerCase().includes(cat.replace('_', ' '))) {
      return cat;
    }
  }
  return null;
}

export default {
  checkMessageSafety,
  analyzeConversationTrends,
  getSafetySummary
};
