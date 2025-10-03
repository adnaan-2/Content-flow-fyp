import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, ArrowLeftIcon, SendIcon, ShieldCheckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email'); // Track current step

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting forgot password for:', email);
      
      const response = await authService.forgotPassword({ email });
      
      console.log('Forgot password response:', response.data);
      
      if (response.data.requiresVerification) {
        toast({
          title: "Verification code sent!",
          description: "Please check your email for the 6-digit verification code.",
        });
        
        setStep('code'); // Move to code verification step
      } else {
        toast({
          title: "Email sent!",
          description: response.data.message,
        });
      }
      
    } catch (err: any) {
      console.error('Forgot password error:', err);
      
      let errorMessage = "Failed to send verification code. Please try again.";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Verifying reset code for:', email);
      
      const response = await authService.verifyResetCode({ 
        email, 
        verificationCode 
      });
      
      console.log('Code verification response:', response.data);
      
      toast({
        title: "Code verified!",
        description: "Redirecting to password reset page...",
      });
      
      // Navigate to reset password page with token
      navigate(`/reset-password?token=${response.data.resetToken}`, { replace: true });
      
    } catch (err: any) {
      console.error('Code verification error:', err);
      
      let errorMessage = "Invalid or expired verification code";
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword({ email });
      toast({
        title: "Code resent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Email input step
  if (step === 'email') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border border-gray-700 bg-gray-800/90 backdrop-blur-lg shadow-2xl">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                <MailIcon className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-gray-300">
                Don't worry! Enter your email address and we'll send you a verification code to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="Enter your email address"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-gray-600 bg-gray-700/70 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <SendIcon className="h-4 w-4" />
                      Send Verification Code
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-center justify-center w-full">
                <div className="border-t border-gray-600 flex-grow"></div>
                <span className="px-3 text-gray-400 text-sm">or</span>
                <div className="border-t border-gray-600 flex-grow"></div>
              </div>
              <Link to="/login" className="w-full">
                <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300 hover:bg-gray-700/50">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // Verification code input step
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border border-gray-700 bg-gray-800/90 backdrop-blur-lg shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Enter Verification Code
            </CardTitle>
            <CardDescription className="text-gray-300">
              We've sent a 6-digit verification code to <strong className="text-white">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-gray-200 font-medium">
                  Verification Code
                </Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  placeholder="Enter 6-digit code"
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="border-gray-600 bg-gray-700/70 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400 text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-400 text-center">
                  Code expires in 10 minutes
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheckIcon className="h-4 w-4" />
                    Verify Code
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center justify-center w-full">
              <div className="border-t border-gray-600 flex-grow"></div>
              <span className="px-3 text-gray-400 text-sm">Need help?</span>
              <div className="border-t border-gray-600 flex-grow"></div>
            </div>
            <div className="flex flex-col space-y-2 w-full">
              <Button 
                onClick={handleResendCode}
                variant="outline" 
                className="w-full border-gray-600 bg-gray-700/50 text-gray-200 hover:bg-gray-600/50 hover:text-white"
                disabled={loading}
              >
                Resend Code
              </Button>
              <Button 
                onClick={() => setStep('email')}
                variant="ghost" 
                className="w-full text-purple-400 hover:text-purple-300 hover:bg-gray-700/50"
              >
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Change Email
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;