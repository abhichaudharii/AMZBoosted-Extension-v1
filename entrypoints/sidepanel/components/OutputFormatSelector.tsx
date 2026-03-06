import React from 'react';
import { Label } from '@/components/ui/label';
import { FileSpreadsheet, FileJson, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutputFormatSelectorProps {
    value: string;
    onChange: (value: string) => void;
    allowedFormats?: ('csv' | 'excel' | 'json')[];
}

export const OutputFormatSelector: React.FC<OutputFormatSelectorProps> = ({ 
    value, 
    onChange,
    allowedFormats = ['csv', 'excel', 'json']
}) => {
    const allOptions = [
        { id: 'csv', label: 'CSV', sub: 'Excel Compatible', icon: FileSpreadsheet, color: 'text-green-600' },
        { id: 'excel', label: 'Excel', sub: '.xlsx Format', icon: Table, color: 'text-blue-600' },
        { id: 'json', label: 'JSON', sub: 'Raw Data', icon: FileJson, color: 'text-yellow-600' },
    ];

    const options = allOptions.filter(opt => allowedFormats.includes(opt.id as any));

    return (
        <div className="space-y-3">
            <Label>Output Format</Label>
            <div className="grid grid-cols-3 gap-2">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                            value === opt.id
                                ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                                : "bg-card border-border hover:bg-muted/50 hover:border-border/80"
                        )}
                    >
                        <opt.icon className={cn("w-6 h-6", opt.color)} />
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
