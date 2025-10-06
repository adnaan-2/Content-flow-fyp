const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required if user signs up with Google
    }
  },
  googleId: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.png'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  profilePhotoPublicId: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  passwordResetCode: {
    type: String,
    default: null
  },
  passwordResetCodeExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  knownDevices: [{
    fingerprint: String,
    browser: String,
    os: String,
    firstSeen: {
      type: Date,
      default: Date.now
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Method to safely return user data without sensitive information
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);