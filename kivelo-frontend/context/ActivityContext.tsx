import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Activity {
  _id: string;
  title: string;
  description: string;
  category: 'education' | 'physical' | 'creative' | 'chores' | 'social' | 'mindfulness';
  points: number;
  duration: number;
  assignedTo: {
    _id: string;
    name?: string;
  }[] | string[];
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  getActivities: () => Promise<void>;
  completeActivity: (activityId: string) => Promise<void>;
  refreshActivities: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

// API URL - using deployed backend only
const API_URLS = [
  'https://family-wellness.onrender.com/api/v1'
];

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
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

  // Get user's activities (child gets assigned, parent gets created)
  const getActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/activities');
      
      // No token available - user not logged in, clear state silently
      if (!response) {
        setActivities([]);
        return;
      }

      const result = await response.json();

      if (result.success) {
        setActivities(result.activities || []);
      } else {
        setError(result.message || 'Failed to fetch activities');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
      // Don't log expected auth errors
      if (!errorMessage.includes('token')) {
        console.error('Get activities error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete an activity (child only)
  const completeActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/activities/${activityId}/complete`, {
        method: 'POST',
      });

      // No token available
      if (!response) {
        throw new Error('Please log in to complete activities');
      }

      const result = await response.json();

      if (result.success) {
        // Refresh activities list to show updated status
        await getActivities();
      } else {
        throw new Error(result.message || 'Failed to complete activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete activity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getActivities]);

  // Refresh activities
  const refreshActivities = useCallback(async () => {
    await getActivities();
  }, [getActivities]);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        loading,
        error,
        getActivities,
        completeActivity,
        refreshActivities,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
};
