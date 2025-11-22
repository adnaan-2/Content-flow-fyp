const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  // Create Stripe customer
  async createCustomer(email, name, userId) {
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: userId.toString()
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create checkout session for subscription
  async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, userId) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId.toString()
        },
        subscription_data: {
          metadata: {
            userId: userId.toString()
          }
        }
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create payment intent for one-time payment
  async createPaymentIntent(amount, currency = 'usd', customerId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Get subscription from Stripe
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, priceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations',
      });
      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  async handleCheckoutCompleted(session) {
    const userId = session.metadata.userId;
    if (session.mode === 'subscription') {
      // Subscription checkout completed
      await this.updateUserSubscriptionFromStripe(userId, session.subscription);
    }
  }

  async handleSubscriptionCreated(subscription) {
    const userId = subscription.metadata.userId;
    await this.updateUserSubscriptionFromStripe(userId, subscription.id);
  }

  async handleSubscriptionUpdated(subscription) {
    const userId = subscription.metadata.userId;
    await this.updateUserSubscriptionFromStripe(userId, subscription.id);
  }

  async handleSubscriptionDeleted(subscription) {
    const userId = subscription.metadata.userId;
    const userSubscription = await Subscription.findOne({ userId });
    if (userSubscription) {
      userSubscription.status = 'cancelled';
      userSubscription.stripeSubscriptionId = null;
      await userSubscription.save();
    }
  }

  async handlePaymentSucceeded(invoice) {
    // Handle successful payment
    console.log('Payment succeeded for invoice:', invoice.id);
  }

  async handlePaymentFailed(invoice) {
    // Handle failed payment
    console.log('Payment failed for invoice:', invoice.id);
  }

  async updateUserSubscriptionFromStripe(userId, stripeSubscriptionId) {
    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      let userSubscription = await Subscription.findOne({ userId });
      
      if (!userSubscription) {
        userSubscription = new Subscription({ userId });
      }

      // Map Stripe price ID to plan type
      const priceId = stripeSubscription.items.data[0].price.id;
      let planType = 'standard';
      if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
        planType = 'premium';
      }

      userSubscription.planType = planType;
      userSubscription.status = stripeSubscription.status === 'active' ? 'active' : stripeSubscription.status;
      userSubscription.stripeSubscriptionId = stripeSubscriptionId;
      userSubscription.stripeCustomerId = stripeSubscription.customer;
      userSubscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      userSubscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      
      await userSubscription.save();
    } catch (error) {
      console.error('Error updating user subscription from Stripe:', error);
      throw error;
    }
  }

  // Get Stripe prices (products)
  async getPrices() {
    try {
      const prices = await this.stripe.prices.list({
        active: true,
        type: 'recurring',
      });
      return prices.data;
    } catch (error) {
      console.error('Error getting prices:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();