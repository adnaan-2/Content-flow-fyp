const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GeneratedAdSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  enhancedPrompt: {
    type: String // Store the full enhanced prompt used for generation
  },
  style: {
    type: String,
    default: 'professional'
  },
  dimensions: {
    width: {
      type: Number,
      default: 1024
    },
    height: {
      type: Number,
      default: 1024
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GeneratedAd', GeneratedAdSchema);
