import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, Sun, Lock } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "@/components/ui/use-toast";

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const handleNotificationChange = (type: string, value: boolean) => {
    switch (type) {
      case 'email':
        setEmailNotifications(value);
        break;
      case 'browser':
        setBrowserNotifications(value);
        break;
      case 'marketing':
        setMarketingEmails(value);
        break;
    }
    
    toast({
      title: "Settings updated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${value ? 'enabled' : 'disabled'}`,
    });
  };

  return (
    <div className="container mx-auto py-8 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
      
      <div className="grid gap-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Manage how you receive notifications from the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email-notifications" className="text-gray-700 dark:text-gray-300">Email Notifications</Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your posts and account</span>
              </div>
              <Switch 
                id="email-notifications" 
                checked={emailNotifications}
                onCheckedChange={(value) => handleNotificationChange('email', value)}
              />
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="browser-notifications" className="text-gray-700 dark:text-gray-300">Browser Notifications</Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">Get notified in your browser when posts are published</span>
              </div>
              <Switch 
                id="browser-notifications" 
                checked={browserNotifications}
                onCheckedChange={(value) => handleNotificationChange('browser', value)}
              />
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="marketing-emails" className="text-gray-700 dark:text-gray-300">Marketing Emails</Label>
                <span className="text-sm text-gray-500 dark:text-gray-400">Receive updates about new features and promotions</span>
              </div>
              <Switch 
                id="marketing-emails" 
                checked={marketingEmails}
                onCheckedChange={(value) => handleNotificationChange('marketing', value)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              {theme === 'light' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
              Appearance
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Customize the look and feel of the interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-blue-500" />
                  )}
                  <Label htmlFor="theme-toggle" className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</Label>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-6">
                  Switch between light and dark themes
                </span>
              </div>
              <Switch 
                id="theme-toggle" 
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Manage your account security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="block mb-1 text-gray-700 dark:text-gray-300">Password</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 3 months ago</p>
              </div>
              <Button variant="outline" className="border-gray-300 dark:border-gray-600">Change Password</Button>
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="block mb-1 text-gray-700 dark:text-gray-300">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
              </div>
              <Button variant="outline" className="border-gray-300 dark:border-gray-600">Enable</Button>
            </div>
            <Separator className="bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center justify-between">
              <div>
                <Label className="block mb-1 text-red-600 dark:text-red-400">Delete Account</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;