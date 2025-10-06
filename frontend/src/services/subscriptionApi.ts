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

// Add payment method
export const addPaymentMethod = async (paymentMethodId: string) => {
  try {
    const response = await api.post('/subscription/payment-method', { paymentMethodId });
    return response.data;
  } catch (error) {
    console.error('Add payment method error:', error);
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
  addPaymentMethod,
  cancelSubscription,
  getBillingHistory,
  updateUsage
};