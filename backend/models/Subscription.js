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
    enum: ['basic', 'pro_monthly', 'pro_yearly'],
    default: 'pro_monthly',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due', 'expired', 'trial'],
    default: 'active',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: function() {
      // Set trial end date to 30 days from now for new users on pro plan
      if (this.planType === 'pro_monthly') {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      return null;
    }
  },
  trialEndDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
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
      enum: ['basic', 'priority', 'premium'],
      default: 'basic'
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
  // Check if subscription is expired first
  if (this.isExpired()) {
    return false;
  }
  
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

// Method to check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  const now = new Date();
  
  // Check if free trial has expired
  // Check if subscription has ended (for pro plans)
  if (['pro_monthly', 'pro_yearly'].includes(this.planType) && this.endDate && now > this.endDate) {
    return true;
  }
  
  // Check if paid subscription has expired
  if (this.endDate && now > this.endDate) {
    return true;
  }
  
  return false;
};

// Method to get days remaining in trial
subscriptionSchema.methods.getDaysRemaining = function() {
  if (!this.endDate || this.planType === 'basic') {
    return 0;
  }
  
  const now = new Date();
  const diffTime = this.endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Method to check if user can access app features
subscriptionSchema.methods.hasActiveSubscription = function() {
  return !this.isExpired() && (this.status === 'trial' || this.status === 'active');
};

// Method to get plan limits based on plan type
subscriptionSchema.methods.updatePlanLimits = function() {
  switch (this.planType) {
    case 'basic':
      this.limits = {
        socialAccounts: 1,
        scheduledPostsPerWeek: 0,
        analytics: 'basic',
        support: 'basic',
        teamMembers: 1,
        canCreatePosts: false,
        canGenerateAds: false
      };
      this.price = 0;
      break;
    case 'pro_monthly':
      this.limits = {
        socialAccounts: -1,
        scheduledPostsPerWeek: -1,
        analytics: 'advanced',
        support: 'premium',
        teamMembers: 1,
        canCreatePosts: true,
        canGenerateAds: true
      };
      this.price = 5;
      break;
    case 'pro_yearly':
      this.limits = {
        socialAccounts: -1,
        scheduledPostsPerWeek: -1,
        analytics: 'advanced',
        support: 'premium',
        teamMembers: 1,
        canCreatePosts: true,
        canGenerateAds: true
      };
      this.price = 40;
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
    basic: {
      name: 'Basic Plan',
      price: 0,
      interval: 'forever',
      limits: {
        socialAccounts: 1,
        scheduledPostsPerWeek: 0, // Cannot post
        analytics: 'basic',
        support: 'basic',
        teamMembers: 1,
        canCreatePosts: false,
        canGenerateAds: false
      },
      features: [
        'Social media account connections',
        'Basic analytics',
        'Basic support'
      ],
      restrictions: [
        'Cannot create posts',
        'Cannot generate ads',
        'Limited features'
      ]
    },
    pro_monthly: {
      name: 'Pro Plan (Monthly)',
      price: 5, // 5 USDT
      interval: 'month',
      limits: {
        socialAccounts: -1, // Unlimited
        scheduledPostsPerWeek: -1, // Unlimited
        analytics: 'advanced',
        support: 'premium',
        teamMembers: 1,
        canCreatePosts: true,
        canGenerateAds: true
      },
      features: [
        'Unlimited social media accounts',
        'Unlimited scheduled posts',
        'AI Ad Generation',
        'Advanced analytics',
        'Premium support'
      ]
    },
    pro_yearly: {
      name: 'Pro Plan (Yearly)',
      price: 40, // 40 USDT
      interval: 'year',
      limits: {
        socialAccounts: -1, // Unlimited
        scheduledPostsPerWeek: -1, // Unlimited
        analytics: 'advanced',
        support: 'premium',
        teamMembers: 1,
        canCreatePosts: true,
        canGenerateAds: true
      },
      features: [
        'Unlimited social media accounts',
        'Unlimited scheduled posts',
        'AI Ad Generation',
        'Advanced analytics',
        'Premium support',
        'Save 33% vs monthly'
      ]
    }
  };
  return plans[planType] || plans.basic;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);