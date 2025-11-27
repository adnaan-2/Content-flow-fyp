import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Calendar, 
  Upload, 
  PlusCircle, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface DashboardSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const DashboardSidebar = ({ isOpen, toggleSidebar }: DashboardSidebarProps) => {
  const location = useLocation();
  const { subscription, refreshSubscription, isPro, currentPlan } = useSubscription();
  
  // Listen for URL changes to refresh subscription after payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    // If user returned from successful payment, refresh subscription
    if (success === 'true' && sessionId) {
      const refreshAfterPayment = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s for backend to process
          await refreshSubscription();
        } catch (error) {
          console.error('Failed to refresh subscription:', error);
        }
      };
      refreshAfterPayment();
    }
  }, [location.search, refreshSubscription]);
  
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Link Accounts", icon: LinkIcon, path: "/dashboard/link-accounts" },
    { label: "Schedule Posts", icon: Calendar, path: "/dashboard/schedule" },
    { label: "Upload Posts", icon: Upload, path: "/dashboard/upload", premium: true },
    { label: "Generate Ads", icon: PlusCircle, path: "/dashboard/generate-ads", premium: true },
    { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={`${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300 ease-in-out fixed top-0 left-0 z-50 
      h-screen bg-background border-r border-border shadow-lg flex flex-col`}
    >
      <div className="p-4 flex items-center justify-between">
        <Link to="/dashboard" className={`flex items-center gap-2 text-primary font-bold ${isOpen ? 'text-xl' : 'text-sm justify-center w-full'}`}>
          <div className="flex flex-col items-center">
            <div className="flex">
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/70 ml-1 rounded-sm"></div>
            </div>
            <div className="flex mt-1">
              <div className="w-3 h-3 bg-primary/70 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm ml-1"></div>
            </div>
          </div>
          {isOpen && <span className="text-gradient-primary">ContentFlow</span>}
        </Link>
        
        <Button
          variant="ghost"
          size="icon"
          className={`${isOpen ? '' : 'hidden'} rounded-full h-8 w-8 hover:bg-primary/20 transition-colors`}
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-6 px-3 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path} className="relative">
              <Link 
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`${isOpen ? "mr-3" : "mx-auto"} h-5 w-5 ${isActive(item.path) ? "" : "text-muted-foreground"}`} />
                {isOpen && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{item.label}</span>
                    {item.premium && !isPro && (
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        Pro
                      </Badge>
                    )}
                  </div>
                )}
              </Link>
              {!isOpen && item.premium && !isPro && (
                <div className="absolute -top-1 -right-1">
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1 py-0">
                    P
                  </Badge>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {!isOpen && (
        <div className="mt-auto pb-5 flex flex-col items-center space-y-2">
          <Link to="/dashboard/subscription">
            <Button 
              variant="outline" 
              size="icon"
              title={`Subscription: ${currentPlan === 'pro_monthly' || currentPlan === 'pro_yearly' ? 'Pro' : 'Basic'}`}
              className="rounded-full h-8 w-8 hover:bg-primary/20 transition-colors"
            >
              <Crown className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            variant="ghost" 
            size="icon"
            className="rounded-full h-10 w-10 hover:bg-primary/20 transition-colors"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {isOpen && (
        <div className="mt-auto pb-6 px-4 space-y-3">
          {/* Subscription Card */}
          {!isPro ? (
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-semibold">Upgrade</span>
                </div>
              </div>
              <Link to="/dashboard/subscription">
                <Button variant="secondary" size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-sm h-8">
                  View Plans
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-semibold">Pro Active</span>
                </div>
              </div>
              <Link to="/dashboard/subscription">
                <Button variant="secondary" size="sm" className="w-full bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/30 text-sm h-8">
                  Manage Plan
                </Button>
              </Link>
            </Card>
          )}
          
          <div className="mt-4">
            <Link to="/dashboard/import-media">
              <Button 
                variant="default" 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 rounded-xl shadow-md"
              >
                <Upload className="h-4 w-4" />
                <span>Import Media</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;