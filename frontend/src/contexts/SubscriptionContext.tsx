import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import subscriptionApi from '@/services/subscriptionApi';
import { useAuth } from './AuthContext';

interface SubscriptionData {
  paymentMethodId: any;
  billingHistory: any[];
  planType: string;
  status: string;
  endDate?: string;
  nextBillingDate?: string;
  usage?: any;
  limits?: any;
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  isPro: boolean;
  currentPlan: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getCurrentSubscription();
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      // Set default subscription state on error
      setSubscription({
        planType: 'basic',
        status: 'active',
        paymentMethodId: null,
        billingHistory: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      // Set default basic plan for unauthenticated users
      setSubscription({
        planType: 'basic',
        status: 'active',
        paymentMethodId: null,
        billingHistory: []
      });
      return;
    }
    
    refreshSubscription();
  }, [isAuthenticated]);

  const currentPlan = subscription?.planType || 'basic';
  const isPro = currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly';

  const value: SubscriptionContextType = {
    subscription,
    loading,
    refreshSubscription,
    isPro,
    currentPlan,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};