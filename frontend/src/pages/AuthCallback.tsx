import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const userParam = urlParams.get('user');
        const error = urlParams.get('error');

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
  }, [location, navigate, login, toast]);

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
