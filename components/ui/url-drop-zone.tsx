import React, { useState, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UrlDropZoneProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  maxUrls?: number;
}

export const UrlDropZone: React.FC<UrlDropZoneProps> = ({
  value,
  onChange,
  placeholder = 'Enter Amazon product URLs (one per line)',
  label = 'Product URLs',
  id = 'urls',
  maxUrls = 1000,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const processUrls = (urls: string) => {
    const lines = urls.split('\n').filter(line => line.trim());
    if (lines.length > maxUrls) {
      toast.error(`Maximum ${maxUrls} URLs allowed`, {
        description: `You provided ${lines.length} URLs. Only the first ${maxUrls} will be used.`,
      });
      return lines.slice(0, maxUrls).join('\n');
    }
    return urls;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const processed = processUrls(text);
      onChange(processed);
      toast.success('URLs added successfully', {
        description: `${processed.split('\n').filter(l => l.trim()).length} URLs loaded`,
      });
    }

    // Handle file drops
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const processed = processUrls(text);
          onChange(processed);
          toast.success('File loaded successfully', {
            description: `${processed.split('\n').filter(l => l.trim()).length} URLs imported`,
          });
        };
        reader.readAsText(file);
      } else {
        toast.error('Invalid file type', {
          description: 'Please upload a .txt file',
        });
      }
    }
  }, [onChange, maxUrls]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const processed = processUrls(text);
        onChange(processed);
        toast.success('File loaded successfully', {
          description: `${processed.split('\n').filter(l => l.trim()).length} URLs imported`,
        });
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value;

    // Insert pasted text at cursor position
    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
    const processed = processUrls(newValue);
    onChange(processed);

    // Set cursor position after pasted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const urlCount = value.split('\n').filter(line => line.trim()).length;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {label} *
          {urlCount > 0 && (
            <span className="text-xs text-muted-foreground">({urlCount} URLs)</span>
          )}
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.txt';
              input.onchange = handleFileSelect as any;
              input.click();
            }}
            className="h-7 text-xs hover-scale"
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload File
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              className="h-7 text-xs hover-scale text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-all ${
          isDragging
            ? 'ring-2 ring-primary ring-offset-2 scale-[1.02]'
            : ''
        }`}
      >
        <Textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          className="min-h-[120px] premium-input font-mono text-sm resize-y"
        />
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-md flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-primary animate-bounce" />
              <p className="text-sm font-medium">Drop URLs or file here</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <div>
          Add one URL per line. You can also drag & drop a .txt file or paste from clipboard.
          Maximum {maxUrls} URLs.
        </div>
      </div>
    </div>
  );
};
