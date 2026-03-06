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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Clock, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLimits, useUser } from '@/lib/hooks/useUserData';
import { ScheduleFormData, DAYS_OF_WEEK } from './types';

interface StepFrequencyProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
  isCategoryInsights: boolean;
  isSQP: boolean;
  isSalesTrafficDrilldown: boolean;
}

export const StepFrequency: React.FC<StepFrequencyProps> = ({
  formData,
  setFormData,
  isCategoryInsights,
  isSQP,
  isSalesTrafficDrilldown
}) => {
  const { limits } = useLimits();
  const { user } = useUser();

  // Helper to check if frequency is allowed
  const isFrequencyAllowed = (freq: string) => {
    // Permanent unlock for Business plans (including trial)
    if (user?.plan?.includes('business') || user?.plan === 'enterprise') return true;

    if (!limits?.allowedFrequencies) return true; // Default to allow if not defined
    return limits.allowedFrequencies.includes(freq);
  };

  const toggleDay = (dayId: string) => {
    setFormData({
      ...formData,
      days: formData.days.includes(dayId)
        ? formData.days.filter(d => d !== dayId)
        : [...formData.days, dayId]
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid gap-2">
            <Label>Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
                {!isCategoryInsights && (
                    <SelectItem value="hourly" disabled={!isFrequencyAllowed('hourly')} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        <div className="flex items-center justify-between w-full gap-2">
                            <span>Hourly</span>
                            {!isFrequencyAllowed('hourly') && <Lock className="w-3 h-3 opacity-50" />}
                        </div>
                    </SelectItem>
                )}
                <SelectItem value="daily" disabled={!isFrequencyAllowed('daily')} className="focus:bg-white/10 focus:text-white cursor-pointer">
                     <div className="flex items-center justify-between w-full gap-2">
                        <span>Daily</span>
                        {!isFrequencyAllowed('daily') && <Lock className="w-3 h-3 opacity-50" />}
                    </div>
                </SelectItem>
                <SelectItem value="weekly" disabled={!isFrequencyAllowed('weekly')} className="focus:bg-white/10 focus:text-white cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-2">
                        <span>Weekly</span>
                        {!isFrequencyAllowed('weekly') && <Lock className="w-3 h-3 opacity-50" />}
                    </div>
                </SelectItem>
                <SelectItem value="monthly" disabled={!isFrequencyAllowed('monthly')} className="focus:bg-white/10 focus:text-white cursor-pointer">
                     <div className="flex items-center justify-between w-full gap-2">
                        <span>Monthly</span>
                        {!isFrequencyAllowed('monthly') && <Lock className="w-3 h-3 opacity-50" />}
                    </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {!isFrequencyAllowed(formData.frequency) && formData.frequency && (
                <p className="text-xs text-destructive mt-1">
                    Your current plan does not support {formData.frequency} schedules. Please upgrade.
                </p>
            )}
            {isCategoryInsights && (
                <p className="text-xs text-muted-foreground">Category Insights supports Daily, Weekly, or Monthly schedules.</p>
            )}
      </div>

      {/* SQP Specific: Data Period */}
      {isSQP && (
        <div className="grid gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
          <Label>Data Period</Label>
          <RadioGroup 
            value={formData.dataPeriod} 
            onValueChange={(v: 'current_week' | 'last_week') => setFormData({...formData, dataPeriod: v})}
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/5 bg-[#0A0A0B]/40 hover:bg-[#FF6B00]/5 hover:border-[#FF6B00]/20 transition-all cursor-pointer">
              <RadioGroupItem value="last_week" id="last_week" className="border-white/20 text-[#FF6B00]" />
              <Label htmlFor="last_week" className="font-normal text-gray-300 cursor-pointer flex-1">Last Completed Week (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border border-white/5 bg-[#0A0A0B]/40 hover:bg-[#FF6B00]/5 hover:border-[#FF6B00]/20 transition-all cursor-pointer">
              <RadioGroupItem value="current_week" id="current_week" className="border-white/20 text-[#FF6B00]" />
              <Label htmlFor="current_week" className="font-normal text-gray-300 cursor-pointer flex-1">Current Week (Partial Data)</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Sales & Traffic Specific: Data Period */}
      {isSalesTrafficDrilldown && (
        <div className="grid gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
          <Label>Data Period</Label>
          <RadioGroup 
            value={formData.dataPeriod || 'last_30_days'} 
            onValueChange={(v) => setFormData({...formData, dataPeriod: v})}
          >
             <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yesterday" id="yesterday" />
                    <Label htmlFor="yesterday" className="font-normal cursor-pointer">Yesterday</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="last_7_days" id="last_7_days" />
                    <Label htmlFor="last_7_days" className="font-normal cursor-pointer">Last 7 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="last_30_days" id="last_30_days" />
                    <Label htmlFor="last_30_days" className="font-normal cursor-pointer">Last 30 Days</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month_to_date" id="month_to_date" />
                    <Label htmlFor="month_to_date" className="font-normal cursor-pointer">Month to Date</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="last_month" id="last_month" />
                    <Label htmlFor="last_month" className="font-normal cursor-pointer">Last Month</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="font-normal cursor-pointer">Custom Date Range</Label>
                </div>
             </div>
          </RadioGroup>

          {formData.dataPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-2 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Input 
                        type="date" 
                        value={formData.startDate || ''} 
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="h-8"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">End Date</Label>
                     <Input 
                        type="date" 
                        value={formData.endDate || ''} 
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="h-8"
                    />
                </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly Setup (Days + Time) */}
      {(formData.frequency === 'weekly') && (
        <div className="grid gap-2">
          <Label>Run on Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-all border",
                  formData.days.includes(day.id)
                    ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-[0_0_10px_-2px_rgba(255,107,0,0.5)]"
                    : "bg-[#0A0A0B]/50 hover:bg-[#FF6B00]/10 border-white/10 text-gray-400 hover:text-white"
                  )}
              >
                {day.label}
              </div>
            ))}
          </div>
          {formData.days.length === 0 && (
            <p className="text-xs text-destructive">Please select at least one day</p>
          )}
        </div>
      )}
      
      {/* Time or Interval Input */}
      {formData.frequency !== 'hourly' ? (
        <div className="grid gap-2">
          <Label htmlFor="time">Run Time</Label>
          <div className="relative">
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="pl-3 bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20 appearance-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Schedule will run at this time (local time)
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="interval">Repeat Every (Hours)</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="interval"
              type="number"
              min={1}
              max={24}
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
              className="pl-9 bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Task will run every {formData.interval} {formData.interval === 1 ? 'hour' : 'hours'}.
          </p>
        </div>
      )}
    </div>
  );
};
