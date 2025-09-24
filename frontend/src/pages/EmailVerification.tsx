import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MailIcon, RefreshCwIcon, CheckCircleIcon, AlertCircleIcon, ArrowRightIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get user data from navigation state or localStorage
  const signupData = location.state;
  
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  // If no signup data, redirect to signup
  useEffect(() => {
    if (!signupData?.userId || !signupData?.email) {
      navigate("/signup", { replace: true });
    }
  }, [signupData, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: signupData.userId,
          verificationCode: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Show success animation
        setVerificationSuccess(true);
        
        toast({
          title: "Email verified successfully!",
          description: "Your account is now active",
        });
        
        // Start countdown for redirect
        setRedirectCountdown(3);
        const interval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              navigate("/dashboard", { replace: true });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(data.message || "Verification failed");
        toast({
          title: "Verification failed",
          description: data.message || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const errorMessage = "Network error. Please try again.";
      setError(errorMessage);
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
    setResendLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: signupData.userId
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Verification code sent!",
          description: "Check your email for the new code",
        });
        setCountdown(60); // 60 second cooldown
        setVerificationCode(""); // Clear input
      } else {
        toast({
          title: "Failed to resend code",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Network error",
        description: "Failed to resend code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (!signupData?.userId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass-card border-primary/10">
          {verificationSuccess ? (
            // Success state
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircleIcon className="h-12 w-12 text-green-600 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-600 mb-4">
                Email Verified Successfully!
              </CardTitle>
              <CardDescription className="text-base mb-6">
                Your account is now active. You'll be redirected to the dashboard in:
              </CardDescription>
              <div className="flex items-center justify-center space-x-2 text-lg font-semibold">
                <ArrowRightIcon className="h-5 w-5 text-primary animate-bounce" />
                <span>{redirectCountdown} seconds</span>
              </div>
            </div>
          ) : (
            // Verification form
            <>
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <MailIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  Verify Your Email
                </CardTitle>
                <CardDescription>
                  We've sent a 6-digit verification code to
                  <br />
                  <span className="font-semibold text-foreground">{signupData.email}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      name="verificationCode"
                      placeholder="123456"
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '');
                        setVerificationCode(value);
                        // Clear error when user starts typing
                        if (error) setError("");
                      }}
                      className="bg-secondary/50 text-center text-xl font-mono tracking-widest"
                      required
                    />
                  </div>
                  
                  {error && (
                    <div className="flex items-center space-x-2 rounded-md bg-destructive/10 p-3 text-sm">
                      <AlertCircleIcon className="h-4 w-4 text-destructive flex-shrink-0" />
                      <span className="text-destructive">{error}</span>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? (
                      <>
                        <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="mr-2 h-4 w-4" />
                        Verify Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  Didn't receive the code?
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={resendLoading || countdown > 0}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      <MailIcon className="mr-2 h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate("/signup")}
                  className="w-full text-sm"
                >
                  Back to Signup
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;