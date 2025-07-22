const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MediaSchema = new Schema({
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
  originalname: {
    type: String
  },
  mimetype: {
    type: String
  },
  size: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Media', MediaSchema);