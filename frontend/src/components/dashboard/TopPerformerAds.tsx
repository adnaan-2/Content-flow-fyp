import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar } from 'lucide-react';
import api from '@/services/api';

interface GeneratedAd {
  _id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  style: string;
  dimensions: {
    width: number;
    height: number;
  };
  createdAt: string;
}

export default function TopPerformerAds() {
  const [ads, setAds] = useState<GeneratedAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGeneratedAds();
  }, []);

  const fetchGeneratedAds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ads/my-ads');
      const adsData = response.data.ads || response.data || [];
      // Show most recent ads first
      const sorted = adsData.sort((a: GeneratedAd, b: GeneratedAd) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAds(sorted.slice(0, 10)); // Top 10 recent ads
    } catch (error) {
      console.error('Error fetching generated ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStyleColor = (style: string) => {
    const colors: { [key: string]: string } = {
      professional: 'bg-blue-500',
      creative: 'bg-purple-500',
      minimal: 'bg-gray-500',
      vibrant: 'bg-pink-500',
      elegant: 'bg-indigo-500'
    };
    return colors[style.toLowerCase()] || 'bg-primary';
  };

  if (loading) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <Sparkles className="w-4 h-4" />
            AI-Generated Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ads.length === 0) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <Sparkles className="w-4 h-4" />
            AI-Generated Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center text-sm text-muted-foreground">
            <Sparkles className="w-8 h-8 mb-2 text-muted-foreground/50" />
            <p>No AI ads generated yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
          <Sparkles className="w-4 h-4" />
          AI-Generated Ads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-2">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="border border-border dark:border-border rounded-lg p-3 hover:shadow-sm transition-shadow bg-card dark:bg-card cursor-pointer"
              onClick={() => window.open(ad.url, '_blank')}
            >
              <div className="flex gap-2">
                {/* Ad Image */}
                <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={ad.url}
                    alt="Generated Ad"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=Ad';
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={`${getStyleColor(ad.style)} text-white text-[10px] px-1.5 py-0`}>
                      {ad.style}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(ad.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="text-xs text-card-foreground line-clamp-1 mb-1">
                    {ad.prompt}
                  </p>

                  <p className="text-[10px] text-muted-foreground">
                    {ad.dimensions.width} × {ad.dimensions.height}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
