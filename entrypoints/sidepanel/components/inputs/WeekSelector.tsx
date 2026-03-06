import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface WeekSelectorProps {
  selectedWeeks: string[];
  onChange: (weeks: string[]) => void;
  options?: { label: string; value: string }[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({
  selectedWeeks,
  onChange,
  options,
  onRefresh,
  isRefreshing = false,
}) => {
  // Generate weeks for the current year (latest first) if no options provided
  const weeks = useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }
    return [];
  }, [options]);

  const [isOpen, setIsOpen] = React.useState(false);

  const toggleWeek = (weekValue: string) => {
    if (selectedWeeks.includes(weekValue)) {
      onChange(selectedWeeks.filter((w) => w !== weekValue));
    } else {
      onChange([...selectedWeeks, weekValue]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const getLabel = (value: string) => {
    const option = weeks.find(w => w.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
                <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <Label className="text-sm font-medium">Select Weeks</Label>
            {onRefresh && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="h-6 w-6 ml-1 text-muted-foreground hover:text-primary"
                    title="Refresh Weeks"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            )}
        </div>
        {selectedWeeks.length > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClear}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            >
                Clear All
            </Button>
        )}
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between h-10 px-3 font-normal bg-background/50 border-border/50 backdrop-blur-sm focus:ring-primary/20 hover:bg-muted/30 transition-all"
          >
            <span className="truncate">
                {selectedWeeks.length === 0
                ? "Select weeks..."
                : selectedWeeks.length === 1
                ? getLabel(selectedWeeks[0])
                : `${selectedWeeks.length} weeks selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] max-h-[300px] flex flex-col" align="start">
            <DropdownMenuLabel>Available Weeks</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="overflow-y-auto flex-1 min-h-0">
                {weeks.map((week) => (
                    <DropdownMenuCheckboxItem
                        key={week.value}
                        checked={selectedWeeks.includes(week.value)}
                        onCheckedChange={() => toggleWeek(week.value)}
                        onSelect={(e) => e.preventDefault()}
                    >
                        {week.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </div>
            <div className="p-2 border-t mt-auto">
                <Button 
                    size="sm" 
                    className="w-full h-8" 
                    onClick={() => setIsOpen(false)}
                >
                    Done
                </Button>
            </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Selected tags preview */}
      {selectedWeeks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedWeeks.slice(0, 5).map(weekValue => (
                  <Badge key={weekValue} variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                      {getLabel(weekValue)}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => toggleWeek(weekValue)}
                      />
                  </Badge>
              ))}
              {selectedWeeks.length > 5 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground">
                      +{selectedWeeks.length - 5} more
                  </Badge>
              )}
          </div>
      )}
    </div>
  );
};
