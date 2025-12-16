// context/JournalContext.tsx
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URLS = [
  "https://family-wellness.onrender.com/api/v1",
];

const ACCESS_TOKEN_KEY = "kivelo_access_token";

// Types
export interface JournalEntry {
  _id: string;
  child: string;
  type: "text" | "audio" | "video" | "drawing" | "photo" | "voice" | "mixed";
  title: string;
  content: string;
  assets?: string[];
  visibility: "private" | "parent-only" | "family" | "public";
  mood: "happy" | "sad" | "angry" | "anxious" | "excited" | "calm" | "tired" | "neutral";
  moodIntensity: number;
  tags?: string[];
  isPrivate: boolean;
  wordCount?: number;
  readTime?: number;
  aiAnalysis?: {
    summary?: string;
    keywords?: string[];
    sentiment?: "positive" | "neutral" | "negative";
    suggestions?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface JournalStats {
  totalEntries: number;
  totalWords: number;
  averageWordsPerEntry: number;
  moodDistribution: Record<string, number>;
  streak: number;
  lastEntryDate?: string;
}

export interface CreateJournalData {
  type?: "text" | "audio" | "video" | "drawing" | "photo" | "voice" | "mixed";
  title: string;
  content: string;
  mood?: string;
  moodIntensity?: number;
  visibility?: "private" | "parent-only" | "family" | "public";
  tags?: string[];
  assets?: string[];
}

interface JournalContextType {
  journals: JournalEntry[];
  isLoading: boolean;
  stats: JournalStats | null;
  createJournal: (data: CreateJournalData) => Promise<{ success: boolean; message?: string; data?: JournalEntry; pointsEarned?: number }>;
  getMyJournals: (page?: number, limit?: number) => Promise<{ success: boolean; data?: JournalEntry[]; pagination?: any }>;
  getJournal: (journalId: string) => Promise<{ success: boolean; data?: JournalEntry }>;
  updateJournal: (journalId: string, updates: Partial<CreateJournalData>) => Promise<{ success: boolean; message?: string; data?: JournalEntry }>;
  deleteJournal: (journalId: string) => Promise<{ success: boolean; message?: string }>;
  getJournalStats: () => Promise<{ success: boolean; data?: JournalStats }>;
  getJournalPrompts: () => Promise<{ success: boolean; data?: string[] }>;
  refreshJournals: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<JournalStats | null>(null);

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
        console.warn(`❌ Network error with ${baseUrl}:`, error.message);
      }
    }
    
    return { error: lastError };
  };

  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Create a new journal entry
  const createJournal = useCallback(async (data: CreateJournalData) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback("/journals", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: data.type || "text",
          title: data.title,
          content: data.content,
          mood: data.mood || "neutral",
          moodIntensity: data.moodIntensity || 5,
          visibility: data.visibility || "parent-only",
          tags: data.tags || [],
        }),
      });

      if (result.error) {
        return result.error;
      }

      const newJournal = result.data?.data;
      if (newJournal) {
        setJournals(prev => [newJournal, ...prev]);
      }

      return {
        success: true,
        data: newJournal,
        pointsEarned: result.data?.pointsEarned || 0,
        message: result.data?.message || "Journal entry created!",
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to create journal" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get all journals for the logged-in child
  const getMyJournals = useCallback(async (page = 1, limit = 20) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback(`/journals/my-journals?page=${page}&limit=${limit}`, {
        method: "GET",
        headers,
      });

      if (result.error) {
        return result.error;
      }

      const fetchedJournals = result.data?.data?.journals || result.data?.data || [];
      
      if (page === 1) {
        setJournals(fetchedJournals);
      } else {
        setJournals(prev => [...prev, ...fetchedJournals]);
      }

      return {
        success: true,
        data: fetchedJournals,
        pagination: result.data?.pagination,
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to fetch journals" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single journal entry
  const getJournal = useCallback(async (journalId: string) => {
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback(`/journals/${journalId}`, {
        method: "GET",
        headers,
      });

      if (result.error) {
        return result.error;
      }

      return {
        success: true,
        data: result.data?.data,
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to fetch journal" };
    }
  }, []);

  // Update a journal entry
  const updateJournal = useCallback(async (journalId: string, updates: Partial<CreateJournalData>) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback(`/journals/${journalId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updates),
      });

      if (result.error) {
        return result.error;
      }

      const updatedJournal = result.data?.data;
      if (updatedJournal) {
        setJournals(prev =>
          prev.map(j => (j._id === journalId ? updatedJournal : j))
        );
      }

      return {
        success: true,
        data: updatedJournal,
        message: "Journal updated successfully",
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to update journal" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a journal entry
  const deleteJournal = useCallback(async (journalId: string) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback(`/journals/${journalId}`, {
        method: "DELETE",
        headers,
      });

      if (result.error) {
        return result.error;
      }

      setJournals(prev => prev.filter(j => j._id !== journalId));

      return {
        success: true,
        message: "Journal deleted successfully",
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to delete journal" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get journal statistics
  const getJournalStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback("/journals/stats", {
        method: "GET",
        headers,
      });

      if (result.error) {
        return result.error;
      }

      const fetchedStats = result.data?.data;
      if (fetchedStats) {
        setStats(fetchedStats);
      }

      return {
        success: true,
        data: fetchedStats,
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to fetch stats" };
    }
  }, []);

  // Get journal prompts/suggestions
  const getJournalPrompts = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const result = await apiCallWithFallback("/journals/prompts", {
        method: "GET",
        headers,
      });

      if (result.error) {
        // Return default prompts if API fails
        return {
          success: true,
          data: [
            "What made you smile today?",
            "What's something new you learned?",
            "Who did you play with today?",
            "What's your favorite thing about today?",
            "What are you grateful for?",
            "What's something kind you did for someone?",
            "What's a challenge you faced today?",
            "What's your wish for tomorrow?",
          ],
        };
      }

      return {
        success: true,
        data: result.data?.data || [],
      };
    } catch (error: any) {
      return { success: false, message: error.message || "Failed to fetch prompts" };
    }
  }, []);

  // Refresh journals list
  const refreshJournals = useCallback(async () => {
    await getMyJournals(1, 20);
  }, [getMyJournals]);

  return (
    <JournalContext.Provider
      value={{
        journals,
        isLoading,
        stats,
        createJournal,
        getMyJournals,
        getJournal,
        updateJournal,
        deleteJournal,
        getJournalStats,
        getJournalPrompts,
        refreshJournals,
      }}
    >
      {children}
    </JournalContext.Provider>
  );
}

export function useJournal() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournal must be used within a JournalProvider");
  }
  return context;
}
