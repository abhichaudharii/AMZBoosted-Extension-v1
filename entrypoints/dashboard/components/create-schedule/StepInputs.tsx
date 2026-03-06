import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { UrlDropZone } from '@/components/ui/url-drop-zone';
import { ScheduleFormData } from './types';
import { Tool } from '@/entrypoints/sidepanel/lib/tools';

interface StepInputsProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  tool?: Tool; // Pass the selected tool to access config
}

export const StepInputs: React.FC<StepInputsProps> = ({
  formData,
  setFormData,
  tool
}) => {
  // Initialize inputs if empty
  useEffect(() => {
    if (tool?.inputConfig?.inputs) {
        const newInputs = { ...formData.inputs };
        let changed = false;
        tool.inputConfig.inputs.forEach(input => {
            if (newInputs[input.key] === undefined) {
                newInputs[input.key] = '';
                changed = true;
            }
        });
        if (changed) {
            setFormData({ ...formData, inputs: newInputs });
        }
    }
  }, [tool?.id]);

  const handleInputChange = (key: string, value: string) => {
    setFormData({
        ...formData,
        inputs: {
            ...formData.inputs,
            [key]: value
        }
    });
  };

  // Helper to handle file upload for textarea inputs
  const handleFileUpload = async (key: string, file: File) => {
    try {
        const text = await file.text();
        const newValues = text
            .split(/[\n,]/)
            .map(k => k.trim().replace(/^"|"$/g, ''))
            .filter(k => k);
        
        const current = formData.inputs[key] || '';
        const updated = current 
            ? `${current}\n${newValues.join('\n')}`
            : newValues.join('\n');
            
        handleInputChange(key, updated);
        toast.success(`Imported ${newValues.length} items`);
    } catch (e) {
        toast.error('Failed to read file');
    }
  };

  // Render Dynamic Inputs
  const renderDynamicInputs = () => {
    if (!tool?.inputConfig?.inputs) {
        // Fallback for tools without config (legacy behavior)
        // Assume basic URL input
        return (
            <UrlDropZone
                id="urls"
                label="Product URLs / ASINs"
                placeholder="Enter URLs or ASINs (one per line)"
                value={formData.urls}
                onChange={(urls) => setFormData({ ...formData, urls })}
                maxUrls={500}
            />
        );
    }

    return tool.inputConfig.inputs.map((input) => (
        <div key={input.key} className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label>
                    {input.label} 
                    {input.required && tool?.id !== 'sales-traffic-drilldown' && <span className="text-destructive"> *</span>}
                    {tool?.id === 'sales-traffic-drilldown' && <span className="text-muted-foreground font-normal ml-1">(Optional)</span>}
                </Label>
                {input.type === 'textarea' && (
                     <div className="flex items-center gap-2">
                         <span className="text-xs text-muted-foreground">
                             {(formData.inputs[input.key] || '').split('\n').filter(k => k.trim()).length} lines
                         </span>
                         <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleInputChange(input.key, '')}
                             className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                         >
                             Clear
                         </Button>
                     </div>
                )}
            </div>

            {input.description && <p className="text-xs text-muted-foreground">{input.description}</p>}

            <div className="relative">
                {input.type === 'textarea' ? (
                    <>
                        <textarea
                            className="flex min-h-[150px] w-full rounded-md border border-white/10 bg-[#0A0A0B]/50 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/20 focus-visible:border-[#FF6B00]/50 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-white"
                            placeholder={input.placeholder}
                            value={formData.inputs[input.key] || ''}
                            onChange={(e) => handleInputChange(input.key, e.target.value)}
                        />
                         <div className="absolute bottom-2 right-2 flex gap-1">
                             <input 
                                type="file" 
                                className="hidden" 
                                id={`upload-${input.key}`}
                                accept=".txt,.csv"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(input.key, e.target.files[0])}
                             />
                             <Button
                                 variant="secondary"
                                 size="sm"
                                 className="h-7 text-xs"
                                 onClick={() => document.getElementById(`upload-${input.key}`)?.click()}
                             >
                                 <Upload className="w-3 h-3 mr-1" />
                                 Import
                             </Button>
                         </div>
                    </>
                ) : (
                    <input
                        className="flex h-11 w-full rounded-md border border-white/10 bg-[#0A0A0B]/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/20 focus-visible:border-[#FF6B00]/50 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                        placeholder={input.placeholder}
                        value={formData.inputs[input.key] || ''}
                        onChange={(e) => handleInputChange(input.key, e.target.value)}
                    />
                )}
            </div>
        </div>
    ));
  };


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Dynamic or Legacy Inputs */}
      {renderDynamicInputs()}

      {/* Output Format - Always Show */}
      <div className="grid gap-2">
        <Label>Output Format</Label>
        <Select
          value={formData.outputFormat}
          onValueChange={(value: any) => setFormData({ ...formData, outputFormat: value })}
        >
          <SelectTrigger className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
            <SelectItem value="csv" className="focus:bg-white/10 focus:text-white cursor-pointer">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>CSV (Comma Separated)</span>
              </div>
            </SelectItem>
            <SelectItem value="excel" className="focus:bg-white/10 focus:text-white cursor-pointer">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                <span>Excel (.xlsx)</span>
              </div>
            </SelectItem>
            <SelectItem value="json" className="focus:bg-white/10 focus:text-white cursor-pointer">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-orange-500" />
                <span>JSON</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

       {/* Specific Tool Options (if needed, e.g. Report Period for Category Insights) */}
       {tool?.id === 'category-insights' && (
            <div className="grid gap-2">
                <Label>Report Period</Label>
                <Select
                    value={formData.reportType}
                    onValueChange={(value) => setFormData({ ...formData, reportType: value })}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="l7d">Last 7 Days</SelectItem>
                        <SelectItem value="l30d">Last 30 Days</SelectItem>
                        <SelectItem value="l90d">Last 90 Days</SelectItem>
                        <SelectItem value="l12m">Last 12 Months</SelectItem>
                    </SelectContent>
                </Select>
            </div>
       )}
    </div>
  );
};
