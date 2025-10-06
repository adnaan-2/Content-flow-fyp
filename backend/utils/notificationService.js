const { createNotification } = require('../controllers/notificationController');

// Notification service to replace email notifications for internal app events
const notificationService = {
  
  // Send notification when a post is scheduled
  sendPostScheduledNotification: async (userId, postDetails) => {
    try {
      const title = "Post Scheduled Successfully";
      const message = `Your post "${postDetails.content?.substring(0, 50) || 'New post'}..." has been scheduled to publish on ${new Date(postDetails.scheduledTime).toLocaleDateString()}.`;
      const type = "post_scheduled";
      const data = {
        postId: postDetails.id,
        scheduledTime: postDetails.scheduledTime,
        platforms: postDetails.platforms || []
      };

      await createNotification(userId, title, message, type, data);
      console.log('Post scheduled notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending post scheduled notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when a post is published
  sendPostPublishedNotification: async (userId, postDetails) => {
    try {
      const title = "Post Published Successfully";
      const message = `Your post "${postDetails.content?.substring(0, 50) || 'New post'}..." has been published across your connected social media platforms.`;
      const type = "post_published";
      const data = {
        postId: postDetails.id,
        publishedTime: new Date(),
        platforms: postDetails.platforms || [],
        engagement: postDetails.engagement || {}
      };

      await createNotification(userId, title, message, type, data);
      console.log('Post published notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending post published notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when a social account is connected
  sendSocialAccountConnectedNotification: async (userId, platform, accountName) => {
    try {
      const title = "Social Account Connected";
      const message = `Your ${platform} account (@${accountName}) has been successfully connected to ContentFlow.`;
      const type = "social_account_connected";
      const data = {
        platform,
        accountName,
        connectedAt: new Date()
      };

      await createNotification(userId, title, message, type, data);
      console.log('Social account connected notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending social account connected notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when a social account is disconnected
  sendSocialAccountDisconnectedNotification: async (userId, platform, accountName) => {
    try {
      const title = "Social Account Disconnected";
      const message = `Your ${platform} account (@${accountName}) has been disconnected from ContentFlow.`;
      const type = "social_account_disconnected";
      const data = {
        platform,
        accountName,
        disconnectedAt: new Date()
      };

      await createNotification(userId, title, message, type, data);
      console.log('Social account disconnected notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending social account disconnected notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when password is changed
  sendPasswordChangedNotification: async (userId) => {
    try {
      const title = "Password Changed";
      const message = "Your account password has been successfully updated. If you didn't make this change, please contact support immediately.";
      const type = "password_changed";
      const data = {
        changedAt: new Date(),
        securityAlert: true
      };

      await createNotification(userId, title, message, type, data);
      console.log('Password changed notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending password changed notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when profile is updated
  sendProfileUpdatedNotification: async (userId, updatedFields) => {
    try {
      const title = "Profile Updated";
      const fieldsList = Array.isArray(updatedFields) ? updatedFields.join(', ') : 'profile information';
      const message = `Your ${fieldsList} has been successfully updated.`;
      const type = "profile_updated";
      const data = {
        updatedFields,
        updatedAt: new Date()
      };

      await createNotification(userId, title, message, type, data);
      console.log('Profile updated notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending profile updated notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when subscription changes
  sendSubscriptionChangedNotification: async (userId, newPlan, oldPlan) => {
    try {
      const title = "Subscription Updated";
      const message = `Your subscription has been ${oldPlan === 'free' ? 'upgraded' : 'changed'} from ${oldPlan} to ${newPlan} plan.`;
      const type = "subscription_changed";
      const data = {
        newPlan,
        oldPlan,
        changedAt: new Date()
      };

      await createNotification(userId, title, message, type, data);
      console.log('Subscription changed notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending subscription changed notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when payment is processed
  sendPaymentProcessedNotification: async (userId, amount, status) => {
    try {
      const title = status === 'success' ? "Payment Processed" : "Payment Failed";
      const message = status === 'success' 
        ? `Your payment of $${amount} has been successfully processed.`
        : `Your payment of $${amount} could not be processed. Please update your payment method.`;
      const type = "payment_processed";
      const data = {
        amount,
        status,
        processedAt: new Date()
      };

      await createNotification(userId, title, message, type, data);
      console.log('Payment processed notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending payment processed notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Send general notification
  sendGeneralNotification: async (userId, title, message, data = {}) => {
    try {
      const type = "general";
      
      await createNotification(userId, title, message, type, data);
      console.log('General notification sent to user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error sending general notification:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = notificationService;