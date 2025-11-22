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
  Cell
} from 'recharts';

const Analytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('weekly');
  const [syncing, setSyncing] = useState(false);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getDashboard({ timeRange });
      setData(response.data);
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
    
    return data.platformBreakdown.map(platform => ({
      name: platform.platformName,
      followers: platform.metrics.followers,
      engagement: platform.metrics.engagement,
      posts: platform.metrics.posts,
      likes: platform.metrics.likes,
      comments: platform.metrics.comments,
      impressions: platform.metrics.impressions
    }));
  };

  const pieChartData = data?.platformBreakdown.map(platform => ({
    name: platform.platformName,
    value: platform.metrics.followers,
    fill: platform.platform === 'facebook' ? '#1877F2' :
          platform.platform === 'instagram' ? '#E4405F' :
          platform.platform === 'twitter' ? '#1DA1F2' :
          platform.platform === 'linkedin' ? '#0A66C2' : '#6B7280'
  })) || [];

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
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Total Followers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatNumber(data.totalMetrics.followers)}
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
              {formatNumber(data.totalMetrics.likes + data.totalMetrics.comments + data.totalMetrics.shares)}
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
              {formatNumber(data.totalMetrics.impressions)}
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
              {data.totalMetrics.avgEngagement.toFixed(1)}%
            </div>
            <div className={`text-sm flex items-center mt-1 ${getGrowthTrend(data.growthMetrics.engagementGrowth).color}`}>
              {data.growthMetrics.engagementGrowth > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {getGrowthTrend(data.growthMetrics.engagementGrowth).label}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="platforms" className="data-[state=active]:bg-background">Platforms</TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-background">Engagement</TabsTrigger>
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
                      label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
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
