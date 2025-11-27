
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingCard = ({ 
  title, 
  price, 
  description, 
  features, 
  isPopular = false
}: { 
  title: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}) => (
  <div className={`
    glass-card rounded-xl p-6 border 
    ${isPopular 
      ? 'border-brand-purple relative md:scale-105 z-10' 
      : 'border-white/10'}
  `}>
    {isPopular && (
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-xs px-3 py-1 rounded-full">
        Most Popular
      </span>
    )}
    <div className="text-center mb-6">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="mb-2">
        <span className="text-3xl font-bold">{price}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    
    <div className="space-y-3 mb-6">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start">
          <div className="mt-1 mr-3 flex-shrink-0">
            <Check className={`h-4 w-4 ${isPopular ? 'text-brand-purple' : 'text-brand-blue'}`} />
          </div>
          <p className="text-sm">{feature}</p>
        </div>
      ))}
    </div>
    
    <Button 
      className={`w-full ${isPopular ? 'bg-brand-purple hover:bg-brand-purple/90' : ''}`}
      variant={isPopular ? 'default' : 'outline'}
    >
      Get Started
    </Button>
  </div>
);

const Pricing = () => {
  return (
    <section id="pricing" className="section-padding">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Choose the Right <span className="text-gradient-primary">Plan</span> for You
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start for free or upgrade to Pro for unlimited access to all features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-4">
          <PricingCard
            title="Basic Plan"
            price="Free"
            description="Free forever with limited access"
            features={[
              "Social media account connections",
              "Basic analytics",
              "Community support"
            ]}
          />
          
          <PricingCard
            title="Pro Plan (Monthly)"
            price="5 USDT/month"
            description="Full access with monthly billing"
            features={[
              "Unlimited social media accounts",
              "Unlimited scheduled posts",
              "AI Ad Generation",
              "Advanced analytics",
              "Premium support"
            ]}
            isPopular={true}
          />
          
          <PricingCard
            title="Pro Plan (Yearly)"
            price="40 USDT/year"
            description="Full access with yearly billing - Save 33%"
            features={[
              "Unlimited social media accounts",
              "Unlimited scheduled posts",
              "AI Ad Generation",
              "Advanced analytics",
              "Premium support",
              "Save 33% vs monthly plan"
            ]}
          />
        </div>

        <div className="mt-12 text-center glass-card p-8 rounded-xl max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Start with the Basic Plan</h3>
          <p className="text-muted-foreground mb-6">
            Connect your social media accounts and explore our platform for free. Upgrade to Pro anytime to unlock unlimited posting and AI-powered features.
          </p>
          <Button variant="outline" size="lg">Get Started Free</Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
