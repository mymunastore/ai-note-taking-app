import React, { useState, useEffect } from "react";
import { Camera, Save, User, Mail, Phone, MapPin, Calendar, Bell, Palette, Shield, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth, useBackend } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const { user, isLoaded } = useAuth();
  const backend = useBackend();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    avatar: "",
  });

  useEffect(() => {
    if (isLoaded && user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatar: user.imageUrl || "",
      });
    }
  }, [isLoaded, user]);

  const [notifications, setNotifications] = useState({
    transcriptionComplete: true,
    summaryReady: true,
    weeklyDigest: false,
    productUpdates: true,
    securityAlerts: true
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "America/Los_Angeles",
    dateFormat: "MM/DD/YYYY",
    autoSave: true,
    defaultProjectPrivacy: "private"
  });

  const handleProfileUpdate = async () => {
    try {
      await backend.auth.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload this file to a service and then update the user's profile URL
      // For this demo, we'll just show a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
      toast({
        title: "Avatar Updated",
        description: "Your new avatar is ready. Click 'Save Changes' to apply.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 text-emerald-700 dark:text-emerald-300 text-lg">
                        {getInitials(`${profile.firstName} ${profile.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{profile.firstName} {profile.lastName}</h3>
                    <p className="text-muted-foreground">{profile.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <Button onClick={handleProfileUpdate} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Language</Label>
                    <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Timezone</Label>
                    <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                        <SelectItem value="Europe/Paris">CET</SelectItem>
                        <SelectItem value="Asia/Tokyo">JST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Auto-save recordings</Label>
                    <p className="text-sm text-muted-foreground">Automatically save recordings after processing</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoSave: checked }))}
                  />
                </div>

                <div>
                  <Label className="text-foreground">Default Project Privacy</Label>
                  <Select value={preferences.defaultProjectPrivacy} onValueChange={(value: any) => setPreferences(prev => ({ ...prev, defaultProjectPrivacy: value }))}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Theme Settings */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle dark/light theme</p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={toggleTheme}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Transcription Complete</Label>
                    <p className="text-sm text-muted-foreground">When transcription is ready</p>
                  </div>
                  <Switch
                    checked={notifications.transcriptionComplete}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, transcriptionComplete: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Summary Ready</Label>
                    <p className="text-sm text-muted-foreground">When AI summary is generated</p>
                  </div>
                  <Switch
                    checked={notifications.summaryReady}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, summaryReady: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">Weekly activity summary</p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Product Updates</Label>
                    <p className="text-sm text-muted-foreground">New features and updates</p>
                  </div>
                  <Switch
                    checked={notifications.productUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, productUpdates: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important security notifications</p>
                  </div>
                  <Switch
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, securityAlerts: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
