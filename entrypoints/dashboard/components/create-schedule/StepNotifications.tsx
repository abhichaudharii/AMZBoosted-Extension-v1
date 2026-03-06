import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScheduleFormData } from './types';
import { useNavigate } from 'react-router-dom';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { Folder, Zap, AlertCircle, CheckCircle, Bell } from 'lucide-react';

interface StepNotificationsProps {
  formData: ScheduleFormData;
  setFormData: (data: ScheduleFormData) => void;
}

export const StepNotifications: React.FC<StepNotificationsProps> = ({
  formData,
  setFormData
}) => {
  const { integrations } = useIntegrations();
  const navigate = useNavigate();

  const googleDriveConnected = integrations.some(i => i.id === 'google-drive' && i.is_connected);
  const notificationChannels = integrations.filter(i => i.category === 'notification_channel' && i.is_connected);

  const toggleNotification = (key: keyof Pick<ScheduleFormData, 'notifyOnStart' | 'notifyOnSuccess' | 'notifyOnFail'>) => {
    setFormData({ ...formData, [key]: !formData[key] });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Google Drive Integration */}
      {formData.tool !== 'price-tracker' && googleDriveConnected && (
      <div className="border border-white/5 rounded-lg p-4 bg-[#0A0A0B]/40 space-y-4 hover:border-white/10 transition-colors">
        <div className="flex items-center justify-between pointer-events-auto" onClick={() => setFormData({ ...formData, googleDriveEnabled: !formData.googleDriveEnabled })}>
            <div className="flex items-center gap-3 cursor-pointer select-none">
                <div className="p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <Folder className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <Label className="text-base font-semibold text-gray-200 cursor-pointer pointer-events-none">Google Drive Backup</Label>
                    <p className="text-sm text-gray-500">Save schedule outputs to your Drive.</p>
                </div>
            </div>
            <Switch 
                checked={formData.googleDriveEnabled} 
                onCheckedChange={(checked) => setFormData({ ...formData, googleDriveEnabled: checked })}
                className="data-[state=checked]:bg-blue-600"
            />
        </div>
        
        {formData.googleDriveEnabled && (
             <div className="pl-14 text-sm text-gray-500 space-y-1 animate-in fade-in slide-in-from-top-2">
                 <p className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                     Files will be saved in: <span className="font-mono bg-[#1A1A1C] px-1.5 py-0.5 rounded text-gray-300 border border-white/5">Amzboosted / {new Date().getFullYear()} / {new Date().toLocaleString('default', { month: 'long' })} / Schedules</span>
                 </p>
             </div>
        )}
      </div>
      )}

      {/* Price Alerts Section */}
      {formData.tool === 'price-tracker' && (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                 <Bell className="w-5 h-5 text-primary" />
                 <h3 className="font-semibold text-lg">Price Alerts</h3>
            </div>
            
            <div className="grid gap-3">
                <div className="bg-[#0A0A0B]/40 border border-white/5 rounded-md p-3">
                    <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setFormData({...formData, alertOnPriceDrop: !formData.alertOnPriceDrop})}>
                        <Checkbox 
                            id="alertPrice" 
                            checked={formData.alertOnPriceDrop} 
                            className="border-white/20 data-[state=checked]:bg-[#FF6B00] data-[state=checked]:border-[#FF6B00] pointer-events-none" 
                        />
                        <Label className="flex items-center gap-2 cursor-pointer flex-1 font-medium text-gray-300 pointer-events-none">
                            <Zap className="w-4 h-4 text-[#FF6B00]" />
                            Notify on Price Drop
                        </Label>
                    </div>
                    
                    {formData.alertOnPriceDrop && (
                         <div className="mt-3 ml-7 animate-in fade-in slide-in-from-top-2">
                             <Label htmlFor="threshold" className="text-xs text-gray-500 mb-1.5 block">
                                 Alert if price drops by at least:
                             </Label>
                             <div className="relative max-w-[150px]">
                                 <Input 
                                     id="threshold"
                                     type="number" 
                                     min="1" 
                                     max="99"
                                     value={formData.priceDropThreshold || ''}
                                     onChange={(e) => setFormData({...formData, priceDropThreshold: parseInt(e.target.value) || 0})}
                                     className="pr-8 h-8 bg-[#0A0A0B]/50 border-white/10 text-white focus:ring-[#FF6B00]/20"
                                 />
                                 <span className="absolute right-3 top-1.5 text-sm text-gray-500">%</span>
                             </div>
                         </div>
                    )}
                </div>

                <div className="flex items-center space-x-3 p-3 border border-white/5 rounded-md hover:bg-[#0A0A0B]/40 hover:border-white/10 transition-all cursor-pointer select-none" onClick={() => setFormData({...formData, alertOnStockChange: !formData.alertOnStockChange})}>
                    <Checkbox 
                        id="alertStock" 
                        checked={formData.alertOnStockChange} 
                        className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 pointer-events-none" 
                    />
                    <Label className="flex items-center gap-2 cursor-pointer flex-1 font-medium text-gray-300 pointer-events-none">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Notify on Stock Change
                    </Label>
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-6">
                * We will check prices based on your schedule frequency.
            </p>
        </div>
      )}

      {/* Notification Events - Hidden for Price Tracker */}
      {formData.tool !== 'price-tracker' && (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
             <Bell className="w-5 h-5 text-primary" />
             <h3 className="font-semibold text-lg">Notification Events</h3>
        </div>
        
        {notificationChannels.length > 0 ? (
            <div className="grid gap-3">
                <div 
                    className="flex items-center space-x-3 p-3 border border-white/5 rounded-md hover:bg-[#0A0A0B]/40 hover:border-white/10 transition-all cursor-pointer select-none" 
                    onClick={() => toggleNotification('notifyOnStart')}
                >
                    <Checkbox 
                        checked={formData.notifyOnStart} 
                        className="border-white/20 data-[state=checked]:bg-[#FF6B00] data-[state=checked]:border-[#FF6B00] pointer-events-none" 
                    />
                    <Label className="flex items-center gap-2 cursor-pointer flex-1 text-gray-300 pointer-events-none">
                        <Zap className="w-4 h-4 text-[#FF6B00]" />
                        Notify when started
                    </Label>
                </div>

                <div 
                    className="flex items-center space-x-3 p-3 border border-white/5 rounded-md hover:bg-[#0A0A0B]/40 hover:border-white/10 transition-all cursor-pointer select-none" 
                    onClick={() => toggleNotification('notifyOnSuccess')}
                >
                    <Checkbox 
                        checked={formData.notifyOnSuccess} 
                        className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 pointer-events-none" 
                    />
                    <Label className="flex items-center gap-2 cursor-pointer flex-1 text-gray-300 pointer-events-none">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Notify on success
                    </Label>
                </div>

                <div 
                    className="flex items-center space-x-3 p-3 border border-white/5 rounded-md hover:bg-[#0A0A0B]/40 hover:border-white/10 transition-all cursor-pointer select-none" 
                    onClick={() => toggleNotification('notifyOnFail')}
                >
                    <Checkbox 
                        checked={formData.notifyOnFail} 
                        className="border-white/20 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 pointer-events-none" 
                    />
                    <Label className="flex items-center gap-2 cursor-pointer flex-1 text-gray-300 pointer-events-none">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Notify on failure
                    </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    * Notifications will be sent to all your connected channels.
                </p>
            </div>
        ) : (
            <div className="border border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-center gap-3 bg-[#0A0A0B]/20">
                <div className="p-3 bg-white/5 rounded-full">
                    <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-1">
                    <h4 className="font-medium text-gray-200">No Notification Channels</h4>
                    <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                        Connect Telegram, Slack, or Discord to receive updates about your schedule.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard/integrations')}
                    className="mt-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors border border-primary/20"
                >
                    Connect Channels
                </button>
            </div>
        )}
      </div>
      )}
    </div>
  );
};
