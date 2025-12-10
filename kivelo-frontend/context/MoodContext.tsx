// context/MoodContext.tsx
import { createContext, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URLS = [
  "https://family-wellness.onrender.com/api/v1",
];

const ACCESS_TOKEN_KEY = "kivelo_access_token";

// Types
export interface MoodCheckin {
  _id: string;
  child: string;
  type: "emoji" | "text" | "voice" | "drawing" | "numeric" | "combined";
  emoji?: string;
  textNote?: string;
  voiceNote?: {
    url: string;
    duration: number;
    public_id: string;
  };
  drawing?: {
    url: string;
    public_id: string;
  };
  moodScore: number;
  trustZone: "green" | "yellow" | "orange" | "red";
  tags?: string[];
  context?: {
    location?: string;
    activity?: string;
    people?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface MoodStats {
  averageScore: number;
  totalEntries: number;
  trustZoneDistribution: {
    green?: number;
    yellow?: number;
    orange?: number;
    red?: number;
  };
  frequentEmojis: Record<string, number>;
  currentTrustZone: string;
}

interface MoodContextType {
  submitMood: (moodData: {
    emoji?: string;
    textNote?: string;
    moodScore?: number;
    tags?: string[];
  }) => Promise<{ success: boolean; message?: string; data?: MoodCheckin }>;
  getMoodHistory: (period?: string, limit?: number) => Promise<{ success: boolean; data?: MoodCheckin[]; stats?: MoodStats }>;
  getTodayMood: () => Promise<{ success: boolean; data?: MoodCheckin; hasCheckedInToday?: boolean }>;
  getMoodStats: () => Promise<{ success: boolean; data?: MoodStats }>;
  deleteMood: (moodId: string) => Promise<{ success: boolean; message?: string }>;
  updateMood: (moodId: string, updates: Partial<MoodCheckin>) => Promise<{ success: boolean; message?: string; data?: MoodCheckin }>;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  // user not required in this context implementation

  // API call helper with fallback
  const apiCallWithFallback = async (endpoint: string, options: RequestInit = {}) => {
    let lastError = null;
    
    for (const baseUrl of API_URLS) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, options);
        
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          
          lastError = { success: false, message: errorMessage };
          console.warn(`❌ Failed with ${baseUrl}:`, errorMessage);
          continue;
        }

        const data = await response.json();
        return { response, data };
        
      } catch (error: any) {
        lastError = {
          success: false,
          message: `Network error: ${error.message}`
        };
        console.warn(`🌐 Network error with ${baseUrl}:`, error.message);
      }
    }

    throw new Error(lastError?.message || "Unable to connect to server");
  };

  // Submit mood check-in
  const submitMood = async (moodData: {
    emoji?: string;
    textNote?: string;
    moodScore?: number;
    tags?: string[];
  }) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback("/mood/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(moodData),
      });

      if (data.success) {
        return {
          success: true,
          message: data.message || "Mood recorded successfully!",
          data: data.data
        };
      } else {
        return { success: false, message: data.message || "Failed to record mood" };
      }
    } catch (error: any) {
      console.error("Submit mood error:", error);
      return { success: false, message: error.message || "Failed to record mood. Please try again." };
    }
  };

  // Get mood history
  const getMoodHistory = async (period: string = "week", limit: number = 50) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback(
        `/mood/history?period=${period}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        }
      );

      if (data.success) {
        return {
          success: true,
          data: data.data,
          stats: data.stats
        };
      } else {
        return { success: false, message: data.message || "Failed to fetch mood history" };
      }
    } catch (error: any) {
      console.error("Get mood history error:", error);
      return { success: false, message: error.message || "Failed to fetch mood history." };
    }
  };

  // Get today's mood
  const getTodayMood = async () => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback("/mood/today", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (data.success) {
        return {
          success: true,
          data: data.data,
          hasCheckedInToday: data.hasCheckedInToday
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error: any) {
      console.error("Get today mood error:", error);
      return { success: false, message: error.message || "Failed to fetch today's mood." };
    }
  };

  // Get mood stats
  const getMoodStats = async () => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback("/mood/stats", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        return { success: false, message: data.message || "Failed to fetch mood stats" };
      }
    } catch (error: any) {
      console.error("Get mood stats error:", error);
      return { success: false, message: error.message || "Failed to fetch mood stats." };
    }
  };

  // Delete mood entry
  const deleteMood = async (moodId: string) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback(`/mood/${moodId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      if (data.success) {
        return {
          success: true,
          message: data.message || "Mood deleted successfully"
        };
      } else {
        return { success: false, message: data.message || "Failed to delete mood" };
      }
    } catch (error: any) {
      console.error("Delete mood error:", error);
      return { success: false, message: error.message || "Failed to delete mood." };
    }
  };

  // Update mood entry
  const updateMood = async (moodId: string, updates: Partial<MoodCheckin>) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        return { success: false, message: "Not authenticated. Please log in again." };
      }

      const { data } = await apiCallWithFallback(`/mood/${moodId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates),
      });

      if (data.success) {
        return {
          success: true,
          message: data.message || "Mood updated successfully",
          data: data.data
        };
      } else {
        return { success: false, message: data.message || "Failed to update mood" };
      }
    } catch (error: any) {
      console.error("Update mood error:", error);
      return { success: false, message: error.message || "Failed to update mood." };
    }
  };

  return (
    <MoodContext.Provider
      value={{
        submitMood,
        getMoodHistory,
        getTodayMood,
        getMoodStats,
        deleteMood,
        updateMood,
      }}
    >
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => {
  const context = useContext(MoodContext);
  if (!context) throw new Error("useMood must be used within MoodProvider");
  return context;
};
