const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      // Social Account Events
      'social_account_connected',
      'social_account_disconnected',
      'social_account_connection_failed',
      
      // Post Events
      'post_published',
      'post_scheduled',
      'post_publish_failed',
      'post_schedule_failed',
      'scheduled_post_edited',
      
      // Subscription Events
      'subscription_activated',
      'subscription_cancelled',
      'subscription_expired',
      'subscription_renewed',
      
      // Profile Events
      'profile_updated',
      'password_changed',
      'profile_picture_updated'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, type, title, message, metadata = {}) {
  try {
    const notification = new this({
      userId,
      type,
      title,
      message,
      metadata
    });
    
    await notification.save();
    console.log(`📱 Notification created for user ${userId}: ${type}`);
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  await this.save();
  return this;
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ userId, isRead: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);