const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SocialAccount = require('../models/SocialAccount');
const { authenticateToken } = require('../middleware/auth');

// Get user's current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user.id });
    
    // Create default free subscription if none exists
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free'
      });
      await subscription.save();
    }

    // Update usage stats
    const connectedAccounts = await SocialAccount.countDocuments({ 
      userId: req.user.id, 
      isActive: true 
    });
    
    subscription.usage.connectedAccounts = connectedAccounts;
    await subscription.save();

    res.json({
      success: true,
      subscription: {
        ...subscription.toObject(),
        planDetails: Subscription.getPlanDetails(subscription.planType)
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        ...Subscription.getPlanDetails('free')
      },
      {
        id: 'standard',
        ...Subscription.getPlanDetails('standard')
      },
      {
        id: 'premium',
        ...Subscription.getPlanDetails('premium')
      }
    ];

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Check if user can perform an action based on their plan
router.get('/check-limits', authenticateToken, async (req, res) => {
  try {
    const { action } = req.query; // 'connect-account' or 'schedule-post'
    
    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free'
      });
      await subscription.save();
    }

    let canPerform = false;
    let message = '';

    switch (action) {
      case 'connect-account':
        canPerform = subscription.canConnectMoreAccounts();
        if (!canPerform) {
          message = `Your ${subscription.planType} plan allows ${subscription.limits.socialAccounts} social account(s). Upgrade to connect more.`;
        }
        break;
      case 'schedule-post':
        canPerform = subscription.canScheduleMorePosts();
        if (!canPerform) {
          message = `Your ${subscription.planType} plan allows ${subscription.limits.scheduledPostsPerWeek} scheduled post(s) per week. Upgrade for more.`;
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.json({
      success: true,
      canPerform,
      message,
      currentUsage: subscription.usage,
      limits: subscription.limits
    });
  } catch (error) {
    console.error('Check limits error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upgrade/downgrade subscription plan
router.post('/change-plan', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['free', 'standard', 'premium'].includes(planType)) {
      return res.status(400).json({ success: false, message: 'Invalid plan type' });
    }

    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free'
      });
    }

    const oldPlan = subscription.planType;
    subscription.planType = planType;
    
    // If upgrading to paid plan, set billing date
    if (planType !== 'free') {
      const nextBilling = new Date();
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      subscription.nextBillingDate = nextBilling;
      subscription.status = 'active';
    } else {
      subscription.nextBillingDate = null;
    }

    await subscription.save();

    // Add to billing history
    if (planType !== 'free') {
      subscription.billingHistory.push({
        amount: subscription.price,
        status: 'paid',
        description: `Upgraded to ${subscription.planType} plan`
      });
      await subscription.save();
    }

    res.json({
      success: true,
      message: `Successfully ${planType === 'free' ? 'downgraded' : 'upgraded'} to ${planType} plan`,
      subscription: {
        ...subscription.toObject(),
        planDetails: Subscription.getPlanDetails(subscription.planType)
      }
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add payment method (mock implementation)
router.post('/payment-method', authenticateToken, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free'
      });
    }

    subscription.paymentMethodId = paymentMethodId;
    subscription.stripeCustomerId = `cus_mock_${req.user.id}`;
    await subscription.save();

    res.json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found' });
    }

    subscription.planType = 'free';
    subscription.status = 'cancelled';
    subscription.nextBillingDate = null;
    subscription.paymentMethodId = null;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You have been moved to the free plan.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get billing history
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      return res.json({
        success: true,
        billingHistory: []
      });
    }

    res.json({
      success: true,
      billingHistory: subscription.billingHistory.sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update usage (called when user performs actions)
router.post('/update-usage', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'connect-account', 'schedule-post', etc.
    
    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free'
      });
    }

    switch (action) {
      case 'schedule-post':
        // Check weekly reset
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        
        if (subscription.usage.lastResetDate < weekStart) {
          subscription.usage.scheduledPostsThisWeek = 0;
          subscription.usage.lastResetDate = new Date();
        }
        
        subscription.usage.scheduledPostsThisWeek += 1;
        break;
    }

    await subscription.save();

    res.json({
      success: true,
      usage: subscription.usage
    });
  } catch (error) {
    console.error('Update usage error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;