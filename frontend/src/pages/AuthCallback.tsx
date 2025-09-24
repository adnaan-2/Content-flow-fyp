import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const location = useLocation();
  const navigate = useNavigate();

  // Debug: Log the full URL when component mounts
  console.log('AuthCallback mounted with URL:', window.location.href);
  console.log('Location search:', location.search);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        console.log('Auth callback params:', { code: !!code, state, error, fullURL: location.search });

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/dashboard/link-accounts'), 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setTimeout(() => navigate('/dashboard/link-accounts'), 3000);
          return;
        }

        // Determine platform from URL params, session storage, or default
        const platformFromUrl = urlParams.get('platform');
        const platform = platformFromUrl || sessionStorage.getItem('connecting_platform') || 'facebook';
        console.log('Using platform:', platform, 'from URL:', platformFromUrl);
        
        const response = await fetch(`/api/social-media/auth/${platform}/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ code, state })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Account connected successfully!');
          
          // Send success message to parent window
          console.log('Sending success message to parent window', { hasOpener: !!window.opener });
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_AUTH_SUCCESS',
              platform: platform,
              data: data
            }, window.location.origin);
          }
          
          setTimeout(() => {
            // Try to send message one more time before closing
            if (window.opener) {
              window.opener.postMessage({
                type: 'SOCIAL_AUTH_SUCCESS',
                platform: platform,
                data: data
              }, window.location.origin);
            }
            
            window.close(); // Close popup
            // Or navigate if not in popup
            if (!window.opener) {
              navigate('/dashboard/link-accounts');
            }
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Authentication failed');
          
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'SOCIAL_AUTH_ERROR',
              error: data.error || 'Authentication failed'
            }, window.location.origin);
          }
          
          setTimeout(() => {
            if (window.opener) {
              window.close();
            } else {
              navigate('/dashboard/link-accounts');
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setTimeout(() => navigate('/dashboard/link-accounts'), 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center max-w-md w-full mx-4">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-4">Connecting Account</h2>
            <p className="text-gray-300">{message}</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-6">✓</div>
            <h2 className="text-2xl font-bold text-white mb-4">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting you back...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-6">✗</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400 mt-4">Redirecting you back...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;