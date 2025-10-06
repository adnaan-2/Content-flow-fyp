const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'post_scheduled',
      'post_published', 
      'social_account_connected',
      'social_account_disconnected',
      'password_changed',
      'profile_updated',
      'subscription_changed',
      'payment_processed',
      'general'
    ]
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  data: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Static method to create notification
notificationSchema.statics.createNotification = async function(userId, title, message, type, data = {}) {
  try {
    const notification = new this({
      userId,
      title,
      message,
      type,
      data
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
  return this;
};

// Instance method to mark as unread
notificationSchema.methods.markAsUnread = async function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = null;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Notification', notificationSchema);