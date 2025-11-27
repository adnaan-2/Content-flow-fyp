const Notification = require('../models/Notification');

class NotificationService {
  // Post-related notifications
  static async postPublished(userId, platforms, message = null, postContent = null) {
    try {
      console.log('📢 Creating post published notification for user:', userId);
      console.log('📢 Platforms:', platforms);
      console.log('📢 Message:', message);
      console.log('📢 Post content:', postContent);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'post_published',
        title: 'Post Published Successfully',
        message: message || `Your post was successfully published to ${platforms.join(', ')}`,
        data: {
          platforms,
          postContent: postContent || 'No content provided'
        }
      });
      
      console.log('📢 Post published notification created:', notification._id);
      return notification;
    } catch (error) {
      console.error('📢 Error creating post published notification:', error);
      throw error;
    }
  }

  static async postPublishFailed(userId, platforms, error, postContent = null) {
    try {
      console.log('📢 Creating post publish failed notification for user:', userId);
      console.log('📢 Platforms:', platforms);
      console.log('📢 Error:', error);
      console.log('📢 Post content:', postContent);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'post_failed',
        title: 'Post Publishing Failed',
        message: `Failed to publish post to ${platforms.join(', ')}: ${error}`,
        data: {
          platforms,
          error,
          postContent: postContent || 'No content provided'
        }
      });
      
      console.log('📢 Post publish failed notification created:', notification._id);
      return notification;
    } catch (notificationError) {
      console.error('📢 Error creating post failed notification:', notificationError);
      throw notificationError;
    }
  }

  static async postScheduled(userId, platforms, scheduledDate, postContent = null) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'post_scheduled',
        title: 'Post Scheduled Successfully',
        message: `Your post has been scheduled for ${new Date(scheduledDate).toLocaleString()} on ${platforms.join(', ')}`,
        data: {
          platforms,
          scheduledDate,
          postContent
        }
      });
      
      console.log('📢 Post scheduled notification created for user:', userId);
      return notification;
    } catch (error) {
      console.error('📢 Error creating post scheduled notification:', error);
      throw error;
    }
  }

  static async postScheduleFailed(userId, platforms, error, postContent = null) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'schedule_failed',
        title: 'Post Scheduling Failed',
        message: `Failed to schedule post for ${platforms.join(', ')}: ${error}`,
        data: {
          platforms,
          error,
          postContent
        }
      });
      
      console.log('📢 Post schedule failed notification created for user:', userId);
      return notification;
    } catch (notificationError) {
      console.error('📢 Error creating schedule failed notification:', notificationError);
      throw notificationError;
    }
  }

  static async postUpdated(userId, postId, changes = null) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'post_updated',
        title: 'Post Updated',
        message: 'Your post has been updated successfully',
        data: {
          postId,
          changes
        }
      });
      
      console.log('📢 Post updated notification created for user:', userId);
      return notification;
    } catch (error) {
      console.error('📢 Error creating post updated notification:', error);
      throw error;
    }
  }

  // Social account notifications
  static async socialAccountConnected(userId, platform, accountName = null) {
    try {
      console.log('📢 Creating social account connected notification for user:', userId);
      console.log('📢 Platform:', platform);
      console.log('📢 Account name:', accountName);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'account_connected',
        title: 'Account Connected',
        message: `Your ${platform} account${accountName ? ` (${accountName})` : ''} has been connected successfully`,
        data: {
          platform,
          accountName
        }
      });
      
      console.log('📢 Social account connected notification created:', notification._id);
      return notification;
    } catch (error) {
      console.error('📢 Error creating social account connected notification:', error);
      throw error;
    }
  }

  static async socialAccountDisconnected(userId, platform, accountName = null) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'account_disconnected',
        title: 'Account Disconnected',
        message: `Your ${platform} account${accountName ? ` (${accountName})` : ''} has been disconnected`,
        data: {
          platform,
          accountName
        }
      });
      
      console.log('📢 Social account disconnected notification created for user:', userId);
      return notification;
    } catch (error) {
      console.error('📢 Error creating social account disconnected notification:', error);
      throw error;
    }
  }

  static async socialAccountConnectionFailed(userId, platform, error) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'connection_failed',
        title: 'Connection Failed',
        message: `Failed to connect your ${platform} account: ${error}`,
        data: {
          platform,
          error
        }
      });
      
      console.log('📢 Social account connection failed notification created for user:', userId);
      return notification;
    } catch (notificationError) {
      console.error('📢 Error creating connection failed notification:', notificationError);
      throw notificationError;
    }
  }

  // Subscription notifications
  static async subscriptionActivated(userId, plan, features = []) {
    try {
      console.log('📢 Creating subscription activated notification for user:', userId);
      console.log('📢 Plan:', plan);
      console.log('📢 Features:', features);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'subscription_activated',
        title: 'Subscription Activated',
        message: `Your ${plan} subscription has been activated successfully`,
        data: {
          plan,
          features
        }
      });
      
      console.log('📢 Subscription activated notification created:', notification._id);
      return notification;
    } catch (error) {
      console.error('📢 Error creating subscription activated notification:', error);
      throw error;
    }
  }

  static async subscriptionCancelled(userId, plan, effectiveDate = null) {
    try {
      console.log('📢 Creating subscription cancelled notification for user:', userId);
      console.log('📢 Plan:', plan);
      console.log('📢 Effective date:', effectiveDate);
      
      const notification = await Notification.createNotification({
        userId,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: `Your ${plan} subscription has been cancelled${effectiveDate ? ` (effective ${new Date(effectiveDate).toLocaleDateString()})` : ''}`,
        data: {
          plan,
          effectiveDate
        }
      });
      
      console.log('📢 Subscription cancelled notification created:', notification._id);
      return notification;
    } catch (error) {
      console.error('📢 Error creating subscription cancelled notification:', error);
      throw error;
    }
  }

  static async subscriptionExpired(userId, plan) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'subscription_expired',
        title: 'Subscription Expired',
        message: `Your ${plan} subscription has expired. Please renew to continue using premium features`,
        data: {
          plan
        }
      });
      
      console.log('📢 Subscription expired notification created for user:', userId);
      return notification;
    } catch (error) {
      console.error('📢 Error creating subscription expired notification:', error);
      throw error;
    }
  }

  // Profile notifications
  static async profileUpdated(userId, message) {
    try {
      const notification = await Notification.createNotification({
        userId,
        type: 'profile_updated',
        title: 'Profile Updated',
        message: message || 'Your profile has been updated successfully',
        data: {}
      });
      
      console.log('📢 Profile updated notification created for user:', userId);
      return notification;
    } catch (error) {
      console.error('📢 Error creating profile updated notification:', error);
      throw error;
    }
  }

  // General utility methods
  static async getNotifications(userId, page = 1, limit = 10) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
      
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({ 
        userId, 
        isRead: false 
      });
      
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  static async markAsRead(userId, notificationId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true, readAt: new Date() },
        { new: true }
      );
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async deleteNotification(userId, notificationId) {
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