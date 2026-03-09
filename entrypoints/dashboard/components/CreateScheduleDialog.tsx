import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

import { ScheduleFormData, Schedule } from './create-schedule/types';
import { StepBasics } from './create-schedule/StepBasics';
import { StepFrequency } from './create-schedule/StepFrequency';
import { StepInputs } from './create-schedule/StepInputs';
import { StepNotifications } from './create-schedule/StepNotifications'; // Import new step
import { StepReview } from './create-schedule/StepReview';

interface CreateScheduleDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onScheduleCreated: () => void;
  scheduleToEdit?: Schedule | null;
  onCreateSchedule: (schedule: any) => Promise<any>;
  onUpdateSchedule?: (id: string, schedule: any) => Promise<void>;
  preselectedTool?: string;
}

export const CreateScheduleDialog: React.FC<CreateScheduleDialogProps> = ({
  open,
  setOpen,
  onScheduleCreated,
  scheduleToEdit,
  onCreateSchedule,
  onUpdateSchedule,
  preselectedTool
}) => {
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const { tools } = useRemoteTools();
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    tool: preselectedTool || '',
    marketplace: 'US',
    frequency: 'daily',
    time: '09:00',
    urls: '',
    days: [],
    dataPeriod: 'last_week',
    outputFormat: 'csv',
    interval: 1,
    keywords: '',
    reportType: 'l30d',
    inputs: {}, // Initialize dynamic inputs
    notifyOnStart: false,
    notifyOnSuccess: true,
    notifyOnFail: true,
    alertOnStockChange: false,
    googleDriveEnabled: false,
    dayOfMonth: 1
  });

  const editMode = !!scheduleToEdit;
  const selectedTool = tools.find(t => t.id === formData.tool);

  useEffect(() => {
    if (scheduleToEdit) {
        // Map legacy fields to new inputs if needed
        // For now just load legacy fields directly, StepInputs handles migration visually if we wanted, 
        // but here we just ensure state is loaded.
      setFormData({
        name: scheduleToEdit.name,
        tool: scheduleToEdit.toolId,
        marketplace: scheduleToEdit.marketplace,
        frequency: scheduleToEdit.frequency,
        time: scheduleToEdit.time,
        urls: scheduleToEdit.urls.join('\n'), // Legacy
        inputs: scheduleToEdit.options?.inputs || (() => {
          // Legacy Migration
          const legacyInputs: Record<string, string> = {};
          
          if (scheduleToEdit.toolId === 'category-insights') {
              // Map keywords to 'keywords' input
              legacyInputs['keywords'] = scheduleToEdit.options?.keywords || '';
          } else if (scheduleToEdit.toolId === 'top-terms') {
              // Map legacy, tough to know exactly without parsing, but usually 'urls' was used for ASINs
              // Only if we stored search term in options
              if (scheduleToEdit.options?.searchTerm) {
                 legacyInputs['search_term'] = scheduleToEdit.options.searchTerm;
              }
              legacyInputs['asins'] = scheduleToEdit.urls.join('\n');
          } else {
              // Default fallback for generic tools
              legacyInputs['urls'] = scheduleToEdit.urls.join('\n');
          }
          return legacyInputs;
        })(),
        days: scheduleToEdit.days || [],
        dataPeriod: scheduleToEdit.dataPeriod || 'last_week',
        outputFormat: scheduleToEdit.outputFormat || 'csv',
        interval: scheduleToEdit.interval || 1,
        keywords: scheduleToEdit.options?.keywords || '',
        reportType: scheduleToEdit.options?.reportType || 'l30d',
        notifyOnStart: scheduleToEdit.options?.notifyOnStart || false,
        notifyOnSuccess: scheduleToEdit.options?.notifyOnSuccess || true,
        notifyOnFail: scheduleToEdit.options?.notifyOnFail || true,
        alertOnPriceDrop: scheduleToEdit.options?.alertOnPriceDrop || true,
        priceDropThreshold: scheduleToEdit.options?.priceDropThreshold || 5,
        alertOnStockChange: scheduleToEdit.options?.alertOnStockChange || false,
        googleDriveEnabled: scheduleToEdit.options?.googleDriveEnabled || false,
        startDate: scheduleToEdit.options?.startDate || scheduleToEdit.startDate || '',
        endDate: scheduleToEdit.options?.endDate || scheduleToEdit.endDate || '',
        dayOfMonth: scheduleToEdit.dayOfMonth || scheduleToEdit.options?.dayOfMonth || 1
      });
      setStep(1); 
    } else {
      // Reset form
      setFormData({
        name: '',
        tool: '',
        marketplace: 'US',
        frequency: 'daily',
        time: '09:00',
        urls: '',
        days: [],
        dataPeriod: 'last_week',
        outputFormat: 'csv',
        interval: 1,
        keywords: '',
        reportType: 'l30d',
        inputs: {},
        notifyOnStart: false,
        notifyOnSuccess: true,
        notifyOnFail: true,
        googleDriveEnabled: false,
        dayOfMonth: 1
      });
      setStep(1);
    }
  }, [scheduleToEdit, open]);

  const handleNext = () => {
    // Validation
    if (step === 1) {
      if (!formData.name || !formData.tool) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    if (step === 2) {
      if (formData.frequency !== 'hourly' && !formData.time) {
        toast.error('Please select a time');
        return;
      }
      if (formData.frequency === 'weekly' && formData.days.length === 0) {
        toast.error('Please select at least one day');
        return;
      }
      if (formData.frequency === 'monthly' && (!formData.dayOfMonth || formData.dayOfMonth < 1)) {
        toast.error('Please select a day of the month');
        return;
      }
      if (formData.frequency === 'hourly' && formData.interval < 1) {
        toast.error('Interval must be at least 1 hour');
        return;
      }

      // Sales & Traffic Custom Date Validation
      if (formData.tool === 'sales-traffic-drilldown' && formData.dataPeriod === 'custom') {
          if (!formData.startDate || !formData.endDate) {
               toast.error('Please select both Start Date and End Date');
               return;
          }
          if (formData.startDate > formData.endDate) {
              toast.error('Start Date cannot be after End Date');
              return;
          }
      }
    }
    if (step === 3) {
      // Dynamic Validation
      if (selectedTool?.id === 'sales-traffic-drilldown') {
        // Inputs are optional for this tool (defaults to all products = 1 credit)
        // No validation needed
      } 
      else if (selectedTool?.id === 'top-terms') {
          const searchTerm = formData.inputs['search_term']?.trim();
          const asins = formData.inputs['asins']?.trim();
          
          if (!searchTerm && !asins) {
              toast.error('Please enter at least one: Search Term or ASINs');
              return;
          }
      } else if (selectedTool?.inputConfig?.inputs) {
          for (const input of selectedTool.inputConfig.inputs) {
              if (input.required && !formData.inputs[input.key]?.trim()) {
                  toast.error(`Please enter ${input.label}`);
                  return;
              }
          }
      } else {
          // Legacy validation fallback
          if (selectedTool?.id === 'category-insights') {
            if (!formData.keywords.trim()) {
                toast.error('Please enter at least one keyword');
                return;
            }
          } else {
            if (!formData.urls.trim()) {
                toast.error('Please add at least one URL or ASIN');
                return;
            }
          }
      }
    }

    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setCreating(true);
    try {
      
      // Construct URLs list based on what's available
      let urlsList: string[] = [];
      const isDynamic = !!selectedTool?.inputConfig;

      if (isDynamic) {
          // If dynamic, we might store the primary 'list' input as URLs for legacy compatibility
          // For now, let's look for known keys or just use the raw inputs object in options
          if (formData.inputs['urls']) urlsList = formData.inputs['urls'].split('\n').filter(x => x.trim());
          else if (formData.inputs['asins']) urlsList = formData.inputs['asins'].split('\n').filter(x => x.trim());
          else if (formData.inputs['keywords']) urlsList = formData.inputs['keywords'].split('\n').filter(x => x.trim());
      } else {
          // Legacy Fallback
          const isCategoryInsights = formData.tool === 'category-insights';
          const rawUrls = isCategoryInsights ? formData.keywords : formData.urls;
          urlsList = rawUrls ? rawUrls.split('\n').filter((item) => item.trim()) : [];
      }

      // Calculate nextRunAt & Cron Expression
      let nextRunAt = new Date();
      const [hours, minutes] = formData.time.split(':').map(Number);
      nextRunAt.setHours(hours, minutes, 0, 0);

      let cronExpression = '';

      if (formData.frequency === 'hourly') {
        nextRunAt = new Date(); // Reset to now for relative hourly
        nextRunAt.setHours(nextRunAt.getHours() + formData.interval);
        cronExpression = `0 */${formData.interval} * * *`;
      } else if (formData.frequency === 'daily') {
        if (nextRunAt <= new Date()) nextRunAt.setDate(nextRunAt.getDate() + 1);
        cronExpression = `${minutes} ${hours} * * *`;
      } else if (formData.frequency === 'weekly') {
        // Find next day in the selected days
        const dayMap: Record<string, number> = { 'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6 };
        const selectedDays = formData.days.map(d => dayMap[d.toLowerCase()]).sort();
        
        if (selectedDays.length > 0) {
          const currentDay = nextRunAt.getDay();
          let nextDay = selectedDays.find(d => d > currentDay || (d === currentDay && nextRunAt > new Date()));
          
          if (nextDay === undefined) nextDay = selectedDays[0];
          
          let daysUntil = nextDay - currentDay;
          if (daysUntil < 0 || (daysUntil === 0 && nextRunAt <= new Date())) daysUntil += 7;
          
          nextRunAt.setDate(nextRunAt.getDate() + daysUntil);
          cronExpression = `${minutes} ${hours} * * ${selectedDays.join(',')}`;
        }
      } else if (formData.frequency === 'monthly') {
        const targetDay = formData.dayOfMonth || 1;
        nextRunAt.setDate(targetDay);
        
        if (nextRunAt <= new Date()) {
          nextRunAt.setMonth(nextRunAt.getMonth() + 1);
        }
        cronExpression = `${minutes} ${hours} ${targetDay} * *`;
      }

      const scheduleData = {
        id: editMode && scheduleToEdit ? scheduleToEdit.id : crypto.randomUUID(),
        name: formData.name,
        toolId: formData.tool,
        marketplace: formData.marketplace,
        frequency: formData.frequency,
        time: formData.time,
        urls: urlsList,
        status: editMode && scheduleToEdit ? (scheduleToEdit.enabled ? 'active' : 'paused') : 'active',
        days: formData.days,
        dayOfMonth: formData.dayOfMonth,
        dataPeriod: formData.dataPeriod,
        outputFormat: formData.outputFormat,
        interval: formData.interval,
        enabled: editMode && scheduleToEdit ? scheduleToEdit.enabled : true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cronExpression,
        notifyOnComplete: true,
        userId: 'user', 
        createdAt: editMode && scheduleToEdit ? scheduleToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextRunAt: nextRunAt.toISOString(), 
        runCount: editMode && scheduleToEdit ? scheduleToEdit.runCount : 0,
        options: {
            keywords: formData.keywords,
            reportType: formData.reportType,
            // New Fields
            inputs: formData.inputs, // Save dynamic inputs
            notifyOnStart: formData.notifyOnStart,
            notifyOnSuccess: formData.notifyOnSuccess,
            notifyOnFail: formData.notifyOnFail,
            alertOnPriceDrop: formData.alertOnPriceDrop,
            priceDropThreshold: formData.priceDropThreshold,
            alertOnStockChange: formData.alertOnStockChange,
            googleDriveEnabled: formData.googleDriveEnabled,
            startDate: formData.startDate,
            endDate: formData.endDate,
            dayOfMonth: formData.dayOfMonth
        }
      };

      if (editMode && scheduleToEdit && onUpdateSchedule) {
        await onUpdateSchedule(scheduleToEdit.id, scheduleData);
        toast.success('Schedule updated successfully', {
          description: `${formData.name} has been updated`,
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
      } else {
        await onCreateSchedule(scheduleData);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Schedule created successfully', {
          description: `${formData.name} is now active`,
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        });
      }

      onScheduleCreated(); 
      setOpen(false);
      
    } catch (error: any) {
      console.error(error);
      toast.error(editMode ? 'Failed to update schedule' : 'Failed to create schedule', {
        description: error.message || 'An error occurred'
      });
    } finally {
      setCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="w-full mb-8 px-2">
      {/* Progress Bar Background */}
      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
        {/* Animated Progress Fill */}
        <div 
          className="absolute h-full bg-gradient-to-r from-[#FF6B00] to-[#FF8533] transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,107,0,0.5)]"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        />
      </div>

      {/* Steps Labels */}
      <div className="flex justify-between mt-3 text-[10px] font-medium uppercase tracking-wider text-gray-500">
        <span className={cn("transition-colors duration-300", step >= 1 ? "text-[#FF6B00]" : "")}>Basics</span>
        <span className={cn("transition-colors duration-300", step >= 2 ? "text-[#FF6B00]" : "")}>Frequency</span>
        <span className={cn("transition-colors duration-300", step >= 3 ? "text-[#FF6B00]" : "")}>Inputs</span>
        <span className={cn("transition-colors duration-300", step >= 4 ? "text-[#FF6B00]" : "")}>Notify</span>
        <span className={cn("transition-colors duration-300", step >= 5 ? "text-[#FF6B00]" : "")}>Review</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent 
        className="sm:max-w-[600px] bg-[#1A1A1C]/95 border-white/10 backdrop-blur-2xl text-white shadow-2xl overflow-hidden p-0 gap-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editMode ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editMode ? 'Update your existing schedule settings below.' : 'Set up a new automated task schedule.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6">
          {renderStepIndicator()}
        </div>

        <div className="p-6 min-h-[300px]">
          {step === 1 && (
            <StepBasics 
              formData={formData} 
              setFormData={setFormData}
              tools={tools}
              editMode={editMode}
            />
          )}

          {step === 2 && (
            <StepFrequency 
              formData={formData}
              setFormData={setFormData}
              isCategoryInsights={formData.tool === 'category-insights'}
              isSQP={formData.tool === 'sqr-simple' || formData.tool === 'sqr-detail'}
              isSalesTrafficDrilldown={formData.tool === 'sales-traffic-drilldown'}
            />
          )}

          {step === 3 && (
            <StepInputs
              formData={formData}
              setFormData={setFormData}
              tool={selectedTool} // Pass selected tool
            />
          )}

          {step === 4 && (
             <StepNotifications 
                formData={formData}
                setFormData={setFormData}
             />
          )}

          {step === 5 && (
            <StepReview
              formData={formData}
              tools={tools}
              isCategoryInsights={formData.tool === 'category-insights'}
              isSQP={formData.tool === 'sqr-simple' || formData.tool === 'sqr-detail'}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between p-6">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={creating}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
          )}

          {step < 5 ? (
            <div className="flex gap-2">
                {editMode && (
                     <Button 
                        onClick={handleSubmit} 
                        disabled={creating} 
                        variant="outline"
                        className="border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                     >
                        {creating ? 'Updating...' : 'Update'}
                     </Button>
                )}
                <Button onClick={handleNext} className="bg-[#FF6B00] hover:bg-[#FF8533] text-white border-0">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
          ) : (
            <Button onClick={handleSubmit} disabled={creating} className="bg-[#FF6B00] hover:bg-[#FF8533] text-white border-0 min-w-[140px]">
              {creating ? 'Creating...' : editMode ? 'Update Schedule' : 'Create Schedule'}
              {!creating && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
