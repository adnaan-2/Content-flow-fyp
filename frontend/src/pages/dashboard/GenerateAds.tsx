import { useState, useEffect } from "react";
import { 
  Sparkles, 
  Download, 
  Heart, 
  Star, 
  Zap, 
  Palette, 
  ImageIcon, 
  Loader2, 
  Trash2, 
  Eye,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Gamepad2,
  Shirt,
  Utensils,
  Plane,
  Music,
  Camera,
  Gift,
  Briefcase
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { adService } from "@/services/api";

const GenerateAds = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myAds, setMyAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Categories with icons and beautiful colors
  const categories = [
    { id: "food", name: "Food & Beverage", icon: Coffee, color: "bg-orange-500", description: "Restaurants, cafes, food delivery" },
    { id: "fashion", name: "Fashion & Style", icon: Shirt, color: "bg-pink-500", description: "Clothing, accessories, beauty" },
    { id: "tech", name: "Technology", icon: Zap, color: "bg-blue-500", description: "Gadgets, apps, software" },
    { id: "automotive", name: "Automotive", icon: Car, color: "bg-red-500", description: "Cars, bikes, automotive services" },
    { id: "real-estate", name: "Real Estate", icon: Home, color: "bg-green-500", description: "Properties, rentals, construction" },
    { id: "gaming", name: "Gaming", icon: Gamepad2, color: "bg-purple-500", description: "Games, gaming gear, esports" },
    { id: "travel", name: "Travel", icon: Plane, color: "bg-cyan-500", description: "Hotels, flights, destinations" },
    { id: "music", name: "Music & Events", icon: Music, color: "bg-indigo-500", description: "Concerts, festivals, music" },
    { id: "business", name: "Business", icon: Briefcase, color: "bg-gray-600", description: "Services, consulting, B2B" },
    { id: "lifestyle", name: "Lifestyle", icon: Gift, color: "bg-rose-500", description: "Health, fitness, wellness" }
  ];

  // Size presets with modern aspect ratios
  const sizes = [
    { id: "square", name: "Square Post", dimensions: "1080x1080", ratio: "1:1", description: "Perfect for Instagram posts" },
    { id: "story", name: "Story", dimensions: "1080x1920", ratio: "9:16", description: "Instagram/Facebook stories" },
    { id: "landscape", name: "Landscape", dimensions: "1200x630", ratio: "16:9", description: "Facebook posts, banners" },
    { id: "portrait", name: "Portrait", dimensions: "1080x1350", ratio: "4:5", description: "Instagram portrait posts" },
    { id: "banner", name: "Web Banner", dimensions: "1920x1080", ratio: "16:9", description: "Website headers, ads" },
    { id: "mobile", name: "Mobile Banner", dimensions: "320x480", ratio: "2:3", description: "Mobile app banners" }
  ];

  // Templates for each category
  const templates = {
    food: [
      { id: "food-promo", name: "Restaurant Promo", prompt: "Delicious [FOOD] with elegant presentation, warm lighting, special offer banner" },
      { id: "food-delivery", name: "Food Delivery", prompt: "Fresh [FOOD] delivery service, modern packaging, fast delivery theme" },
      { id: "food-sale", name: "Food Sale", prompt: "[FOOD] with discount badge, appetizing close-up, sale promotion design" }
    ],
    fashion: [
      { id: "fashion-collection", name: "New Collection", prompt: "Stylish [PRODUCT] fashion collection, modern model, trendy background" },
      { id: "fashion-sale", name: "Fashion Sale", prompt: "[PRODUCT] with discount offer, fashionable styling, sale banner" },
      { id: "fashion-brand", name: "Brand Showcase", prompt: "Premium [PRODUCT] brand showcase, luxury aesthetic, elegant presentation" }
    ],
    tech: [
      { id: "tech-launch", name: "Product Launch", prompt: "Innovative [PRODUCT] technology showcase, futuristic design, launch announcement" },
      { id: "tech-app", name: "App Promotion", prompt: "[APP] mobile application, sleek interface, download promotion" },
      { id: "tech-gadget", name: "Gadget Ad", prompt: "Modern [GADGET] with technical specifications, tech-savvy design" }
    ],
    automotive: [
      { id: "auto-showcase", name: "Vehicle Showcase", prompt: "Stunning [VEHICLE] in dramatic lighting, luxury automotive presentation" },
      { id: "auto-service", name: "Auto Service", prompt: "Professional [SERVICE] automotive care, trusted service provider" },
      { id: "auto-sale", name: "Vehicle Sale", prompt: "[VEHICLE] with special pricing, automotive dealership promotion" }
    ],
    "real-estate": [
      { id: "property-listing", name: "Property Listing", prompt: "Beautiful [PROPERTY] with architectural highlights, real estate showcase" },
      { id: "property-sale", name: "Property Sale", prompt: "[PROPERTY] with price reduction, real estate promotion" },
      { id: "property-rent", name: "Rental Property", prompt: "Modern [PROPERTY] for rent, comfortable living space" }
    ],
    gaming: [
      { id: "game-launch", name: "Game Launch", prompt: "Epic [GAME] launch announcement, gaming graphics, action-packed design" },
      { id: "gaming-gear", name: "Gaming Gear", prompt: "Professional [EQUIPMENT] gaming setup, esports quality equipment" },
      { id: "gaming-event", name: "Gaming Event", prompt: "[EVENT] gaming tournament, competitive gaming atmosphere" }
    ],
    travel: [
      { id: "travel-destination", name: "Destination", prompt: "Breathtaking [DESTINATION] travel experience, wanderlust inspiration" },
      { id: "travel-package", name: "Travel Package", prompt: "[PACKAGE] vacation deal, travel agency promotion" },
      { id: "travel-hotel", name: "Hotel Booking", prompt: "Luxury [HOTEL] accommodation, hospitality excellence" }
    ],
    music: [
      { id: "music-event", name: "Music Event", prompt: "[EVENT] concert promotion, energetic music atmosphere" },
      { id: "music-album", name: "Album Release", prompt: "[ALBUM] music release, artistic album cover design" },
      { id: "music-festival", name: "Music Festival", prompt: "[FESTIVAL] music celebration, festival vibes and energy" }
    ],
    business: [
      { id: "business-service", name: "Service Promotion", prompt: "Professional [SERVICE] business solution, corporate excellence" },
      { id: "business-consulting", name: "Consulting", prompt: "[CONSULTING] business expertise, professional advisory services" },
      { id: "business-startup", name: "Startup Launch", prompt: "Innovative [STARTUP] business launch, entrepreneurial spirit" }
    ],
    lifestyle: [
      { id: "lifestyle-fitness", name: "Fitness", prompt: "[FITNESS] wellness journey, healthy lifestyle motivation" },
      { id: "lifestyle-beauty", name: "Beauty", prompt: "[BEAUTY] self-care routine, wellness and beauty" },
      { id: "lifestyle-wellness", name: "Wellness", prompt: "[WELLNESS] healthy living, mindfulness and balance" }
    ]
  };

  useEffect(() => {
    loadMyAds();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowRatioDropdown(false);
        setShowTemplateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadMyAds = async () => {
    try {
      setAdsLoading(true);
      const response = await adService.getMyAds(1, 12);
      setMyAds(response.data.ads || []);
    } catch (err) {
      console.error("Error loading ads:", err);
    } finally {
      setAdsLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!confirm("Are you sure you want to delete this generated ad?")) return;

    try {
      await adService.deleteAd(adId);
      setMyAds(myAds.filter(ad => ad._id !== adId));
    } catch (err) {
      console.error("Error deleting ad:", err);
      setError("Failed to delete ad");
    }
  };

  const handleDownloadAd = async (ad) => {
    try {
      const response = await fetch(ad.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-ad-${ad._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading ad:", err);
      setError("Failed to download ad");
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    // Replace placeholder in template with user's custom text or keep as is
    setPrompt(template.prompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description or select a template");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      const selectedSizeData = sizes.find(s => s.id === selectedSize);
      const [width, height] = selectedSizeData ? selectedSizeData.dimensions.split('x').map(Number) : [1080, 1080];
      
      const response = await adService.generateAd({
        prompt: prompt.trim(),
        style: selectedCategory,
        dimensions: { width, height }
      });

      setGeneratedImage(response.data);
      setSuccess("✨ Ad generated successfully!");
      setShowHeartAnimation(true);
      
      // Reload ads to show the new one
      loadMyAds();
      
      // Clear success message and animation after 3 seconds
      setTimeout(() => {
        setSuccess("");
        setShowHeartAnimation(false);
      }, 3000);

    } catch (err) {
      console.error("Error generating ad:", err);
      const errorMessage = err.response?.data?.message || "Failed to generate ad. Please try again.";
      const errorCode = err.response?.data?.error;
      
      if (err.response?.status === 503) {
        if (errorCode === 'DNS_ERROR') {
          setError("🌐 Network connectivity issue. Please check your internet connection and try again.");
        } else if (errorCode === 'NETWORK_ERROR') {
          setError("🔒 Network access blocked. Please check firewall settings or try using a VPN.");
        } else {
          setError("🤖 AI model is loading. Please wait a minute and try again.");
        }
      } else if (err.response?.status === 401) {
        setError("🔑 API authentication failed. Please contact support.");
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        setError("🌐 Network connection failed. Please check your internet and try again.");
      } else {
        setError(errorMessage);
      }
      
      setTimeout(() => setError(""), 8000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage?.imageUrl) return;
    
    try {
      const response = await fetch(generatedImage.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `generated-ad-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading image:", err);
      setError("Failed to download image");
    }
  };

  return (
    <div className="h-screen bg-background text-foreground overflow-hidden">
      {/* Error/Success Messages */}
      {error && (
        <Alert className="mx-auto max-w-4xl mx-4 my-2 bg-destructive/10 text-destructive border-destructive/20">
          <AlertDescription className="flex items-center gap-2">
            <span className="animate-bounce">⚠️</span>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mx-auto max-w-4xl mx-4 my-2 bg-green-500/10 text-green-500 border-green-500/20">
          <AlertDescription className="flex items-center gap-2">
            <span className="animate-bounce">🎉</span>
            {success}
            {showHeartAnimation && (
              <Heart className="h-4 w-4 text-red-400 animate-ping ml-2" />
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Container - Full Height Layout */}
      <div className="h-full flex flex-col px-4 py-4">
        {/* Header Section - Compact */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI Design Studio</h1>
          </div>
          <p className="text-sm text-muted-foreground">Transform your ideas into stunning ads with AI</p>
        </div>

        {/* Search Bar Section - Compact */}
        <div className="w-full max-w-4xl mx-auto mb-4">
          <div className="relative">
            <Textarea
              placeholder="Describe your dream ad in detail... Be creative and specific!"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={1}
              className="w-full min-h-[50px] bg-background border-2 border-border text-foreground placeholder-muted-foreground/70 resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-base font-medium rounded-xl px-5 py-3 pr-16 shadow-lg hover:shadow-xl"
              style={{ 
                fontSize: '16px',
                lineHeight: '1.4'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.max(50, target.scrollHeight) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!isGenerating && prompt.trim()) {
                    handleGenerate();
                  }
                }
              }}
            />
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 h-auto shadow-md hover:shadow-lg transition-all duration-200"
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Compact Selection Icons */}
          <div className="flex justify-center items-center gap-4 mt-3">
            {/* Category Selector */}
            <div className="relative dropdown-container">
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 h-8 px-3 transition-all duration-200 ${
                  selectedCategory 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                {selectedCategory ? (
                  <>
                    {(() => {
                      const category = categories.find(c => c.id === selectedCategory);
                      const IconComponent = category?.icon || Palette;
                      return <IconComponent className="h-3 w-3" />;
                    })()}
                    <span className="text-xs font-medium">
                      {categories.find(c => c.id === selectedCategory)?.name.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <Palette className="h-3 w-3" />
                    <span className="text-xs">Category</span>
                  </>
                )}
              </Button>
              
              {showCategoryDropdown && (
                <div className="absolute top-10 left-0 bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[200px]">
                  <div className="grid grid-cols-2 gap-1">
                    {categories.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? "default" : "ghost"}
                          size="sm"
                          className="h-10 flex flex-col items-center gap-1 transition-all duration-200"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <IconComponent className="h-3 w-3" />
                          <span className="text-xs">{category.name.split(' ')[0]}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Ratio Selector */}
            <div className="relative dropdown-container">
              <Button
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 h-8 px-3 transition-all duration-200 ${
                  selectedSize 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => setShowRatioDropdown(!showRatioDropdown)}
              >
                <div className={`border-2 ${selectedSize ? 'border-primary-foreground' : 'border-current'} rounded`} 
                     style={{ 
                       width: selectedSize ? 
                         (sizes.find(s => s.id === selectedSize)?.ratio === '1:1' ? '10px' : 
                          sizes.find(s => s.id === selectedSize)?.ratio.includes('16:9') ? '14px' : '8px') : '10px',
                       height: selectedSize ? 
                         (sizes.find(s => s.id === selectedSize)?.ratio === '1:1' ? '10px' : 
                          sizes.find(s => s.id === selectedSize)?.ratio.includes('16:9') ? '8px' : '12px') : '10px'
                     }}>
                </div>
                <span className="text-xs">
                  {selectedSize ? sizes.find(s => s.id === selectedSize)?.ratio : "Ratio"}
                </span>
              </Button>
              
              {showRatioDropdown && (
                <div className="absolute top-10 left-0 bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[140px]">
                  <div className="space-y-1">
                    {sizes.map((size) => (
                      <Button
                        key={size.id}
                        variant={selectedSize === size.id ? "default" : "ghost"}
                        size="sm"
                        className="w-full flex items-center gap-2 justify-start h-8 transition-all duration-200"
                        onClick={() => {
                          setSelectedSize(size.id);
                          setShowRatioDropdown(false);
                        }}
                      >
                        <div className={`border-2 ${selectedSize === size.id ? 'border-primary-foreground' : 'border-current'} rounded`} 
                             style={{ 
                               width: size.ratio === '1:1' ? '10px' : size.ratio.includes('16:9') ? '14px' : '8px',
                               height: size.ratio === '1:1' ? '10px' : size.ratio.includes('16:9') ? '8px' : '12px'
                             }}>
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-medium">{size.name}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Template Selector - Only show if category is selected */}
            {selectedCategory && (
              <div className="relative dropdown-container">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 h-8 px-3 transition-all duration-200 ${
                    selectedTemplate 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                >
                  <Star className="h-3 w-3" />
                  <span className="text-xs">
                    {selectedTemplate ? 
                      templates[selectedCategory]?.find(t => t.id === selectedTemplate)?.name : 
                      "Template"
                    }
                  </span>
                </Button>
                
                {showTemplateDropdown && (
                  <div className="absolute top-10 left-0 bg-background border border-border rounded-lg shadow-xl p-2 z-50 min-w-[160px]">
                    <div className="space-y-1">
                      {templates[selectedCategory]?.map((template) => (
                        <Button
                          key={template.id}
                          variant={selectedTemplate === template.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full text-left justify-start h-7 transition-all duration-200"
                          onClick={() => {
                            handleTemplateSelect(template);
                            setShowTemplateDropdown(false);
                          }}
                        >
                          <span className="text-xs">{template.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area - Flexible Height */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Generated Result Display - Left Side */}
          <div className="flex-1 flex items-center justify-center">
            {generatedImage ? (
              <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">AI Generated</span>
                  </div>
                  
                  <div className="mb-4">
                    <img
                      src={generatedImage.imageUrl}
                      alt="Generated Ad"
                      className="w-full h-auto max-h-64 object-contain rounded-lg shadow-md border border-border mx-auto"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={handleDownload} 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-4"
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="font-medium px-4"
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <Palette className="h-16 w-16 text-muted-foreground animate-pulse" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1 animate-bounce" />
                </div>
                <p className="text-lg font-bold text-foreground mb-1">Ready to Create</p>
                <p className="text-sm text-muted-foreground">Enter your prompt and generate</p>
              </div>
            )}
          </div>

          {/* Design History - Right Side */}
          <div className="w-80 flex flex-col min-h-0">
            <h3 className="text-lg font-bold text-foreground mb-3 text-center">
              Design History
            </h3>
            
            <div className="flex-1 overflow-hidden">
              {adsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : myAds.length === 0 ? (
                <div className="text-center py-8">
                  <div className="relative mx-auto w-12 h-12 mb-3">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No designs yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Create your first design!</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {myAds.slice(0, 8).map((ad, index) => (
                      <div 
                        key={ad._id} 
                        className="group relative aspect-square animate-in fade-in-50 hover:scale-105 transition-all duration-300"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <img
                          src={ad.url}
                          alt={ad.prompt}
                          className="w-full h-full object-cover rounded-lg border border-border shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/50"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl bg-background border border-border">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2 text-primary">
                                    <Sparkles className="h-4 w-4" />
                                    Generated Design
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3">
                                  <img
                                    src={ad.url}
                                    alt={ad.prompt}
                                    className="w-full max-h-[50vh] object-contain rounded-lg border border-border"
                                  />
                                  <div className="bg-card p-3 rounded-lg border border-border">
                                    <strong className="text-primary text-sm">Prompt:</strong>
                                    <p className="mt-1 text-sm text-muted-foreground">{ad.prompt}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleDownloadAd(ad)}
                              className="h-6 w-6 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteAd(ad._id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-1 rounded-b-lg">
                          <p className="text-xs truncate font-medium">{ad.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateAds;
