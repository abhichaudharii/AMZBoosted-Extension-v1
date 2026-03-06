import React from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SavedViewsManager } from "@/components/saved-views/SavedViewsManager";

interface ActivityFiltersProps {
  pageState: {
    searchQuery: string;
    statusFilter: string;
    toolFilter: string;
    marketplaceFilter: string;
    creditsFilter: string;
    itemsPerPage: number;
    page: number;
  };
  updatePageState: (newState: Partial<ActivityFiltersProps["pageState"]>) => void;
  uniqueTools: { id: string; name: string }[];
  uniqueMarketplaces: string[];
  currentFilters: Record<string, any>;
  onLoadView: (filters: Record<string, any>) => void;
}

export const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  pageState,
  updatePageState,
  uniqueTools,
  uniqueMarketplaces,
  currentFilters,
  onLoadView,
}) => {
  const handleClearFilters = () => {
    updatePageState({
      toolFilter: "all",
      statusFilter: "all",
      marketplaceFilter: "all",
      creditsFilter: "all",
      searchQuery: "",
      itemsPerPage: 10,
      page: 1,
    });
  };

  const hasActiveFilters = pageState.searchQuery || pageState.statusFilter !== 'all' || pageState.toolFilter !== 'all' || pageState.creditsFilter !== 'all';

  return (
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 p-4 mb-4">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by tool or marketplace..."
              value={pageState.searchQuery}
              onChange={(e) => updatePageState({ searchQuery: e.target.value })}
              className="pl-9 bg-[#0A0A0B] border-white/10 text-white focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]/50 h-10"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Status</label>
            <Select
              value={pageState.statusFilter}
              onValueChange={(value) => updatePageState({ statusFilter: value })}
            >
              <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 h-9 focus:ring-[#FF6B00]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tool Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Tool</label>
            <Select
              value={pageState.toolFilter}
              onValueChange={(value) => updatePageState({ toolFilter: value })}
            >
              <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 h-9 focus:ring-[#FF6B00]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300 max-h-[200px]">
                <SelectItem value="all">All Tools</SelectItem>
                {uniqueTools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Marketplace Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Marketplace</label>
            <Select
              value={pageState.marketplaceFilter}
              onValueChange={(value) =>
                updatePageState({ marketplaceFilter: value })
              }
            >
              <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 h-9 focus:ring-[#FF6B00]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300 max-h-[200px]">
                <SelectItem value="all">All Markets</SelectItem>
                {uniqueMarketplaces.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credits Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">Credits Used</label>
            <Select
              value={pageState.creditsFilter}
              onValueChange={(value) => updatePageState({ creditsFilter: value })}
            >
              <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 h-9 focus:ring-[#FF6B00]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="0">0 Credits</SelectItem>
                <SelectItem value="1-10">1-10 Credits</SelectItem>
                <SelectItem value="10+">10+ Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
           <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            className={hasActiveFilters ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2" : "text-gray-600 cursor-not-allowed gap-2"}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear Filters
          </Button>

          <SavedViewsManager
            page="tasks"
            currentFilters={currentFilters}
            onLoadView={onLoadView}
          />
        </div>
    </div>
  );
};
