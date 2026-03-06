import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { MARKETPLACES } from '@/lib/constants/marketplaces';
import { FlagUS, FlagUK, FlagCA, FlagIN, FlagDE, FlagFR, FlagIT, FlagES } from '@/lib/flags';
import { ScheduleFormData } from './types';

const flagMap: Record<string, React.FC<{ className?: string }>> = {
  US: FlagUS,
  UK: FlagUK,
  CA: FlagCA,
  IN: FlagIN,
  DE: FlagDE,
  FR: FlagFR,
  IT: FlagIT,
  ES: FlagES,
};

interface StepBasicsProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  tools: any[];
  editMode: boolean;
}

export const StepBasics: React.FC<StepBasicsProps> = ({
  formData,
  setFormData,
  tools,
  editMode
}) => {
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-gray-300">Schedule Name <span className="text-[#FF6B00]">*</span></Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Weekly Competitor Analysis"
          className="bg-[#0A0A0B]/50 border-white/10 text-white placeholder:text-gray-600 focus:border-[#FF6B00]/50 focus:ring-[#FF6B00]/20 h-11"
          autoFocus={!editMode}
        />
      </div>

      <div className="grid gap-2">
           <Label className="text-gray-300">Tool <span className="text-[#FF6B00]">*</span></Label>
           {editMode ? (
               <div className="flex items-center gap-3 px-4 py-3 border border-white/10 rounded-lg bg-[#0A0A0B]/30 text-gray-400 text-sm">
                   {(() => {
                       const t = tools.find(x => x.id === formData.tool);
                       if (!t && formData.tool === 'price-tracker') {
                            return (
                               <>
                                   <Globe className="w-5 h-5 text-gray-500" />
                                   <span>Price Tracker</span>
                               </>
                            )
                       }
                       if (!t) return <span>Unknown Tool</span>;
                       const Icon = t.icon;
                       return (
                           <>
                               <Icon className="w-5 h-5 text-gray-500" />
                               <span className="text-white font-medium">{t.name}</span>
                           </>
                       );
                   })()}
               </div>
           ) : (
               <Select
                   value={formData.tool}
                   onValueChange={(val) => setFormData({...formData, tool: val})}
               >
                   <SelectTrigger className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
                       <SelectValue placeholder="Select tool..." />
                   </SelectTrigger>
                   <SelectContent className="bg-[#1A1A1C] border-white/10 text-white max-h-[300px]">
                       {tools
                           .filter(t => t.enabled !== false) 
                           .map(tool => (
                           <SelectItem key={tool.id} value={tool.id} className="focus:bg-white/10 focus:text-white cursor-pointer">
                               <div className="flex items-center gap-3 py-1">
                                   <div className="p-1.5 rounded-md bg-white/5 border border-white/5">
                                       <tool.icon className="w-4 h-4 text-gray-400" />
                                   </div>
                                   <span>{tool.name}</span>
                               </div>
                           </SelectItem>
                       ))}
                   </SelectContent>
               </Select>
           )}
           {editMode && <p className="text-xs text-gray-500">Tool cannot be changed in editing mode.</p>}
      </div>

      <div className="grid gap-2">
           <Label htmlFor="marketplace" className="text-gray-300">Marketplace</Label>
           <Select
           value={formData.marketplace}
           onValueChange={(value) => setFormData({ ...formData, marketplace: value })}
           >
           <SelectTrigger id="marketplace" className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
               <SelectValue />
           </SelectTrigger>
           <SelectContent className="bg-[#1A1A1C] border-white/10 text-white max-h-[300px]">
               {MARKETPLACES.map((m) => {
               const Flag = flagMap[m.id];
               return (
                   <SelectItem key={m.id} value={m.id} className="focus:bg-white/10 focus:text-white cursor-pointer">
                   <div className="flex items-center gap-3 py-1">
                       {Flag ? <Flag className="w-5 h-3.5 rounded-[2px]" /> : <Globe className="w-4 h-4" />}
                       <span>{m.name}</span>
                   </div>
                   </SelectItem>
               );
               })}
           </SelectContent>
           </Select>
      </div>
    </div>
  );
};
