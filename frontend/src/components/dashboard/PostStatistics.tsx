import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '@/services/api';

interface PostStats {
  successful: number;
  scheduled: number;
  failed: number;
  total: number;
}

export default function PostStatistics() {
  const [stats, setStats] = useState<PostStats>({
    successful: 0,
    scheduled: 0,
    failed: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostStats();
  }, []);

  const fetchPostStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/analytics');
      const posts = response.data.posts || response.data.data?.posts || [];

      const successful = posts.filter((p: any) => p.status === 'published').length;
      const scheduled = posts.filter((p: any) => p.status === 'scheduled').length;
      const failed = posts.filter((p: any) => p.status === 'failed').length;

      setStats({
        successful,
        scheduled,
        failed,
        total: posts.length
      });
    } catch (error) {
      console.error('Error fetching post stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    bgColor 
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    color: string; 
    bgColor: string;
  }) => (
    <div className={`${bgColor} rounded-lg p-4 border border-${color}/20`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-2xl font-bold text-card-foreground">{value}</span>
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {stats.total > 0 && (
        <div className="mt-2 h-1.5 bg-background/50 rounded-full overflow-hidden">
          <div
            className={`h-full bg-current ${color}`}
            style={{ width: `${(value / stats.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-card-foreground">Post Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-card-foreground">Post Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={CheckCircle}
            label="Published"
            value={stats.successful}
            color="text-green-600"
            bgColor="bg-green-50 dark:bg-green-950/20"
          />
          <StatCard
            icon={Clock}
            label="Scheduled"
            value={stats.scheduled}
            color="text-blue-600"
            bgColor="bg-blue-50 dark:bg-blue-950/20"
          />
          <StatCard
            icon={XCircle}
            label="Failed"
            value={stats.failed}
            color="text-red-600"
            bgColor="bg-red-50 dark:bg-red-950/20"
          />
        </div>
      </CardContent>
    </Card>
  );
}
