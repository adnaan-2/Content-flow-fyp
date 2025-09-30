import { useState, useEffect } from "react";

import { mediaService, adService } from '@/services/api';

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

const platforms = [
  { id: "facebook", name: "Facebook", color: "#4267B2" },
  { id: "instagram", name: "Instagram", color: "#E1306C" },
  { id: "twitter", name: "Twitter", color: "#1DA1F2" },
  { id: "tiktok", name: "TikTok", color: "#000000" },
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
    fetchMedia();
    fetchGenerated();
  }, []);

  // Platform selection
  const togglePlatformSelection = (platform: string) => {
    setSelectedPlatforms(selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform]
    );
  };

  // Post Now
  const handlePostNow = () => {
    if ((mediaFiles.length === 0 && !generatedImage) || selectedPlatforms.length === 0) {
      toast({ title: "Select media and platforms", variant: "destructive" });
      return;
    }
    toast({ title: "Posted!", description: `Posted to ${selectedPlatforms.join(", ")}` });
  };

  // Schedule Post
  const handleSchedulePost = () => {
    setShowScheduleDialog(false);
    toast({ title: "Post scheduled!", description: `Scheduled for ${scheduledDate} at ${scheduledTime}` });
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
                  disabled={selectedImages.length === 0 || selectedPlatforms.length === 0}
                  onClick={handlePostNow}
                >
                  Post Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={selectedImages.length === 0 || selectedPlatforms.length === 0}
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
            <CardDescription>Choose where to publish your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {platforms.map((platform) => (
              <div key={platform.id}>
                <button
                  className={`flex items-center gap-3 w-full p-3 rounded-md transition-colors ${
                    selectedPlatforms.includes(platform.id) 
                      ? "bg-primary/10" 
                      : "hover:bg-muted"
                  }`}
                  onClick={() => togglePlatformSelection(platform.id)}
                >
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${platform.color}20` }}
                  >
                    <span style={{ color: platform.color }} className="text-lg font-bold">
                      {platform.name[0]}
                    </span>
                  </div>
                  <span className="font-medium">{platform.name}</span>
                  {selectedPlatforms.includes(platform.id) && (
                    <CheckCircle className="ml-auto h-4 w-4 text-primary" />
                  )}
                </button>
                {platform.id !== platforms[platforms.length - 1].id && <Separator className="my-2" />}
              </div>
            ))}
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
