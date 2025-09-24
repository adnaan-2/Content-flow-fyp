const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'linkedin', 'x', 'twitter'],
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
  accountData: {
    profilePicture: String,
    followerCount: Number,
    bio: String,
    website: String
  }
}, {
  timestamps: true
});

// Compound index to ensure one account per platform per user
socialAccountSchema.index({ userId: 1, platform: 1, accountId: 1 }, { unique: true });

module.exports = mongoose.model('SocialAccount', socialAccountSchema);