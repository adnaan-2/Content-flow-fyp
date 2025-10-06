import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, CheckCheck, Eye, EyeOff, Trash2, MoreVertical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/services/notificationApi";

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadMoreNotifications,
    hasMore
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Filter notifications based on unread filter
  const filteredNotifications = showUnreadOnly 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Format notification time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'post_scheduled':
      case 'post_published':
        return '📝';
      case 'social_account_connected':
      case 'social_account_disconnected':
        return '🔗';
      case 'password_changed':
        return '🔒';
      case 'profile_updated':
        return '👤';
      case 'subscription_changed':
        return '💳';
      case 'payment_processed':
        return '💰';
      default:
        return '🔔';
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  // Handle mark as read/unread
  const handleToggleRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (notification.isRead) {
        await markAsUnread(notification._id);
        toast({
          title: "Marked as unread",
          description: "Notification marked as unread successfully."
        });
      } else {
        await markAsRead(notification._id);
        toast({
          title: "Marked as read",
          description: "Notification marked as read successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification status.",
        variant: "destructive"
      });
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast({
        title: "Deleted",
        description: "Notification deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive"
      });
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Success",
        description: "All notifications marked as read."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive"
      });
    }
  };

  // Handle delete all notifications
  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications();
      toast({
        title: "Success",
        description: "All notifications deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all notifications.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <p className="text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshNotifications()}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <MoreVertical className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All as Read
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className="text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showUnreadOnly ? 'Show All' : 'Show Unread Only'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteAll}
                  disabled={notifications.length === 0}
                  className="text-red-400 hover:bg-gray-700 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <Bell className="h-16 w-16 mx-auto text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
                </h3>
                <p className="text-gray-500">
                  {showUnreadOnly 
                    ? 'All your notifications have been read.' 
                    : 'When you have notifications, they will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification._id}
                  className={`bg-gray-800 border-gray-700 cursor-pointer transition-all duration-200 hover:bg-gray-750 hover:border-gray-600 ${
                    !notification.isRead ? 'ring-2 ring-blue-500/20 bg-gray-800/80' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-lg ${
                              notification.isRead ? 'text-gray-300' : 'text-white'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className={`mt-1 text-sm ${
                              notification.isRead ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.isRead && (
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">
                                New
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleToggleRead(notification, e)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700 h-8 w-8 p-0"
                          title={notification.isRead ? "Mark as unread" : "Mark as read"}
                        >
                          {notification.isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(notification._id, e)}
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-700 h-8 w-8 p-0"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-6">
                  <Button
                    variant="outline"
                    onClick={loadMoreNotifications}
                    disabled={loading}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;