// context/NotificationContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const ACCESS_TOKEN_KEY = "kivelo_access_token";
const PREFERENCES_KEY = "kivelo_notification_preferences";

// Socket server URLs
const SOCKET_URLS = [
  "http://localhost:5000",
  "https://family-wellness.onrender.com",
];

// Types - matching backend Notification model
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "mood_alert" | "streak_milestone" | "new_journal" | "new_activity" | "activity_completed" | "activity_submission" | "submission_reviewed" | "points_earned" | "badge_earned" | "system" | "reminder" | "parent_alert" | "ai_suggestion" | "new_message" | "chat_message";
  priority: number; // 1-5
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
  isSent?: boolean;
  sentVia?: string[];
  scheduledFor?: string;
}

export interface NotificationStats {
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

// Notification preferences for controlling which notifications to show
export interface NotificationPreferences {
  enableNotifications: boolean;
  moodAlerts: boolean;
  activityUpdates: boolean;
  journalUpdates: boolean;
  streakMilestones: boolean;
  badgeEarned: boolean;
  systemNotifications: boolean;
  aiSuggestions: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableNotifications: true,
  moodAlerts: true,
  activityUpdates: true,
  journalUpdates: true,
  streakMilestones: true,
  badgeEarned: true,
  systemNotifications: true,
  aiSuggestions: true,
};

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  preferences: NotificationPreferences;
  getNotifications: (options?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  getStats: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  unreadCount: number;
  isSocketConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URLS = [
  "http://localhost:5000/api/v1",  // Local dev server
  "https://family-wellness.onrender.com/api/v1",
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workingUrl, setWorkingUrl] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Calculate unread count from stats or notifications (with safe fallback)
  const unreadCount = stats?.unread ?? (Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error("Failed to load notification preferences:", error);
    }
  };

  // Update and save preferences
  const updatePreferences = useCallback(async (newPrefs: Partial<NotificationPreferences>) => {
    try {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    }
  }, [preferences]);

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

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await makeAuthenticatedRequest(`/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (!response) return false; // Logged out

      if (response.success) {
        // Update local state
        const deletedNotif = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        // Update stats if the deleted notification was unread
        if (stats && deletedNotif && !deletedNotif.isRead) {
          setStats({
            ...stats,
            total: stats.total - 1,
            unread: Math.max(0, stats.unread - 1),
          });
        } else if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1,
            read: Math.max(0, stats.read - 1),
          });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      return false;
    }
  }, [makeAuthenticatedRequest, stats, notifications]);

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

  // Socket connection for real-time notifications
  useEffect(() => {
    if (!user || !role) {
      // User logged out - disconnect socket
      if (socketRef.current) {
        console.log("[NOTIFICATION SOCKET] Disconnecting - user logged out");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
      return;
    }

    const connectSocket = async () => {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        console.log("[NOTIFICATION SOCKET] No access token, skipping connection");
        return;
      }

      // Try each URL until one works
      for (const url of SOCKET_URLS) {
        try {
          console.log(`[NOTIFICATION SOCKET] Attempting connection to ${url}...`);
          
          const newSocket = io(url, {
            auth: { token: accessToken },
            transports: ["websocket", "polling"],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
          });

          newSocket.on("connect", () => {
            console.log(`[NOTIFICATION SOCKET] Connected to ${url}`);
            setIsSocketConnected(true);
            
            // Join user room to receive notifications
            const userId = user._id || user.id;
            if (userId) {
              console.log(`[NOTIFICATION SOCKET] Joining user room: user:${userId}`);
              newSocket.emit("join_user", userId);
            }
          });

          newSocket.on("disconnect", (reason) => {
            console.log(`[NOTIFICATION SOCKET] Disconnected: ${reason}`);
            setIsSocketConnected(false);
          });

          // Listen for real-time notifications
          newSocket.on("notification", (data: any) => {
            console.log("[NOTIFICATION SOCKET] Received notification:", data);
            
            if (data?.notification) {
              // Add new notification to the beginning of the list
              setNotifications(prev => {
                // Check if notification already exists
                const exists = prev.some(n => n._id === data.notification._id);
                if (exists) return prev;
                return [data.notification, ...prev];
              });
              
              // Update unread count
              setStats(prev => {
                if (!prev) return { total: 1, unread: 1, read: 0 };
                return {
                  ...prev,
                  total: prev.total + 1,
                  unread: prev.unread + 1,
                };
              });
            }
          });

          // Listen for new messages (can also trigger notification refresh)
          newSocket.on("new_message", (data: any) => {
            console.log("[NOTIFICATION SOCKET] Received new_message:", data);
            // Optionally refresh notifications to ensure we have the latest
          });

          socketRef.current = newSocket;
          
          // Wait for connection
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (!newSocket.connected) {
                newSocket.disconnect();
                reject(new Error("Connection timeout"));
              }
            }, 10000);

            newSocket.once("connect", () => {
              clearTimeout(timeout);
              resolve();
            });

            newSocket.once("connect_error", () => {
              clearTimeout(timeout);
              reject(new Error("Connection failed"));
            });
          });

          console.log(`[NOTIFICATION SOCKET] Successfully connected`);
          return;
        } catch (err) {
          console.log(`[NOTIFICATION SOCKET] Failed to connect to ${url}, trying next...`);
          continue;
        }
      }

      console.log("[NOTIFICATION SOCKET] All connection attempts failed");
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, role]);

  const value: NotificationContextType = {
    notifications,
    stats,
    pagination,
    loading,
    error,
    preferences,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getStats,
    refreshNotifications,
    updatePreferences,
    unreadCount,
    isSocketConnected,
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