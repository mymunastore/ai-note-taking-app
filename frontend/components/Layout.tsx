import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Mic, Settings, Moon, Sun, FolderOpen, User, Home, BarChart3, LogOut, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import Logo3D from "./Logo3D";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, isPremium, features } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard", premium: false },
    { path: "/record", icon: Mic, label: "Record", premium: false },
    { path: "/projects", icon: FolderOpen, label: "Projects", premium: false },
    { path: "/settings", icon: Settings, label: "Settings", premium: false },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Enhanced Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col shadow-lg">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3 mb-2">
            <Logo3D size="sm" animated={true} showText={false} />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                SCRIBE AI
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">AI Voice Intelligence</p>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50 dark:text-emerald-300 text-xs px-2 py-0.5">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                    {item.premium && isPremium && (
                      <Sparkles className="w-3 h-3 ml-auto text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Premium Features Section */}
          {isPremium && (
            <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Premium Features</span>
              </div>
              <div className="space-y-2 text-xs text-emerald-600 dark:text-emerald-400">
                {features.realTimeTranscription && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Real-time Transcription</span>
                  </div>
                )}
                {features.enhancedAnalytics && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Enhanced Analytics</span>
                  </div>
                )}
                {features.cloudSync && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Cloud Synchronization</span>
                  </div>
                )}
                {features.unlimitedRecordings && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                    <span>Unlimited Recordings</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 mr-3" />
            ) : (
              <Sun className="w-4 h-4 mr-3" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>

          {/* Enhanced User Info */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 text-emerald-700 dark:text-emerald-300">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {user?.firstName} {user?.lastName}
                      </p>
                      {isPremium && (
                        <Crown className="w-3 h-3 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user?.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              {isPremium && (
                <DropdownMenuItem asChild>
                  <Link to="/pricing" className="flex items-center">
                    <Crown className="w-4 h-4 mr-2" />
                    Premium Features
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
