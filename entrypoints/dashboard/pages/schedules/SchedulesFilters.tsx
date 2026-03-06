import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SchedulesFiltersProps {
    pageState: any;
    updatePageState: (newState: any) => void;
    tools: any[];
    marketplaces: string[];
    onClearFilters: () => void;
    onLoadView: (view: any) => void;
}

export const SchedulesFilters: React.FC<SchedulesFiltersProps> = ({
    pageState,
    updatePageState,
    tools,
    marketplaces,
    onClearFilters,
}) => {
    const hasActiveFilters = pageState.searchQuery || pageState.toolFilter !== 'all' || pageState.statusFilter !== 'all' || pageState.marketplaceFilter !== 'all';

    return (
        <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                 {/* Search */}
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input 
                        placeholder="Search schedules..." 
                        value={pageState.searchQuery || ''}
                        onChange={(e) => updatePageState({ searchQuery: e.target.value })}
                        className="pl-9 bg-[#0A0A0B] border-white/10 text-white focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]/50"
                    />
                </div>

                 {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
                    <Select value={pageState.toolFilter} onValueChange={(val) => updatePageState({ toolFilter: val })}>
                        <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[130px]">
                            <SelectValue placeholder="Tool" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                            <SelectItem value="all">All Tools</SelectItem>
                            {tools.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={pageState.statusFilter} onValueChange={(val) => updatePageState({ statusFilter: val })}>
                        <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[110px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={pageState.marketplaceFilter} onValueChange={(val) => updatePageState({ marketplaceFilter: val })}>
                        <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[140px]">
                            <SelectValue placeholder="Marketplace" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                            <SelectItem value="all">All Markets</SelectItem>
                            {marketplaces.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={onClearFilters}
                            className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10 shrink-0"
                            title="Clear Filters"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
