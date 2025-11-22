import api from './api';

export interface AnalyticsMetrics {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  followers: number;
  engagement: number;
}

export interface ConnectedAccount {
  platform: string;
  platformName: string;
  accountName: string;
  isConnected: boolean;
  lastSync?: string;
  profileImage?: string;
  metrics: AnalyticsMetrics;
}

export interface TotalMetrics {
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  followers: number;
  avgEngagement: number;
}

export interface GrowthMetrics {
  followersGrowth: number;
  engagementGrowth: number;
  reachGrowth: number;
}

export interface DashboardData {
  connectedAccounts: ConnectedAccount[];
  hasConnectedAccounts: boolean;
  totalMetrics: TotalMetrics;
  platformBreakdown: ConnectedAccount[];
  growthMetrics: GrowthMetrics;
  timeRange?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface AnalyticsApiParams {
  timeRange?: string;
  platforms?: string[];
}

class AnalyticsApi {
  // Get dashboard analytics overview
  async getDashboard(params: AnalyticsApiParams = {}): Promise<DashboardResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.timeRange) {
        queryParams.append('timeRange', params.timeRange);
      }
      
      if (params.platforms && params.platforms.length > 0) {
        queryParams.append('platforms', params.platforms.join(','));
      }

      const url = `/social-media/analytics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data;
    } catch (error: any) {
      console.error('Analytics API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch dashboard analytics');
    }
  }

  // Get analytics for specific platform account
  async getAccountAnalytics(accountId: string, params: AnalyticsApiParams = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.timeRange) {
        queryParams.append('timeRange', params.timeRange);
      }

      const url = `/social-media/accounts/${accountId}/analytics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data;
    } catch (error: any) {
      console.error('Account Analytics API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch account analytics');
    }
  }

  // Sync analytics from social platforms (if needed for real-time updates)
  async syncAnalytics(params: AnalyticsApiParams = {}) {
    try {
      const response = await api.post('/social-media/analytics/sync', params);
      return response.data;
    } catch (error: any) {
      console.error('Sync Analytics API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to sync analytics');
    }
  }

  // Get connected social media accounts
  async getConnectedAccounts() {
    try {
      const response = await api.get('/social-media/accounts');
      return response.data;
    } catch (error: any) {
      console.error('Connected Accounts API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch connected accounts');
    }
  }

  // Format numbers for display (e.g., 1000 -> 1K)
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Get posts with analytics
  async getPosts() {
    try {
      const response = await api.get('/social-media/posts/analytics');
      return response.data;
    } catch (error: any) {
      console.error('Posts Analytics API Error:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch posts analytics');
    }
  }

  // Calculate growth trend icon and color
  getGrowthTrend(growth: number) {
    if (growth > 0) {
      return { icon: '↗️', color: 'text-green-600', label: '+' + growth.toFixed(1) + '%' };
    } else if (growth < 0) {
      return { icon: '↘️', color: 'text-red-600', label: growth.toFixed(1) + '%' };
    } else {
      return { icon: '→', color: 'text-gray-600', label: '0%' };
    }
  }
}

export const analyticsApi = new AnalyticsApi();
export default analyticsApi;