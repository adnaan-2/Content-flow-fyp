import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');
  const hasProcessed = useRef(false);

  const processSocialMediaCallback = async (platform: string, params: {
    code?: string | null;
    state?: string | null;
    oauth_token?: string | null;
    oauth_verifier?: string | null;
  }) => {
    try {
      console.log(`🔄 Starting social media callback for ${platform}`);
      
      setStatus('processing');
      setMessage(`Connecting your ${platform} account...`);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      let requestBody;
      if (params.code && params.state) {
        // OAuth 2.0 flow (LinkedIn)
        requestBody = { code: params.code, state: params.state };
      } else if (params.oauth_token && params.oauth_verifier) {
        // OAuth 1.0a flow (X/Twitter)
        requestBody = { oauth_token: params.oauth_token, oauth_verifier: params.oauth_verifier };
      } else {
        throw new Error('Invalid OAuth parameters');
      }

      const response = await fetch(`http://localhost:5000/api/social-media/auth/${platform}/callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(`${platform} account connected successfully!`);
        
        toast({
          title: "Account Connected",
          description: `Your ${platform} account has been successfully connected.`,
        });

        // Send success message to parent window
        if (window.opener) {
          console.log('🔄 Sending success message to parent window');
          
          // Show success message in popup
          setStatus('success');
          setMessage('✅ Account connected successfully!');
          
          // Send message to parent window immediately
          window.opener.postMessage({
            type: 'AUTH_SUCCESS',
            platform: platform,
            message: 'Successfully connected your account!',
            account: data.account,
            accounts: data.accounts
          }, window.location.origin);
          
          // Parent window will close this popup, but add fallback
          setTimeout(() => {
            if (!window.closed) {
              console.log('🔄 Fallback: popup still open, attempting self-close');
              try {
                window.close();
              } catch (e) {
                setMessage('✅ Account connected! You can close this window.');
              }
            }
          }, 2000);
          
          return;
        }
        
        // Otherwise redirect to link accounts page (not dashboard)
        setTimeout(() => {
          navigate('/dashboard/link-accounts', { replace: true });
        }, 2000);
      } else {
        throw new Error(data.message || 'Social media connection failed');
      }
    } catch (error: any) {
      console.error('Social media callback error:', error);
      setStatus('error');
      setMessage(`Failed to connect ${platform} account: ${error.message}`);
      
      toast({
        title: "Connection Failed",
        description: `Failed to connect your ${platform} account. Please try again.`,
        variant: "destructive",
      });

      // Close popup window with error if this is a popup
      if (window.opener) {
        console.log('🔄 Sending error message to parent window');
        
        // Show error message in popup
        setStatus('error');
        setMessage(`❌ Connection failed: ${error.message}`);
        
        // Send error message to parent window immediately
        window.opener.postMessage({ 
          type: 'AUTH_ERROR', 
          platform, 
          error: error.message
        }, '*');
        
        // Parent window will close this popup, but add fallback
        setTimeout(() => {
          if (!window.closed) {
            console.log('🔄 Fallback: popup still open, attempting self-close');
            try {
              window.close();
            } catch (e) {
              setMessage('❌ Connection failed. You can close this window.');
            }
          }
        }, 2000);
        
        return;
      }

      // Otherwise redirect back to link accounts page
      setTimeout(() => {
        navigate('/dashboard/link-accounts', { replace: true });
      }, 3000);
    }
  };

  useEffect(() => {
    const processCallback = async () => {
      // Prevent duplicate processing
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');
        const error = urlParams.get('error');
        const platform = urlParams.get('platform');
        
        // Check if this is a social media authentication callback
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const oauth_token = urlParams.get('oauth_token');
        const oauth_verifier = urlParams.get('oauth_verifier');
        
        console.log('🔄 Checking for social media callback', { platform, code: !!code, state: !!state });
        console.log('🔄 Current URL:', window.location.href);
        
        if (platform && ((code && state) || (oauth_token && oauth_verifier))) {
          console.log('🔄 Processing social media callback for:', platform);
          await processSocialMediaCallback(platform, { code, state, oauth_token, oauth_verifier });
          return;
        }

        if (error) {
          setStatus('error');
          let errorMessage = 'Authentication failed';
          
          switch(error) {
            case 'authentication_failed':
              errorMessage = 'Google authentication failed. Please try again.';
              break;
            case 'google_auth_failed':
              errorMessage = 'Google authentication was cancelled or failed.';
              break;
            case 'server_error':
              errorMessage = 'Server error during authentication. Please try again.';
              break;
            case 'account_conflict':
              errorMessage = 'This email is already registered with a different method. Please sign in with your email and password instead.';
              break;
            default:
              errorMessage = `Authentication failed: ${error}`;
          }
          
          setMessage(errorMessage);
          
          toast({
            title: "Authentication Failed",
            description: errorMessage,
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        if (!token || !userParam) {
          setStatus('error');
          setMessage('Missing authentication data');
          
          toast({
            title: "Authentication Error",
            description: "Missing authentication data. Please try again.",
            variant: "destructive",
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        const userData = JSON.parse(decodeURIComponent(userParam));
        
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');
        
        login(token, userData);
        
        toast({
          title: "Welcome!",
          description: `Successfully signed in with Google as ${userData.name}`,
        });
        
        navigate('/dashboard', { replace: true });
        
      } catch (error) {
        console.error('AuthCallback processing error:', error);
        hasProcessed.current = false; // Reset flag on error to allow retry
        setStatus('error');
        setMessage('Failed to process authentication. Please try again.');
        
        toast({
          title: "Authentication Error",
          description: "Failed to process authentication. Please try again.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    processCallback();
  }, []); // Empty dependency array to prevent duplicate calls

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="border border-gray-700 bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-lg p-8 text-center">
          <div className="space-y-4">
            {status === 'processing' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                </div>
                <h2 className="text-xl font-bold text-white">Processing...</h2>
                <p className="text-gray-300">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-green-400">Success!</h2>
                <p className="text-gray-300">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-red-400">Authentication Failed</h2>
                <p className="text-gray-300">{message}</p>
                <p className="text-sm text-gray-400">Redirecting to login page...</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
