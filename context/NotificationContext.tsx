"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";
import { getUserId } from "@/lib/storage";

export type Notification = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const refreshNotifications = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/notifications/${userId}`);
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = async (id: string) => {
    const userId = getUserId();
    if (!userId) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await api.patch(`/notifications/${userId}/${id}/read`);
    } catch (error) {
      console.error("Failed to mark as read:", error);
      // Optional: revert state on failure
    }
  };

  const markAllAsRead = async () => {
    const userId = getUserId();
    if (!userId) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await api.patch(`/notifications/${userId}/read-all`);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Optional: Auto fetch on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
