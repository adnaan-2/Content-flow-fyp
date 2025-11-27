import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'social_account_connected':
      return '🔗';
    case 'social_account_disconnected':
      return '❌';
    case 'social_account_connection_failed':
      return '⚠️';
    case 'post_published':
      return '📤';
    case 'post_scheduled':
      return '⏰';
    case 'post_publish_failed':
    case 'post_schedule_failed':
      return '❌';
    case 'scheduled_post_edited':
      return '✏️';
    case 'subscription_activated':
      return '✨';
    case 'subscription_cancelled':
    case 'subscription_expired':
      return '⚠️';
    case 'subscription_renewed':
      return '🔄';
    case 'profile_updated':
    case 'profile_picture_updated':
      return '👤';
    case 'password_changed':
      return '🔒';
    default:
      return '📱';
  }
};

const getNotificationColor = (type: string) => {
  if (type.includes('failed') || type.includes('expired') || type.includes('disconnected')) {
    return 'text-red-600 dark:text-red-400';
  }
  if (type.includes('connected') || type.includes('published') || type.includes('activated') || type.includes('renewed')) {
    return 'text-green-600 dark:text-green-400';
  }
  if (type.includes('scheduled') || type.includes('updated')) {
    return 'text-blue-600 dark:text-blue-400';
  }
  return 'text-gray-600 dark:text-gray-400';
};

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAllAsRead } = useNotifications();
  const { toast } = useToast();

  // Auto-mark all as read when dropdown opens
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    
    if (open && unreadCount > 0) {
      try {
        await markAllAsRead();
      } catch (error) {
        console.error('Failed to mark notifications as read:', error);
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative p-2 h-9 w-9 ${className}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          

        </div>

        {/* Content */}
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`group relative p-4 hover:bg-accent/50 cursor-pointer transition-colors border-l-4 ${
                    notification.isRead 
                      ? 'border-l-transparent' 
                      : 'border-l-primary bg-accent/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-lg" role="img" aria-label="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm text-card-foreground truncate pr-2">
                          {notification.title}
                        </p>
                        

                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${getNotificationColor(notification.type)}`}>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border">
            <Link to="/dashboard/notifications">
              <Button 
                variant="ghost" 
                className="w-full h-8 text-sm"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;