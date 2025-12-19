// context/ConversationContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://family-wellness.onrender.com/api/v1';
const LOCAL_API_URL = 'http://localhost:5000/api/v1';

// ============================================================
// TYPES
// ============================================================

interface MoodContext {
  currentMood?: {
    emoji: string;
    moodScore: number;
    trustZone: string;
    lastCheckinAt: string;
  } | null;
  moodTrend?: {
    weeklyAverage: number | null;
    trend: 'improving' | 'stable' | 'declining';
    daysTracked: number;
  };
  recentJournalThemes?: string[];
  interests?: string[];
  activityEngagement?: {
    completedThisWeek: number;
    favoriteCategory: string | null;
  };
}

interface MessageMetadata {
  moodScore?: number;
  trustZone?: string;
  aiConfidence?: number;
  suggestedActivity?: string;
}

interface Message {
  _id: string;
  sender?: string;
  role: 'user' | 'child' | 'parent' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'voice' | 'suggestion' | 'mood_insight' | 'activity';
  metadata?: MessageMetadata;
  flagged?: boolean;
  flagReason?: string;
  createdAt: string;
}

interface Participant {
  user: {
    _id: string;
    name: string;
    avatar?: { url: string };
  };
  role: 'parent' | 'child';
  joinedAt: string;
  lastReadAt?: string;
}

interface ConversationStats {
  messagesCount: number;
  sessionDuration: number;
  moodImproved: boolean | null;
}

interface AIConversation {
  conversationId: string;
  type: 'ai_chat';
  context: MoodContext;
  messages: Message[];
  moodAtStart?: {
    emoji: string;
    moodScore: number;
    trustZone: string;
  } | null;
  stats?: ConversationStats;
}

interface FamilyConversation {
  _id: string;
  type: 'family_chat' | 'parent_child' | 'sibling';
  participants: Participant[];
  lastMessage?: Message;
  unreadCount?: number;
  createdAt: string;
}

interface SafetyCheck {
  flagged: boolean;
  category?: string;
}

interface ConversationContextType {
  // AI Chat
  aiConversation: AIConversation | null;
  aiLoading: boolean;
  getOrCreateAIChat: () => Promise<AIConversation | null>;
  sendAIMessage: (content: string) => Promise<Message | null>;
  addAIResponse: (content: string, metadata?: Partial<MessageMetadata>) => Promise<Message | null>;
  endAIChat: () => Promise<void>;
  
  // Family Chat
  familyConversations: FamilyConversation[];
  familyLoading: boolean;
  getFamilyChats: () => Promise<FamilyConversation[]>;
  createFamilyChat: (participantIds: string[], type?: string) => Promise<FamilyConversation | null>;
  getConversationHistory: (conversationId: string, limit?: number) => Promise<Message[]>;
  sendFamilyMessage: (conversationId: string, content: string) => Promise<Message | null>;
  markConversationRead: (conversationId: string) => Promise<void>;
  
  // Edit & Delete
  editMessage: (conversationId: string, messageId: string, content: string) => Promise<Message | null>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<boolean>;
  
  // Utility
  error: string | null;
  clearError: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  // AI Chat State
  const [aiConversation, setAIConversation] = useState<AIConversation | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  
  // Family Chat State
  const [familyConversations, setFamilyConversations] = useState<FamilyConversation[]>([]);
  const [familyLoading, setFamilyLoading] = useState(false);
  
  // Error State
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // API HELPER
  // ============================================================
  
  const makeRequest = async (
    endpoint: string, 
    method: string = 'GET', 
    body?: any
  ): Promise<any> => {
    const token = await AsyncStorage.getItem('kivelo_access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const urls = [LOCAL_API_URL, API_URL];
    let lastError: Error | null = null;
    
    for (const baseUrl of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `Request failed with status ${response.status}`;
          
          // For client errors (4xx except 404), throw immediately - don't try other servers
          // 404 might mean route doesn't exist on this server, try next
          // 5xx means server error, try next server
          if (response.status >= 400 && response.status < 500 && response.status !== 404) {
            throw new Error(errorMessage);
          }
          
          // For 404 or 5xx, store error and try next server
          lastError = new Error(errorMessage);
          console.log(`Request to ${baseUrl} failed with ${response.status}:`, errorMessage);
          continue;
        }

        return await response.json();
      } catch (err: any) {
        // If it's our thrown error (client error like 401, 403), re-throw immediately
        if (err.message && !err.message.includes('Network') && !err.message.includes('fetch') && err.name !== 'AbortError') {
          // Check if it's a known HTTP error we want to propagate
          if (err.message.includes('status') || err.message.includes('Unauthorized') || 
              err.message.includes('Forbidden') || err.message.includes('not found')) {
            throw err;
          }
        }
        
        if (err.name === 'AbortError') {
          console.log(`Request to ${baseUrl} timed out`);
          lastError = new Error(`Request to ${baseUrl} timed out`);
        } else {
          console.log(`Request to ${baseUrl} failed:`, err.message);
          lastError = err;
        }
        // Try next URL for network errors
        continue;
      }
    }

    // If we have a specific error message, use it instead of generic message
    throw lastError || new Error('All API servers unavailable');
  };

  // ============================================================
  // AI CHAT METHODS
  // ============================================================
  
  /**
   * Get or create AI conversation with mood context
   */
  const getOrCreateAIChat = useCallback(async (): Promise<AIConversation | null> => {
    try {
      setAILoading(true);
      setError(null);
      
      const response = await makeRequest('/conversations/ai', 'GET');
      
      if (response.success && response.data) {
        const conversation: AIConversation = {
          conversationId: response.data.conversationId,
          type: 'ai_chat',
          context: response.data.context || {},
          messages: response.data.messages || [],
          moodAtStart: response.data.moodAtStart,
          stats: response.data.stats
        };
        setAIConversation(conversation);
        return conversation;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error getting AI conversation:', err.message);
      setError(err.message);
      return null;
    } finally {
      setAILoading(false);
    }
  }, []);

  /**
   * Send a message in the AI conversation
   */
  const sendAIMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (!aiConversation?.conversationId) {
      setError('No active AI conversation');
      return null;
    }

    try {
      setError(null);
      
      const response = await makeRequest('/conversations/message', 'POST', {
        conversationId: aiConversation.conversationId,
        content,
        type: 'text'
      });

      if (response.success && response.data?.message) {
        const newMessage = response.data.message;
        
        // Update local state
        setAIConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          };
        });

        // If message was flagged, log it (but don't show to child)
        if (response.data.safetyCheck?.flagged) {
          console.log('Message flagged for safety:', response.data.safetyCheck.category);
        }

        return newMessage;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error sending AI message:', err.message);
      setError(err.message);
      return null;
    }
  }, [aiConversation]);

  /**
   * Add an AI assistant response to the conversation
   */
  const addAIResponse = useCallback(async (
    content: string, 
    metadata?: Partial<MessageMetadata>
  ): Promise<Message | null> => {
    if (!aiConversation?.conversationId) {
      setError('No active AI conversation');
      return null;
    }

    try {
      setError(null);
      
      const response = await makeRequest('/conversations/ai/response', 'POST', {
        conversationId: aiConversation.conversationId,
        content,
        type: metadata?.suggestedActivity ? 'activity' : 'text',
        metadata
      });

      if (response.success && response.data?.message) {
        const newMessage = response.data.message;
        
        // Update local state
        setAIConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage]
          };
        });

        return newMessage;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error adding AI response:', err.message);
      setError(err.message);
      return null;
    }
  }, [aiConversation]);

  /**
   * End the current AI conversation
   */
  const endAIChat = useCallback(async (): Promise<void> => {
    if (!aiConversation?.conversationId) return;

    try {
      await makeRequest(`/conversations/ai/${aiConversation.conversationId}/end`, 'POST');
      setAIConversation(null);
    } catch (err: any) {
      console.error('Error ending AI chat:', err.message);
    }
  }, [aiConversation]);

  // ============================================================
  // FAMILY CHAT METHODS
  // ============================================================
  
  /**
   * Get all family conversations
   */
  const getFamilyChats = useCallback(async (): Promise<FamilyConversation[]> => {
    try {
      setFamilyLoading(true);
      setError(null);
      
      const response = await makeRequest('/conversations/family', 'GET');
      
      if (response.success && response.data) {
        setFamilyConversations(response.data);
        return response.data;
      }
      
      return [];
    } catch (err: any) {
      console.error('Error getting family conversations:', err.message);
      setError(err.message);
      return [];
    } finally {
      setFamilyLoading(false);
    }
  }, []);

  /**
   * Create a new family conversation
   */
  const createFamilyChat = useCallback(async (
    participantIds: string[], 
    type: string = 'family_chat'
  ): Promise<FamilyConversation | null> => {
    try {
      setError(null);
      
      const response = await makeRequest('/conversations/family', 'POST', {
        participantIds,
        type
      });

      if (response.success && response.data) {
        // Add to local state
        setFamilyConversations(prev => [response.data, ...prev]);
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error creating family chat:', err.message);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Get conversation history with pagination
   */
  const getConversationHistory = useCallback(async (
    conversationId: string, 
    limit: number = 50
  ): Promise<Message[]> => {
    try {
      setError(null);
      
      const response = await makeRequest(
        `/conversations/${conversationId}?limit=${limit}`, 
        'GET'
      );

      if (response.success && response.data?.messages) {
        return response.data.messages;
      }
      
      return [];
    } catch (err: any) {
      console.error('Error getting conversation history:', err.message);
      setError(err.message);
      return [];
    }
  }, []);

  /**
   * Send a message in a family conversation
   */
  const sendFamilyMessage = useCallback(async (
    conversationId: string, 
    content: string
  ): Promise<Message | null> => {
    try {
      setError(null);
      
      const response = await makeRequest('/conversations/message', 'POST', {
        conversationId,
        content,
        type: 'text'
      });

      if (response.success && response.data?.message) {
        const newMessage = response.data.message;
        
        // Update local state for the specific conversation
        setFamilyConversations(prev => 
          prev.map(conv => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: newMessage
              };
            }
            return conv;
          })
        );

        return newMessage;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error sending family message:', err.message);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Mark a conversation as read
   */
  const markConversationRead = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await makeRequest(`/conversations/${conversationId}/read`, 'POST');
      
      // Update local state
      setFamilyConversations(prev => 
        prev.map(conv => {
          if (conv._id === conversationId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    } catch (err: any) {
      console.error('Error marking conversation read:', err.message);
    }
  }, []);

  /**
   * Edit a message in a conversation
   */
  const editMessage = useCallback(async (
    conversationId: string,
    messageId: string,
    content: string
  ): Promise<Message | null> => {
    try {
      setError(null);
      
      const response = await makeRequest(
        `/conversations/${conversationId}/messages/${messageId}`,
        'PUT',
        { content }
      );

      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (err: any) {
      console.error('Error editing message:', err.message);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Delete a message from a conversation
   */
  const deleteMessage = useCallback(async (
    conversationId: string,
    messageId: string
  ): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await makeRequest(
        `/conversations/${conversationId}/messages/${messageId}`,
        'DELETE'
      );

      return response.success === true;
    } catch (err: any) {
      console.error('Error deleting message:', err.message);
      setError(err.message);
      return false;
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================
  // CONTEXT VALUE
  // ============================================================
  
  const value: ConversationContextType = {
    // AI Chat
    aiConversation,
    aiLoading,
    getOrCreateAIChat,
    sendAIMessage,
    addAIResponse,
    endAIChat,
    
    // Family Chat
    familyConversations,
    familyLoading,
    getFamilyChats,
    createFamilyChat,
    getConversationHistory,
    sendFamilyMessage,
    markConversationRead,
    
    // Edit & Delete
    editMessage,
    deleteMessage,
    
    // Utility
    error,
    clearError
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
};
