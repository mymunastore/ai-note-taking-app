import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, Search, MoreVertical, Users, Lock, Globe, Calendar, FileText, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  privacy: "private" | "team" | "public";
  recordingsCount: number;
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  color: string;
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    privacy: "private" as const,
    color: "#10b981"
  });

  const [projects] = useState<Project[]>([
    {
      id: "1",
      name: "Team Meetings",
      description: "Weekly team standup meetings and project discussions",
      privacy: "team",
      recordingsCount: 12,
      totalDuration: 480,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      color: "#10b981"
    },
    {
      id: "2", 
      name: "Client Calls",
      description: "Important client meetings and sales calls",
      privacy: "private",
      recordingsCount: 8,
      totalDuration: 320,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-18"),
      color: "#3b82f6"
    },
    {
      id: "3",
      name: "Product Research",
      description: "User interviews and market research sessions",
      privacy: "team",
      recordingsCount: 15,
      totalDuration: 600,
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-19"),
      color: "#8b5cf6"
    }
  ]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!newProject.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would make an API call
    toast({
      title: "Project Created",
      description: `"${newProject.name}" has been created successfully.`
    });

    setNewProject({
      name: "",
      description: "",
      privacy: "private",
      color: "#10b981"
    });
    setIsCreateDialogOpen(false);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case "private":
        return <Lock className="w-4 h-4" />;
      case "team":
        return <Users className="w-4 h-4" />;
      case "public":
        return <Globe className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case "private":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "team":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "public":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-emerald-600" />
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize your recordings into projects for better management
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your project"
                    rows={3}
                    className="bg-background border-border resize-none"
                  />
                </div>
                <div>
                  <Label>Privacy</Label>
                  <Select value={newProject.privacy} onValueChange={(value: any) => setNewProject(prev => ({ ...prev, privacy: value }))}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private - Only you can access</SelectItem>
                      <SelectItem value="team">Team - Team members can access</SelectItem>
                      <SelectItem value="public">Public - Anyone can view</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No projects found" : "No projects yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create your first project to organize your recordings"}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="border-border bg-card hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-foreground group-hover:text-emerald-600 transition-colors">
                          <Link to={`/projects/${project.id}`}>
                            {project.name}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`text-xs ${getPrivacyColor(project.privacy)}`}>
                            <span className="flex items-center gap-1">
                              {getPrivacyIcon(project.privacy)}
                              {project.privacy}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem>Share Project</DropdownMenuItem>
                        <DropdownMenuItem>Export Data</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Project</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mic className="w-4 h-4" />
                        <span>{project.recordingsCount} recordings</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDuration(project.totalDuration)}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Updated {project.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
