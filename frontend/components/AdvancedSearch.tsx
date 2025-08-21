import React, { useState } from "react";
import { Search, Filter, Calendar, Clock, Languages, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface SearchFilters {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  minDuration?: number;
  maxDuration?: number;
  language?: string;
  tags?: string[];
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  availableTags: string[];
  isLoading?: boolean;
}

export default function AdvancedSearch({ onSearch, availableTags, isLoading }: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ru", name: "Russian" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
  ];

  const handleSearch = () => {
    const searchFilters = { ...filters, query };
    onSearch(query, searchFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const addTag = (tag: string) => {
    if (!filters.tags?.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }));
  };

  const clearFilters = () => {
    setFilters({ query: "" });
    setQuery("");
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.minDuration || 
                          filters.maxDuration || filters.language || (filters.tags && filters.tags.length > 0);

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search notes, transcripts, and summaries..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 bg-background border-border focus:border-emerald-500 focus:ring-emerald-500/20"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`border-border ${hasActiveFilters ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : ""}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length - 1}
            </Badge>
          )}
        </Button>

        <Button 
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          Search
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-foreground">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date From
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date To
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Duration Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Min Duration (seconds)
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minDuration || ""}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minDuration: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="bg-background border-border"
                />
              </div>

              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Max Duration (seconds)
                </Label>
                <Input
                  type="number"
                  placeholder="3600"
                  value={filters.maxDuration || ""}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    maxDuration: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="bg-background border-border"
                />
              </div>
            </div>

            {/* Language Filter */}
            <div>
              <Label className="text-foreground flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Original Language
              </Label>
              <Select 
                value={filters.language || ""} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  language: value || undefined 
                }))}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Any language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any language</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <div>
              <Label className="text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              
              {/* Selected Tags */}
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
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

              {/* Available Tags */}
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter(tag => !filters.tags?.includes(tag))
                    .slice(0, 10)
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                        onClick={() => addTag(tag)}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
