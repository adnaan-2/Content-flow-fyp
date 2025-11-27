import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import notificationApi, { Notification } from '../services/notificationApi';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  triggerRefresh: () => void; // For immediate refresh after actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load notifications and unread count
  const refreshNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationApi.getNotifications(1, 10), // Get recent 10 notifications
        notificationApi.getUnreadCount()
      ]);

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.notifications);
      }

      if (unreadResponse.success) {
        setUnreadCount(unreadResponse.unreadCount);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state immediately
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
      
      // Refresh to get latest state
      setTimeout(refreshNotifications, 100);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await notificationApi.deleteAllNotifications();
      
      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  };

  // Trigger immediate refresh (useful after actions that create notifications)
  const triggerRefresh = () => {
    refreshNotifications();
  };

  // Load notifications on mount and set up polling
  useEffect(() => {
    refreshNotifications();
    
    // Poll for new notifications every 5 seconds for real-time updates
    const interval = setInterval(refreshNotifications, 5000);
    
    // Make refresh function available globally for triggering after actions
    (window as any).refreshNotifications = refreshNotifications;
    
    return () => {
      clearInterval(interval);
      delete (window as any).refreshNotifications;
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    triggerRefresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};