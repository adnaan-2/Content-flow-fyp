const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'linkedin', 'x'],
    required: true
  },
  accountId: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  profilePicture: {
    type: String
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Platform-specific data
  platformData: {
    // Facebook pages (for Facebook accounts)
    pages: [{
      id: String,
      name: String,
      accessToken: String,
      profilePicture: String,
      followerCount: Number,
      category: String,
      permissions: [String],
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    
    // General platform info
    followerCount: Number,
    bio: String,
    website: String,
    displayName: String,
    
    // Instagram-specific
    instagramBusinessId: String,
    connectedFacebookPageId: String,
    
    // LinkedIn-specific
    linkedinId: String,
    
    // X-specific
    username: String,
    verified: Boolean
  }
}, {
  timestamps: true
});

// Indexes for performance - allowing multiple accounts per platform
socialAccountSchema.index({ userId: 1, platform: 1 });
socialAccountSchema.index({ userId: 1, isActive: 1 });
socialAccountSchema.index({ accountId: 1, platform: 1 });
socialAccountSchema.index({ 'platformData.pages.id': 1 }); // For Facebook page lookups

// Helper methods for Facebook pages
socialAccountSchema.methods.getFacebookPages = function() {
  if (this.platform !== 'facebook') {
    return [];
  }
  return this.platformData?.pages || [];
};

socialAccountSchema.methods.getFacebookPageById = function(pageId) {
  if (this.platform !== 'facebook') {
    return null;
  }
  return (this.platformData?.pages || []).find(page => page.id === pageId);
};

// Static methods for querying
socialAccountSchema.statics.findUserAccounts = function(userId, platform = null) {
  const query = { userId: userId, isActive: true };
  if (platform) {
    query.platform = platform;
  }
  return this.find(query);
};

socialAccountSchema.statics.findByPlatformAccountId = function(userId, platform, accountId) {
  return this.findOne({
    userId: userId,
    platform: platform,
    accountId: accountId,
    isActive: true
  });
};

module.exports = mongoose.model('SocialAccount', socialAccountSchema);