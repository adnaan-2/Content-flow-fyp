import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { analyticsApi, type DashboardData } from '@/services/analyticsApi';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('weekly');
  const [syncing, setSyncing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);

  // Platform normalization
  const PLATFORM_ORDER = [
    { key: 'instagram', name: 'Instagram', color: '#E4405F' },
    { key: 'facebook', name: 'Facebook', color: '#1877F2' },
    { key: 'linkedin', name: 'LinkedIn', color: '#0A66C2' },
    { key: 'twitter', name: 'Twitter', color: '#1DA1F2' },
  ];
  const normalizePlatformKey = (p: string) => {
    const k = (p || '').toLowerCase();
    if (k === 'x') return 'twitter';
    return k;
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getDashboard({ timeRange });
      setData(response.data);
      // Also fetch per-post analytics from real endpoint
      try {
        const postsRes = await analyticsApi.getPosts();
        const postsList = postsRes.posts || postsRes.data?.posts || [];
        setPosts(postsList);
        setPostsLoaded(true);
      } catch (postErr: any) {
        console.warn('Posts analytics fetch warning:', postErr?.message || postErr);
        setPosts([]);
        setPostsLoaded(false);
      }
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Handle sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      await analyticsApi.syncAnalytics({ timeRange });
      await fetchAnalyticsData();
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to sync analytics');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Format numbers
  const formatNumber = (num: number): string => {
    return analyticsApi.formatNumber(num);
  };

  // Get growth styling
  const getGrowthTrend = (growth: number) => {
    return analyticsApi.getGrowthTrend(growth);
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!data?.platformBreakdown) return [];
    const map: Record<string, any> = {};
    data.platformBreakdown.forEach(pb => {
      const key = normalizePlatformKey(pb.platform);
      map[key] = {
        name: pb.platformName,
        followers: pb.metrics.followers || 0,
        engagement: pb.metrics.engagement || 0,
        posts: pb.metrics.posts || 0,
        likes: pb.metrics.likes || 0,
        comments: pb.metrics.comments || 0,
        impressions: pb.metrics.impressions || 0,
      };
    });
    return PLATFORM_ORDER.map(p => map[p.key] || {
      name: p.name,
      followers: 0,
      engagement: 0,
      posts: 0,
      likes: 0,
      comments: 0,
      impressions: 0,
    });
  };

  const pieChartData = (() => {
    const breakdownMap: Record<string, number> = {};
    (data?.platformBreakdown || []).forEach(pb => {
      const key = normalizePlatformKey(pb.platform);
      breakdownMap[key] = (pb.metrics?.followers || 0);
    });
    return PLATFORM_ORDER.map(p => ({
      name: p.name,
      value: breakdownMap[p.key] || 0,
      fill: p.color
    }));
  })();

  // Compute totals from real posts
  const computeTotals = () => {
    const totals = {
      posts: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      followers: 0,
      avgEngagement: 0,
    };
    posts.forEach(p => {
      const a = p?.analytics || {};
      totals.posts += 1;
      totals.likes += Number(a.likes || 0);
      totals.comments += Number(a.comments || 0);
      totals.shares += Number(a.shares || 0);
      const impressions = (a.impressions != null ? a.impressions : a.views != null ? a.views : 0);
      totals.impressions += Number(impressions || 0);
    });
    totals.followers = (data?.platformBreakdown || []).reduce((sum, pb) => sum + (pb.metrics?.followers || 0), 0);
    const interactions = totals.likes + totals.comments + totals.shares;
    totals.avgEngagement = totals.followers > 0 ? (interactions / totals.followers) * 100 : 0;
    return totals;
  };

  // Helpers for post analytics
  const getPostEngagement = (p: any) => {
    const a = p?.analytics || {};
    const likes = Number(a.likes || 0);
    const comments = Number(a.comments || 0);
    const shares = Number(a.shares || 0);
    const views = Number(a.views || 0);
    // Prioritize interactions; include views lightly
    return likes + comments + shares + Math.floor(views * 0.1);
  };

  const computePlatformEngagement = () => {
    const byPlatform: Record<string, { name: string; engagement: number; posts: number }> = {};
    posts.forEach(p => {
      const key = (p.platform || 'unknown').toLowerCase();
      const e = getPostEngagement(p);
      if (!byPlatform[key]) byPlatform[key] = { name: key.charAt(0).toUpperCase() + key.slice(1), engagement: 0, posts: 0 };
      byPlatform[key].engagement += e;
      byPlatform[key].posts += 1;
    });
    return Object.values(byPlatform).map(item => ({
      name: item.name,
      engagement: item.engagement,
      avgEngagement: item.posts ? item.engagement / item.posts : 0,
      posts: item.posts
    }));
  };

  const computeTimeHistogram = () => {
    const buckets: Record<number, { hour: number; engagement: number; count: number }> = {};
    for (let h = 0; h < 24; h++) buckets[h] = { hour: h, engagement: 0, count: 0 };
    posts.forEach(p => {
      const dtStr = p.publishedTime || p.createdAt || p.scheduledTime;
      if (!dtStr) return;
      const d = new Date(dtStr);
      const hour = d.getHours();
      const e = getPostEngagement(p);
      buckets[hour].engagement += e;
      buckets[hour].count += 1;
    });
    return Object.values(buckets).map(b => ({
      hour: `${b.hour}:00`,
      avgEngagement: b.count ? Math.round(b.engagement / b.count) : 0,
      count: b.count
    }));
  };

  const computeBestFormat = () => {
    const byType: Record<string, { type: string; engagement: number; count: number }> = {};
    posts.forEach(p => {
      const t = (p?.content?.mediaType || 'text').toLowerCase();
      const e = getPostEngagement(p);
      if (!byType[t]) byType[t] = { type: t, engagement: 0, count: 0 };
      byType[t].engagement += e;
      byType[t].count += 1;
    });
    const arr = Object.values(byType).map(x => ({ type: x.type, avg: x.count ? x.engagement / x.count : 0, count: x.count }));
    arr.sort((a, b) => b.avg - a.avg);
    return arr[0] || { type: 'text', avg: 0, count: 0 };
  };

  const getAISuggestions = () => {
    const platformSeries = computePlatformEngagement();
    const bestPlatform = platformSeries.length ? platformSeries.slice().sort((a, b) => b.avgEngagement - a.avgEngagement)[0] : null;
    const timeSeries = computeTimeHistogram();
    const bestTime = timeSeries.length ? timeSeries.slice().sort((a, b) => b.avgEngagement - a.avgEngagement)[0] : null;
    const bestFormat = computeBestFormat();

    return {
      platform: bestPlatform?.name || 'N/A',
      platformHint: bestPlatform ? `Avg engagement ${formatNumber(Math.round(bestPlatform.avgEngagement))}` : 'Insufficient data',
      timeWindow: bestTime ? bestTime.hour : 'N/A',
      timeHint: bestTime ? `Avg engagement ${formatNumber(bestTime.avgEngagement)}` : 'Insufficient data',
      format: bestFormat.type,
      formatHint: bestFormat.count ? `Across ${bestFormat.count} posts` : 'Insufficient data'
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-16" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert className="max-w-2xl">
          <AlertDescription>
            <div className="flex flex-col space-y-2">
              <span>Error loading analytics: {error}</span>
              <Button onClick={fetchAnalyticsData} variant="outline" className="w-fit">
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!data?.hasConnectedAccounts) {
    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground mb-6">
            Connect your social media accounts to view detailed analytics and insights.
          </p>
          <Button>Connect Accounts</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Detailed Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics across all platforms
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="weekly">Last 4 Weeks</option>
            <option value="monthly">Last 3 Months</option>
            <option value="yearly">Last Year</option>
          </select>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(() => { const totals = computeTotals(); return (<>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Total Followers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(totals.followers)}
            </div>
            <div className={`text-sm flex items-center mt-1 ${getGrowthTrend(data.growthMetrics.followersGrowth).color}`}>
              {data.growthMetrics.followersGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {getGrowthTrend(data.growthMetrics.followersGrowth).label}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              Total Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(totals.likes + totals.comments + totals.shares)}
            </div>
            <div className={`text-sm flex items-center mt-1 ${getGrowthTrend(data.growthMetrics.engagementGrowth).color}`}>
              {data.growthMetrics.engagementGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {getGrowthTrend(data.growthMetrics.engagementGrowth).label}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Total Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(totals.impressions)}
            </div>
            <div className={`text-sm flex items-center mt-1 ${getGrowthTrend(data.growthMetrics.reachGrowth).color}`}>
              {data.growthMetrics.reachGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {getGrowthTrend(data.growthMetrics.reachGrowth).label}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Avg. Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totals.avgEngagement.toFixed(1)}%
            </div>
            <div className={`text-sm flex items-center mt-1 ${getGrowthTrend(data.growthMetrics.engagementGrowth).color}`}>
              {data.growthMetrics.engagementGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {getGrowthTrend(data.growthMetrics.engagementGrowth).label}
            </div>
          </CardContent>
        </Card>
        </>); })()}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="platforms" className="data-[state=active]:bg-background">Platforms</TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-background">Engagement</TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-background">Insights</TabsTrigger>
          <TabsTrigger value="growth" className="data-[state=active]:bg-background">Growth</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Followers by Platform Chart */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Followers by Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieChartData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground font-medium">{formatNumber(p.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Comparison */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Platform Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="followers" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.platformBreakdown.map((platform, index) => (
              <Card key={index} className="bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-foreground">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      platform.platform === 'facebook' ? 'bg-[#1877F2]' :
                      platform.platform === 'instagram' ? 'bg-[#E4405F]' :
                      platform.platform === 'twitter' ? 'bg-[#1DA1F2]' :
                      platform.platform === 'linkedin' ? 'bg-[#0A66C2]' :
                      'bg-muted-foreground'
                    }`}>
                      {platform.platformName.charAt(0)}
                    </div>
                    <span>{platform.platformName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{formatNumber(platform.metrics.followers)}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{platform.metrics.engagement.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Engagement</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Posts</span>
                      <span className="font-medium text-foreground">{formatNumber(platform.metrics.posts)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Likes</span>
                      <span className="font-medium text-foreground">{formatNumber(platform.metrics.likes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Comments</span>
                      <span className="font-medium text-foreground">{formatNumber(platform.metrics.comments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Impressions</span>
                      <span className="font-medium text-foreground">{formatNumber(platform.metrics.impressions)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Area type="monotone" dataKey="likes" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="comments" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-Post Engagement by Platform */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Per-Post Engagement by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={computePlatformEngagement()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="avgEngagement" name="Avg Engagement" fill="hsl(var(--primary))" />
                  <Bar dataKey="posts" name="Posts" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights (AI Suggestions) */}
        <TabsContent value="insights" className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoaded && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {(() => {
                    const s = getAISuggestions();
                    return (
                      <>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Best Platform</div>
                          <div className="text-xl font-semibold text-foreground">{s.platform}</div>
                          <div className="text-xs text-muted-foreground">{s.platformHint}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Best Time to Post</div>
                          <div className="text-xl font-semibold text-foreground">{s.timeWindow}</div>
                          <div className="text-xs text-muted-foreground">{s.timeHint}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Best Format</div>
                          <div className="text-xl font-semibold text-foreground">{s.format}</div>
                          <div className="text-xs text-muted-foreground">{s.formatHint}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-muted-foreground">Insufficient post data to generate suggestions.</div>
              )}
            </CardContent>
          </Card>

          {/* Engagement by Hour */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Average Engagement by Hour</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={computeTimeHistogram()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Line type="monotone" dataKey="avgEngagement" stroke="hsl(var(--primary))" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Follower Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {getGrowthTrend(data.growthMetrics.followersGrowth).label}
                </div>
                <div className="text-sm text-muted-foreground mt-2">vs. previous period</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {getGrowthTrend(data.growthMetrics.engagementGrowth).label}
                </div>
                <div className="text-sm text-muted-foreground mt-2">vs. previous period</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Reach Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {getGrowthTrend(data.growthMetrics.reachGrowth).label}
                </div>
                <div className="text-sm text-muted-foreground mt-2">vs. previous period</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
