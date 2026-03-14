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
import { Clock, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLimits, useUser } from '@/lib/hooks/useUserData';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { ScheduleFormData, DAYS_OF_WEEK } from './types';

// Hourly interval options per plan
// Pro: minimum 4h. Business: minimum 1h.
const HOURLY_OPTIONS = [
    { value: 1,  label: 'Every 1 hour',   minPlan: 'business' },
    { value: 2,  label: 'Every 2 hours',  minPlan: 'business' },
    { value: 3,  label: 'Every 3 hours',  minPlan: 'business' },
    { value: 4,  label: 'Every 4 hours',  minPlan: 'professional' },
    { value: 6,  label: 'Every 6 hours',  minPlan: 'professional' },
    { value: 8,  label: 'Every 8 hours',  minPlan: 'professional' },
    { value: 12, label: 'Every 12 hours', minPlan: 'professional' },
];

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
  const { checkPermission } = useFeatures();

  const planTier = (() => {
    const p = user?.plan?.toLowerCase() || 'starter';
    if (p.includes('business') || p === 'enterprise') return 'business';
    if (p.includes('professional') || p.includes('pro')) return 'professional';
    return 'starter';
  })();

  // Helper to check if frequency is allowed
  const isFrequencyAllowed = (freq: string) => {
    if (planTier === 'business' || planTier === 'enterprise') return true;
    if (!limits?.allowedFrequencies) {
      return freq !== 'hourly' || planTier === 'professional';
    }
    return limits.allowedFrequencies.includes(freq);
  };

  // Helper to check if an hourly interval is allowed for current plan
  const isIntervalAllowed = (hours: number) => {
    return checkPermission('schedule', 'hourly_interval', hours);
  };

  // On hourly select, default interval to minimum allowed for the plan
  const getDefaultInterval = () => {
    if (planTier === 'business' || planTier === 'enterprise') return 1;
    if (planTier === 'professional') return 4;
    return 4;
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
              onValueChange={(value) => setFormData({
                ...formData,
                frequency: value,
                // Reset interval to plan minimum when switching to hourly
                interval: value === 'hourly' ? getDefaultInterval() : formData.interval,
              })}
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
      {/* Monthly Setup (Day of Month + Time) */}
      {(formData.frequency === 'monthly') && (
        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
          <Label htmlFor="dayOfMonth">Run on Day of Month</Label>
          <Select
            value={formData.dayOfMonth?.toString() || "1"}
            onValueChange={(value) => setFormData({ ...formData, dayOfMonth: parseInt(value) })}
          >
            <SelectTrigger id="dayOfMonth" className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1C] border-white/10 text-white max-h-[300px]">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={day.toString()} className="focus:bg-white/10 focus:text-white cursor-pointer">
                  Day {day}
                </SelectItem>
              ))}
              <SelectItem value="32" className="focus:bg-white/10 focus:text-white cursor-pointer">
                Last Day of Month
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Schedule will run once per month on the selected day.
          </p>
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
          <Label htmlFor="interval" className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Repeat Interval
          </Label>
          <Select
            value={String(formData.interval || getDefaultInterval())}
            onValueChange={(v) => setFormData({ ...formData, interval: parseInt(v) })}
          >
            <SelectTrigger className="w-full bg-[#0A0A0B]/50 border-white/10 text-white h-11 focus:ring-[#FF6B00]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
              {HOURLY_OPTIONS.map((opt) => {
                const allowed = isIntervalAllowed(opt.value);
                const needsBusiness = opt.minPlan === 'business' && planTier !== 'business';
                return (
                  <SelectItem
                    key={opt.value}
                    value={String(opt.value)}
                    disabled={!allowed}
                    className="focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full gap-3">
                      <span>{opt.label}</span>
                      {!allowed && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          <Zap className="w-3 h-3" />
                          {needsBusiness ? 'Business' : 'Pro'}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {planTier === 'starter'
              ? 'Hourly scheduling requires Pro or Business plan.'
              : planTier === 'professional'
              ? 'Pro plan: minimum 4-hour interval. Upgrade to Business for 1–3 hour intervals.'
              : `Task will run every ${formData.interval || getDefaultInterval()} hours.`}
          </p>
        </div>
      )}
    </div>
  );
};
