import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Heart, MessageCircle, Eye, Share2, ExternalLink, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface Post {
  _id: string;
  platform: string;
  postId?: string;
  platformUrl?: string;
  facebookPageId?: string;
  content: {
    text?: string;
    mediaUrls?: string[];
  };
  status: string;
  publishedTime?: string;
  scheduledTime?: string;
  createdAt: string;
  analytics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  socialAccountId?: {
    platform: string;
    accountName: string;
    platformData?: {
      username?: string;
      instagramBusinessId?: string;
    };
  };
}

export default function PostsSidebar() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      // Use enriched analytics endpoint for accurate likes/comments
      const response = await api.get('/posts/analytics');
      const rawPosts = (response.data.posts || []).length ? response.data.posts : (response.data.data?.posts || []);
      // Filter out failed posts
      const filteredPosts = (rawPosts || []).filter((post: Post) => post.status !== 'failed');
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformName = platform.toLowerCase();
    
    switch (platformName) {
      case 'facebook':
        return (
          <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-5 h-5 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'x':
      case 'twitter':
        return (
          <svg className="w-5 h-5 text-[#000000]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      published: 'bg-green-500/10 text-green-600 border border-green-500/20',
      scheduled: 'bg-blue-500/10 text-blue-600 border border-blue-500/20', 
      draft: 'bg-muted text-muted-foreground border border-border'
    };
    return colors[status] || 'bg-muted text-muted-foreground border border-border';
  };

  // Generate platform-specific URL with direct post navigation
  const generatePlatformUrl = (post: Post) => {
    // Use stored platformUrl if available
    if (post.platformUrl) {
      return post.platformUrl;
    }
    
    // For published posts, prioritize direct post URLs
    if (post.status === 'published' && post.postId && post.postId !== 'scheduled') {
      const platform = post.platform.toLowerCase();
      
      switch (platform) {
        case 'instagram':
          // For Instagram, use username/postId format for direct post navigation
          if (post.postId) {
            const username = post.socialAccountId?.platformData?.username || 
                            post.socialAccountId?.accountName;
            if (username) {
              // Use format: https://www.instagram.com/username/postId/
              return `https://www.instagram.com/${username}/${post.postId}/`;
            }
            // If no username, fallback to shortcode format for non-numeric IDs
            if (!/^\d+$/.test(post.postId)) {
              return `https://www.instagram.com/p/${post.postId}/`;
            }
          }
          break;
          
        case 'facebook':
          // Prefer page-specific URL when available
          if (post.facebookPageId && post.postId) {
            return `https://www.facebook.com/${post.facebookPageId}/posts/${post.postId}`;
          }
          // Fallback to post-only URL
          return post.postId ? `https://www.facebook.com/${post.postId}` : null;
          
        case 'x':
        case 'twitter':
          return `https://twitter.com/i/web/status/${post.postId}`;
          
        case 'linkedin':
          // Handle LinkedIn URN format properly
          if (post.postId.startsWith('urn:li:activity:')) {
            return `https://www.linkedin.com/feed/update/${post.postId}`;
          } else if (post.postId.startsWith('urn:')) {
            return `https://www.linkedin.com/feed/update/${post.postId}`;
          } else {
            return `https://www.linkedin.com/feed/update/urn:li:activity:${post.postId}`;
          }
          
        default:
          return null;
      }
    }
    
    return null;
  };

  // Handle post click
  const handlePostClick = (post: Post) => {
    console.log('Post clicked:', post);
    console.log('Post ID:', post.postId);
    console.log('Platform URL:', post.platformUrl);
    console.log('Social Account:', post.socialAccountId);
    
    if (isPostClickable(post)) {
      const url = generatePlatformUrl(post);
      console.log('Generated URL:', url);
      if (url) {
        window.open(url, '_blank');
      } else {
        console.log('No URL generated for post');
      }
    } else {
      console.log('Post is not clickable');
    }
  };

  // Check if post is clickable
  const isPostClickable = (post: Post) => {
    return post.status === 'published';
  };

  const formatTime = (dateString: string, isScheduled = false) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isScheduled && date > now) {
      // For future scheduled posts, show full date/time
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // For published/past posts, show full date and time
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchPosts();
    // Auto refresh every 5 seconds silently
    const interval = setInterval(() => {
      fetchPosts(false); // Don't show loader on auto-refresh
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="w-80 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-80 bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Posts ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {posts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No posts yet</p>
              <p className="text-sm">Create your first post!</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {posts.map((post) => (
                <div 
                  key={post._id} 
                  className={`border border-border rounded-lg p-3 transition-all duration-200 bg-card ${
                    post.status === 'published'
                      ? 'cursor-pointer hover:shadow-md hover:bg-accent/50 hover:scale-[1.02] transform hover:border-accent' 
                      : 'bg-muted/30'
                  }`}
                  onClick={() => handlePostClick(post)}
                  title={post.status === 'published' ? `Click to view on ${post.platform}` : undefined}
                >
                  {/* Platform & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(post.platform)}</span>
                      <span className="font-medium text-sm capitalize text-card-foreground">
                        {post.platform}
                      </span>

                    </div>
                    <Badge className={`text-xs ${getStatusBadge(post.status)}`}>
                      {post.status}
                    </Badge>
                  </div>

                  {/* Content Preview */}
                  {post.content?.text ? (
                    <p className="text-sm text-card-foreground/80 mb-2 line-clamp-2">
                      {post.content.text.length > 100 
                        ? `${post.content.text.slice(0, 100)}...`
                        : post.content.text
                      }
                    </p>
                  ) : post.content?.mediaUrls && post.content.mediaUrls.length > 0 ? (
                    <p className="text-sm text-muted-foreground mb-2 italic">
                      Media-only post
                    </p>
                  ) : null}

                  {/* Media Count */}
                  {post.content?.mediaUrls && post.content.mediaUrls.length > 0 && (
                    <p className="text-xs text-primary mb-2 font-medium">
                      📎 {post.content.mediaUrls.length} media
                    </p>
                  )}

                  {/* Analytics for Published Posts */}
                  {post.status === 'published' && post.analytics && (
                    <div className="flex gap-4 text-xs text-muted-foreground mb-2 p-2 bg-muted/50 rounded border border-border">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.analytics.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.analytics.comments || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.analytics.views || 0}
                      </span>
                    </div>
                  )}

                  {/* Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {post.status === 'published' && post.publishedTime 
                        ? formatTime(post.publishedTime)
                        : post.status === 'scheduled' && post.scheduledTime 
                          ? `Scheduled ${formatTime(post.scheduledTime, true)}`
                          : formatTime(post.createdAt)
                      }
                    </div>
                    {isPostClickable(post) && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        Click to view
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
