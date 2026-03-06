import React from 'react';
import { FileDown, Files } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type DownloadType = 'all-in-one' | 'individual';

interface DownloadTypeSelectorProps {
  value: DownloadType;
  onChange: (value: DownloadType) => void;
}

export const DownloadTypeSelector: React.FC<DownloadTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  const options = [
    { 
      id: 'all-in-one', 
      label: 'All in One File', 
      sub: 'Single consolidated report', 
      icon: Files 
    },
    { 
      id: 'individual', 
      label: 'Individual Files', 
      sub: 'Separate file per ASIN', 
      icon: FileDown 
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-primary/10">
            {value === 'all-in-one' ? <Files className="h-3.5 w-3.5 text-primary" /> : <FileDown className="h-3.5 w-3.5 text-primary" />}
        </div>
        <Label className="text-sm font-medium">Download Preference</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id as DownloadType)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
              value === opt.id
                ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                : "bg-card border-border hover:bg-muted/50 hover:border-border/80"
            )}
          >
            <opt.icon className={cn("w-5 h-5", value === opt.id ? "text-primary" : "text-muted-foreground")} />
            <div className="text-center">
              <div className={cn("text-sm font-medium", value === opt.id ? "text-primary" : "text-foreground")}>
                {opt.label}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {opt.sub}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
