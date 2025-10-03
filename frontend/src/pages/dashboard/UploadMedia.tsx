import { useState, useEffect } from "react";

import { mediaService, adService, postService } from '@/services/api';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Plus, Sparkles, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { validatePostContent, canPost, formatValidationErrors } from "@/utils/postValidation";

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
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/2048px-X_logo_2023.svg.png",
    color: "#000000"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/2048px-LinkedIn_icon.svg.png",
    color: "#0A66C2"
  },
];

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

        const response = await fetch('/api/social-media/accounts', {
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
                    <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center border border-gray-300/30 shadow-sm">
                      <img 
                        src={platform.logo} 
                        alt={`${platform.name} logo`}
                        className="h-full w-full object-cover"
                        style={{
                          filter: platform.id === 'twitter' ? 'invert(1)' : 'none'
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

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Your Post</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-col items-center gap-2">
              <Label style={{ color: '#fff' }}>Date</Label>
              <div style={{ background: '#181818', borderRadius: '1rem', padding: '1rem', border: '2px solid #222' }}>
                <Calendar
                  value={scheduledDate}
                  onChange={value => {
                    if (value instanceof Date) setScheduledDate(value);
                    else if (Array.isArray(value) && value[0] instanceof Date) setScheduledDate(value[0]);
                  }}
                  className="rounded-lg border shadow-md w-full"
                  calendarType="gregory"
                />
                <style>{`
                  .react-calendar {
                    background: #181818 !important;
                    color: #fff !important;
                    border-radius: 1rem !important;
                    border: 2px solid #222 !important;
                  }
                  .react-calendar__tile {
                    background: #181818 !important;
                    color: #fff !important;
                    border-radius: 50% !important;
                  }
                  .react-calendar__tile--active, .react-calendar__tile--now {
                    background: #222 !important;
                    color: #fff !important;
                  }
                  .react-calendar__navigation {
                    background: #181818 !important;
                    color: #fff !important;
                  }
                  .react-calendar__month-view__weekdays {
                    color: #fff !important;
                  }
                  .react-calendar__tile:disabled {
                    background: #222 !important;
                    color: #888 !important;
                  }
                `}</style>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Label style={{ color: '#fff' }}>Time</Label>
              <div style={{ width: '200px', position: 'relative' }}>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  style={{ background: '#222', color: '#fff', border: '2px solid #444', fontWeight: 600, fontSize: '1.3em', textAlign: 'center', borderRadius: '0.5em', width: '100%', padding: '0.4em 2.5em 0.4em 0.4em' }}
                />
                <style>{`
                  input[type="time"]::-webkit-calendar-picker-indicator {
                    filter: invert(1) brightness(2);
                  }
                  input[type="time"]::-ms-input-placeholder {
                    color: #fff;
                  }
                  input[type="time"]::placeholder {
                    color: #fff;
                  }
                `}</style>
              </div>
            </div>
            <Button onClick={handleSchedulePost} className="w-full">Schedule</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UploadMedia;
