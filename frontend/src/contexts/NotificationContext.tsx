import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import notificationApi, { Notification } from '@/services/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load initial notifications and unread count
  const loadNotifications = async (page = 1, replace = true) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications(page, 20);
      
      if (replace) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setUnreadCount(response.data.unreadCount);
      setHasMore(response.data.pagination.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load unread count only
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Refresh notifications (reload from beginning)
  const refreshNotifications = async () => {
    await loadNotifications(1, true);
  };

  // Load more notifications (pagination)
  const loadMoreNotifications = async () => {
    if (!hasMore || loading) return;
    await loadNotifications(currentPage + 1, false);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await notificationApi.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  // Mark notification as unread
  const markAsUnread = async (notificationId: string) => {
    try {
      await notificationApi.markAsUnread(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: false, readAt: undefined }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      throw error;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({
          ...notif,
          isRead: true,
          readAt: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
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
      setHasMore(false);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  };

  // Load notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setHasMore(false);
    }
  }, [isAuthenticated]);

  // Auto-refresh unread count every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      deleteNotification,
      deleteAllNotifications,
      loadMoreNotifications,
      hasMore
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};