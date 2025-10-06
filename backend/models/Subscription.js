const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  planType: {
    type: String,
    enum: ['free', 'standard', 'premium'],
    default: 'free',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: null
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  // Payment details
  paymentMethodId: {
    type: String,
    default: null
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  // Plan limits
  limits: {
    socialAccounts: {
      type: Number,
      default: 1 // Free plan allows 1 account
    },
    scheduledPostsPerWeek: {
      type: Number,
      default: 1 // Free plan allows 1 post per week
    },
    analytics: {
      type: String,
      enum: ['basic', 'advanced', 'custom'],
      default: 'basic'
    },
    support: {
      type: String,
      enum: ['community', 'priority', 'premium'],
      default: 'community'
    },
    teamMembers: {
      type: Number,
      default: 1
    }
  },
  // Billing history
  billingHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['paid', 'failed', 'pending'],
      required: true
    },
    invoiceId: String,
    description: String
  }],
  // Usage tracking
  usage: {
    connectedAccounts: {
      type: Number,
      default: 0
    },
    scheduledPostsThisWeek: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
}, { 
  timestamps: true 
});

// Method to check if user can connect more social accounts
subscriptionSchema.methods.canConnectMoreAccounts = function() {
  return this.usage.connectedAccounts < this.limits.socialAccounts;
};

// Method to check if user can schedule more posts this week
subscriptionSchema.methods.canScheduleMorePosts = function() {
  // Reset weekly counter if needed
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  
  if (this.usage.lastResetDate < weekStart) {
    this.usage.scheduledPostsThisWeek = 0;
    this.usage.lastResetDate = new Date();
  }
  
  return this.limits.scheduledPostsPerWeek === -1 || // -1 means unlimited
         this.usage.scheduledPostsThisWeek < this.limits.scheduledPostsPerWeek;
};

// Method to get plan limits based on plan type
subscriptionSchema.methods.updatePlanLimits = function() {
  switch (this.planType) {
    case 'free':
      this.limits = {
        socialAccounts: 1,
        scheduledPostsPerWeek: 1,
        analytics: 'basic',
        support: 'community',
        teamMembers: 1
      };
      this.price = 0;
      break;
    case 'standard':
      this.limits = {
        socialAccounts: 4,
        scheduledPostsPerWeek: 8,
        analytics: 'advanced',
        support: 'priority',
        teamMembers: 1
      };
      this.price = 10;
      break;
    case 'premium':
      this.limits = {
        socialAccounts: -1, // Unlimited
        scheduledPostsPerWeek: -1, // Unlimited
        analytics: 'custom',
        support: 'premium',
        teamMembers: -1 // Unlimited
      };
      this.price = 25;
      break;
  }
};

// Pre-save middleware to update limits when plan changes
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('planType')) {
    this.updatePlanLimits();
  }
  next();
});

// Static method to get plan details
subscriptionSchema.statics.getPlanDetails = function(planType) {
  const plans = {
    free: {
      name: 'Free Plan',
      price: 0,
      limits: {
        socialAccounts: 1,
        scheduledPostsPerWeek: 1,
        analytics: 'basic',
        support: 'community',
        teamMembers: 1
      },
      features: [
        '1 social media account connection',
        '1 scheduled post per week',
        'Basic analytics',
        'Community support'
      ]
    },
    standard: {
      name: 'Standard Plan',
      price: 10,
      limits: {
        socialAccounts: 4,
        scheduledPostsPerWeek: 8,
        analytics: 'advanced',
        support: 'priority',
        teamMembers: 1
      },
      features: [
        '4 social media accounts (1 per platform)',
        '8 scheduled posts per week',
        'Advanced analytics',
        'Priority support'
      ]
    },
    premium: {
      name: 'Premium Plan',
      price: 25,
      limits: {
        socialAccounts: -1,
        scheduledPostsPerWeek: -1,
        analytics: 'custom',
        support: 'premium',
        teamMembers: -1
      },
      features: [
        'Unlimited social media accounts',
        'Unlimited scheduled posts',
        'Custom analytics reports',
        '24/7 premium support',
        'Unlimited team members'
      ]
    }
  };
  return plans[planType] || plans.free;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);