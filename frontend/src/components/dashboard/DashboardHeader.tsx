import { useState } from "react";
import { User, ChevronDown, Menu, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationDropdown from "./NotificationDropdown";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Define the proper props interface with toggleSidebar
interface DashboardHeaderProps {
  toggleSidebar: () => void;
}

const DashboardHeader = ({ toggleSidebar }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-black/80 border-b border-gray-200/60 dark:border-gray-800/60 py-3 px-4 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* Logo/Brand - always visible */}
        <Link to="/dashboard" className="flex items-center gap-2 text-primary font-bold text-lg">
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
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ContentFlow</span>
        </Link>
      </div>
      
      <div className="flex-1" />
      
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="relative h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <NotificationDropdown />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2">
              <Avatar className="h-8 w-8">
                {(() => {
                  // Get the profile picture URL, filtering out invalid values
                  const profileUrl = user?.profilePhoto || user?.profilePicture || user?.profileImage;
                  const isValidUrl = profileUrl && 
                    profileUrl !== 'default-avatar.png' && 
                    profileUrl !== '' &&
                    (profileUrl.startsWith('http://') || profileUrl.startsWith('https://'));
                  
                  if (isValidUrl) {
                    return (
                      <>
                        <AvatarImage 
                          src={profileUrl} 
                          alt={user?.name || "User"}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {getInitials(user?.name || "User")}
                        </AvatarFallback>
                      </>
                    );
                  }
                  
                  return (
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {getInitials(user?.name || "User")}
                    </AvatarFallback>
                  );
                })()}
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {user?.email || ""}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2">
              <p className="font-medium text-sm">
                {user?.name || "No name available"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "No email available"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/subscription" className="w-full cursor-pointer">
                <span className="mr-2">💳</span>
                Subscription
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="w-full cursor-pointer">
                <span className="mr-2">⚙️</span>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
              <span className="mr-2">🔓</span>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;