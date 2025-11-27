import api from './api';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

const notificationApi = {
  // Get notifications with pagination and filters
  getNotifications: async (page = 1, limit = 20, unreadOnly = false, type?: string): Promise<NotificationResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString()
    });
    
    if (type) {
      params.append('type', type);
    }

    const response = await api.get(`/notifications?${params.toString()}`);
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