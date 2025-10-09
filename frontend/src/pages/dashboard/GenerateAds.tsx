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
import TextType from "@/components/ui/text-type";
import Plasma from "@/components/ui/Plasma";

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
    <div className="h-[85vh] bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-black">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-20 w-48 h-48 bg-gray-200/30 dark:bg-gray-800/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-gray-300/20 dark:bg-gray-700/15 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="mx-auto max-w-4xl mx-4 my-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-600/40 relative z-10 flex-shrink-0">
          <AlertDescription className="flex items-center gap-2 text-sm">
            <span>⚠️</span>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mx-auto max-w-4xl mx-4 my-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-600/40 relative z-10 flex-shrink-0">
          <AlertDescription className="flex items-center gap-2 text-sm">
            <span>🎉</span>
            {success}
            {showHeartAnimation && (
              <Heart className="h-4 w-4 text-pink-400 animate-ping ml-2" />
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Container - Full Height Layout */}
      <div className="flex-1 flex relative z-10 min-h-0">
        {/* Main Content Area - Center */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header Section - Compact */}
          

          {/* Generated Result Display - Center Area */}
          <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0 relative">
            {/* Plasma Background - Only show when no generated image */}
            {!generatedImage && (
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <Plasma 
                  color="#8b5cf6"
                  speed={0.3}
                  direction="pingpong"
                  scale={1.2}
                  opacity={0.3}
                  mouseInteractive={true}
                />
              </div>
            )}
            
            {generatedImage ? (
              <div className="text-center w-full h-full flex flex-col items-center justify-center">
                <div className="mb-6">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Generated Ad"
                    className="max-w-md max-h-80 object-contain rounded-xl border border-gray-300 dark:border-gray-600 shadow-2xl"
                  />
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button 
                    onClick={handleDownload} 
                    className="bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-md"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-white dark:bg-background border-gray-300 dark:border-primary/20 text-gray-900 dark:text-foreground hover:bg-gray-50 dark:hover:bg-primary/10 hover:text-gray-900 dark:hover:text-foreground px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <TextType
                  text={[
                    "Create Amazing Ads with AI",
                    "Transform Ideas into Visuals",
                    "Design with AI Power",
                    "Generate Stunning Content",
                    "Bring Your Vision to Life"
                  ]}
                  className="text-5xl font-black text-gray-900 dark:text-white mb-2"
                  typingSpeed={60}
                  deletingSpeed={40}
                  pauseDuration={1500}
                  loop={true}
                  showCursor={true}
                  cursorCharacter="|"
                  cursorClassName="text-gray-900 dark:text-white text-6xl animate-pulse font-black"
                  textColors={['#111827', '#111827', '#111827', '#111827', '#111827']}
                />
              </div>
            )}
          </div>

          {/* Bottom Search Bar Section */}
          <div className="flex-shrink-0 p-2">
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-3">
                {/* Design Category Button */}
                <div className="relative dropdown-container">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 h-10 px-4 bg-gray-50 dark:bg-black border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-all ${
                      selectedCategory ? "bg-primary/10 text-foreground border-primary" : ""
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
                        <span className="text-xs hidden sm:block">
                          {categories.find(c => c.id === selectedCategory)?.name.split(' ')[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        <Palette className="h-3 w-3" />
                        <span className="text-xs hidden sm:block">Design</span>
                      </>
                    )}
                  </Button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-3 z-50 min-w-[240px] shadow-xl" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                      <div className="grid grid-cols-2 gap-1">
                        {categories.map((category) => {
                          const IconComponent = category.icon;
                          return (
                            <Button
                              key={category.id}
                              variant="ghost"
                              size="sm"
                              className={`h-10 flex flex-col items-center gap-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 text-sm transition-all ${
                                selectedCategory === category.id 
                                  ? "bg-primary text-primary-foreground" 
                                  : "text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground"
                              }`}
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <div className={`p-1 rounded-sm ${selectedCategory === category.id ? "bg-white/20" : "bg-gray-200 dark:bg-gray-800"}`}>
                                <IconComponent className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-medium">{category.name.split(' ')[0]}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ratio Button */}
                <div className="relative dropdown-container">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 h-10 px-4 bg-gray-50 dark:bg-black border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-all ${
                      selectedSize ? "bg-primary/10 text-foreground border-primary" : ""
                    }`}
                    onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                  >
                    <div className="border border-gray-400 dark:border-gray-400 rounded bg-gray-400 dark:bg-gray-600" 
                         style={{ 
                           width: selectedSize ? 
                             (sizes.find(s => s.id === selectedSize)?.ratio === '1:1' ? '10px' : 
                              sizes.find(s => s.id === selectedSize)?.ratio.includes('16:9') ? '12px' : '8px') : '10px',
                           height: selectedSize ? 
                             (sizes.find(s => s.id === selectedSize)?.ratio === '1:1' ? '10px' : 
                              sizes.find(s => s.id === selectedSize)?.ratio.includes('16:9') ? '7px' : '12px') : '10px'
                         }}>
                    </div>
                    <span className="text-sm hidden sm:block">
                      {selectedSize ? sizes.find(s => s.id === selectedSize)?.ratio : "Ratio"}
                    </span>
                  </Button>
                  
                  {showRatioDropdown && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-3 z-50 min-w-[160px] shadow-xl" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
                      <div className="space-y-1">
                        {sizes.map((size) => (
                          <Button
                            key={size.id}
                            variant="ghost"
                            size="sm"
                            className={`w-full flex items-center gap-2 justify-start h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-xs ${
                              selectedSize === size.id 
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" 
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                            }`}
                            onClick={() => {
                              setSelectedSize(size.id);
                              setShowRatioDropdown(false);
                            }}
                          >
                            <div className="border border-gray-400 rounded bg-gray-600" 
                                 style={{ 
                                   width: size.ratio === '1:1' ? '8px' : size.ratio.includes('16:9') ? '10px' : '6px',
                                   height: size.ratio === '1:1' ? '8px' : size.ratio.includes('16:9') ? '6px' : '10px'
                                 }}>
                            </div>
                            <div className="text-left">
                              <div className="text-xs">{size.name}</div>
                              <div className="text-xs text-gray-500">{size.ratio}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Search Input */}
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Describe your ad... Be creative and specific!"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={1}
                    className="w-full min-h-[40px] bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base rounded-lg px-4 py-3 pr-20"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.max(40, Math.min(80, target.scrollHeight)) + 'px';
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
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-primary/80 hover:bg-primary/90 text-primary-foreground px-4 py-2 h-auto rounded-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all shadow-md"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Right Sidebar - Design History */}
        <div className="w-64 flex flex-col border-l border-gray-300 dark:border-gray-800 bg-white dark:bg-black">
          <div className="p-4 border-b border-gray-300 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                <ImageIcon className="h-2 w-2 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">History</h3>
            </div>
        
          </div>
          
          <div className="flex-1 overflow-hidden p-2">
            {adsLoading ? (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 dark:border-gray-600 mb-1"></div>
                <span className="text-xs text-gray-500 dark:text-gray-500">Loading...</span>
              </div>
            ) : myAds.length === 0 ? (
              <div className="text-center py-4">
                <div className="mx-auto w-8 h-8 mb-2">
                  <ImageIcon className="h-8 w-8 text-gray-500 dark:text-gray-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-500 text-xs mb-1">No designs yet</p>
                <p className="text-gray-500 dark:text-gray-600 text-xs">Create your first ad</p>
              </div>
            ) : (
              <div 
                className="h-full overflow-y-auto"
                style={{ 
                  scrollbarWidth: 'thin', 
                  scrollbarColor: '#374151 transparent'
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {myAds.slice(0, 12).map((ad, index) => (
                    <div 
                      key={ad._id} 
                      className="group relative aspect-square"
                    >
                      <img
                        src={ad.url}
                        alt={ad.prompt}
                        className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="h-6 w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-0 text-xs">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-300">
                                  <ImageIcon className="h-4 w-4" />
                                  Generated Design
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <img
                                  src={ad.url}
                                  alt={ad.prompt}
                                  className="w-full max-h-[50vh] object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                                />
                                <div className="bg-gray-50 dark:bg-black p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                                  <strong className="text-gray-700 dark:text-gray-300 text-xs">Prompt:</strong>
                                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{ad.prompt}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleDownloadAd(ad)}
                            className="h-6 w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-0 text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            onClick={() => handleDeleteAd(ad._id)}
                            className="h-6 w-6 p-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-0 text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-black/80 text-gray-900 dark:text-white p-1 rounded-b-lg">
                        <p className="text-xs truncate">{ad.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {myAds.length > 12 && (
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-600">+{myAds.length - 12} more</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default GenerateAds;
