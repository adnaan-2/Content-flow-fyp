import { useState, useEffect } from "react";
import { postService } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Trash2,
  X,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ManagePosts = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Platform icons
  const PlatformIcon = ({ platform }: { platform: string }) => {
    const iconClass = "h-4 w-4";
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className={iconClass} style={{ color: '#1877F2' }} />;
      case 'instagram':
        return <Instagram className={iconClass} style={{ color: '#E4405F' }} />;
      case 'x':
      case 'twitter':
        return <Twitter className={iconClass} style={{ color: '#000000' }} />;
      case 'linkedin':
        return <Linkedin className={iconClass} style={{ color: '#0A66C2' }} />;
      default:
        return <div className={iconClass} />;
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      published: { color: 'bg-green-500', icon: CheckCircle, text: 'Published' },
      scheduled: { color: 'bg-blue-500', icon: Clock, text: 'Scheduled' },
      failed: { color: 'bg-red-500', icon: XCircle, text: 'Failed' },
      draft: { color: 'bg-gray-500', icon: Calendar, text: 'Draft' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await postService.getUserPosts({ page: 1, limit: 50 });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch posts",
        variant: "destructive"
      });
    }
  };

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    try {
      const response = await postService.getScheduledPosts();
      setScheduledPosts(response.data.scheduledPosts || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    }
  };

  // Cancel scheduled post
  const handleCancelScheduled = async (postId: string) => {
    try {
      await postService.cancelScheduledPost(postId);
      toast({
        title: "Success",
        description: "Scheduled post cancelled"
      });
      fetchScheduledPosts();
      fetchPosts();
    } catch (error) {
      console.error('Error cancelling post:', error);
      toast({
        title: "Error",
        description: "Failed to cancel scheduled post",
        variant: "destructive"
      });
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await postService.deletePost(postId);
      toast({
        title: "Success",
        description: "Post deleted"
      });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPosts(), fetchScheduledPosts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'published':
        return posts.filter(post => post.status === 'published');
      case 'scheduled':
        return scheduledPosts;
      case 'failed':
        return posts.filter(post => post.status === 'failed');
      default:
        return posts;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Posts</h1>
          <p className="text-muted-foreground">View and manage your social media posts</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Posts ({posts.length})</TabsTrigger>
          <TabsTrigger value="published">
            Published ({posts.filter(p => p.status === 'published').length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Failed ({posts.filter(p => p.status === 'failed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredPosts().length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No posts found for this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {getFilteredPosts().map((post) => (
                <Card key={post._id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={post.platform} />
                        <span className="font-medium capitalize">{post.platform}</span>
                        <StatusBadge status={post.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status === 'scheduled' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Scheduled Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel this scheduled post? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleCancelScheduled(post._id)}>
                                  Yes, Cancel Post
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Post</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this post record? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePost(post._id)}>
                                Yes, Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Post Content */}
                    {post.content?.text && (
                      <div>
                        <h4 className="font-medium mb-2">Caption:</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {post.content.text}
                        </p>
                      </div>
                    )}

                    {/* Media Preview */}
                    {post.content?.mediaUrls && post.content.mediaUrls.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Media:</h4>
                        <div className="flex gap-2 overflow-x-auto">
                          {post.content.mediaUrls.map((url: string, index: number) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Media ${index + 1}`}
                              className="h-20 w-20 object-cover rounded-md flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder-image.png";
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {post.scheduledTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Scheduled: {new Date(post.scheduledTime).toLocaleString()}
                        </div>
                      )}
                      {post.publishedTime && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Published: {new Date(post.publishedTime).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Error Message for Failed Posts */}
                    {post.status === 'failed' && post.errorMessage && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <h4 className="font-medium text-red-800 mb-1">Error:</h4>
                        <p className="text-sm text-red-600">{post.errorMessage}</p>
                      </div>
                    )}

                    {/* Post Analytics (if available) */}
                    {post.analytics && Object.values(post.analytics).some((val: any) => typeof val === 'number' && val > 0) && (
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <div className="font-medium">{post.analytics.likes || 0}</div>
                          <div className="text-xs text-muted-foreground">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{post.analytics.comments || 0}</div>
                          <div className="text-xs text-muted-foreground">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{post.analytics.shares || 0}</div>
                          <div className="text-xs text-muted-foreground">Shares</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManagePosts;