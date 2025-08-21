import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Smartphone, Building, Github, Chrome, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";
import Logo3D from "../components/Logo3D";
import backend from "~backend/client";

export default function SignInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, socialSignIn, phoneSignIn, ssoSignIn } = useAuth();
  const { toast } = useToast();

  // Email/Password Sign In
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Phone Sign In
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);

  // SSO Sign In
  const [ssoDomain, setSsoDomain] = useState("");
  const [isSsoLoading, setIsSsoLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/";

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email, password, twoFactorCode || undefined);
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
      navigate(redirectUrl);
    } catch (error: any) {
      if (error.message?.includes("Two-factor")) {
        setShowTwoFactor(true);
        toast({
          title: "Two-Factor Authentication Required",
          description: "Please enter your 2FA code to continue.",
        });
      } else {
        toast({
          title: "Sign In Failed",
          description: error.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
    try {
      // In a real implementation, this would redirect to the OAuth provider
      const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
      const authUrl = getOAuthUrl(provider, redirectUri);
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Social Sign In Failed",
        description: error.message || "Failed to sign in with social provider.",
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

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPhoneLoading(true);

    try {
      await phoneSignIn(phone, phoneCode);
      toast({
        title: "Welcome!",
        description: "You have been successfully signed in.",
      });
      navigate(redirectUrl);
    } catch (error: any) {
      toast({
        title: "Phone Sign In Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleSsoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSsoLoading(true);

    try {
      // In a real implementation, this would redirect to the SSO provider
      const ssoUrl = `https://sso.${ssoDomain}/auth?redirect_uri=${encodeURIComponent(window.location.origin)}/auth/sso/callback`;
      window.location.href = ssoUrl;
    } catch (error: any) {
      toast({
        title: "SSO Sign In Failed",
        description: error.message || "Failed to sign in with SSO.",
        variant: "destructive",
      });
    } finally {
      setIsSsoLoading(false);
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
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="border-border bg-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
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
                <TabsTrigger value="sso" className="text-xs">
                  <Building className="w-4 h-4 mr-1" />
                  SSO
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Sign In */}
              <TabsContent value="email">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
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
                        placeholder="Enter your password"
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
                  </div>

                  {showTwoFactor && (
                    <div>
                      <Label htmlFor="twoFactorCode">Two-Factor Code</Label>
                      <Input
                        id="twoFactorCode"
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="bg-background border-border"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Sign In */}
              <TabsContent value="phone">
                <form onSubmit={phoneCodeSent ? handlePhoneSignIn : handleSendPhoneCode} className="space-y-4">
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
                    {isPhoneLoading ? "Processing..." : phoneCodeSent ? "Sign In" : "Send Code"}
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

              {/* Social Sign In */}
              <TabsContent value="social">
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialSignIn("google")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>

                  <Button
                    onClick={() => handleSocialSignIn("github")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Github className="w-4 h-4 mr-2" />
                    Continue with GitHub
                  </Button>

                  <Button
                    onClick={() => handleSocialSignIn("microsoft")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Continue with Microsoft
                  </Button>

                  <Button
                    onClick={() => handleSocialSignIn("apple")}
                    variant="outline"
                    className="w-full border-border hover:bg-accent"
                  >
                    <Apple className="w-4 h-4 mr-2" />
                    Continue with Apple
                  </Button>
                </div>
              </TabsContent>

              {/* SSO Sign In */}
              <TabsContent value="sso">
                <form onSubmit={handleSsoSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="ssoDomain">Company Domain</Label>
                    <Input
                      id="ssoDomain"
                      type="text"
                      value={ssoDomain}
                      onChange={(e) => setSsoDomain(e.target.value)}
                      placeholder="company.com"
                      required
                      className="bg-background border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter your company domain to sign in with SSO
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSsoLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  >
                    {isSsoLoading ? "Redirecting..." : "Continue with SSO"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Sign up for free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
