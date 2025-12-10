import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface LearningArticle {
  _id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: 'parenting' | 'child_development' | 'education' | 'health' | 'behavior';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadingTime: number;
  readingTime?: number; // Alias for estimatedReadingTime
  tags: string[];
  thumbnailUrl?: string;
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  difficultyLevel?: string; // Alias for difficulty
  isCompleted?: boolean;
}

export interface QuizQuestion {
  _id: string;
  question: string;
  options: {
    id: string;
    text: string;
  }[];
  correctAnswerId: string;
  explanation: string;
}

export interface ArticleWithQuiz {
  article: LearningArticle;
  quiz?: QuizQuestion[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface LearningContextType {
  articles: LearningArticle[];
  currentArticle: ArticleWithQuiz | null;
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  getArticles: (params?: {
    category?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  getArticleWithQuiz: (articleId: string) => Promise<void>;
  markComplete: (articleId: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

// API URL - using deployed backend only
const API_URLS = [
  'https://family-wellness.onrender.com/api/v1'
];

export const LearningProvider = ({ children }: { children: ReactNode }) => {
  const [articles, setArticles] = useState<LearningArticle[]>([]);
  const [currentArticle, setCurrentArticle] = useState<ArticleWithQuiz | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to make API calls with fallback
  const makeAuthenticatedRequest = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await AsyncStorage.getItem('kivelo_access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
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

  // Get learning articles with filters
  const getArticles = useCallback(async (params?: {
    category?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const queryString = queryParams.toString();
      const endpoint = `/learning/articles${queryString ? `?${queryString}` : ''}`;

      const response = await makeAuthenticatedRequest(endpoint);
      const result = await response.json();

      if (result.success) {
        setArticles(result.data || []);
        setPagination(result.pagination || null);
      } else {
        setError(result.message || 'Failed to fetch articles');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch learning articles';
      setError(errorMessage);
      console.error('Get articles error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get article with quiz questions
  const getArticleWithQuiz = useCallback(async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/learning/articles/${articleId}`);
      const result = await response.json();

      if (result.success) {
        setCurrentArticle(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch article');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch article';
      setError(errorMessage);
      console.error('Get article error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark article as complete
  const markComplete = useCallback(async (articleId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await makeAuthenticatedRequest(`/learning/articles/${articleId}/complete`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        // Update local state to mark article as completed
        setArticles(prevArticles =>
          prevArticles.map(article =>
            article._id === articleId
              ? { ...article, isCompleted: true }
              : article
          )
        );
      } else {
        throw new Error(result.message || 'Failed to mark article complete');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark article complete';
      setError(errorMessage);
      console.error('Mark complete error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh articles
  const refreshArticles = useCallback(async () => {
    await getArticles();
  }, [getArticles]);

  return (
    <LearningContext.Provider
      value={{
        articles,
        currentArticle,
        pagination,
        loading,
        error,
        getArticles,
        getArticleWithQuiz,
        markComplete,
        refreshArticles,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};
