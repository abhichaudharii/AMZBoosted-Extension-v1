import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings } from '../lib/types';
import { SettingsSheet } from './SettingsSheet';

interface ProcessingSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

export const ProcessingSettingsSheet: React.FC<ProcessingSettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  return (
    <SettingsSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Processing Settings"
      description="Configure how the tool processes your URLs"
      footer={
        <Button className="w-full" onClick={onClose}>
          Save Settings
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Request Delay</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={settings.delay}
              onChange={(e) =>
                onSettingsChange({ ...settings, delay: parseInt(e.target.value) || 0 })
              }
              className="text-sm h-10"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">milliseconds</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Time to wait between processing each URL to avoid rate limits
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto Retry</Label>
              <p className="text-xs text-muted-foreground">
                Automatically retry failed URLs up to 3 times
              </p>
            </div>
            <Switch
              checked={settings.autoRetry}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, autoRetry: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Slow Mode</Label>
              <p className="text-xs text-muted-foreground">
                Use slower, more human-like processing behavior
              </p>
            </div>
            <Switch
              checked={settings.slowMode}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, slowMode: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Smart Scrape</Label>
              <p className="text-xs text-muted-foreground">
                Use intelligent data extraction for better results
              </p>
            </div>
            <Switch
              checked={settings.smartScrape}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, smartScrape: checked })
              }
            />
          </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Skip Credit Confirmation</Label>
              <p className="text-xs text-muted-foreground">
                Don't show confirmation popup before running tool
              </p>
            </div>
            <Switch
              checked={settings.skipCreditConfirmation}
              onCheckedChange={(checked) =>
                onSettingsChange({ ...settings, skipCreditConfirmation: checked })
              }
            />
          </div>
        </div>
      </div>
    </SettingsSheet>
  );
};
