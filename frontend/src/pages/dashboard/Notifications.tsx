import React, { useState, useEffect } from 'react';
import { Bell, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import notificationApi, { Notification } from '@/services/notificationApi';
import { formatDistanceToNow } from 'date-fns';

const notificationTypes = [
  { value: 'all', label: 'All Notifications' },
  { value: 'social_account_connected', label: 'Account Connected' },
  { value: 'social_account_disconnected', label: 'Account Disconnected' },
  { value: 'social_account_connection_failed', label: 'Connection Failed' },
  { value: 'post_published', label: 'Post Published' },
  { value: 'post_scheduled', label: 'Post Scheduled' },
  { value: 'post_publish_failed', label: 'Post Failed' },
  { value: 'subscription_activated', label: 'Subscription Activated' },
  { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { value: 'profile_updated', label: 'Profile Updated' },
];

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
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
  }
  if (type.includes('connected') || type.includes('published') || type.includes('activated') || type.includes('renewed')) {
    return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
  }
  if (type.includes('scheduled') || type.includes('updated')) {
    return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20';
  }
  return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20';
};

const NotificationsPage: React.FC = () => {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { unreadCount, markAllAsRead, deleteAllNotifications } = useNotifications();
  const { toast } = useToast();

  // Auto-mark all notifications as read when page loads
  useEffect(() => {
    const autoMarkAsRead = async () => {
      if (unreadCount > 0) {
        try {
          await markAllAsRead();
        } catch (error) {
          console.error('Failed to auto-mark notifications as read:', error);
        }
      }
    };
    
    // Add a small delay to ensure notifications are loaded first
    const timer = setTimeout(autoMarkAsRead, 1000);
    return () => clearTimeout(timer);
  }, [unreadCount, markAllAsRead]);

  const loadNotifications = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      
      const response = await notificationApi.getNotifications(pageNum, 20, showUnreadOnly, filter === 'all' ? undefined : filter);
      
      if (response.success) {
        if (reset || pageNum === 1) {
          setAllNotifications(response.notifications);
        } else {
          setAllNotifications(prev => [...prev, ...response.notifications]);
        }
        setHasMore(response.pagination.hasNext);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter notifications based on current filters
  useEffect(() => {
    let filtered = [...allNotifications];
    
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    setFilteredNotifications(filtered);
  }, [allNotifications, filter, showUnreadOnly]);

  useEffect(() => {
    loadNotifications(1, true);
  }, [filter, showUnreadOnly]);



  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadNotifications(1, true)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {notificationTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            Unread only
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading notifications...</span>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-12">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications found</h3>
              <p className="text-muted-foreground">
                {showUnreadOnly 
                  ? "You have no unread notifications" 
                  : filter !== 'all'
                  ? `No notifications of type "${notificationTypes.find(t => t.value === filter)?.label}"`
                  : "You're all caught up!"
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-0">
                {filteredNotifications.map((notification, index) => (
                  <div
                    key={notification._id}
                    className={`group relative p-4 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors border-l-4 ${
                      notification.isRead 
                        ? 'border-l-transparent' 
                        : 'border-l-primary'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <span className="text-xl" role="img" aria-label="notification-icon">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-card-foreground mb-1">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 break-words">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              </span>
                              
                              <Badge variant="outline" className="text-xs">
                                {notificationTypes.find(t => t.value === notification.type)?.label || notification.type}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-4">
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;