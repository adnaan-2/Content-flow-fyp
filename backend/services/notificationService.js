const Notification = require('../models/Notification');

class NotificationService {
  // Social Account Notifications
  static async socialAccountConnected(userId, platform, accountName) {
    return await Notification.createNotification(
      userId,
      'social_account_connected',
      'Account Connected',
      `Successfully connected your ${platform} account (@${accountName})`,
      { platform, accountName }
    );
  }

  static async socialAccountDisconnected(userId, platform, accountName) {
    return await Notification.createNotification(
      userId,
      'social_account_disconnected',
      'Account Disconnected',
      `Your ${platform} account (@${accountName}) has been disconnected`,
      { platform, accountName }
    );
  }

  static async socialAccountConnectionFailed(userId, platform, error) {
    return await Notification.createNotification(
      userId,
      'social_account_connection_failed',
      'Connection Failed',
      `Failed to connect ${platform} account: ${error}`,
      { platform, error }
    );
  }

  // Post Notifications
  static async postPublished(userId, platforms, postContent) {
    try {
      console.log('🔔 Creating success notification:', { userId, platforms });
      const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
      const content = postContent?.substring(0, 50) || 'Media post';
      
      const notification = await Notification.createNotification(
        userId,
        'post_published',
        'Post Published',
        `Your post "${content}${postContent?.length > 50 ? '...' : ''}" was successfully published to ${platformList}`,
        { platforms, postContent }
      );
      
      console.log('✅ Success notification created:', notification._id);
      return notification;
    } catch (notificationError) {
      console.error('❌ Error creating success notification:', notificationError);
      throw notificationError;
    }
  }

  static async postScheduled(userId, platforms, scheduledTime, postContent) {
    const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
    const content = postContent?.substring(0, 50) || 'Media post';
    const timeStr = new Date(scheduledTime).toLocaleString();
    
    return await Notification.createNotification(
      userId,
      'post_scheduled',
      'Post Scheduled',
      `Your post "${content}${postContent?.length > 50 ? '...' : ''}" is scheduled for ${timeStr} on ${platformList}`,
      { platforms, scheduledTime, postContent }
    );
  }

  static async postPublishFailed(userId, platforms, error, postContent) {
    try {
      console.log('🔔 Creating failure notification:', { userId, platforms, error });
      const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
      const content = postContent?.substring(0, 50) || 'Media post';
      
      const notification = await Notification.createNotification(
        userId,
        'post_publish_failed',
        'Post Failed',
        `Failed to publish your post "${content}${postContent?.length > 50 ? '...' : ''}" to ${platformList}: ${error}`,
        { platforms, error, postContent }
      );
      
      console.log('✅ Failure notification created:', notification._id);
      return notification;
    } catch (notificationError) {
      console.error('❌ Error creating failure notification:', notificationError);
      throw notificationError;
    }
  }

  static async postScheduleFailed(userId, platforms, error, postContent) {
    const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
    const content = postContent?.substring(0, 50) || 'Media post';
    
    return await Notification.createNotification(
      userId,
      'post_schedule_failed',
      'Scheduling Failed',
      `Failed to schedule your post "${content}${postContent?.length > 50 ? '...' : ''}" for ${platformList}: ${error}`,
      { platforms, error, postContent }
    );
  }

  static async scheduledPostEdited(userId, postContent) {
    const content = postContent?.substring(0, 50) || 'Media post';
    
    return await Notification.createNotification(
      userId,
      'scheduled_post_edited',
      'Scheduled Post Updated',
      `Your scheduled post "${content}${postContent?.length > 50 ? '...' : ''}" has been updated`,
      { postContent }
    );
  }

  // Subscription Notifications
  static async subscriptionActivated(userId, planType, planName) {
    return await Notification.createNotification(
      userId,
      'subscription_activated',
      'Subscription Activated',
      `Your ${planName} subscription is now active! Enjoy your enhanced features.`,
      { planType, planName }
    );
  }

  static async subscriptionCancelled(userId, planType, planName) {
    return await Notification.createNotification(
      userId,
      'subscription_cancelled',
      'Subscription Cancelled',
      `Your ${planName} subscription has been cancelled. You'll retain access until your billing period ends.`,
      { planType, planName }
    );
  }

  static async subscriptionExpired(userId, planType, planName) {
    return await Notification.createNotification(
      userId,
      'subscription_expired',
      'Subscription Expired',
      `Your ${planName} subscription has expired. Upgrade to continue enjoying premium features.`,
      { planType, planName }
    );
  }

  static async subscriptionRenewed(userId, planType, planName, nextBillingDate) {
    const billingStr = new Date(nextBillingDate).toLocaleDateString();
    
    return await Notification.createNotification(
      userId,
      'subscription_renewed',
      'Subscription Renewed',
      `Your ${planName} subscription has been renewed. Next billing date: ${billingStr}`,
      { planType, planName, nextBillingDate }
    );
  }

  // Profile Notifications
  static async profileUpdated(userId, changedFields) {
    const fieldsList = Array.isArray(changedFields) ? changedFields.join(', ') : changedFields;
    
    return await Notification.createNotification(
      userId,
      'profile_updated',
      'Profile Updated',
      `Your profile has been updated. Changes: ${fieldsList}`,
      { changedFields }
    );
  }

  static async passwordChanged(userId) {
    return await Notification.createNotification(
      userId,
      'password_changed',
      'Password Changed',
      `Your password has been successfully changed for security.`,
      { timestamp: new Date() }
    );
  }

  static async profilePictureUpdated(userId) {
    return await Notification.createNotification(
      userId,
      'profile_picture_updated',
      'Profile Picture Updated',
      `Your profile picture has been updated successfully.`,
      { timestamp: new Date() }
    );
  }

  // Utility methods
  static async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }

  static async markAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (notification) {
        return await notification.markAsRead();
      }
      return null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  static async getNotifications(userId, options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false,
      type = null 
    } = options;

    const query = { userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    try {
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      const result = await Notification.findOneAndDelete({ 
        _id: notificationId, 
        userId 
      });
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static async deleteAllNotifications(userId) {
    try {
      const result = await Notification.deleteMany({ userId });
      return result;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;