import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Share2,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '@/services/api';

interface PostAnalytics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  engagement: number;
  reach: number;
}

interface SocialAccount {
  _id: string;
  platform: string;
  accountName: string;
  profilePicture?: string;
}

interface Post {
  _id: string;
  platform: string;
  content: {
    text?: string;
    mediaUrls?: string[];
    mediaType?: string;
  };
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  publishedTime?: string;
  scheduledTime?: string;
  createdAt: string;
  analytics: PostAnalytics;
  socialAccount: SocialAccount;
  postId?: string;
  errorMessage?: string;
}

interface PostsSidebarProps {
  className?: string;
}

const PostsSidebar = ({ className }: PostsSidebarProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/posts/analytics');
      setPosts(response.data.posts || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch posts:', err);
      setError(err.response?.data?.error || 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return 'bg-blue-600';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'linkedin':
        return 'bg-blue-700';
      case 'x':
      case 'twitter':
        return 'bg-black dark:bg-white';
      default:
        return 'bg-gray-500';
    }
  };

  const formatPostTime = (post: Post) => {
    if (post.status === 'published' && post.publishedTime) {
      return `Published ${formatDistanceToNow(new Date(post.publishedTime), { addSuffix: true })}`;
    }
    if (post.status === 'scheduled' && post.scheduledTime) {
      return `Scheduled for ${format(new Date(post.scheduledTime), 'MMM dd, HH:mm')}`;
    }
    return `Created ${formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}`;
  };

  const getTotalEngagement = (analytics: PostAnalytics) => {
    return analytics.likes + analytics.comments + analytics.shares;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Posts
          </CardTitle>
          <CardDescription>Loading your posts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full dark:bg-gray-700"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 dark:bg-gray-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Posts
            </CardTitle>
            <CardDescription>Analytics for your latest posts</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPosts}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          {error ? (
            <div className="p-4 text-center text-muted-foreground">
              <p className="text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchPosts}
              >
                Try Again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No posts yet</p>
              <p className="text-xs mt-1">Your published posts will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {posts.map((post, index) => (
                <div key={post._id}>
                  <div className="flex items-start space-x-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    {/* Platform Avatar */}
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.socialAccount?.profilePicture} />
                        <AvatarFallback className={getPlatformColor(post.platform)}>
                          {post.platform.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        {getStatusIcon(post.status)}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getStatusColor(post.status)}`}
                        >
                          {post.status}
                        </Badge>
                        <span className="text-xs font-medium">
                          {post.socialAccount?.accountName}
                        </span>
                      </div>

                      {/* Post Text */}
                      {post.content?.text && (
                        <p className="text-sm text-foreground mb-2 line-clamp-2">
                          {post.content.text}
                        </p>
                      )}

                      {/* Media Count */}
                      {post.content?.mediaUrls && post.content.mediaUrls.length > 0 && (
                        <p className="text-xs text-muted-foreground mb-2">
                          📎 {post.content.mediaUrls.length} media file(s)
                        </p>
                      )}

                      {/* Analytics or Status Message */}
                      {post.status === 'published' ? (
                        post.analytics && getTotalEngagement(post.analytics) > 0 ? (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {post.analytics.likes}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.analytics.comments}
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="w-3 h-3" />
                              {post.analytics.shares}
                            </div>
                            {post.analytics.views > 0 && (
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {post.analytics.views}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-2">
                            📊 Analytics loading...
                          </p>
                        )
                      ) : post.status === 'failed' ? (
                        <p className="text-xs text-red-500 mb-2">
                          ❌ {post.errorMessage || 'Failed to post'}
                        </p>
                      ) : post.status === 'scheduled' ? (
                        <p className="text-xs text-blue-600 mb-2">
                          ⏰ Waiting to be posted
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mb-2">
                          📝 Not posted yet
                        </p>
                      )}

                      {/* Time */}
                      <p className="text-xs text-muted-foreground">
                        {formatPostTime(post)}
                      </p>
                    </div>
                  </div>

                  {/* Separator */}
                  {index < posts.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PostsSidebar;