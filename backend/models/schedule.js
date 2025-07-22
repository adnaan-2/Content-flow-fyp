const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScheduleSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: Schema.Types.ObjectId,
    ref: 'Media',
    required: true
  },
  scheduledDateTime: {
    type: Date,
    required: true
  },
  platforms: [{
    type: String,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin'],
    required: true
  }],
  caption: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'posted', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);