import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  category: string;
  shortcuts: Shortcut[];
}

const shortcuts: ShortcutGroup[] = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['Alt', '1'], description: 'Go to Dashboard' },
      { keys: ['Alt', '2'], description: 'Go to Tools' },
      { keys: ['Alt', '3'], description: 'Go to Reports' },
      { keys: ['Alt', '4'], description: 'Go to Schedules' },
      { keys: ['Alt', '5'], description: 'Go to Exports' },
    ],
  },
  {
    category: 'Actions',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Alt', 'T'], description: 'Toggle theme' },
      { keys: ['Esc'], description: 'Close dialogs/modals' },
    ],
  },
  {
    category: 'Table Actions',
    shortcuts: [
      { keys: ['⌘', 'A'], description: 'Select all rows' },
      { keys: ['Delete'], description: 'Delete selected rows' },
      { keys: ['E'], description: 'Export selected rows' },
    ],
  },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions faster
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map((group, index) => (
            <div key={group.category}>
              {index > 0 && <Separator />}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">{group.category}</h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2">
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <React.Fragment key={keyIdx}>
                            {keyIdx > 0 && <span className="text-xs text-muted-foreground">+</span>}
                            <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                              {key}
                            </Badge>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="text-xs text-muted-foreground">
          <p>Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">?</kbd> anytime to open this dialog</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
