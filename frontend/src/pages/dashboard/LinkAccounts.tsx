import React, { useState, useEffect } from 'react';

interface SocialAccount {
  _id: string;
  platform: string;
  accountName: string;
  accountData: {
    profilePicture?: string;
    followerCount?: number;
    bio?: string;
    pageType?: string;
  };
  isActive: boolean;
}

export default function LinkAccounts() {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [fetchingAccounts, setFetchingAccounts] = useState(false);

  const socialPlatforms = [
    {
      name: 'Facebook',
      platform: 'facebook',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877F2',
      description: 'Manage Facebook pages and reach your audience'
    },
    {
      name: 'Instagram',
      platform: 'instagram',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      color: '#E4405F',
      description: 'Share visual content and stories'
    },
    {
      name: 'LinkedIn',
      platform: 'linkedin',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: '#0A66C2',
      description: 'Connect with professionals'
    },
    {
      name: 'X',
      platform: 'x',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: '#000000',
      description: 'Share thoughts and engage'
    }
  ];

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      setFetchingAccounts(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/social-media/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setConnectedAccounts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setFetchingAccounts(false);
    }
  };

  const handleConnect = async (platform: string) => {
    setConnectingPlatform(platform);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setConnectingPlatform(null);
        return;
      }

      // Clean up any inactive accounts for this platform first (optional)
      // This ensures a fresh connection without conflicts
      console.log(`Initiating connection for ${platform}`);

      // Store the platform for the callback
      sessionStorage.setItem('connecting_platform', platform);

      const response = await fetch(`/api/social-media/auth/${platform}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.authUrl) {
          const popup = window.open(
            data.authUrl,
            'social-auth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );

          // Listen for popup messages
          const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'SOCIAL_AUTH_SUCCESS') {
              popup?.close();
              setLoading(false);
              setConnectingPlatform(null);
              setConnectionSuccess(`${platform} account connected successfully!`);
              
              // Immediately refresh accounts
              fetchConnectedAccounts();
              
              // Clear success message after 3 seconds
              setTimeout(() => setConnectionSuccess(null), 3000);
              
              window.removeEventListener('message', handleMessage);
            } else if (event.data.type === 'SOCIAL_AUTH_ERROR') {
              popup?.close();
              setLoading(false);
              setConnectingPlatform(null);
              window.removeEventListener('message', handleMessage);
            }
          };

          window.addEventListener('message', handleMessage);

          // Fallback: check if popup is closed
          const checkClosed = setInterval(() => {
            if (popup?.closed) {
              clearInterval(checkClosed);
              setLoading(false);
              setConnectingPlatform(null);
              window.removeEventListener('message', handleMessage);
              // Refresh accounts after potential connection
              setTimeout(() => fetchConnectedAccounts(), 1000);
            }
          }, 1000);

          // Cleanup after 5 minutes
          setTimeout(() => {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            if (!popup?.closed) {
              popup?.close();
            }
            setLoading(false);
            setConnectingPlatform(null);
          }, 300000);
        }
      } else {
        setLoading(false);
        setConnectingPlatform(null);
      }
    } catch (error) {
      console.error('Error connecting account:', error);
      setLoading(false);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/social-media/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Account disconnected:', data.message);
        fetchConnectedAccounts();
        
        // Show disconnect confirmation
        setConnectionSuccess('Account disconnected successfully');
        setTimeout(() => setConnectionSuccess(null), 2000);
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const handleDisconnectPlatform = async (platform: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/social-media/accounts/platform/${platform}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Platform accounts disconnected:', data.message);
        fetchConnectedAccounts();
        
        // Show disconnect confirmation
        setConnectionSuccess(`All ${platform} accounts disconnected successfully`);
        setTimeout(() => setConnectionSuccess(null), 2000);
      }
    } catch (error) {
      console.error('Error disconnecting platform accounts:', error);
    }
  };

  const getConnectedAccounts = (platform: string) => {
    if (!Array.isArray(connectedAccounts)) return [];
    return connectedAccounts.filter(account => account.platform === platform);
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Connect Accounts
          </h1>
          <p className="text-gray-400 text-lg">
            Link your social media accounts to manage them from one place
          </p>
        </div>

        {/* Success/Status Notification */}
        {connectionSuccess && (
          <div className={`mb-6 rounded-lg p-4 backdrop-blur-sm animate-pulse ${
            connectionSuccess.includes('disconnected') 
              ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30'
              : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`text-xl ${
                  connectionSuccess.includes('disconnected') ? 'text-orange-400' : 'text-green-400'
                }`}>
                  {connectionSuccess.includes('disconnected') ? '🔓' : '✓'}
                </div>
                <p className={`font-medium ${
                  connectionSuccess.includes('disconnected') ? 'text-orange-400' : 'text-green-400'
                }`}>{connectionSuccess}</p>
              </div>
              {fetchingAccounts && (
                <div className="flex items-center space-x-2 text-current">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Platforms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socialPlatforms.map((platform) => {
            const platformConnectedAccounts = getConnectedAccounts(platform.platform);
            const isConnected = platformConnectedAccounts.length > 0;
            const isConnecting = connectingPlatform === platform.platform;

            return (
              <div 
                key={platform.platform} 
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all duration-300 hover:bg-gray-900/70"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="p-3 rounded-lg text-white"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {platform.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {platform.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isConnected 
                      ? 'bg-green-900/50 text-green-400 border border-green-800' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </div>
                </div>

                {/* Connected Account Info */}
                {isConnected && platformConnectedAccounts.length > 0 && (
                  <div className="mb-6">
                    {/* Sort accounts: personal first, then pages */}
                    {platformConnectedAccounts
                      .sort((a, b) => {
                        // Accounts without pageType first (personal accounts)
                        if (!a.accountData.pageType && b.accountData.pageType) return -1;
                        if (a.accountData.pageType && !b.accountData.pageType) return 1;
                        return 0;
                      })
                      .map((account, index) => {
                        const isPage = account.accountData.pageType === 'page';
                        const previousAccount = index > 0 ? platformConnectedAccounts[index - 1] : null;
                        const showAsChild = isPage && previousAccount && !previousAccount.accountData.pageType;

                        if (showAsChild) {
                          // Show as child page
                          return (
                            <div key={account._id} className="ml-8 mt-2">
                              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 relative">
                                {/* Connection line */}
                                <div className="absolute -left-8 top-1/2 w-6 h-px bg-gray-600"></div>
                                <div className="absolute -left-8 top-1/2 w-2 h-2 bg-gray-600 rounded-full transform -translate-y-1/2"></div>
                                
                                <div className="flex items-center space-x-3">
                                  {account.accountData.profilePicture && (
                                    <img 
                                      src={account.accountData.profilePicture} 
                                      alt="Page" 
                                      className="w-8 h-8 rounded-full object-cover border border-gray-600"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h5 className="font-medium text-white text-sm">
                                      {account.accountName}
                                    </h5>
                                    {account.accountData.followerCount !== undefined && (
                                      <p className="text-gray-400 text-xs mt-1">
                                        {account.accountData.followerCount.toLocaleString()} followers
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Show as main account
                          return (
                            <div key={account._id} className="mb-3">
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                                <div className="flex items-center space-x-3">
                                  {account.accountData.profilePicture && (
                                    <img 
                                      src={account.accountData.profilePicture} 
                                      alt="Profile" 
                                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-white">
                                      {account.accountName}
                                    </h4>
                                    {account.accountData.followerCount !== undefined && (
                                      <p className="text-gray-400 text-sm mt-1">
                                        {account.accountData.followerCount.toLocaleString()} followers
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                  </div>
                )}

                {/* Connect/Disconnect Button */}
                <button 
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    isConnecting
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : isConnected
                        ? 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-900/70'
                        : 'text-white hover:opacity-90'
                  }`}
                  style={{ 
                    backgroundColor: !isConnecting && !isConnected ? platform.color : undefined 
                  }}
                  onClick={() => isConnected ? handleDisconnectPlatform(platform.platform) : handleConnect(platform.platform)}
                  disabled={loading}
                >
                  {isConnecting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : isConnected ? (
                    `Disconnect ${platform.name}`
                  ) : (
                    `Connect ${platform.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Why Connect Your Accounts?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
              <div>
                <div className="text-blue-400 mb-1">📊</div>
                <p>Unified analytics and insights across all platforms</p>
              </div>
              <div>
                <div className="text-green-400 mb-1">⏰</div>
                <p>Schedule posts to multiple accounts simultaneously</p>
              </div>
              <div>
                <div className="text-purple-400 mb-1">🎯</div>
                <p>Streamlined content management and publishing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
