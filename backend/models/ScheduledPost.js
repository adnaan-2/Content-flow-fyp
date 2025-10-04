const mongoose = require('mongoose');

const scheduledPostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    required: true
  },
  mediaUrl: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['photo', 'video'],
    default: 'photo'
  },
  platforms: [{
    type: String,
    enum: ['facebook', 'instagram', 'x', 'linkedin'],
    required: true
  }],
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'posted', 'failed'],
    default: 'pending'
  },
  facebookPageId: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScheduledPost', scheduledPostSchema);