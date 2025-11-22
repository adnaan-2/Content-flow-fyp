import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, CreditCard, Calendar, DollarSign, Shield, Users, BarChart, Zap, Globe, Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import subscriptionApi from "@/services/subscriptionApi";

interface Plan {
  id: string;
  name: string;
  price: number;
  limits: {
    socialAccounts: number;
    scheduledPostsPerWeek: number;
    analytics: string;
    support: string;
    teamMembers: number;
  };
  features: string[];
}

interface SubscriptionData {
  planType: string;
  status: string;
  price: number;
  nextBillingDate?: string;
  paymentMethodId?: string;
  billingHistory: Array<{
    date: string;
    amount: number;
    status: string;
    description?: string;
  }>;
  usage: {
    connectedAccounts: number;
    scheduledPostsThisWeek: number;
  };
  limits: {
    socialAccounts: number;
    scheduledPostsPerWeek: number;
  };
}

const Subscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
    
    // Check URL parameters for Stripe checkout results
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');
    const mock = urlParams.get('mock');
    const plan = urlParams.get('plan');
    
    if (success === 'true' && sessionId) {
      // Verify the checkout session
      subscriptionApi.verifyCheckout(sessionId)
        .then(() => {
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
          });
          loadSubscriptionData();
        })
        .catch(() => {
          toast({
            title: "Verification Failed",
            description: "Please contact support if you were charged.",
            variant: "destructive"
          });
        });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "You can upgrade your plan anytime.",
        variant: "default"
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (mock === 'true' && plan) {
      toast({
        title: "Development Mode",
        description: `Mock payment flow for ${plan} plan. Use the upgrade button to simulate payment.`,
        variant: "default"
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subscriptionResponse, plansResponse] = await Promise.all([
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getAvailablePlans()
      ]);
      
      setCurrentSubscription(subscriptionResponse.subscription);
      setAvailablePlans(plansResponse.plans);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(planId);
      
      // Check if user is already on this plan
      if (currentPlan === planId) {
        toast({
          title: "Already Active",
          description: "This plan is already active for your account.",
          variant: "default"
        });
        return;
      }
      
      // If it's free trial, show message
      if (planId === 'free_trial') {
        toast({
          title: "Free Trial",
          description: "You are already on the free trial. Upgrade to a paid plan for more features.",
          variant: "default"
        });
        return;
      }
      
      // For paid plans, create checkout session
      if (planId === 'standard' || planId === 'premium') {
        const response = await subscriptionApi.createCheckoutSession(planId);
        
        if (response.mock) {
          // Handle mock payment for development
          const confirmPayment = window.confirm(
            `This is a development environment. Simulate payment for ${planId} plan?`
          );
          
          if (confirmPayment) {
            const mockResponse = await subscriptionApi.mockPaymentSuccess(planId);
            toast({
              title: "Success",
              description: mockResponse.message,
            });
            await loadSubscriptionData();
          }
        } else {
          // Redirect to Stripe checkout
          window.location.href = response.checkoutUrl;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process upgrade",
        variant: "destructive"
      });
    } finally {
      setUpgrading(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await subscriptionApi.cancelSubscription();
      toast({
        title: "Subscription Cancelled",
        description: response.message,
      });
      await loadSubscriptionData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };

  const handleAddPaymentMethod = () => {
    toast({
      title: "Payment Method",
      description: "Payment method management will be available in the next update. For now, you can update your payment method through the subscription upgrade process.",
      variant: "default"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  const plans = [
    {
      id: "free_trial",
      name: "30-Day Free Trial",
      price: 0,
      interval: "30 days",
      description: "Perfect for getting started",
      features: [
        "2 social media account connections",
        "5 scheduled posts per week",
        "Basic analytics",
        "Community support",
        "30 days free access"
      ],
      limitations: [
        "Trial expires after 30 days",
        "Limited to basic features"
      ],
      isPopular: false,
      color: "border-green-300"
    },
    {
      id: "standard",
      name: "Standard Plan",
      price: 10,
      interval: "month",
      description: "Ideal for growing creators",
      features: [
        "4 social media accounts (1 per platform)",
        "8 scheduled posts per week",
        "Advanced analytics",
        "Priority support"
      ],
      limitations: [
        "1 Facebook, 1 Instagram, 1 LinkedIn, 1 X account only"
      ],
      isPopular: true,
      color: "border-blue-500"
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 25,
      interval: "month",
      description: "For teams, organizations, and businesses",
      features: [
        "Unlimited social media accounts",
        "Unlimited scheduled posts",
        "Custom analytics reports",
        "24/7 premium support",
        "Unlimited team members"
      ],
      limitations: [],
      isPopular: false,
      color: "border-purple-500"
    }
  ];

  const currentPlan = currentSubscription?.planType || 'free';
  const hasPaymentMethod = currentSubscription?.paymentMethodId ? true : false;
  const currentPlanDetails = plans.find(p => p.id === currentPlan);
  const billingHistory = currentSubscription?.billingHistory || [];

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground">Choose the perfect plan for your content creation needs</p>
      </div>
      
      {/* Plan Cards - Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative bg-gray-900 border-gray-700 ${
            plan.isPopular ? "shadow-lg ring-2 ring-blue-500/50" : "shadow-md"
          } ${currentPlan === plan.id ? "ring-2 ring-green-500/50" : ""} 
          flex flex-col h-full`}>
            
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1">
                  <Star className="h-3 w-3 mr-1" fill="currentColor" />
                  Most Popular
                </Badge>
              </div>
            )}

            {currentPlan === plan.id && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-600 text-white">
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="mb-4">
                {plan.id === "free" && <Zap className="h-12 w-12 mx-auto text-green-400" />}
                {plan.id === "standard" && <BarChart className="h-12 w-12 mx-auto text-blue-400" />}
                {plan.id === "premium" && <Globe className="h-12 w-12 mx-auto text-purple-400" />}
              </div>
              <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
              <CardDescription className="text-sm text-gray-300">{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">{plan.price}$</span>
                <span className="text-gray-300 text-lg">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 flex-grow">
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center text-white">
                  <Check className="h-4 w-4 mr-2 text-green-400" />
                  What's Included:
                </h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.limitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-amber-400">
                    Limitations:
                  </h4>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="text-sm text-gray-300">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-4 mt-auto">
              <div className="w-full flex items-center justify-center">
                {currentPlan === plan.id ? (
                  <Button 
                    variant="outline" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-500 hover:border-green-600" 
                    disabled
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Plan Active
                  </Button>
                ) : (
                  <Button 
                    className={`w-full ${
                      plan.isPopular 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                        : plan.id === "free_trial"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    } text-white font-semibold`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                  >
                    {upgrading === plan.id ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {plan.id === "free_trial" ? (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Start Free Trial
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Upgrade to {plan.name}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Billing Information Section */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <CreditCard className="h-6 w-6 mr-2" />
                  Billing Information
                </CardTitle>
                <CardDescription>Manage your payment methods and billing history</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {!hasPaymentMethod && currentPlan === "free" ? (
              // No payment method - Free plan
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Method Added</h3>
                <p className="text-gray-500 mb-6">You're currently on the free plan. Add a payment method to upgrade to premium features.</p>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Payment Method",
                      description: "Add payment method functionality will be available after upgrading to a paid plan.",
                      variant: "default"
                    });
                  }} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              // Has payment method or paid plan
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Current Plan Info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <h3 className="font-semibold flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-blue-600" />
                        Current Plan
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">{currentPlanDetails?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentPlanDetails?.price ? `$${currentPlanDetails.price}` : '$0'}/{currentPlanDetails?.interval || 'month'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Next billing</p>
                      <p className="font-semibold">Nov 1, 2024</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Method
                    </h3>
                    {hasPaymentMethod ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="font-medium">•••• •••• •••• 4242</p>
                            <p className="text-xs text-muted-foreground">Expires 12/26</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No payment method added</p>
                    )}
                  </div>
                </div>

                {/* Billing History */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Recent Payments
                  </h3>
                  
                  {currentPlan !== "free" && hasPaymentMethod ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-secondary/30 px-4 py-2 grid grid-cols-3 text-sm font-medium">
                        <span>Date</span>
                        <span>Amount</span>
                        <span>Status</span>
                      </div>
                      {billingHistory.map((payment, index) => (
                        <div key={index} className="px-4 py-3 border-t grid grid-cols-3 text-sm">
                          <span>{new Date(payment.date).toLocaleDateString()}</span>
                          <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                          <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No payment history available</p>
                      <p className="text-xs">Upgrade to a paid plan to see billing history</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          
          {(hasPaymentMethod || currentPlan !== "free") && (
            <CardFooter className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-gray-500 hover:border-gray-600" 
                  onClick={handleAddPaymentMethod}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {hasPaymentMethod ? "Update Payment Method" : "Add Payment Method"}
                </Button>
                {currentPlan !== "free" && (
                  <Button 
                    variant="destructive" 
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold" 
                    onClick={handleCancelSubscription}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Subscription;