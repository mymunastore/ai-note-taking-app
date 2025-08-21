import React from "react";
import { Filter, Calendar, Clock, Languages, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";

interface SearchFiltersProps {
  filters: {
    dateFrom?: Date;
    dateTo?: Date;
    minDuration?: number;
    maxDuration?: number;
    language?: string;
    tags?: string[];
  };
  onFiltersChange: (filters: any) => void;
  availableTags: string[];
  availableLanguages: string[];
}

export default function SearchFilters({ 
  filters, 
  onFiltersChange, 
  availableTags = [], 
  availableLanguages = [] 
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [durationRange, setDurationRange] = React.useState([
    filters.minDuration || 0, 
    filters.maxDuration || 3600
  ]);

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addTag = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      updateFilter('tags', [...currentTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = filters.tags || [];
    updateFilter('tags', currentTags.filter(t => t !== tag));
  };

  const clearFilters = () => {
    onFiltersChange({});
    setDurationRange([0, 3600]);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof typeof filters];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="hover:border-emerald-500">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                  Active
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Search Filters
                  </span>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left">
                          <Calendar className="w-4 h-4 mr-2" />
                          {filters.dateFrom ? filters.dateFrom.toLocaleDateString() : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => updateFilter('dateFrom', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="justify-start text-left">
                          <Calendar className="w-4 h-4 mr-2" />
                          {filters.dateTo ? filters.dateTo.toLocaleDateString() : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => updateFilter('dateTo', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Duration Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration Range</Label>
                  <div className="px-2">
                    <Slider
                      value={durationRange}
                      onValueChange={(value) => {
                        setDurationRange(value);
                        updateFilter('minDuration', value[0]);
                        updateFilter('maxDuration', value[1]);
                      }}
                      max={3600}
                      min={0}
                      step={60}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatDuration(durationRange[0])}</span>
                      <span>{formatDuration(durationRange[1])}</span>
                    </div>
                  </div>
                </div>

                {/* Language Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Language</Label>
                  <Select value={filters.language || ""} onValueChange={(value) => updateFilter('language', value || undefined)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any language</SelectItem>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            {lang}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <Select onValueChange={addTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add tag filter" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags
                        .filter(tag => !filters.tags?.includes(tag))
                        .map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {tag}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {filters.tags && filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.dateFrom && (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
              From: {filters.dateFrom.toLocaleDateString()}
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
              To: {filters.dateTo.toLocaleDateString()}
            </Badge>
          )}
          {filters.language && (
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
              Language: {filters.language}
            </Badge>
          )}
          {(filters.minDuration || filters.maxDuration) && (
            <Badge variant="outline" className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300">
              Duration: {formatDuration(filters.minDuration || 0)} - {formatDuration(filters.maxDuration || 3600)}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
