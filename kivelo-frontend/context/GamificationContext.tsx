import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Badge {
  _id: string;
  badgeId?: {
    _id: string;
    name: string;
    iconUrl: string;
    description: string;
  };
  earnedAt?: string;
  name?: string;
  iconUrl?: string;
  description?: string;
  pointsRequired?: number;
}

export interface GamificationStats {
  points: number;
  streakCount: number;
  badges: Badge[];
  level: number;
  nextLevelPoints: number;
}

export interface RedeemRewardResponse {
  rewardId: string;
  pointsSpent: number;
  remainingPoints: number;
}

interface GamificationContextType {
  stats: GamificationStats | null;
  availableBadges: Badge[];
  loading: boolean;
  error: string | null;
  getStats: () => Promise<void>;
  getBadges: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<RedeemRewardResponse>;
  refreshStats: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// API URL - using deployed backend only
const API_URLS = [
  'https://family-wellness.onrender.com/api/v1'
];

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to make API calls with fallback
  const makeAuthenticatedRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response | null> => {
    const token = await AsyncStorage.getItem('kivelo_access_token');
    
    if (!token) {
      // Return null instead of throwing - caller should handle gracefully
      return null;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    let lastError: Error | null = null;

    for (const baseUrl of API_URLS) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers,
        });

        if (response.ok || response.status < 500) {
          return response;
        }
      } catch (err) {
        lastError = err as Error;
        console.log(`Trying next URL after error: ${err}`);
      }
    }

    throw lastError || new Error('All API endpoints failed');
  };

  // Get gamification stats (points, streak, badges, level)
  const getStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/gamification/stats');
      
      // No token available - user not logged in, clear state silently
      if (!response) {
        setStats(null);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.message || 'Failed to fetch stats');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gamification stats';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available badges
  const getBadges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/gamification/badges');
      
      // No token available - user not logged in, clear state silently
      if (!response) {
        setAvailableBadges([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setAvailableBadges(result.data || []);
      } else {
        setError(result.message || 'Failed to fetch badges');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch badges';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Redeem reward
  const redeemReward = useCallback(async (rewardId: string): Promise<RedeemRewardResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/gamification/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      });

      // No token available
      if (!response) {
        throw new Error('Please log in to redeem rewards');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh stats after redeeming
        await getStats();
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to redeem reward');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to redeem reward';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getStats]);

  // Refresh stats (for after completing activities, mood check-ins, etc.)
  const refreshStats = useCallback(async () => {
    await getStats();
  }, [getStats]);

  return (
    <GamificationContext.Provider
      value={{
        stats,
        availableBadges,
        loading,
        error,
        getStats,
        getBadges,
        redeemReward,
        refreshStats,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
