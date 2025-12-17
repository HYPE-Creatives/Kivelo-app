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

export interface CreateActivityData {
  title: string;
  description: string;
  category: 'education' | 'physical' | 'creative' | 'chores' | 'social' | 'mindfulness';
  points: number;
  duration: number;
  assignedTo: string[];
  dueDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  category?: 'education' | 'physical' | 'creative' | 'chores' | 'social' | 'mindfulness';
  points?: number;
  duration?: number;
  assignedTo?: string[];
  dueDate?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

interface ActivityContextType {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  getActivities: () => Promise<void>;
  createActivity: (data: CreateActivityData) => Promise<{ success: boolean; message?: string; activity?: Activity }>;
  updateActivity: (activityId: string, data: UpdateActivityData) => Promise<{ success: boolean; message?: string; activity?: Activity }>;
  deleteActivity: (activityId: string) => Promise<{ success: boolean; message?: string }>;
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

  // Helper function to make API calls with fallback and timeout
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
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Return response for caller to handle (including 4xx errors)
        if (response.ok || response.status < 500) {
          return response;
        }
        
        // 5xx errors - try next URL
        lastError = new Error(`Server error: ${response.status}`);
      } catch (err) {
        lastError = err as Error;
        if ((err as Error).name === 'AbortError') {
          lastError = new Error('Request timed out. The server may be waking up, please try again.');
        }
        console.log(`API error: ${lastError.message}`);
      }
    }

    throw lastError || new Error('Failed to connect to server. Please check your internet connection.');
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

  // Create a new activity (parent only)
  const createActivity = useCallback(async (data: CreateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest('/activities', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (!response) {
        return { success: false, message: 'Please log in to create activities' };
      }

      const result = await response.json();

      if (result.success) {
        await getActivities(); // Refresh list
        return { success: true, activity: result.activity };
      } else {
        return { success: false, message: result.message || 'Failed to create activity' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create activity';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getActivities]);

  // Update an activity (parent only)
  const updateActivity = useCallback(async (activityId: string, data: UpdateActivityData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/activities/${activityId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });

      if (!response) {
        return { success: false, message: 'Please log in to update activities' };
      }

      const result = await response.json();

      if (result.success) {
        await getActivities(); // Refresh list
        return { success: true, activity: result.activity };
      } else {
        return { success: false, message: result.message || 'Failed to update activity' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [getActivities]);

  // Delete an activity (parent only)
  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (!response) {
        return { success: false, message: 'Please log in to delete activities' };
      }

      const result = await response.json();

      if (result.success) {
        await getActivities(); // Refresh list
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Failed to delete activity' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      return { success: false, message: errorMessage };
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
        createActivity,
        updateActivity,
        deleteActivity,
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
