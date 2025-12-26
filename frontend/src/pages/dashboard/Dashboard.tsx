import TopPerformerPosts from '@/components/dashboard/TopPerformerPosts';
import TopPerformerAds from '@/components/dashboard/TopPerformerAds';
import PlatformAnalytics from '@/components/dashboard/PlatformAnalytics';
import AccountHealthCheck from '@/components/dashboard/AccountHealthCheck';
import PostStatistics from '@/components/dashboard/PostStatistics';
import PostsSidebar from '@/components/dashboard/PostsSidebar';

export default function Dashboard() {
  return (
    <div className="flex gap-4 p-6 min-h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 space-y-4">
        {/* Post Statistics */}
        <PostStatistics />

        {/* Top Performers Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopPerformerPosts />
          <TopPerformerAds />
        </div>

        {/* Analytics Row - Merged with tighter spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <PlatformAnalytics />
          </div>
          <div className="lg:col-span-1">
            <AccountHealthCheck />
          </div>
        </div>
      </div>

      {/* Fixed Right Sidebar - Posts */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-6">
          <PostsSidebar />
        </div>
      </div>
    </div>
  );
}
