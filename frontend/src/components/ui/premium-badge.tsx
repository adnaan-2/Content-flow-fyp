import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  currentPlan: string;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  currentPlan, 
  className = '' 
}) => {
  const isPro = currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly';
  
  if (isPro) {
    return (
      <Badge className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 text-xs ${className}`}>
        <Crown className="h-3 w-3 mr-1" />
        PRO
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className={`border-gray-400 text-gray-600 px-2 py-1 text-xs ${className}`}>
      Basic
    </Badge>
  );
};

export default PremiumBadge;