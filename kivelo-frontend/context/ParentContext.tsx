// context/ParentContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URLS = [
  "http://192.168.66.1:5000/api/v1",  // Local dev server
  "https://family-wellness.onrender.com/api/v1"
];
const API_BASE = API_URLS[0]; // Primary URL for direct calls
const ACCESS_TOKEN_KEY = "kivelo_access_token";

// Types
export interface Child {
  _id: string;
  id?: string;
  name: string;
  email: string;
  hasSetPassword?: boolean;
  lastLogin?: string;
  points?: number;
  completedActivities?: number;
  currentStreak?: number;
  level?: number;
  streakCount?: number;
  user?: {
    _id?: string;
    name: string;
    email: string;
    dob?: string;
    gender?: string;
    avatar?: {
      url?: string;
      public_id?: string;
    };
  };
}

export interface ChildMoodSummary {
  childId: string;
  childName: string;
  latestMood?: {
    emoji: string;
    moodScore: number;
    trustZone: string;
    createdAt: string;
    textNote?: string;
  };
  weeklyAverage?: number;
  trustZone?: string;
  totalCheckins?: number;
}

export interface ChildGamificationStats {
  points: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  completedActivities: number;
  lastActivityDate?: string;
}

export interface ChildActivity {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  points?: number;
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;
  createdAt: string;
}

export interface FamilyActivityFeed {
  _id: string;
  childId: string;
  childName: string;
  type: "mood_checkin" | "activity_completed" | "badge_earned" | "streak_milestone" | "journal_entry" | "points_earned";
  title: string;
  description?: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface JournalEntry {
  _id: string;
  childId: string;
  childName?: string;
  type: string;
  content: string;
  title: string;
  mood?: string;
  moodIntensity?: number;
  visibility: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningArticle {
  _id: string;
  title: string;
  content?: string;
  summary?: string;
  excerpt?: string;
  category?: string;
  difficulty?: string;
  estimatedReadingTime?: number;
  tags?: string[];
  thumbnailUrl?: string;
  imageUrl?: string;
  externalUrl?: string;
  viewCount?: number;
  createdAt: string;
}

// Alias for Article export
export type Article = LearningArticle;

export interface MoodEntry {
  _id: string;
  emoji?: string;
  moodScore?: number;
  trustZone?: string;
  textNote?: string;
  createdAt: string;
}

interface ParentContextType {
  children: Child[];
  loading: boolean;
  familyActivityFeed: FamilyActivityFeed[];
  getChildren: () => Promise<{ success: boolean; data?: Child[]; message?: string }>;
  getChildDetails: (childId: string) => Promise<{ success: boolean; data?: any; message?: string }>;
  getChildMoodSummary: (childId: string) => Promise<{ success: boolean; data?: ChildMoodSummary; message?: string }>;
  getChildMoodHistory: (childId: string, period?: string) => Promise<MoodEntry[]>;
  getChildMoodInsights: (childId: string) => Promise<any>;
  getChildJournals: (childId: string) => Promise<JournalEntry[]>;
  getAllChildrenJournals: () => Promise<{ success: boolean; data?: JournalEntry[]; message?: string }>;
  getChildGamificationStats: (childId: string) => Promise<{ success: boolean; data?: ChildGamificationStats; message?: string }>;
  getChildActivities: (childId: string, status?: string) => Promise<{ success: boolean; data?: ChildActivity[]; message?: string }>;
  getFamilyDashboard: () => Promise<{ success: boolean; data?: any; message?: string }>;
  getFamilyActivityFeed: () => Promise<{ success: boolean; data?: FamilyActivityFeed[]; message?: string }>;
  getLearningArticles: (params?: { category?: string; page?: number; limit?: number }) => Promise<LearningArticle[]>;
  getArticleDetails: (articleId: string) => Promise<{ success: boolean; data?: LearningArticle; message?: string }>;
  createActivity: (activityData: any) => Promise<{ success: boolean; data?: any; message?: string }>;
  generateChildCode: (childData: { name: string; email: string; dob: string; gender?: string }) => Promise<{ success: boolean; code?: string; message?: string }>;
  awardPointsToChild: (childId: string, points: number, reason: string) => Promise<{ success: boolean; message?: string }>;
}

const ParentContext = createContext<ParentContextType | null>(null);

export function ParentProvider({ children: childrenProp }: { children: ReactNode }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [familyActivityFeed, setFamilyActivityFeed] = useState<FamilyActivityFeed[]>([]);

  // API helper with fallback URLs
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return { success: false, message: "Not authenticated" };
    }

    let lastError: any = null;
    
    for (const baseUrl of API_URLS) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
          },
        });

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.log(`API (${baseUrl}): Non-JSON response, trying next...`);
          continue;
        }

        const data = await response.json();
        
        if (!response.ok) {
          // If it's a client error (4xx), don't try next URL
          if (response.status >= 400 && response.status < 500) {
            return { success: false, message: data.message || "Request failed" };
          }
          lastError = new Error(data.message || "Request failed");
          continue;
        }

        return { success: true, ...data };
      } catch (error: any) {
        lastError = error;
        console.log(`API (${baseUrl}): Failed, trying next...`);
      }
    }
    
    console.error(`API Error (${endpoint}):`, lastError);
    return { success: false, message: lastError?.message || "Network error" };
  };

  // Normalize child data to ensure name/email are at top level
  const normalizeChild = (child: any): Child => {
    // Debug: Log the raw child data to see what avatar looks like
    console.log('📦 Raw child data:', JSON.stringify(child, null, 2));
    console.log('🖼️ Child user avatar:', child.user?.avatar);
    
    return {
      ...child,
      // Copy user fields to top level for easier access
      name: child.user?.name || child.name || "Unknown",
      email: child.user?.email || child.email || "",
      // Keep the user object intact for avatar access
      user: child.user,
    };
  };

  // Get all children
  const getChildren = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiCall("/parents/children-list");
      if (result.success && result.children) {
        const normalizedChildren = result.children.map(normalizeChild);
        setChildren(normalizedChildren);
        return { success: true, data: normalizedChildren };
      }
      // Handle case where data might be in different format
      if (result.success && result.data) {
        const normalizedChildren = result.data.map(normalizeChild);
        setChildren(normalizedChildren);
        return { success: true, data: normalizedChildren };
      }
      return { success: false, message: result.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get child details
  const getChildDetails = useCallback(async (childId: string) => {
    const result = await apiCall(`/parents/children-list/${childId}`);
    if (result.success) {
      const child = result.child || result.data;
      return { success: true, data: normalizeChild(child) };
    }
    return { success: false, message: result.message };
  }, []);

  // Get child mood summary
  const getChildMoodSummary = useCallback(async (childId: string) => {
    const result = await apiCall(`/parents/child/${childId}/mood-summary`);
    return result;
  }, []);

  // Get journals for a specific child
  const getChildJournals = useCallback(async (childId: string): Promise<JournalEntry[]> => {
    const result = await apiCall(`/journals/child/${childId}`);
    if (result.success) {
      // Backend returns { data: { journals: [...], childInfo: {...} } }
      const data = result.data;
      if (Array.isArray(data)) return data;
      if (data?.journals && Array.isArray(data.journals)) return data.journals;
      return result.journals || [];
    }
    return [];
  }, []);

  // Get all children's journals
  const getAllChildrenJournals = useCallback(async () => {
    const result = await apiCall("/journals/family");
    if (result.success) {
      // Backend returns { data: { journals: [...] } } or { data: [...] }
      const data = result.data;
      if (Array.isArray(data)) return { success: true, data };
      if (data?.journals && Array.isArray(data.journals)) return { success: true, data: data.journals };
      return { success: true, data: result.journals || [] };
    }
    return { success: false, message: result.message };
  }, []);

  // Get child mood history
  const getChildMoodHistory = useCallback(async (childId: string, period: string = "week"): Promise<MoodEntry[]> => {
    const result = await apiCall(`/parents/child/${childId}/moods?period=${period}`);
    if (result.success) {
      return result.data || result.moods || result.moodHistory || [];
    }
    return [];
  }, []);

  // Get child mood insights (AI analysis) - silently fail if endpoint not available
  const getChildMoodInsights = useCallback(async (childId: string): Promise<any> => {
    try {
      const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) return null;

      const response = await fetch(`${API_BASE}/mood/child/${childId}/insights`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Silently return null if endpoint doesn't exist or returns error
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json") || !response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data || data.insights || null;
    } catch {
      // Silently fail - this endpoint may not be implemented
      return null;
    }
  }, []);

  // Get learning articles
  const getLearningArticles = useCallback(async (params?: { category?: string; page?: number; limit?: number }): Promise<LearningArticle[]> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    
    const endpoint = `/learning/articles${queryParams.toString() ? `?${queryParams}` : ""}`;
    const result = await apiCall(endpoint);
    
    if (result.success) {
      return result.data || result.articles || [];
    }
    return [];
  }, []);

  // Get article details
  const getArticleDetails = useCallback(async (articleId: string) => {
    const result = await apiCall(`/learning/articles/${articleId}`);
    if (result.success) {
      return { success: true, data: result.data || result.article };
    }
    return { success: false, message: result.message };
  }, []);

  // Create activity for children
  const createActivity = useCallback(async (activityData: any) => {
    const result = await apiCall("/activity", {
      method: "POST",
      body: JSON.stringify(activityData),
    });
    return result;
  }, []);

  // Generate child registration code
  const generateChildCode = useCallback(async (childData: { name: string; email: string; dob: string; gender?: string }) => {
    const result = await apiCall("/auth/generate-code", {
      method: "POST",
      body: JSON.stringify({
        childName: childData.name,
        childEmail: childData.email,
        childDOB: childData.dob,
        childGender: childData.gender,
      }),
    });
    
    if (result.success) {
      return { success: true, code: result.code, message: result.message };
    }
    return { success: false, message: result.message };
  }, []);

  // Get child gamification stats (points, badges, streak, level)
  const getChildGamificationStats = useCallback(async (childId: string) => {
    // Try to get from child details endpoint which includes gamification data
    const result = await apiCall(`/parents/children-list/${childId}`);
    if (result.success) {
      const child = result.child || result.data;
      return { 
        success: true, 
        data: {
          points: child?.points || 0,
          level: child?.level || Math.floor((child?.points || 0) / 100) + 1,
          currentStreak: child?.currentStreak || child?.streakCount || 0,
          longestStreak: child?.longestStreak || child?.currentStreak || 0,
          badges: child?.badges || [],
          completedActivities: child?.completedActivities || 0,
          lastActivityDate: child?.lastActivity,
        }
      };
    }
    return { success: false, message: result.message };
  }, []);

  // Get child activities
  const getChildActivities = useCallback(async (childId: string, status?: string) => {
    const endpoint = status 
      ? `/parents/child/${childId}/activities?status=${status}`
      : `/parents/child/${childId}/activities`;
    const result = await apiCall(endpoint);
    if (result.success) {
      return { success: true, data: result.data?.activities || result.activities || [] };
    }
    return { success: false, message: result.message };
  }, []);

  // Get family dashboard summary
  const getFamilyDashboard = useCallback(async () => {
    const result = await apiCall("/parents/dashboard");
    if (result.success) {
      return { success: true, data: result.dashboard || result.data };
    }
    return { success: false, message: result.message };
  }, []);

  // Get family activity feed - aggregates recent activities from all children
  const getFamilyActivityFeed = useCallback(async () => {
    const feed: FamilyActivityFeed[] = [];
    
    // Get all children data
    const childrenResult = await apiCall("/parents/children-list");
    if (!childrenResult.success) {
      return { success: false, message: childrenResult.message };
    }
    
    const childrenList = childrenResult.children || childrenResult.data || [];
    
    // For each child, get their recent moods and activities
    for (const child of childrenList) {
      const childId = child._id || child.id;
      const childName = child.user?.name || child.name || "Child";
      
      // Get recent moods
      try {
        const moodsResult = await apiCall(`/parents/child/${childId}/moods?limit=5`);
        if (moodsResult.success) {
          const moods = moodsResult.data || moodsResult.moods || [];
          moods.forEach((mood: any) => {
            feed.push({
              _id: mood._id || `mood-${childId}-${mood.createdAt}`,
              childId,
              childName,
              type: "mood_checkin",
              title: `${childName} checked in`,
              description: mood.textNote || `Feeling ${mood.emoji || "okay"}`,
              timestamp: mood.createdAt,
              data: { emoji: mood.emoji, moodScore: mood.moodScore, trustZone: mood.trustZone },
            });
          });
        }
      } catch (e) {
        // Continue with other children
      }
      
      // Add gamification milestones if available
      if (child.points && child.points > 0) {
        const level = Math.floor(child.points / 100) + 1;
        if (child.points % 100 === 0 || level > 1) {
          feed.push({
            _id: `points-${childId}-${child.points}`,
            childId,
            childName,
            type: "points_earned",
            title: `${childName} earned points`,
            description: `Total: ${child.points} points (Level ${level})`,
            timestamp: child.lastActivity || new Date().toISOString(),
            data: { points: child.points, level },
          });
        }
      }
      
      // Add streak milestone
      if (child.currentStreak && child.currentStreak >= 3) {
        feed.push({
          _id: `streak-${childId}-${child.currentStreak}`,
          childId,
          childName,
          type: "streak_milestone",
          title: `${childName} is on a streak!`,
          description: `${child.currentStreak} day streak 🔥`,
          timestamp: child.lastActivity || new Date().toISOString(),
          data: { streak: child.currentStreak },
        });
      }
    }
    
    // Sort by timestamp (newest first)
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    setFamilyActivityFeed(feed.slice(0, 20)); // Keep top 20
    return { success: true, data: feed };
  }, []);

  // Award points to child
  const awardPointsToChild = useCallback(async (childId: string, points: number, reason: string) => {
    const result = await apiCall("/gamification/award-points", {
      method: "POST",
      body: JSON.stringify({ childId, points, reason }),
    });
    return result;
  }, []);

  return (
    // @ts-expect-error - React 19 Context type compatibility issue
    <ParentContext.Provider
      value={{
        children,
        loading,
        familyActivityFeed,
        getChildren,
        getChildDetails,
        getChildMoodSummary,
        getChildMoodHistory,
        getChildMoodInsights,
        getChildJournals,
        getAllChildrenJournals,
        getChildGamificationStats,
        getChildActivities,
        getFamilyDashboard,
        getFamilyActivityFeed,
        getLearningArticles,
        getArticleDetails,
        createActivity,
        generateChildCode,
        awardPointsToChild,
      }}
    >
      {childrenProp}
    </ParentContext.Provider>
  );
}

export function useParent() {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error("useParent must be used within a ParentProvider");
  }
  return context;
}
