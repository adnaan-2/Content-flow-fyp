const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  socialAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialAccount',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'linkedin', 'twitter'],
    required: true
  },
  postId: {
    type: String,
    required: true
  },
  content: {
    text: String,
    mediaUrls: [String],
    mediaType: {
      type: String,
      enum: ['photo', 'video', 'carousel', 'text']
    }
  },
  scheduledTime: Date,
  publishedTime: Date,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  analytics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    reach: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Post', postSchema);