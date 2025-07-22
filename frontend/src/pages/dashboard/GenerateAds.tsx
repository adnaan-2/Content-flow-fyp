
import { useState, useEffect } from "react";
import { Sparkles, Download, RefreshCw, Palette, ImageIcon, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { adService } from "@/services/api";

const GenerateAds = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedDimension, setSelectedDimension] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [presets, setPresets] = useState(null);

  // Load presets on component mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const response = await adService.getPresets();
      setPresets(response.data.presets);
    } catch (err) {
      console.error("Error loading presets:", err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your ad");
      return;
    }

    setIsGenerating(true);
    setError("");
    setSuccess("");

    try {
      const selectedDimensionData = presets?.dimensions.find(d => d.id === selectedDimension);
      
      const response = await adService.generateAd({
        prompt: prompt.trim(),
        style: selectedStyle,
        dimensions: selectedDimensionData ? {
          width: selectedDimensionData.width,
          height: selectedDimensionData.height
        } : { width: 1024, height: 1024 }
      });

      setGeneratedImage(response.data);
      setSuccess("Ad generated successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error("Error generating ad:", err);
      const errorMessage = err.response?.data?.message || "Failed to generate ad. Please try again.";
      
      if (err.response?.status === 503) {
        setError("AI model is loading. Please wait a minute and try again.");
      } else {
        setError(errorMessage);
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
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

  const examplePrompts = [
    "Coffee shop grand opening with 20% discount",
    "Fitness app promotion with workout motivation",
    "Fashion sale with summer collection showcase",
    "Tech startup launch with innovation theme",
    "Restaurant special menu with delicious food",
    "Travel agency vacation deals with tropical beach"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Ads</h1>
        <p className="text-muted-foreground">
          Create stunning marketing visuals with AI-powered FLUX.1
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-500/10 text-green-500 border-green-500/20">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Ad Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Ad Generator
            </CardTitle>
            <CardDescription>
              Describe your ad and let AI create a professional marketing visual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe your ad</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., Modern coffee shop promotion with cozy atmosphere and special discount offer"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="bg-secondary/50"
              />
            </div>

            {/* Style Selection */}
            {presets?.styles && (
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Choose a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.styles.map((style) => (
                      <SelectItem key={style.id} value={style.id}>
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dimension Selection */}
            {presets?.dimensions && (
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Select value={selectedDimension} onValueChange={setSelectedDimension}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Choose dimensions" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.dimensions.map((dim) => (
                      <SelectItem key={dim.id} value={dim.id}>
                        <div>
                          <div className="font-medium">{dim.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {dim.width}x{dim.height} - {dim.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Ad
                </span>
              )}
            </Button>

            {/* Example Prompts */}
            <div className="space-y-2">
              <Label>Example prompts:</Label>
              <div className="grid grid-cols-1 gap-2">
                {examplePrompts.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 text-left justify-start text-xs"
                    onClick={() => setPrompt(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Generated Ad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              Generated Ad
            </CardTitle>
            <CardDescription>
              Your AI-generated marketing visual will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Generated Ad"
                    className="w-full rounded-lg border shadow-md"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {generatedImage.prompt && (
                  <div className="text-xs text-muted-foreground p-3 bg-secondary/50 rounded">
                    <strong>Generated with:</strong> {generatedImage.prompt}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Palette className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Your generated ad will appear here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter a description and click "Generate Ad" to create your visual
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateAds;
