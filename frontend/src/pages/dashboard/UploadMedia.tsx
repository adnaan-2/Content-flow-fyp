import { useState, useEffect } from "react";

import { mediaService, adService, postService } from '@/services/api';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Plus, Sparkles, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { validatePostContent, canPost, formatValidationErrors } from "@/utils/postValidation";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from "date-fns";

const platforms = [
  { 
    id: "facebook", 
    name: "Facebook", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/2023_Facebook_icon.svg/2048px-2023_Facebook_icon.svg.png",
    color: "#1877F2"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png",
    color: "#E4405F"
  },
  { 
    id: "twitter", 
    name: "X (Twitter)", 
    logo: "https://abs.twimg.com/favicons/twitter.3.ico",
    color: "#000000"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/2048px-LinkedIn_icon.svg.png",
    color: "#0A66C2"
  },
];

// Modern Calendar Component
const ModernCalendar = ({ value, onChange }: { value: Date; onChange: (date: Date) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(value);
  
  // Update currentMonth when value changes (e.g., when component re-renders with different selected date)
  useEffect(() => {
    if (value && !isSameMonth(currentMonth, value)) {
      setCurrentMonth(value);
    }
  }, [value]);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDateClick = (date: Date) => {
    if (!isBefore(date, startOfDay(new Date()))) {
      onChange(date);
    }
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 p-0"
        >
          <ChevronLeft className="h-2 w-2 text-gray-600 dark:text-gray-300" />
        </Button>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today);
              onChange(today);
            }}
            className="h-5 px-2 text-xs bg-gray-200 dark:bg-gray-800 hover:bg-purple-600 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:text-white"
          >
            Today
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 p-0"
        >
          <ChevronRight className="h-2 w-2 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
      
      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map(day => (
          <div key={day} className="text-center py-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{day.slice(0, 2)}</span>
          </div>
        ))}
      </div>
      
      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isSelected = isSameDay(day, value);
          const isCurrentDay = isToday(day);
          const isPast = isBefore(day, startOfDay(new Date()));
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              disabled={isPast}
              className={`
                h-7 w-full rounded-md text-xs font-medium transition-all duration-200
                ${isSelected 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105' 
                  : isCurrentDay
                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-500/20 dark:to-blue-500/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30'
                  : isPast
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  : 'text-gray-400 dark:text-gray-600'
                }
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Modern Time Picker Component
const ModernTimePicker = ({ value, onChange }: { value: string; onChange: (time: string) => void }) => {
  const [hours, minutes] = value.split(':');
  const [showPicker, setShowPicker] = useState(false);
  
  const handleTimeChange = (newHours: string, newMinutes: string) => {
    onChange(`${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`);
  };
  
  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour12 = parseInt(h) % 12 || 12;
    const period = parseInt(h) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${m} ${period}`;
  };
  
  return (
    <div className="relative">
      <div 
        onClick={() => setShowPicker(!showPicker)}
        className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 cursor-pointer hover:border-purple-500 transition-colors duration-200 group"
      >
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300" />
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            {formatTime(value)}
          </span>
        </div>
      </div>
      
      {showPicker && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 shadow-2xl z-50">
          <div className="flex items-center justify-center gap-2">
            {/* Hours */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimeChange(((parseInt(hours) + 1) % 24).toString(), minutes)}
                className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-purple-600 p-0"
              >
                <ChevronRight className="h-2 w-2 rotate-[-90deg]" />
              </Button>
              <div className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-1 m-1 min-w-[2rem] text-center">
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{hours.padStart(2, '0')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimeChange(((parseInt(hours) - 1 + 24) % 24).toString(), minutes)}
                className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-purple-600 p-0"
              >
                <ChevronRight className="h-2 w-2 rotate-90" />
              </Button>
            </div>
            
            <span className="text-sm font-bold text-gray-600 dark:text-gray-500">:</span>
            
            {/* Minutes */}
            <div className="flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimeChange(hours, ((parseInt(minutes) + 5) % 60).toString())}
                className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-purple-600 p-0"
              >
                <ChevronRight className="h-2 w-2 rotate-[-90deg]" />
              </Button>
              <div className="bg-gray-200 dark:bg-gray-800 rounded px-1 py-1 m-1 min-w-[2rem] text-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{minutes.padStart(2, '0')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTimeChange(hours, ((parseInt(minutes) - 5 + 60) % 60).toString())}
                className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-purple-600 p-0"
              >
                <ChevronRight className="h-2 w-2 rotate-90" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center mt-2">
            <Button
              size="sm"
              onClick={() => setShowPicker(false)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-6 text-xs px-3"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const UploadMedia = () => {
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [importedMedia, setImportedMedia] = useState<any[]>([]);
  const [generatedMedia, setGeneratedMedia] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // store _id or unique id
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Fetch imported media from Cloudinary on mount
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await mediaService.getAllMedia();
        setImportedMedia(response.data.media || []);
      } catch (err) {}
    };
    const fetchGenerated = async () => {
      try {
        const response = await adService.getMyAds(1, 12);
        setGeneratedMedia(response.data.ads || []);
      } catch (err) {}
    };
    const fetchConnectedAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/social-media/accounts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConnectedAccounts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Error fetching connected accounts:', err);
      }
    };
    
    fetchMedia();
    fetchGenerated();
    fetchConnectedAccounts();
  }, []);

  // Get connected accounts for a platform
  const getConnectedAccountsForPlatform = (platformId: string) => {
    const platformMapping: { [key: string]: string } = {
      'facebook': 'facebook',
      'instagram': 'instagram', 
      'twitter': 'x',
      'linkedin': 'linkedin'
    };
    
    const mappedPlatform = platformMapping[platformId];
    
    if (platformId === 'facebook') {
      // For Facebook, group all Facebook accounts (including pages) as one platform
      const fbAccounts = connectedAccounts.filter(acc => acc.platform === 'facebook' && acc.isActive);
      return fbAccounts;
    }
    
    return connectedAccounts.filter(acc => acc.platform === mappedPlatform && acc.isActive);
  };

  // Get display text for connected accounts
  const getAccountDisplayText = (platformId: string, accounts: any[]) => {
    if (accounts.length === 0) return null;
    
    if (platformId === 'facebook') {
      // With the new structure, there should only be one Facebook account
      if (accounts.length === 1) {
        const account = accounts[0];
        const pages = account.platformData?.pages || [];
        
        if (pages.length === 0) {
          // No pages, show main account name
          return account.accountName;
        } else if (pages.length === 1) {
          // One page, show the page name
          return pages[0].name;
        } else {
          // Multiple pages, show first page + count
          return `${pages[0].name} +${pages.length - 1} more`;
        }
      } else {
        // This shouldn't happen with new structure, but fallback
        return `${accounts.length} accounts`;
      }
    }
    
    return accounts.length === 1 
      ? accounts[0].accountName 
      : `${accounts.length} accounts`;
  };

  // Platform selection
  const togglePlatformSelection = (platform: string) => {
    const platformAccounts = getConnectedAccountsForPlatform(platform);
    
    // Only allow selection if there are connected accounts
    if (platformAccounts.length === 0) {
      toast({ 
        title: "Account not connected", 
        description: `Please connect your ${platform} account first`,
        variant: "destructive" 
      });
      return;
    }
    
    setSelectedPlatforms(selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform]
    );
  };

  // Post Now
  const handlePostNow = async () => {
    // Get selected images data to extract URLs
    const selectedImagesData = [...importedMedia, ...generatedMedia].filter(item => 
      selectedImages.includes(item._id)
    );
    const mediaUrls = selectedImagesData.map(item => item.url || item.imageUrl);

    // Validate content
    const validationErrors = validatePostContent({
      caption,
      mediaUrls,
      platforms: selectedPlatforms
    });

    if (validationErrors.length > 0) {
      toast({ 
        title: "Validation failed", 
        description: formatValidationErrors(validationErrors),
        variant: "destructive" 
      });
      return;
    }

    setIsPosting(true);
    
    // Show special message for Instagram
    if (selectedPlatforms.includes('instagram')) {
      toast({
        title: "Processing...",
        description: "Instagram posts may take 30-60 seconds to process. Please wait...",
      });
    }

    try {
      // Map platform IDs to backend platform names
      const platformMapping: { [key: string]: string } = {
        'facebook': 'facebook',
        'instagram': 'instagram', 
        'twitter': 'x',
        'linkedin': 'linkedin'
      };
      
      const mappedPlatforms = selectedPlatforms.map(platform => platformMapping[platform] || platform);
      
      const postData = {
        caption,
        mediaUrls,
        platforms: mappedPlatforms,
        mediaType: 'photo',
        facebookPageId: null // You can add page selection logic here
      };

      console.log('📤 Sending post data:', postData);
      console.log('� Platform mapping:', selectedPlatforms, '→', mappedPlatforms);
      console.log('�📸 Selected images:', selectedImages);
      console.log('🔗 Media URLs:', mediaUrls);

      const response = await postService.postNow(postData);
      
      toast({ 
        title: "Posted successfully!", 
        description: `Posted to ${response.data.results.map(r => r.platform).join(", ")}` 
      });

      // Reset form
      setSelectedImages([]);
      setCaption('');
      setSelectedPlatforms([]);

      // Show any errors if some platforms failed
      if (response.data.errors && response.data.errors.length > 0) {
        toast({
          title: "Some posts failed",
          description: response.data.errors.join(", "),
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Post now error:', error);
      const errorMessage = error.response?.data?.error || "Could not post to social media. Please try again.";
      
      // Special handling for Instagram timeout errors
      if (errorMessage.includes('took too long to process') || errorMessage.includes('Instagram')) {
        toast({ 
          title: "Instagram Processing Delay", 
          description: "Instagram is taking longer than usual to process your media. Please try again in a few minutes.",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Posting failed", 
          description: errorMessage,
          variant: "destructive" 
        });
      }
    } finally {
      setIsPosting(false);
    }
  };

  // Schedule Post
  const handleSchedulePost = async () => {
    // Get selected images data to extract URLs
    const selectedImagesData = [...importedMedia, ...generatedMedia].filter(item => 
      selectedImages.includes(item._id)
    );
    const mediaUrls = selectedImagesData.map(item => item.url || item.imageUrl);

    // Validate content
    const validationErrors = validatePostContent({
      caption,
      mediaUrls,
      platforms: selectedPlatforms
    });

    if (validationErrors.length > 0) {
      toast({ 
        title: "Validation failed", 
        description: formatValidationErrors(validationErrors),
        variant: "destructive" 
      });
      return;
    }

    try {
      // Combine date and time
      const scheduleDateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':');
      scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Map platform IDs to backend platform names
      const platformMapping: { [key: string]: string } = {
        'facebook': 'facebook',
        'instagram': 'instagram', 
        'twitter': 'x',
        'linkedin': 'linkedin'
      };
      
      const mappedPlatforms = selectedPlatforms.map(platform => platformMapping[platform] || platform);

      const postData = {
        caption,
        mediaUrls,
        platforms: mappedPlatforms,
        scheduledTime: scheduleDateTime.toISOString(),
        mediaType: 'photo',
        facebookPageId: null // You can add page selection logic here
      };

      const response = await postService.schedulePost(postData);
      
      setShowScheduleDialog(false);
      
      toast({ 
        title: "Post scheduled successfully!", 
        description: `Scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledTime} on ${response.data.platforms.join(", ")}` 
      });

      // Reset form
      setSelectedImages([]);
      setCaption('');
      setSelectedPlatforms([]);

    } catch (error) {
      console.error('Schedule post error:', error);
      toast({ 
        title: "Scheduling failed", 
        description: error.response?.data?.error || "Could not schedule post. Please try again.",
        variant: "destructive" 
      });
    }
  };

  // AI Caption Generation
  const handleGenerateCaption = async () => {
    if (selectedImages.length === 0) {
      toast({ 
        title: "Select images first", 
        description: "Please select at least one image to generate a caption",
        variant: "destructive" 
      });
      return;
    }

    setIsGeneratingCaption(true);
    try {
      // Get selected images data
      const selectedImagesData = [...importedMedia, ...generatedMedia].filter(item => 
        selectedImages.includes(item._id)
      );

      const response = await fetch('/api/caption/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          images: selectedImagesData,
          platforms: selectedPlatforms,
          currentCaption: caption
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate caption');
      }

      const data = await response.json();
      setCaption(data.caption);
      
      toast({ 
        title: "Caption generated!", 
        description: "AI has created a caption for your selected images" 
      });
    } catch (error) {
      console.error('Caption generation error:', error);
      toast({ 
        title: "Generation failed", 
        description: error.message || "Could not generate caption. Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Upload & Generate Media</h1>
      <p className="text-muted-foreground mb-4">Import media, generate content, and post to social platforms.</p>

      {/* Images Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Imported Media */}
        <Card>
          <CardHeader>
            <CardTitle>Imported Media</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {importedMedia.map(file => {
                const selectedIdx = selectedImages.indexOf(file._id);
                return (
                  <div
                    className={`border rounded-lg overflow-hidden bg-card cursor-pointer relative group ${selectedIdx !== -1 ? 'ring-2 ring-primary' : ''}`}
                    key={file._id}
                  >
                    <div className="relative aspect-square bg-muted">
                      <img 
                        src={file.url} 
                        alt={file.originalname || 'Media file'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => (e.currentTarget.src = "/placeholder-image.png")}
                        onClick={() => {
                          setSelectedImages(selectedImages.includes(file._id)
                            ? selectedImages.filter(id => id !== file._id)
                            : [...selectedImages, file._id]);
                        }}
                      />
                      {selectedIdx !== -1 && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full px-2 py-1 text-xs group-hover:scale-110 transition-transform" title={`Selected #${selectedIdx+1}`}>{selectedIdx+1}</div>
                      )}
                    </div>
                    <div className="mt-1 text-xs truncate">{file.originalname}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Generated Media */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Media</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedMedia.map(gen => {
                const selectedIdx = selectedImages.indexOf(gen._id);
                return (
                  <div
                    className={`border rounded-lg overflow-hidden bg-card cursor-pointer relative group ${selectedIdx !== -1 ? 'ring-2 ring-primary' : ''}`}
                    key={gen._id}
                  >
                    <div className="relative aspect-square bg-muted">
                      <img 
                        src={gen.url || gen.imageUrl} 
                        alt={gen.prompt || 'Generated Ad'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={e => (e.currentTarget.src = "/placeholder-image.png")}
                        onClick={() => {
                          setSelectedImages(selectedImages.includes(gen._id)
                            ? selectedImages.filter(id => id !== gen._id)
                            : [...selectedImages, gen._id]);
                        }}
                      />
                      {selectedIdx !== -1 && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full px-2 py-1 text-xs group-hover:scale-110 transition-transform" title={`Selected #${selectedIdx+1}`}>{selectedIdx+1}</div>
                      )}
                    </div>
                    <div className="mt-1 text-xs truncate">{gen.prompt || 'Generated Ad'}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Caption & Social Selection Section */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        {/* Caption Input & Post Buttons */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Caption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={5}
                className="mb-2 pr-12"
              />
              
              {/* AI Caption Generation Button */}
              <button
                onClick={handleGenerateCaption}
                disabled={isGeneratingCaption || selectedImages.length === 0}
                className="absolute top-2 right-2 h-8 w-8 rounded-md bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex items-center justify-center group"
                title={selectedImages.length === 0 ? "Select images first" : "Generate AI Caption"}
              >
                {isGeneratingCaption ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white group-hover:animate-pulse" />
                )}
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </button>
            </div>
            
            <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={selectedImages.length === 0 || selectedPlatforms.length === 0 || isPosting}
                  onClick={handlePostNow}
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {selectedPlatforms.includes('instagram') ? 'Processing Instagram...' : 'Posting...'}
                    </>
                  ) : (
                    'Post Now'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={selectedImages.length === 0 || selectedPlatforms.length === 0 || isPosting}
                  onClick={() => setShowScheduleDialog(true)}
                >
                  Post Later
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Selection */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Select Platforms</CardTitle>
            <CardDescription>
              Choose where to publish your content. Only connected accounts can be selected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {platforms.map((platform) => {
              const platformAccounts = getConnectedAccountsForPlatform(platform.id);
              const isConnected = platformAccounts.length > 0;
              const isSelected = selectedPlatforms.includes(platform.id);
              
              return (
                <div key={platform.id}>
                  <button
                    className={`flex items-center gap-3 w-full p-3 rounded-md transition-colors ${
                      isSelected 
                        ? "bg-primary/10 border border-primary/20" 
                        : isConnected 
                          ? "hover:bg-muted" 
                          : "hover:bg-muted/50 opacity-75 cursor-not-allowed"
                    }`}
                    onClick={() => togglePlatformSelection(platform.id)}
                    disabled={!isConnected}
                    title={!isConnected ? `Connect your ${platform.name} account first` : ''}
                  >
                    <div className={`h-8 w-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-300/30 shadow-sm ${
                      platform.id === 'twitter' ? 'bg-black' : ''
                    }`}>
                      {platform.id === 'twitter' ? (
                        <div className="text-white font-bold text-lg">𝕏</div>
                      ) : (
                        <img 
                          src={platform.logo} 
                          alt={`${platform.name} logo`}
                          className="h-full w-full object-cover"
                          style={{
                            filter: 'none'
                          }}
                          onError={(e) => {
                          // Fallback to colored letter if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-sm font-bold" style="color: ${platform.color}">${platform.name[0]}</span>`;
                            parent.style.backgroundColor = `${platform.color}15`;
                            parent.style.borderColor = `${platform.color}40`;
                          }
                        }}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="font-medium">{platform.name}</div>
                      
                      {isConnected ? (
                        <div className="text-xs text-muted-foreground">
                          <span className="text-green-400 font-medium">
                            ✓ {getAccountDisplayText(platform.id, platformAccounts)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-red-400 font-medium">
                          ✗ Not connected
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    
                    {!isConnected && (
                      <div className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      </div>
                    )}
                  </button>

                  {/* Show platform-specific notes */}
                  {isSelected && platform.id === 'twitter' && (
                    <div className="mt-2 ml-8 p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                      <p className="text-blue-800 font-medium">ℹ️ X (Twitter) Note:</p>
                      <p className="text-blue-600">Text content is required. Images are optional.</p>
                    </div>
                  )}
                  
                  {isSelected && platform.id === 'instagram' && (
                    <div className="mt-2 ml-8 p-2 bg-purple-50 border border-purple-200 rounded-md text-xs">
                      <p className="text-purple-800 font-medium">📸 Instagram Note:</p>
                      <p className="text-purple-600">At least one image required. May take 30-60 seconds to process.</p>
                    </div>
                  )}

                  {/* Show Facebook Pages as sub-options when selected */}
                  {platform.id === 'facebook' && isSelected && isConnected && (
                    <div className="ml-8 mt-2 space-y-1">
                      {platformAccounts.map((account) => {
                        const pages = account.platformData?.pages || [];
                        return pages.map((page: any) => (
                          <div key={page.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md text-sm">
                            {page.profilePicture && (
                              <img 
                                src={page.profilePicture} 
                                alt="Page" 
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span className="text-muted-foreground">📄 {page.name}</span>
                            {page.followerCount !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {page.followerCount.toLocaleString()} followers
                              </span>
                            )}
                          </div>
                        ));
                      })}
                    </div>
                  )}
                  
                  {platform.id !== platforms[platforms.length - 1].id && <Separator className="my-2" />}
                </div>
              );
            })}
            
            {connectedAccounts.length === 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No social media accounts connected yet.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/link-accounts'}
                >
                  Connect Accounts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modern Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="sm:max-w-lg max-w-[90vw] max-h-[95vh] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-800/30 dark:to-blue-800/30 -m-6 mb-3 p-3 rounded-t-lg">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              Schedule Your Post
            </DialogTitle>
          
          </DialogHeader>
          
          <div className="space-y-3 px-1 max-h-[70vh] overflow-y-auto">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                Select Date
              </Label>
              <ModernCalendar 
                value={scheduledDate} 
                onChange={setScheduledDate} 
              />
            </div>
            
            {/* Time Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Select Time
              </Label>
              <ModernTimePicker 
                value={scheduledTime} 
                onChange={setScheduledTime} 
              />
            </div>
            
            {/* Selected DateTime Display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-800/20 dark:to-blue-800/20 border border-purple-200 dark:border-purple-600/30 rounded-lg p-2">
              <div className="text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400">Scheduled for:</p>
                <p className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  {format(scheduledDate, 'MMM do, yyyy')} at {(() => {
                    const [h, m] = scheduledTime.split(':');
                    const hour12 = parseInt(h) % 12 || 12;
                    const period = parseInt(h) >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${m} ${period}`;
                  })()}
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowScheduleDialog(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 h-9 text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSchedulePost} 
                disabled={isPosting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold h-9 text-sm"
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Schedule Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadMedia;
