import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

interface AccountHealth {
  platform: string;
  accountName: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: Date;
  details?: {
    tokenValid: boolean;
    permissionsOk: boolean;
    apiResponding: boolean;
  };
}

export default function AccountHealthCheck() {
  const [healthStatus, setHealthStatus] = useState<AccountHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkAccountsHealth();
  }, []);

  const checkAccountsHealth = async () => {
    try {
      setChecking(true);
      const response = await api.get('/social-media/accounts');
      const accounts = response.data.accounts || response.data || [];

      const healthChecks = await Promise.all(
        accounts.map(async (account: any) => {
          try {
            // Verify token and API connectivity by making a test call
            const testResult = await verifyAccountApi(account);
            
            return {
              platform: account.platform,
              accountName: account.accountName,
              status: testResult.status,
              message: testResult.message,
              lastChecked: new Date(),
              details: testResult.details
            };
          } catch (error) {
            return {
              platform: account.platform,
              accountName: account.accountName,
              status: 'error' as const,
              message: 'Failed to verify account',
              lastChecked: new Date(),
              details: {
                tokenValid: false,
                permissionsOk: false,
                apiResponding: false
              }
            };
          }
        })
      );

      setHealthStatus(healthChecks);
    } catch (error) {
      console.error('Error checking accounts health:', error);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  const verifyAccountApi = async (account: any): Promise<{
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details: {
      tokenValid: boolean;
      permissionsOk: boolean;
      apiResponding: boolean;
    };
  }> => {
    // Check if account is active
    if (!account.isActive) {
      return {
        status: 'warning',
        message: 'Account is inactive',
        details: {
          tokenValid: false,
          permissionsOk: false,
          apiResponding: false
        }
      };
    }

    // Check token expiry
    if (account.tokenExpiry) {
      const expiryDate = new Date(account.tokenExpiry);
      const now = new Date();
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (expiryDate < now) {
        return {
          status: 'error',
          message: 'Token has expired',
          details: {
            tokenValid: false,
            permissionsOk: false,
            apiResponding: false
          }
        };
      }

      if (daysUntilExpiry < 7) {
        return {
          status: 'warning',
          message: `Token expires in ${daysUntilExpiry} days`,
          details: {
            tokenValid: true,
            permissionsOk: true,
            apiResponding: true
          }
        };
      }
    }

    // Check permissions
    const hasRequiredPermissions = account.permissions && account.permissions.length > 0;
    if (!hasRequiredPermissions) {
      return {
        status: 'warning',
        message: 'Limited permissions',
        details: {
          tokenValid: true,
          permissionsOk: false,
          apiResponding: true
        }
      };
    }

    // All checks passed
    return {
      status: 'healthy',
      message: 'All systems operational',
      details: {
        tokenValid: true,
        permissionsOk: true,
        apiResponding: true
      }
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-600 border border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 border border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return '📘';
      case 'instagram':
        return '📷';
      case 'linkedin':
        return '💼';
      case 'x':
      case 'twitter':
        return '🐦';
      default:
        return '🌐';
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <Shield className="w-4 h-4" />
            Account Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (healthStatus.length === 0) {
    return (
      <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <Shield className="w-4 h-4" />
            Account Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex flex-col items-center justify-center text-sm text-muted-foreground">
            <Shield className="w-8 h-8 mb-2 text-muted-foreground/50" />
            <p>No connected accounts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthyCount = healthStatus.filter(h => h.status === 'healthy').length;
  const warningCount = healthStatus.filter(h => h.status === 'warning').length;
  const errorCount = healthStatus.filter(h => h.status === 'error').length;

  return (
    <Card className="shadow-sm bg-card dark:bg-card border-border dark:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-card-foreground">
            <Shield className="w-4 h-4" />
            Account Health
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkAccountsHealth}
            disabled={checking}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="flex gap-2 mt-2">
          {healthyCount > 0 && (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
              {healthyCount} Healthy
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
              {warningCount} Warning
            </Badge>
          )}
          {errorCount > 0 && (
            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
              {errorCount} Error
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent space-y-2">
          {healthStatus.map((health, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg border border-border dark:border-border bg-card dark:bg-card hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base">{getPlatformIcon(health.platform)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-medium text-xs capitalize truncate">
                      {health.platform}
                    </h4>
                    <Badge className={`text-[9px] px-1 py-0 ${getStatusBadge(health.status)}`}>
                      {health.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {health.message}
                  </p>
                </div>
              </div>
              
              <div className="scale-75">{getStatusIcon(health.status)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
