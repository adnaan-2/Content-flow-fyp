import api from './api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'post_scheduled' | 'post_published' | 'social_account_connected' | 'social_account_disconnected' | 
        'password_changed' | 'profile_updated' | 'subscription_changed' | 'payment_processed' | 'general';
  isRead: boolean;
  data: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalNotifications: number;
      hasMore: boolean;
    };
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

const notificationApi = {
  // Get all notifications with pagination
  getNotifications: async (page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> => {
    const response = await api.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark notification as unread
  markAsUnread: async (notificationId: string) => {
    const response = await api.put(`/notifications/${notificationId}/unread`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete specific notification
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await api.delete('/notifications');
    return response.data;
  }
};

export default notificationApi;