import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const platform = urlParams.get('platform');
        const error = urlParams.get('error');
        const oauth_token = urlParams.get('oauth_token');
        const oauth_verifier = urlParams.get('oauth_verifier');

        console.log('AuthCallback - Platform:', platform, 'Code:', code?.substring(0, 20) + '...', 'OAuth Token:', oauth_token?.substring(0, 20) + '...');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              platform, 
              error: error 
            }, window.location.origin);
          }
          return;
        }

        // Check for OAuth 2.0 or OAuth 1.0a parameters
        const hasOAuth2 = code && platform;
        const hasOAuth1 = oauth_token && oauth_verifier && platform;

        if (!hasOAuth2 && !hasOAuth1) {
          setStatus('error');
          setMessage('Missing authorization code or platform information');
          return;
        }

        setMessage(`Connecting your ${platform} account...`);

        // Prepare request body based on OAuth version
        const requestBody = hasOAuth1 
          ? { oauth_token, oauth_verifier }
          : { code };

        // Send parameters to backend for token exchange
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/social-media/auth/${platform}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setStatus('success');
          setMessage(`${platform} account connected successfully!`);
          
          // Try multiple methods to communicate success
          try {
            // Method 1: postMessage (may fail due to CORS)
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'AUTH_SUCCESS', 
                platform,
                message: result.message,
                account: result.account
              }, window.location.origin);
            }
          } catch (e) {

          }
          
          // Method 2: localStorage communication as fallback
          const authResult = {
            type: 'AUTH_SUCCESS',
            platform,
            message: result.message,
            account: result.account,
            timestamp: Date.now()
          };
          
          localStorage.setItem('auth_result', JSON.stringify(authResult));
          
          // Close popup after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);

        } else {
          setStatus('error');
          setMessage(result.error || `Failed to connect ${platform} account`);
          
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'AUTH_ERROR', 
              platform, 
              error: result.error || 'Connection failed' 
            }, window.location.origin);
          }
        }

      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
        
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'AUTH_ERROR', 
            platform: 'unknown', 
            error: 'Unexpected error occurred' 
          }, window.location.origin);
        }
      }
    };

    processCallback();
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-gray-700/50">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Connecting Account</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="rounded-full h-12 w-12 bg-green-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-400 mb-2">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-gray-500 text-sm mt-2">This window will close automatically...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="rounded-full h-12 w-12 bg-red-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-400 mb-2">Connection Failed</h2>
            <p className="text-gray-300">{message}</p>
            <button 
              onClick={() => window.close()} 
              className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}