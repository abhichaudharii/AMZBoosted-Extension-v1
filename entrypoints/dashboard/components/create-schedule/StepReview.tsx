import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Folder, Zap } from 'lucide-react';
import { MARKETPLACES } from '@/lib/constants/marketplaces';
import { FlagUS, FlagUK, FlagCA, FlagIN, FlagDE, FlagFR, FlagIT, FlagES } from '@/lib/flags';
import { ScheduleFormData } from './types';
import { useIntegrations } from '@/lib/hooks/useIntegrations';

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

interface StepReviewProps {
  formData: ScheduleFormData;
  tools: any[];
  isCategoryInsights: boolean;
  isSQP: boolean;
}

export const StepReview: React.FC<StepReviewProps> = ({
  formData,
  tools,
  isCategoryInsights,
  isSQP
}) => {
  const selectedTool = tools.find(t => t.id === formData.tool);
  const { integrations } = useIntegrations();

  // Helper to count items in a potentially multi-line string input
  const countItems = (val?: string) => val ? val.split('\n').filter(x => x.trim()).length : 0;
  
  const connectedChannels = integrations.filter(i => i.is_connected && i.category === 'notification_channel');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="rounded-lg border border-white/5 bg-[#0A0A0B]/40 shadow-sm text-gray-200">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-white">{formData.name}</h3>
            <Badge variant="outline" className="border-white/10 text-gray-400">{formData.frequency}</Badge>
          </div>
          
          {/* ... (Previous Fields: Tool, Marketplace, Next Run - Keep as is) ... */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Tool</span>
              <div className="font-medium flex items-center gap-2">
                {selectedTool?.name || formData.tool}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Marketplace</span>
              <div className="font-medium flex items-center gap-1">
                 {(() => {
                    const m = MARKETPLACES.find(m => m.id === formData.marketplace);
                    const Flag = flagMap[formData.marketplace];
                    return (
                        <>
                            {Flag && <Flag className="w-3 h-3 rounded-[1px]" />}
                            {m?.name}
                        </>
                    );
                 })()}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Next Run</span>
              <div className="font-medium">
                {(() => {
                    if (formData.frequency === 'hourly') {
                        return `Every ${formData.interval} ${formData.interval === 1 ? 'hour' : 'hours'}`;
                    }
                    
                    const [hours, minutes] = formData.time.split(':').map(Number);
                    const now = new Date();
                    const runTime = new Date();
                    runTime.setHours(hours, minutes, 0, 0);
                    
                    if (runTime > now) {
                        return `Today at ${formData.time}`;
                    } else {
                        return `Tomorrow at ${formData.time}`;
                    }
                })()}
              </div>
            </div>

            {/* Dynamic Inputs Display */}
            {selectedTool?.inputConfig?.inputs ? (
                 selectedTool.inputConfig.inputs.map((input: any) => (
                    <div key={input.key} className="space-y-1">
                        <span className="text-muted-foreground">{input.label}</span>
                        <div className="font-medium truncate max-w-[150px]" title={formData.inputs[input.key]}>
                             {input.type === 'textarea' 
                                ? `${countItems(formData.inputs[input.key])} items`
                                : formData.inputs[input.key] || '-'
                             }
                        </div>
                    </div>
                 ))
            ) : (
                // Legacy Display
                <div className="space-y-1">
                  <span className="text-muted-foreground">Items to Process</span>
                  <div className="font-medium">
                    {isCategoryInsights 
                        ? formData.keywords.split('\n').filter(k => k.trim()).length 
                        : formData.urls.split('\n').filter(u => u.trim()).length
                    }
                  </div>
                </div>
            )}


            {isSQP && (
              <div className="space-y-1">
                <span className="text-muted-foreground">Data Period</span>
                <div className="font-medium capitalize">{formData.dataPeriod?.replace('_', ' ')}</div>
              </div>
            )}
            {isCategoryInsights && (
                <div className="space-y-1">
                    <span className="text-muted-foreground">Report Type</span>
                    <div className="font-medium uppercase">{formData.reportType}</div>
                </div>
            )}
            {formData.frequency === 'weekly' && (
              <div className="space-y-1 col-span-2">
                <span className="text-muted-foreground">Run Days</span>
                <div className="flex gap-1 mt-1">
                  {formData.days.map(d => (
                    <Badge key={d} variant="secondary" className="text-xs uppercase">{d}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Price Tracker Specific Alerts */}
             {formData.tool === 'price-tracker' && (
                  <div className="space-y-1 col-span-2">
                      <span className="text-muted-foreground">Price Alerts Setup</span>
                      <div className="flex gap-2 mt-1">
                          {formData.alertOnPriceDrop && (
                              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                                  Price Drop {formData.priceDropThreshold ? `(> ${formData.priceDropThreshold}%)` : ''}
                              </Badge>
                          )}
                          {formData.alertOnStockChange && <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Stock Change</Badge>}
                          {!formData.alertOnPriceDrop && !formData.alertOnStockChange && <span className="text-sm italic text-muted-foreground">None enabled</span>}
                      </div>
                  </div>
             )}
          </div>
          
          {/* Notifications & Integrations Summary */}
          <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div className="space-y-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Connected Integrations</span>
                  
                  {(!formData.googleDriveEnabled && connectedChannels.length === 0) ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-[#0A0A0B]/30 p-2 rounded-md border border-white/5 border-dashed">
                          <Zap className="w-3 h-3 opacity-50" />
                          <span>No integrations active</span>
                      </div>
                  ) : (
                      <div className="flex flex-col gap-2">
                           {/* Google Drive Card */}
                           {formData.googleDriveEnabled && (
                               <div className="flex items-center gap-3 p-2.5 rounded-md border border-white/5 bg-[#0A0A0B]/40 hover:bg-white/5 transition-colors">
                                   <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                       <Folder className="w-4 h-4 text-blue-400" />
                                   </div>
                                   <div className="flex flex-col">
                                       <span className="text-sm font-medium leading-none text-gray-200">Google Drive</span>
                                       <span className="text-[10px] text-gray-500 mt-1">Backup enabled</span>
                                   </div>
                               </div>
                           )}

                           {/* Notification Channels */}
                           {connectedChannels.length > 0 && (
                               <div className="grid grid-cols-2 gap-2">
                                   {connectedChannels.map(c => {
                                       // Determine icon/color based on name/provider
                                       let icon = <Zap className="w-4 h-4 text-slate-400" />;
                                       let bg = "bg-slate-500/10 border-slate-500/20";
                                       
                                       const name = c.name.toLowerCase();
                                       if (name.includes('telegram')) {
                                           // Send/Plane icon for Telegram
                                           icon = <Zap className="w-4 h-4 text-sky-400" />; // Fallback if no specific icon
                                           bg = "bg-sky-500/10 border-sky-500/20";
                                       } else if (name.includes('slack')) {
                                           icon = <Zap className="w-4 h-4 text-fuchsia-400" />;
                                           bg = "bg-fuchsia-500/10 border-fuchsia-500/20";
                                       } else if (name.includes('discord')) {
                                           icon = <Zap className="w-4 h-4 text-indigo-400" />;
                                           bg = "bg-indigo-500/10 border-indigo-500/20";
                                       }

                                       return (
                                            <div key={c.id} className="flex items-center gap-2 p-2 rounded-md border border-white/5 bg-[#0A0A0B]/40 hover:bg-white/5 transition-colors">
                                                <div className={`w-7 h-7 rounded-full border ${bg} flex items-center justify-center shrink-0`}>
                                                    {icon}
                                                </div>
                                                <span className="text-xs font-medium truncate text-gray-300" title={c.name}>
                                                    {c.name}
                                                </span>
                                            </div>
                                       );
                                   })}
                               </div>
                           )}
                      </div>
                  )}
              </div>
              
              {/* Notification Type - Hidden for Price Tracker */}
              {formData.tool !== 'price-tracker' && (
                  <div className="space-y-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Events</span>
                      <div className="flex flex-col gap-2">
                          {(!formData.notifyOnStart && !formData.notifyOnSuccess && !formData.notifyOnFail) ? (
                              <div className="text-sm text-muted-foreground italic p-2">None</div>
                          ) : (
                              <div className="flex flex-wrap gap-2">
                                  {formData.notifyOnStart && (
                                     <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-medium">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                                          On Start
                                     </div>
                                  )}
                                  {formData.notifyOnSuccess && (
                                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          On Success
                                     </div>
                                  )}
                                  {formData.notifyOnFail && (
                                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-medium">
                                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                          On Failure
                                     </div>
                                  )}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>

          <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 p-4 rounded-lg flex items-start gap-3 mt-4">
            <Zap className="w-5 h-5 text-[#FF6B00] mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#FF6B00]">
                  Estimated Usage: {(() => {
                      if (formData.tool === 'sales-traffic-drilldown') {
                          const itemCount = Object.values(formData.inputs).reduce((acc: number, val: any) => acc + countItems(val as string), 0);
                          return itemCount === 0 ? "1 Credit" : `${itemCount} Credits`;
                      }
                      
                      // General calculation
                      const count = isCategoryInsights 
                        ? countItems(formData.keywords) 
                        : countItems(formData.urls) + Object.values(formData.inputs).reduce((acc: number, val: any) => acc + countItems(val as string), 0);
                      
                      return count === 0 ? "Calculated on run" : `${count} Credits`;
                  })()}
              </p>
              <p className="text-xs text-gray-400">
                Credits are only deducted when the task runs successfully.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
