import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, UserPlusIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/api";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...signupData } = formData;
      
      console.log('Submitting signup data:', signupData);
      
      // Call the real API endpoint
      const response = await authService.register(signupData);
      
      console.log('Signup response:', response.data);
      
      if (response.data.requiresVerification) {
        // Show success toast
        toast({
          title: "Registration successful!",
          description: response.data.emailWarning 
            ? "Account created but verification email failed. Please contact support." 
            : "Please check your email for verification code",
        });
        
        // Navigate to email verification page
        navigate("/verify-email", { 
          state: { 
            userId: response.data.userId,
            email: response.data.email
          },
          replace: true 
        });
      } else {
        // Old flow (in case verification is disabled)
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        toast({
          title: "Registration successful!",
          description: "Your account has been created",
        });
        
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = "Registration failed. Please try again.";
      let toastDescription = errorMessage;
      
      if (err.response?.data) {
        const errorData = err.response.data;
        errorMessage = errorData.message || errorMessage;
        
        // Handle specific conflict types with actionable guidance
        switch (errorData.conflictType) {
          case 'google_account_exists':
            toastDescription = errorData.message + " Click 'Sign in with Google' below.";
            break;
          case 'email_account_exists':
            toastDescription = errorData.message + " Try signing in with your password instead.";
            break;
          case 'unverified_email_account':
            toastDescription = errorData.message + " Check your email for the verification code.";
            break;
          default:
            toastDescription = errorMessage;
        }
      } else if (err.response?.status === 400) {
        errorMessage = "Invalid data provided. Please check all fields.";
        toastDescription = errorMessage;
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
        toastDescription = errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
        toastDescription = errorMessage;
      }
      
      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: toastDescription,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component remains the same...
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="glass-card border-primary/10">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">
              Create an Account
            </CardTitle>
            <CardDescription className="text-center">
              Join <span className="text-gradient-primary font-semibold">SocialFuse</span> and manage all your social media in one place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-secondary/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-secondary/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10 bg-secondary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10 bg-secondary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlusIcon size={16} />
                    Sign Up
                  </span>
                )}
              </Button>
            </form>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <GoogleSignInButton type="signup" />
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;