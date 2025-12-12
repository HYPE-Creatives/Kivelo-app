// context/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const ACCESS_TOKEN_KEY = "kivelo_access_token";

// Types - matching backend Notification model
interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "mood_alert" | "streak_milestone" | "new_journal" | "points_earned" | "badge_earned" | "system" | "reminder" | "parent_alert" | "ai_suggestion";
  priority: number; // 1-5
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  isSent?: boolean;
  sentVia?: string[];
  scheduledFor?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  getNotifications: (options?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  getStats: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URLS = [
  "http://localhost:5000/api/v1",  // Local dev server
  "https://family-wellness.onrender.com/api/v1",
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);

  // Calculate unread count from stats or notifications (with safe fallback)
  const unreadCount = stats?.unread ?? (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0);

  // Make authenticated request with fallback URLs
  const makeAuthenticatedRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> => {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      // Return null instead of throwing - user is logged out
      return null;
    }

    const urls = workingUrl ? [workingUrl] : API_URLS;

    for (const baseUrl of urls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!workingUrl && response.ok) {
          setWorkingUrl(baseUrl);
        }

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log(`Request to ${baseUrl} timed out, trying next...`);
          continue;
        }
        if (baseUrl === urls[urls.length - 1]) {
          // Last URL failed, return null instead of throwing
          return null;
        }
        // Try next URL silently
      }
    }

    // All URLs failed, return null for graceful handling
    return null;
  }, [workingUrl]);

  // Get notifications with optional filters
  const getNotifications = useCallback(async (options?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.page) params.append("page", options.page.toString());
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.isRead !== undefined) params.append("isRead", options.isRead.toString());
      if (options?.type) params.append("type", options.type);
      if (options?.priority) params.append("priority", options.priority);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await makeAuthenticatedRequest(`/notifications${queryString}`);

      // Handle logged out state gracefully
      if (!response) {
        setNotifications([]);
        setStats(null);
        return;
      }

      if (response.success && response.data) {
        // Backend returns { notifications, stats } inside data
        const notificationData = Array.isArray(response.data.notifications) 
          ? response.data.notifications 
          : [];
        setNotifications(notificationData);
        
        // Stats are included in the response
        if (response.data.stats) {
          setStats(response.data.stats);
        }
        
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        throw new Error(response.message || "Failed to fetch notifications");
      }
    } catch (err: any) {
      // Don't log errors for expected cases (network issues, timeouts)
      setError(err.message || "Failed to fetch notifications");
      // Return empty array on error for graceful handling
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await makeAuthenticatedRequest(`/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (!response) return false; // Logged out

      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
        );
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            unread: Math.max(0, stats.unread - 1),
            read: stats.read + 1,
          });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
      return false;
    }
  }, [makeAuthenticatedRequest, stats]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await makeAuthenticatedRequest("/notifications/read-all", {
        method: "PUT",
      });

      if (!response) return false; // Logged out

      if (response.success) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            unread: 0,
            read: stats.total,
          });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error marking all notifications as read:", err);
      return false;
    }
  }, [makeAuthenticatedRequest, stats]);

  // Get notification stats (separate endpoint - but getNotifications already includes stats)
  const getStats = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest("/notifications/stats");

      if (!response) return; // Logged out

      if (response.success && response.data) {
        // Backend returns { summary: { total, unread, read }, byType, byPriority }
        setStats(response.data.summary || response.data);
      }
    } catch (err: any) {
      console.error("Error fetching notification stats:", err);
      // Fail silently for stats - getNotifications already provides stats
    }
  }, [makeAuthenticatedRequest]);

  // Refresh notifications (stats are included in getNotifications response)
  const refreshNotifications = useCallback(async () => {
    // Just call getNotifications since it includes stats
    await getNotifications({ limit: 50 });
  }, [getNotifications]);

  // Initial load when authenticated, clear on logout
  useEffect(() => {
    if (role) {
      refreshNotifications();
    } else {
      // User logged out - clear all notification state
      setNotifications([]);
      setStats(null);
      setPagination(null);
      setError(null);
    }
  }, [role]);

  const value: NotificationContextType = {
    notifications,
    stats,
    pagination,
    loading,
    error,
    getNotifications,
    markAsRead,
    markAllAsRead,
    getStats,
    refreshNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export default NotificationContext;
