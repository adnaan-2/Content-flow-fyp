const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const SocialAccount = require('../models/SocialAccount');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const stripeService = require('../services/stripeService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get user's current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.user.id });
    
    // Create default free trial subscription if none exists
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free_trial',
        status: 'trial'
      });
      await subscription.save();
    }
    
    // Check if subscription is expired and update status
    if (subscription.isExpired()) {
      subscription.status = 'expired';
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
        planDetails: Subscription.getPlanDetails(subscription.planType),
        daysRemaining: subscription.getDaysRemaining(),
        hasActiveSubscription: subscription.hasActiveSubscription(),
        isExpired: subscription.isExpired()
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

// Create checkout session for subscription upgrade
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['standard', 'premium'].includes(planType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan type. Only standard and premium plans require payment.' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.user.id,
        planType: 'free_trial',
        status: 'trial'
      });
      await subscription.save();
    }

    // Check if Stripe is configured
    if (!stripeService || !stripe) {
      // Mock checkout for development/testing
      return res.json({
        success: true,
        checkoutUrl: `${process.env.FRONTEND_URL}/dashboard/subscription?mock=true&plan=${planType}`,
        sessionId: `mock_session_${Date.now()}`,
        mock: true
      });
    }

    // Create or get Stripe customer
    let stripeCustomerId = subscription.stripeCustomerId;
    
    // Ensure we don't use mock customer IDs
    if (!stripeCustomerId || stripeCustomerId.includes('mock')) {
      console.log('Creating new Stripe customer for user:', user.email);
      const customer = await stripeService.createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        user._id
      );
      stripeCustomerId = customer.id;
      subscription.stripeCustomerId = stripeCustomerId;
      await subscription.save();
      console.log('Created Stripe customer:', stripeCustomerId);
    }

    // Get the correct price ID based on plan
    const priceId = planType === 'standard' 
      ? process.env.STRIPE_STANDARD_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ 
        success: false, 
        message: 'Stripe configuration error. Please contact support.' 
      });
    }

    // Create checkout session
    const session = await stripeService.createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${process.env.FRONTEND_URL}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      `${process.env.FRONTEND_URL}/dashboard/subscription?canceled=true`,
      req.user.id
    );

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create checkout session',
      error: error.message 
    });
  }
});

// Mock payment success for development
router.post('/mock-payment-success', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['standard', 'premium'].includes(planType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan type' 
      });
    }

    let subscription = await Subscription.findOne({ userId: req.user.id });
    if (!subscription) {
      subscription = new Subscription({ userId: req.user.id });
    }

    subscription.planType = planType;
    subscription.status = 'active';
    subscription.stripeSubscriptionId = `mock_sub_${Date.now()}`;
    
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    subscription.nextBillingDate = nextBilling;
    
    await subscription.save();

    res.json({
      success: true,
      message: `Successfully upgraded to ${planType} plan!`,
      subscription: subscription.toObject()
    });
  } catch (error) {
    console.error('Mock payment success error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify checkout session and update subscription
router.post('/verify-checkout', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!stripe) {
      return res.status(400).json({
        success: false,
        message: 'Stripe not configured'
      });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' && session.metadata.userId === req.user.id.toString()) {
      // Update subscription in database
      await stripeService.updateUserSubscriptionFromStripe(req.user.id, session.subscription);
      
      res.json({
        success: true,
        message: 'Subscription activated successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify checkout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify payment' 
    });
  }
});

// Change subscription plan (for existing paying customers)
router.post('/change-plan', authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    
    if (!['standard', 'premium'].includes(planType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid plan type' 
      });
    }

    let subscription = await Subscription.findOne({ userId: req.user.id });
    
    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'No subscription found. Please create a subscription first.' 
      });
    }

    // Check if user has an active Stripe subscription
    if (!subscription.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active payment subscription found. Please subscribe first.',
        requiresPayment: true
      });
    }

    if (!stripeService) {
      // Mock plan change for development
      subscription.planType = planType;
      await subscription.save();
      
      return res.json({
        success: true,
        message: `Successfully changed to ${planType} plan`,
        subscription: subscription.toObject()
      });
    }

    // Update Stripe subscription
    const priceId = planType === 'standard' 
      ? process.env.STRIPE_STANDARD_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PRICE_ID;

    await stripeService.updateSubscription(subscription.stripeSubscriptionId, priceId);
    
    // Update local subscription
    subscription.planType = planType;
    await subscription.save();

    res.json({
      success: true,
      message: `Successfully changed to ${planType} plan`,
      subscription: subscription.toObject()
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

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId && stripeService) {
      try {
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // Continue with local cancellation even if Stripe fails
      }
    }

    subscription.planType = 'free_trial';
    subscription.status = 'cancelled';
    subscription.nextBillingDate = null;
    subscription.paymentMethodId = null;
    subscription.stripeSubscriptionId = null;
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You have been moved to the free trial.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Stripe webhooks endpoint
router.post('/webhooks', express.raw({type: 'application/json'}), async (req, res) => {
  if (!stripe || !stripeService) {
    return res.status(400).json({error: 'Stripe not configured'});
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await stripeService.handleWebhook(event);
    res.json({received: true});
  } catch (error) {
    console.error('Webhook handling failed:', error);
    res.status(400).json({error: 'Webhook handling failed'});
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