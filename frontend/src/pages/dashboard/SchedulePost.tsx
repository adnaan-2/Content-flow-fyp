import React, { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, Filter, Edit, Trash2, X, Upload, Facebook, Instagram, Twitter, Linkedin, Image, Wand2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { mediaService, adService } from "@/services/api";

// Platform configurations using your brand theme
const platformConfig = {
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    lightColor: "bg-blue-50 text-blue-600 border-blue-600/20",
  },
  instagram: {
    name: "Instagram", 
    icon: Instagram,
    color: "bg-pink-600",
    lightColor: "bg-pink-50 text-pink-600 border-pink-600/20",
  },
  x: {
    name: "X (Twitter)",
    icon: Twitter,
    color: "bg-gray-900",
    lightColor: "bg-gray-50 text-gray-900 border-gray-200",
  },
  linkedin: {
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    lightColor: "bg-blue-50 text-blue-700 border-blue-700/20",
  },
};

interface ScheduledPost {
  _id: string;
  caption: string;
  mediaUrl?: string;
  mediaType: 'photo' | 'video';
  platforms: string[];
  scheduledTime: string;
  status: 'pending' | 'posted' | 'failed';
  facebookPageId?: string;
  createdAt: string;
}

interface EditPostData {
  caption: string;
  mediaUrl?: string;
  platforms: string[];
  scheduledTime: Date;
}

interface MediaItem {
  _id: string;
  url: string;
  originalname: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

interface GeneratedAd {
  _id: string;
  url: string;
  prompt: string;
  style: string;
  dimensions: {
    width: number;
    height: number;
  };
  createdAt: string;
}

export default function SchedulePost() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [editData, setEditData] = useState<EditPostData>({
    caption: '',
    platforms: [],
    scheduledTime: new Date(),
  });
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<{start?: Date, end?: Date}>({});
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingAds, setLoadingAds] = useState(false);
  
  const { toast } = useToast();

  // Fetch scheduled posts
  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/schedule/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledPosts(response.data.scheduledPosts || []);
    } catch (error: any) {
      console.error('Error fetching scheduled posts:', error);
      toast({
        title: "Error",
        description: "Failed to load scheduled posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch uploaded media
  const fetchUploadedMedia = async () => {
    try {
      setLoadingMedia(true);
      const response = await mediaService.getAllMedia();
      setUploadedMedia(response.data.media || []);
    } catch (error: any) {
      console.error('Error fetching uploaded media:', error);
      toast({
        title: "Error",
        description: "Failed to load uploaded media",
        variant: "destructive",
      });
    } finally {
      setLoadingMedia(false);
    }
  };

  // Fetch generated ads
  const fetchGeneratedAds = async () => {
    try {
      setLoadingAds(true);
      const response = await adService.getMyAds(1, 50); // Get up to 50 ads
      setGeneratedAds(response.data.ads || []);
    } catch (error: any) {
      console.error('Error fetching generated ads:', error);
      toast({
        title: "Error",
        description: "Failed to load generated ads",
        variant: "destructive",
      });
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  // Filter posts based on selected filters
  const filteredPosts = scheduledPosts.filter(post => {
    // Platform filter
    if (selectedPlatformFilter.length > 0) {
      const hasMatchingPlatform = post.platforms.some(platform => 
        selectedPlatformFilter.includes(platform)
      );
      if (!hasMatchingPlatform) return false;
    }

    // Date range filter
    const postDate = new Date(post.scheduledTime);
    if (dateRangeFilter.start && postDate < dateRangeFilter.start) return false;
    if (dateRangeFilter.end && postDate > dateRangeFilter.end) return false;

    return true;
  });

  // Get posts for a specific date
  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter(post => 
      isSameDay(new Date(post.scheduledTime), date)
    );
  };

  // Get unique platforms from posts for filter
  const uniquePlatforms = Array.from(
    new Set(scheduledPosts.flatMap(post => post.platforms))
  );

  // Delete scheduled post
  const handleDeletePost = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/schedule/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: "Scheduled post deleted successfully",
      });
      
      fetchScheduledPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete scheduled post",
        variant: "destructive",
      });
    }
  };

  // Open edit dialog
  const handleEditPost = (post: ScheduledPost) => {
    setEditingPost(post);
    setEditData({
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      platforms: post.platforms,
      scheduledTime: new Date(post.scheduledTime),
    });
    setIsEditDialogOpen(true);
    // Fetch media when opening edit dialog
    fetchUploadedMedia();
    fetchGeneratedAds();
  };

  // Handle media selection from gallery
  const handleMediaSelect = (mediaUrl: string) => {
    setEditData(prev => ({
      ...prev,
      mediaUrl: mediaUrl
    }));
    setShowMediaGallery(false);
    toast({
      title: "Success",
      description: "Media selected successfully",
    });
  };

  // Update scheduled post
  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const token = localStorage.getItem('token');
      const updatePayload = {
        caption: editData.caption,
        mediaUrls: editData.mediaUrl ? [editData.mediaUrl] : [],
        platforms: editData.platforms,
        scheduledTime: editData.scheduledTime.toISOString(),
      };

      await axios.put(`/api/schedule/${editingPost._id}`, updatePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Success",
        description: "Scheduled post updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingPost(null);
      fetchScheduledPosts();
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update scheduled post",
        variant: "destructive",
      });
    }
  };

  // Handle media upload
  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingMedia(true);
      const formData = new FormData();
      formData.append('media', file);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/media/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setEditData(prev => ({
        ...prev,
        mediaUrl: response.data.url
      }));

      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: "Error",
        description: "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  // Custom day renderer for calendar with platform indicators
  const renderCalendarDay = ({ date, ...props }: any) => {
    const postsForDay = getPostsForDate(date);
    const hasScheduledPosts = postsForDay.length > 0;
    const platformsForDay = Array.from(new Set(postsForDay.flatMap(post => post.platforms)));
    
    return (
      <div className="relative w-full h-full p-1">
        <div className={cn(
          "w-full h-full flex items-center justify-center rounded-md transition-colors cursor-pointer",
          hasScheduledPosts && "bg-gradient-to-br from-blue-100 to-purple-100 font-semibold text-blue-900 border border-blue-200"
        )}>
          {date.getDate()}
        </div>
        {hasScheduledPosts && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {platformsForDay.slice(0, 4).map(platform => (
              <div
                key={platform}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  platformConfig[platform as keyof typeof platformConfig]?.color || "bg-gray-400"
                )}
                title={platformConfig[platform as keyof typeof platformConfig]?.name}
              />
            ))}
            {platformsForDay.length > 4 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${platformsForDay.length - 4} more`} />
            )}
          </div>
        )}
      </div>
    );
  };

  // Custom calendar component with large date boxes
  const CustomCalendar = () => {
    const today = new Date();
    const currentMonth = currentViewDate.getMonth();
    const currentYear = currentViewDate.getFullYear();
    
    // Get first day of month and number of days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Generate calendar days
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(new Date(currentYear, currentMonth, day));
    }
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const goToPreviousMonth = () => {
      setCurrentViewDate(new Date(currentYear, currentMonth - 1, 1));
      setSelectedDate(null);
      setShowSidebar(false);
    };
    
    const goToNextMonth = () => {
      setCurrentViewDate(new Date(currentYear, currentMonth + 1, 1));
      setSelectedDate(null);
      setShowSidebar(false);
    };
    
    return (
      <div className="w-full h-full">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {monthNames[currentMonth]} {currentYear}
            </h1>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={goToPreviousMonth}
                className="border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white font-bold px-6 bg-gray-100 dark:bg-gray-700"
              >
                ← Prev
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={goToNextMonth}
                className="border border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white font-bold px-6 bg-gray-100 dark:bg-gray-700"
              >
                Next →
              </Button>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-purple-500 hover:text-white hover:border-purple-500 font-semibold text-gray-800 dark:text-gray-200">
                  <Filter className="h-5 w-5" />
                  Platforms
                  {selectedPlatformFilter.length > 0 && (
                    <Badge className="ml-1 bg-orange-500 text-white">
                      {selectedPlatformFilter.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {uniquePlatforms.map(platform => {
                  const config = platformConfig[platform as keyof typeof platformConfig];
                  const IconComponent = config?.icon;
                  return (
                    <DropdownMenuCheckboxItem
                      key={platform}
                      checked={selectedPlatformFilter.includes(platform)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlatformFilter(prev => [...prev, platform]);
                        } else {
                          setSelectedPlatformFilter(prev => prev.filter(p => p !== platform));
                        }
                      }}
                    >
                      <span className="mr-2">
                        {IconComponent && <IconComponent className="h-4 w-4" />}
                      </span>
                      {config?.name || platform}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                {selectedPlatformFilter.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedPlatformFilter([])}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-3 mb-4">
          {weekdays.map(day => (
            <div key={day} className="text-center font-bold text-gray-900 dark:text-white py-4 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3 h-[calc(100vh-200px)]">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={index} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl"></div>;
            }
            
            const postsForDay = getPostsForDate(date);
            const hasScheduledPosts = postsForDay.length > 0;
            const platformsForDay = Array.from(new Set(postsForDay.flatMap(post => post.platforms)));
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            
            const handleDateClick = () => {
              if (hasScheduledPosts) {
                setSelectedDate(date);
                setShowSidebar(true);
              } else {
                setSelectedDate(null);
                setShowSidebar(false);
              }
            };
            
            return (
              <div
                key={index}
                className={cn(
                  "bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-3 transition-all duration-300 flex flex-col shadow-lg min-h-[140px]",
                  hasScheduledPosts ? "cursor-pointer hover:shadow-xl hover:border-purple-400 hover:-translate-y-1 hover:bg-gray-50 dark:hover:bg-gray-900" : "cursor-default",
                  isToday && "bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border-blue-400 ring-2 ring-blue-400/40",
                  hasScheduledPosts && "bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-blue-900/50 border-purple-400 shadow-xl",
                  isSelected && "ring-2 ring-purple-400 shadow-2xl transform scale-105 bg-purple-100 dark:bg-purple-900/30"
                )}
                onClick={handleDateClick}
              >
                {/* Date Number */}
                <div className={cn(
                  "text-2xl font-bold mb-2 leading-none",
                  !hasScheduledPosts && !isToday && "text-gray-600 dark:text-gray-300",
                  isToday && "text-blue-600 dark:text-blue-400",
                  hasScheduledPosts && "text-purple-700 dark:text-purple-400"
                )}>
                  {date.getDate()}
                </div>
                
                {/* Content area with proper spacing */}
                {hasScheduledPosts ? (
                  <div className="flex flex-col gap-2 mt-auto">
                    {/* Platform Icons */}
                    <div className="flex flex-wrap gap-1.5">
                      {platformsForDay.slice(0, 4).map(platform => {
                        const config = platformConfig[platform as keyof typeof platformConfig];
                        const IconComponent = config?.icon;
                        return (
                          <div
                            key={platform}
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm border border-gray-500",
                              config?.color || "bg-gray-400"
                            )}
                            title={config?.name}
                          >
                            {IconComponent && <IconComponent className="h-3 w-3" />}
                          </div>
                        );
                      })}
                      {platformsForDay.length > 4 && (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border border-gray-500">
                          +{platformsForDay.length - 4}
                        </div>
                      )}
                    </div>
                    
                    {/* Post count indicator */}
                    <div className="text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full px-2 py-1 text-center shadow-md">
                      {postsForDay.length} post{postsForDay.length > 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-500 opacity-70">
                      No posts scheduled
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full p-6 bg-gray-50 dark:bg-black">
      <CustomCalendar />
      
      {/* Posts List Modal/Sidebar for Selected Date */}
      {showSidebar && selectedDate && getPostsForDate(selectedDate).length > 0 && (
        <Card className="fixed top-6 right-6 w-80 max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-black/95 backdrop-blur-md">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-800/30 dark:to-blue-800/30 rounded-t-lg relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSidebar(false);
                setSelectedDate(null);
              }}
              className="absolute top-2 right-2 h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg font-bold text-purple-600 dark:text-purple-400 pr-8">
              {format(selectedDate, 'MMM dd, yyyy')}
            </CardTitle>
            <CardDescription className="text-purple-500 dark:text-purple-300">
              {getPostsForDate(selectedDate).length} scheduled post{getPostsForDate(selectedDate).length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {getPostsForDate(selectedDate).map(post => {
              const isPosted = post.status === 'posted';
              const isPending = post.status === 'pending';
              const isFailed = post.status === 'failed';
              
              return (
                <div
                  key={post._id}
                  className={cn(
                    "border rounded-xl p-4 transition-all duration-200 group relative",
                    isPosted && "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-800/20 dark:to-emerald-800/20 border-green-200 dark:border-green-600/50",
                    isPending && "bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-800/20 dark:to-blue-800/20 border-purple-200 dark:border-purple-600/50 hover:shadow-md",
                    isFailed && "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-800/20 dark:to-pink-800/20 border-red-200 dark:border-red-600/50"
                  )}
                >
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={cn(
                        "text-xs font-medium",
                        isPosted && "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600/50",
                        isPending && "bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600/50",
                        isFailed && "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600/50"
                      )}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex items-start justify-between mb-3 pr-16">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-200 mb-1">
                        {format(new Date(post.scheduledTime), 'h:mm a')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                        {post.caption}
                      </p>
                    </div>
                  </div>

                  {post.mediaUrl && (
                    <div className="mb-3">
                      <img src={post.mediaUrl} alt="Post media" className="w-full h-20 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.platforms.map(platform => {
                      const config = platformConfig[platform as keyof typeof platformConfig];
                      const IconComponent = config?.icon;
                      return (
                        <Badge 
                          key={platform} 
                          className="text-xs font-medium border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          <span className="mr-1">
                            {IconComponent && <IconComponent className="h-3 w-3" />}
                          </span>
                          {config?.name}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Action Buttons or Status Message */}
                  {isPosted ? (
                    <div className="pt-3 border-t border-green-200 dark:border-green-600/50">
                      <div className="text-center py-2">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">
                          ✅ This post has been successfully published to all platforms
                        </p>
                      </div>
                    </div>
                  ) : isFailed ? (
                    <div className="pt-3 border-t border-red-200 dark:border-red-600/50">
                      <div className="text-center py-2">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                          ❌ Failed to publish - you can edit and retry
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPost(post)}
                            className="flex-1 text-xs hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:border-purple-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit & Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePost(post._id)}
                            className="flex-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-purple-200 dark:border-purple-600/50">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPost(post)}
                          className="flex-1 text-xs hover:bg-purple-100 dark:hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePost(post._id)}
                          className="flex-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-black border border-gray-800">
          <DialogHeader className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 -m-6 mb-4 p-6 rounded-t-lg">
            <DialogTitle className="text-xl font-bold text-purple-400">Edit Scheduled Post</DialogTitle>
            <DialogDescription className="text-purple-300">
              Make changes to your scheduled post. All changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Caption */}
            <div>
              <Label htmlFor="edit-caption" className="text-gray-200">Caption</Label>
              <Textarea
                id="edit-caption"
                value={editData.caption}
                onChange={(e) => setEditData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="What's on your mind?"
                className="mt-1 bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-400"
                rows={3}
              />
            </div>

            {/* Media Upload */}
            <div>
              <Label className="text-gray-200">Photo/Video</Label>
              <div className="mt-2 space-y-3">
                {editData.mediaUrl && (
                  <div className="relative">
                    <img
                      src={editData.mediaUrl}
                      alt="Post media"
                      className="w-full h-32 object-cover rounded border border-gray-600"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditData(prev => ({ ...prev, mediaUrl: undefined }))}
                      className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Upload New Media */}
                  <div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                      className="hidden"
                      id="media-upload"
                    />
                    <Label htmlFor="media-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-purple-500/50 rounded-xl p-4 text-center hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200">
                        {uploadingMedia ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400 mx-auto mb-1"></div>
                        ) : (
                          <Upload className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                        )}
                        <p className="text-xs text-purple-300 font-medium">
                          {uploadingMedia ? 'Uploading...' : 'Upload New'}
                        </p>
                      </div>
                    </Label>
                  </div>

                  {/* Select from Gallery */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaGallery(!showMediaGallery)}
                    className="h-full border-2 border-dashed border-blue-500/50 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-500/10 transition-all duration-200 bg-transparent"
                  >
                    <div className="flex flex-col items-center">
                      <Image className="h-5 w-5 text-blue-400 mb-1" />
                      <p className="text-xs text-blue-300 font-medium">
                        Select Media
                      </p>
                    </div>
                  </Button>
                </div>

                {/* Media Gallery */}
                {showMediaGallery && (
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/50">
                    <Tabs defaultValue="uploaded" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-600">
                        <TabsTrigger value="uploaded" className="data-[state=active]:bg-gray-800">
                          <Image className="h-4 w-4 mr-2" />
                          Uploaded Media
                        </TabsTrigger>
                        <TabsTrigger value="generated" className="data-[state=active]:bg-gray-800">
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generated Ads
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="uploaded" className="mt-4">
                        <ScrollArea className="h-48">
                          {loadingMedia ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                              <span className="ml-2 text-gray-400">Loading media...</span>
                            </div>
                          ) : uploadedMedia.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No uploaded media found</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {uploadedMedia.map((media) => (
                                <div
                                  key={media._id}
                                  className="relative cursor-pointer group"
                                  onClick={() => handleMediaSelect(media.url)}
                                >
                                  <img
                                    src={media.url}
                                    alt={media.originalname}
                                    className="w-full h-16 object-cover rounded border border-gray-600 group-hover:border-purple-400 transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="generated" className="mt-4">
                        <ScrollArea className="h-48">
                          {loadingAds ? (
                            <div className="flex items-center justify-center h-32">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                              <span className="ml-2 text-gray-400">Loading ads...</span>
                            </div>
                          ) : generatedAds.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <Wand2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No generated ads found</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {generatedAds.map((ad) => (
                                <div
                                  key={ad._id}
                                  className="relative cursor-pointer group"
                                  onClick={() => handleMediaSelect(ad.url)}
                                >
                                  <img
                                    src={ad.url}
                                    alt={ad.prompt}
                                    className="w-full h-16 object-cover rounded border border-gray-600 group-hover:border-blue-400 transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <Label className="text-gray-200">Platforms</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(platformConfig).map(([key, config]) => {
                  const IconComponent = config.icon;
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platform-${key}`}
                        checked={editData.platforms.includes(key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditData(prev => ({
                              ...prev,
                              platforms: [...prev.platforms, key]
                            }));
                          } else {
                            setEditData(prev => ({
                              ...prev,
                              platforms: prev.platforms.filter(p => p !== key)
                            }));
                          }
                        }}
                        className="border-gray-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label htmlFor={`platform-${key}`} className="flex items-center gap-2 cursor-pointer text-gray-200">
                        <IconComponent className="h-4 w-4" />
                        {config.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date and Time */}
            <div>
              <Label htmlFor="edit-datetime" className="text-gray-200">Scheduled Date & Time</Label>
              <Input
                id="edit-datetime"
                type="datetime-local"
                value={format(editData.scheduledTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  scheduledTime: new Date(e.target.value)
                }))}
                className="mt-1 bg-gray-700 border-gray-600 text-gray-200"
              />
            </div>
          </div>

          <DialogFooter className="bg-gradient-to-r from-purple-800/20 to-blue-800/20 -m-6 mt-4 p-6 rounded-b-lg">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="hover:bg-gray-700 bg-gray-700 border-gray-600 text-gray-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePost}
              disabled={!editData.caption || editData.platforms.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium"
            >
              Update Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
