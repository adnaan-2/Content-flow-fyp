import api from './api';

// Get current user subscription
export const getCurrentSubscription = async () => {
  try {
    const response = await api.get('/subscription/current');
    return response.data;
  } catch (error) {
    console.error('Get subscription error:', error);
    throw error;
  }
};

// Get all available plans
export const getAvailablePlans = async () => {
  try {
    const response = await api.get('/subscription/plans');
    return response.data;
  } catch (error) {
    console.error('Get plans error:', error);
    throw error;
  }
};

// Check if user can perform an action
export const checkSubscriptionLimits = async (action: 'connect-account' | 'schedule-post') => {
  try {
    const response = await api.get(`/subscription/check-limits?action=${action}`);
    return response.data;
  } catch (error) {
    console.error('Check limits error:', error);
    throw error;
  }
};

// Change subscription plan
export const changeSubscriptionPlan = async (planType: 'free' | 'standard' | 'premium') => {
  try {
    const response = await api.post('/subscription/change-plan', { planType });
    return response.data;
  } catch (error) {
    console.error('Change plan error:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscriptionStatus = async () => {
  try {
    const response = await api.get('/subscription/current');
    return response.data.subscription;
  } catch (error) {
    console.error('Check subscription status error:', error);
    throw error;
  }
};

// Create Stripe checkout session
export const createCheckoutSession = async (planType: 'standard' | 'premium') => {
  try {
    const response = await api.post('/subscription/create-checkout-session', { planType });
    return response.data;
  } catch (error) {
    console.error('Create checkout session error:', error);
    throw error;
  }
};

// Mock payment success for development
export const mockPaymentSuccess = async (planType: 'standard' | 'premium') => {
  try {
    const response = await api.post('/subscription/mock-payment-success', { planType });
    return response.data;
  } catch (error) {
    console.error('Mock payment success error:', error);
    throw error;
  }
};

// Verify checkout session
export const verifyCheckout = async (sessionId: string) => {
  try {
    const response = await api.post('/subscription/verify-checkout', { sessionId });
    return response.data;
  } catch (error) {
    console.error('Verify checkout error:', error);
    throw error;
  }
};

// Cancel subscription
export const cancelSubscription = async () => {
  try {
    const response = await api.post('/subscription/cancel');
    return response.data;
  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw error;
  }
};

// Get billing history
export const getBillingHistory = async () => {
  try {
    const response = await api.get('/subscription/billing-history');
    return response.data;
  } catch (error) {
    console.error('Get billing history error:', error);
    throw error;
  }
};

// Update usage
export const updateUsage = async (action: string) => {
  try {
    const response = await api.post('/subscription/update-usage', { action });
    return response.data;
  } catch (error) {
    console.error('Update usage error:', error);
    throw error;
  }
};

export default {
  getCurrentSubscription,
  getAvailablePlans,
  checkSubscriptionLimits,
  changeSubscriptionPlan,
  createCheckoutSession,
  mockPaymentSuccess,
  verifyCheckout,
  cancelSubscription,
  getBillingHistory,
  updateUsage
};