import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CreditCard, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import subscriptionApi from '@/services/subscriptionApi';

interface SubscriptionStatus {
  planType: string;
  status: string;
  isExpired: boolean;
  hasActiveSubscription: boolean;
  daysRemaining: number;
  trialEndDate?: string;
}

const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const response = await subscriptionApi.getCurrentSubscription();
      setSubscription(response.subscription);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/dashboard/subscription');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If subscription is expired, show upgrade prompt
  if (subscription && subscription.isExpired && !subscription.hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full w-fit">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">Subscription Expired</CardTitle>
            <p className="text-muted-foreground">
              Your {subscription.planType === 'free_trial' ? '30-day free trial has' : 'subscription has'} expired.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                To continue using all features, please upgrade to a paid plan.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                onClick={handleUpgradeClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Choose from our flexible plans starting at $10/month
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show trial warning if less than 7 days remaining
  const showTrialWarning = subscription && 
    subscription.planType === 'free_trial' && 
    subscription.daysRemaining <= 7 && 
    subscription.daysRemaining > 0;

  return (
    <div className="relative">
      {showTrialWarning && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 text-center">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              Free trial ends in {subscription.daysRemaining} day{subscription.daysRemaining !== 1 ? 's' : ''}!
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUpgradeClick}
              className="ml-2 bg-white text-orange-600 hover:bg-gray-100"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default SubscriptionGuard;