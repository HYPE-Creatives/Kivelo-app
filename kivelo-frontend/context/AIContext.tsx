import { createContext, useContext, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URLS = [
  "https://family-wellness.onrender.com/api/v1",
];

// Mock responses for when AI is offline
const MOCK_RESPONSES = {
  greeting: [
    "Hi there! 👋 I'm your AI buddy. How can I help you today?",
    "Hello friend! 🌟 What's on your mind?",
    "Hey! I'm here to chat whenever you need me! 😊",
  ],
  homework: [
    "I'd love to help with your homework! 📚 What subject are you working on? I can explain things in a fun way!",
    "Homework time! 🎓 Tell me what you're stuck on and we'll figure it out together!",
    "Let's tackle that homework! 💪 What subject do you need help with?",
  ],
  sad: [
    "I'm sorry you're feeling sad. 💙 It's okay to have these feelings. Want to tell me what's on your mind?",
    "Sending you a virtual hug! 🤗 I'm here to listen. What's making you feel this way?",
    "It's okay to feel sad sometimes. 💜 Would you like to talk about it? I'm a good listener!",
  ],
  happy: [
    "That's amazing! 🎉 I love hearing that! What made your day so awesome?",
    "Yay! 🌈 Happy vibes! Tell me all about what's making you smile!",
    "So glad you're feeling great! ⭐ Want to share the good news?",
  ],
  joke: [
    "Why don't scientists trust atoms? Because they make up everything! 😄",
    "What do you call a fish without eyes? A fsh! 🐟",
    "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾😂",
    "What do you call a bear with no teeth? A gummy bear! 🐻",
    "Why did the cookie go to the doctor? Because it was feeling crummy! 🍪",
  ],
  game: [
    "I love games! 🎮 Want to play 20 questions, would you rather, or a riddle game?",
    "Game time! 🎲 How about we play a word game or I tell you a riddle?",
    "Let's have fun! 🎯 I can tell riddles, play word games, or we can do trivia!",
  ],
  default: [
    "That's interesting! Tell me more about it! 😊",
    "I'm listening! What else would you like to share? 💭",
    "Thanks for telling me! How does that make you feel? 🌟",
    "I'm here for you! What else is on your mind? 💜",
  ],
};

const getRandomResponse = (category: keyof typeof MOCK_RESPONSES): string => {
  const responses = MOCK_RESPONSES[category];
  return responses[Math.floor(Math.random() * responses.length)];
};

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

interface AIContextType {
  sendMessage: (message: string) => Promise<string>;
  getChatHistory: () => Promise<Message[]>;
  clearChatHistory: () => Promise<void>;
  isLoading: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  const makeRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const token = await AsyncStorage.getItem('kivelo_access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    for (const baseUrl of API_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
          throw new Error(errorData.message || 'Request failed');
        }

        return await response.json();
      } catch (error: any) {
        console.log('API request failed:', error.message);
        continue; // Try next URL or fall through to throw
      }
    }

    throw new Error('API_OFFLINE');
  };

  const sendMessage = async (message: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await makeRequest('/ai/chat', 'POST', { message });
      
      // Backend returns { reply, isMock, timestamp }
      return response.reply || response.message || getSmartFallbackResponse(message);
    } catch (error: any) {
      console.log('AI service unavailable, using fallback:', error.message);
      // Always return a friendly fallback response - never show errors to kids
      return getSmartFallbackResponse(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getChatHistory = async (): Promise<Message[]> => {
    try {
      const response = await makeRequest('/ai/chat/history', 'GET');
      
      // Transform backend format to our Message format
      if (response.conversations && Array.isArray(response.conversations)) {
        return response.conversations.map((conv: any) => ({
          role: conv.sender === 'user' ? 'user' : 'ai',
          text: conv.message,
          timestamp: conv.timestamp,
        }));
      }
      
      return [];
    } catch (error) {
      console.log('Could not fetch chat history, starting fresh');
      return []; // Return empty array, don't throw
    }
  };

  const clearChatHistory = async (): Promise<void> => {
    try {
      await makeRequest('/ai/chat/clear-history', 'DELETE');
    } catch (error) {
      console.log('Could not clear history on server');
      // Don't throw - just log it
    }
  };

  const getSmartFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords and return appropriate category response
    if (lowerMessage.includes('homework') || lowerMessage.includes('school') || lowerMessage.includes('study') || lowerMessage.includes('help with')) {
      return getRandomResponse('homework');
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('upset') || lowerMessage.includes('crying') || lowerMessage.includes('unhappy')) {
      return getRandomResponse('sad');
    }
    
    if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('good') || lowerMessage.includes('awesome') || lowerMessage.includes('excited')) {
      return getRandomResponse('happy');
    }
    
    if (lowerMessage.includes('joke') || lowerMessage.includes('funny') || lowerMessage.includes('laugh') || lowerMessage.includes('make me laugh')) {
      return getRandomResponse('joke');
    }
    
    if (lowerMessage.includes('game') || lowerMessage.includes('play') || lowerMessage.includes('fun') || lowerMessage.includes('bored')) {
      return getRandomResponse('game');
    }
    
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return getRandomResponse('greeting');
    }
    
    // Default friendly response
    return getRandomResponse('default');
  };

  return (
    <AIContext.Provider value={{ sendMessage, getChatHistory, clearChatHistory, isLoading }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
