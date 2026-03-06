import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Save, Bookmark, Trash2 } from 'lucide-react';
import { useSavedViews } from '@/lib/hooks/useSavedViews';
import { toast } from 'sonner';

interface SavedViewsManagerProps {
  page: 'reports' | 'schedules' | 'exports' | 'tasks';
  currentFilters: Record<string, any>;
  onLoadView: (filters: Record<string, any>) => void;
}

export function SavedViewsManager({ page, currentFilters, onLoadView }: SavedViewsManagerProps) {
  const { views, saveView, deleteView } = useSavedViews(page);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewName, setViewName] = useState('');

  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast.error('Please enter a view name');
      return;
    }

    saveView({
      name: viewName,
      page,
      filters: currentFilters,
    });

    toast.success('View saved!', {
      description: `"${viewName}" has been saved`,
    });

    setViewName('');
    setSaveDialogOpen(false);
  };

  const handleLoadView = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      onLoadView(view.filters);
      toast.success('View loaded', {
        description: `Filters from "${view.name}" applied`,
      });
    }
  };

  const handleDeleteView = (viewId: string, viewName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteView(viewId);
    toast.success('View deleted', {
      description: `"${viewName}" has been removed`,
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Current View */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-2" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>
              Save your current filter settings as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="view-name" className="text-sm font-medium">
                View Name
              </label>
              <Input
                id="view-name"
                placeholder="e.g., Last 30 Days Active Reports"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveView();
                  }
                }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Current filters:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(currentFilters).map(([key, value]) => {
                  if (value && value !== 'all') {
                    return (
                      <li key={key}>
                        <span className="capitalize">{key}</span>: {String(value)}
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Saved Views */}
      {views.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Load View ({views.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Saved Views</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleLoadView(view.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{view.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(view.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 ml-2"
                  onClick={(e) => handleDeleteView(view.id, view.name, e)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
