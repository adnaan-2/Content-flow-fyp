import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp } from 'lucide-react';
import api from '@/services/api';

interface PlatformStats {
  platform: string;
  postCount: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  accountName: string;
}

export default function PlatformAnalytics() {
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformAnalytics();
  }, []);

  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch posts and social accounts
      const [postsRes, accountsRes] = await Promise.all([
        api.get('/posts/analytics'),
        api.get('/social-media/accounts')
      ]);

      const posts = postsRes.data.posts || postsRes.data.data?.posts || [];
      const accounts = accountsRes.data.accounts || accountsRes.data || [];

      // Group posts by platform and calculate stats
      const platformMap = new Map<string, PlatformStats>();

      // Initialize with accounts data (to get followers)
      accounts.forEach((account: any) => {
        const platform = account.platform;
        const followerCount = account.platformData?.followerCount || 0;
        
        if (!platformMap.has(platform)) {
          platformMap.set(platform, {
            platform,
            postCount: 0,
            totalLikes: 0,
            totalComments: 0,
            totalFollowers: followerCount,
            accountName: account.accountName
          });
        } else {
          // If multiple accounts for same platform, add followers
          const existing = platformMap.get(platform)!;
          existing.totalFollowers += followerCount;
        }
      });

      // Aggregate post analytics by platform
      posts.forEach((post: any) => {
        const platform = post.platform;
        if (!platformMap.has(platform)) {
          platformMap.set(platform, {
            platform,
            postCount: 0,
            totalLikes: 0,
            totalComments: 0,
            totalFollowers: 0,
            accountName: post.socialAccountId?.accountName || 'Unknown'
          });
        }

        const stats = platformMap.get(platform)!;
        stats.postCount++;
        stats.totalLikes += post.analytics?.likes || 0;
        stats.totalComments += post.analytics?.comments || 0;
      });

      // Convert to array and sort by engagement
      const statsArray = Array.from(platformMap.values()).sort((a, b) => {
        const aEngagement = a.totalLikes + a.totalComments;
        const bEngagement = b.totalLikes + b.totalComments;
        return bEngagement - aEngagement;
      });

      setPlatformStats(statsArray);
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return (
          <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-6 h-6 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-6 h-6 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'x':
      case 'twitter':
        return (
          <svg className="w-6 h-6 text-[#000000]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <TrendingUp className="w-4 h-4" />
            Platform Analytics
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

  if (platformStats.length === 0) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <TrendingUp className="w-4 h-4" />
            Platform Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Connect social accounts to see analytics
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
          <TrendingUp className="w-4 h-4" />
          Platform Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-2.5">
          {platformStats.map((stats) => (
            <div
              key={stats.platform}
              className="py-2 border-b border-border dark:border-border last:border-0 hover:bg-muted/30 dark:hover:bg-muted/30 transition-colors rounded px-2"
            >
              {/* Platform Header with inline stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <div className="scale-75">{getPlatformIcon(stats.platform)}</div>
                  <div>
                    <h3 className="font-medium text-xs capitalize">
                      {stats.platform}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      @{stats.accountName}
                    </p>
                  </div>
                </div>

                {/* Inline Stats */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <p className="font-bold">{stats.postCount}</p>
                    <p className="text-[9px] text-muted-foreground">Posts</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{formatNumber(stats.totalFollowers)}</p>
                    <p className="text-[9px] text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{formatNumber(stats.totalLikes + stats.totalComments)}</p>
                    <p className="text-[9px] text-muted-foreground">Engagement</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
