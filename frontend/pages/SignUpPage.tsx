import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, User, Lock, Smartphone, Chrome, Github, Building, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import Logo3D from "../components/Logo3D";
import backend from "~backend/client";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, socialSignIn, phoneSignIn } = useAuth();
  const { toast } = useToast();

  // Email/Password Sign Up
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Phone Sign Up
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms of service and privacy policy.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password, firstName, lastName);
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      navigate("/verify-email");
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: string) => {
    try {
      // In a real implementation, this would redirect to the OAuth provider
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const authUrl = getOAuthUrl(provider, redirectUri);
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Social Sign Up Failed",
        description: error.message || "Failed to sign up with social provider.",
        variant: "destructive",
      });
    }
  };

  const handleSendPhoneCode = async () => {
    setIsPhoneLoading(true);
    try {
      await backend.auth.sendPhoneCode({ phone });
      setPhoneCodeSent(true);
      toast({
        title: "Code Sent",
        description: "Verification code sent to your phone.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Failed to send verification code.",
        variant: "destructive",
      });
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handlePhoneSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPhoneLoading(true);

    try {
      await phoneSignIn(phone, phoneCode);
      toast({
        title: "Account Created!",
        description: "You have been successfully signed up.",
      });
      navigate("/onboarding");
    } catch (error: any) {
      toast({
        title: "Phone Sign Up Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const getOAuthUrl = (provider: string, redirectUri: string): string => {
    const baseUrls = {
      google: "https://accounts.google.com/oauth2/authorize",
      github: "https://github.com/login/oauth/authorize",
      microsoft: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    };

    const clientIds = {
      google: "your-google-client-id",
      github: "your-github-client-id",
      microsoft: "your-microsoft-client-id",
    };

    const scopes = {
      google: "openid email profile",
      github: "user:email",
      microsoft: "openid email profile",
    };

    const params = new URLSearchParams({
      client_id: clientIds[provider as keyof typeof clientIds],
      redirect_uri: redirectUri,
      scope: scopes[provider as keyof typeof scopes],
      response_type: "code",
      state: Math.random().toString(36).substring(7),
    });

    return `${baseUrls[provider as keyof typeof baseUrls]}?${params.toString()}`;
  };

  const getPasswordStrength = (password: string): { strength: number; feedback: string[] } => {
    const feedback = [];
    let strength = 0;

    if (password.length >= 8) strength += 1;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(password)) strength += 1;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(password)) strength += 1;
    else feedback.push("One lowercase letter");

    if (/\d/.test(password)) strength += 1;
    else feedback.push("One number");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    else feedback.push("One special character");

    return { strength, feedback };
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Logo3D size="sm" animated={true} showText={false} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              SCRIBE AI
            </h1>
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="border-border bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" className="text-xs">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="text-xs">
                  <Smartphone className="w-4 h-4 mr-1" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="social" className="text-xs">
                  <Chrome className="w-4 h-4 mr-1" />
                  Social
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Sign Up */}
              <TabsContent value="email">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="bg-background border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      className="bg-background border-border"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        required
                        className="bg-background border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded ${
                                i < passwordStrength.strength
                                  ? passwordStrength.strength <= 2
                                    ? "bg-red-500"
                                    : passwordStrength.strength <= 3
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Missing: {passwordStrength.feedback.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        className="bg-background border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <Link to="/terms" className="text-emerald-600 hover:text-emerald-700">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !acceptTerms}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Sign Up */}
              <TabsContent value="phone">
                <form onSubmit={phoneCodeSent ? handlePhoneSignUp : handleSendPhoneCode} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                      disabled={phoneCodeSent}
                      className="bg-background border-border"
                    />
                  </div>

                  {phoneCodeSent && (
                    <div>
                      <Label htmlFor="phoneCode">Verification Code</Label>
                      <Input
                        id="phoneCode"
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isPhoneLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isPhoneLoading ? "Processing..." : phoneCodeSent ? "Create Account" : "Send Code"}
                  </Button>

                  {phoneCodeSent && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoneCodeSent(false);
                        setPhoneCode("");
                      }}
                      className="w-full"
                    >
                      Use Different Number
                    </Button>
                  )}
                </form>
              </TabsContent>

              {/* Social Sign Up */}
              <TabsContent value="social">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialSignUp("google")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>

                  <Button
                    onClick={() => handleSocialSignUp("github")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Continue with GitHub
                  </Button>

                  <Button
                    onClick={() => handleSocialSignUp("microsoft")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Continue with Microsoft
                  </Button>

                  <Button
                    onClick={() => handleSocialSignUp("apple")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Apple className="w-4 h-4 mr-2" />
                    Continue with Apple
                  </Button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    By continuing, you agree to our{" "}
                    <Link to="/terms" className="text-emerald-600 hover:text-emerald-700">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/sign-in" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
