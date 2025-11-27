import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature: 'posts' | 'ads' | 'analytics';
  className?: string;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  feature, 
  className = '' 
}) => {
  const navigate = useNavigate();
  const { subscription, loading } = useSubscription();
  
  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }
  
  const currentPlan = subscription?.planType || 'basic';
  
  // Check if user has access to the feature
  const hasAccess = currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly';
  
  const getFeatureTitle = () => {
    switch (feature) {
      case 'posts':
        return 'Post Creation & Scheduling';
      case 'ads':
        return 'AI Ad Generation';
      case 'analytics':
        return 'Advanced Analytics';
      default:
        return 'Premium Feature';
    }
  };
  
  const getFeatureDescription = () => {
    switch (feature) {
      case 'posts':
        return 'Create and schedule posts across all your social media platforms';
      case 'ads':
        return 'Generate AI-powered advertisements for your social media campaigns';
      case 'analytics':
        return 'Access detailed analytics and insights for your social media performance';
      default:
        return 'This feature requires a Pro subscription';
    }
  };

  // If subscription is expired, show upgrade prompt
  if (hasAccess) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Premium Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1">
          <Crown className="h-3 w-3 mr-1" />
          PREMIUM
        </Badge>
      </div>
      
      {/* Blurred Content */}
      <div className="relative">
        <div className="filter blur-sm pointer-events-none opacity-30">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 border-0 shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">{getFeatureTitle()}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {getFeatureDescription()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-6">
                  {currentPlan === 'basic' 
                    ? 'Unlock powerful content creation tools with Pro' 
                    : 'Your Pro subscription has expired. Renew to continue'
                  }
                </p>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                    onClick={() => navigate('/dashboard/subscription')}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    Plans starting from 5 USDT/month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionGuard;