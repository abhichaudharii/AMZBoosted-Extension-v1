import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Bell,
  CheckCircle2,
  Info,
  Trash2,
  Check,
  Settings,
  MessageSquare,
  Send,
  Hash,
  ShieldCheck,
  Zap,
  ExternalLink,
  Laptop,
  AlertTriangle,
  XCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TelegramConnectModal } from '../components/integrations/TelegramConnectModal';
import { DiscordConnectModal } from '../components/integrations/DiscordConnectModal';
import { SlackConnectModal } from '../components/integrations/SlackConnectModal';
import { toast } from 'sonner';
import { useIntegrations } from '@/lib/hooks/useIntegrations';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const { integrations, loading: integrationsLoading, configureChannel, disconnectIntegration } = useIntegrations();
  const notificationChannels = integrations.filter(i => i.category === 'notification_channel');

  // Modal States
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  
  // UX States
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('AMZBoosted Notifications Enabled', {
          body: 'You will now receive browser notifications for task completions and important updates.',
          icon: chrome.runtime.getURL('icon/128.png'),
        });
      }
    }
  };

  const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-[#FF6B00]" />;
    }
  };

  // Plan Capability Logic
  const { checkPermission, getUpgradeMessage } = useFeatures();
  
  const isChannelLocked = (channelId: string) => !checkPermission('notification_channel', channelId);
  const getUpgradeMsg = (channelId: string) => getUpgradeMessage('notification_channel', channelId);

  const getDefinitionId = (key: string) => {
      return notificationChannels.find(c => c.key === key)?.id;
  };

  const handleConnectClick = (key: string) => {
      if (isChannelLocked(key)) {
          toast.error(`Upgrade required: ${getUpgradeMsg(key)}`);
          return;
      }
      
      const def = notificationChannels.find(c => c.key === key);
      if (!def) return;

      if (key === 'telegram') setShowTelegramModal(true);
      if (key === 'discord') setShowDiscordModal(true);
      if (key === 'slack') setShowSlackModal(true);
  };

  const handleDisconnectClick = (key: string) => {
      const def = notificationChannels.find(c => c.key === key);
      if (!def) return;
      setDisconnectId(def.id);
  };

  const handleConfirmDisconnect = async () => {
      if (!disconnectId) return;
      try {
        setProcessingId(disconnectId);
        await disconnectIntegration(disconnectId);
      } finally {
          setProcessingId(null);
          setDisconnectId(null);
      }
  };

  const onConnectChannel = async (key: string, config: any): Promise<void> => {
      const defId = getDefinitionId(key);
      if (defId) {
          setProcessingId(defId);
          try {
            await configureChannel(defId, config);
            if (key === 'telegram') setShowTelegramModal(false);
            if (key === 'discord') setShowDiscordModal(false);
            if (key === 'slack') setShowSlackModal(false);
          } finally {
            setProcessingId(null);
          }
      } else {
          toast.error(`Configuration failed: Integration ${key} not found`);
      }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                    <Bell className="w-3 h-3 text-[#FF6B00]" />
                    <span>Real-time Updates</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Notifications & <span className="text-[#FF6B00]">Alerts</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Stay updated with your latest task completions, system alerts, and reports. 
                Configure how and where you want to receive these messages.
                </p>
            </div>
            
            <div className="flex gap-3">
               {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                        <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2" onClick={markAllAsRead}>
                            <Check className="w-4 h-4" />
                            Mark all read
                        </Button>
                    )}
                    <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={clearAll}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear all
                    </Button>
                  </>
                )}
            </div>
        </div>

        {/* Section 1: Notification History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* History Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                        <p className="text-sm text-gray-400">Your latest system notifications.</p>
                    </div>
                </div>

                <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden min-h-[400px]">
                     {notificationsLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
                            <p className="text-gray-500">Loading notifications...</p>
                        </div>
                     ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
                            <Bell className="w-12 h-12 opacity-20" />
                            <p>No notifications yet</p>
                        </div>
                     ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((notification) => (
                                <div 
                                    key={notification.id} 
                                    className={cn(
                                        "group p-5 flex gap-4 transition-colors hover:bg-white/[0.02]",
                                        !notification.read && "bg-[#FF6B00]/[0.03]"
                                    )}
                                >
                                    <div className="mt-1 flex-shrink-0">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={cn("text-base font-semibold truncate pr-4", notification.read ? "text-gray-300" : "text-white")}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 font-mono">
                                                {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed break-words">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-[#FF6B00] mt-2 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                     )}
                </div>
            </div>

            {/* Channels Column (1/3 width) */}
            <div className="space-y-8">
                 {/* Browser Notifications */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                            <Laptop className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-white">Browser</h3>
                    </div>
                    
                    <div className="bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                             <div className="p-3 rounded-xl bg-orange-500/10 text-[#FF6B00]">
                                <Bell className="w-6 h-6" />
                             </div>
                             {notificationPermission === 'granted' ? (
                                <Badge className="bg-green-500/15 text-green-500 border-0">Active</Badge>
                             ) : (
                                <Badge variant="outline" className="border-white/10 text-gray-500">Inactive</Badge>
                             )}
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Browser Alerts</h4>
                        <p className="text-sm text-gray-400 mb-6">
                            Receive toast notifications for task completions even when the extension is closed.
                        </p>
                        {notificationPermission !== 'granted' && (
                            <Button onClick={requestNotificationPermission} className="w-full bg-[#FF6B00] hover:bg-[#FF8533] text-white">
                                Enable Notifications
                            </Button>
                        )}
                        {notificationPermission === 'granted' && (
                            <div className="text-xs text-green-500 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                Permission granted
                            </div>
                        )}
                    </div>
                 </div>

                 {/* External Channels */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <Settings className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-white">Channels</h3>
                    </div>

                    <div className="space-y-4">
                        {integrationsLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>
                        ) : (
                            <>
                                {/* Telegram */}
                                <ChannelCard 
                                    id="telegram"
                                    name="Telegram"
                                    icon={Send}
                                    colorClass="text-sky-400 bg-sky-500/10 border-sky-500/20"
                                    locked={isChannelLocked('telegram')}
                                    connected={notificationChannels.find(c => c.key === 'telegram')?.is_connected || false}
                                    description="Receive instant alerts via Telegram Bot"
                                    onConnect={() => handleConnectClick('telegram')}
                                    onDisconnect={() => handleDisconnectClick('telegram')}
                                    upgradeMessage={getUpgradeMsg('telegram')}
                                    isLoading={processingId === getDefinitionId('telegram')}
                                />
                                {/* Discord */}
                                <ChannelCard 
                                    id="discord"
                                    name="Discord"
                                    icon={Hash}
                                    colorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                    locked={isChannelLocked('discord')}
                                    connected={notificationChannels.find(c => c.key === 'discord')?.is_connected || false}
                                    description="Send alerts to Discord via Webhook"
                                    onConnect={() => handleConnectClick('discord')}
                                    onDisconnect={() => handleDisconnectClick('discord')}
                                    upgradeMessage={getUpgradeMsg('discord')}
                                    isLoading={processingId === getDefinitionId('discord')}
                                />
                                {/* Slack */}
                                <ChannelCard 
                                    id="slack"
                                    name="Slack"
                                    icon={MessageSquare}
                                    colorClass="text-purple-400 bg-purple-500/10 border-purple-500/20"
                                    locked={isChannelLocked('slack')}
                                    connected={notificationChannels.find(c => c.key === 'slack')?.is_connected || false}
                                    description="Get notifications in Slack channels"
                                    onConnect={() => handleConnectClick('slack')}
                                    onDisconnect={() => handleDisconnectClick('slack')}
                                    upgradeMessage={getUpgradeMsg('slack')}
                                    isLoading={processingId === getDefinitionId('slack')}
                                />
                            </>
                        )}
                    </div>
                 </div>
            </div>
        </div>

      </div>

      {/* Modals */}
      <TelegramConnectModal isOpen={showTelegramModal} onClose={() => setShowTelegramModal(false)} onConnect={(config) => onConnectChannel('telegram', config)} />
      <DiscordConnectModal isOpen={showDiscordModal} onClose={() => setShowDiscordModal(false)} onConnect={(config) => onConnectChannel('discord', config)} />
      <SlackConnectModal isOpen={showSlackModal} onClose={() => setShowSlackModal(false)} onConnect={(config) => onConnectChannel('slack', config)} />
      
      <AlertDialog open={!!disconnectId} onOpenChange={() => !processingId && setDisconnectId(null)}>
        <AlertDialogContent className="bg-[#1A1A1C] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will stop notifications from being sent to this channel. You can reconnect at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!processingId} className="bg-transparent border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => { e.preventDefault(); handleConfirmDisconnect(); }}
                disabled={!!processingId}
                className="bg-destructive hover:bg-destructive/90 text-white"
            >
                {processingId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Internal component for channel cards - Matched to Premium Style
function ChannelCard({ 
    name, icon: Icon, colorClass, locked, connected, description, onConnect, onDisconnect, upgradeMessage, isLoading
}: any) {
    return (
        <div 
          className={cn(
            "relative overflow-hidden rounded-2xl border transition-all duration-500 group flex flex-col",
            connected 
              ? "bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B] border-[#FF6B00]/30 shadow-[0_0_30px_-10px_rgba(255,107,0,0.15)]" 
              : "bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 hover:border-white/10 hover:shadow-lg"
          )}
        >
             {/* Locked Overlay */}
             {locked && !connected && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm p-4 text-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                        <Lock className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-white mb-0.5">Upgrade Required</p>
                    <p className="text-[10px] text-gray-400 mb-2 truncate max-w-[150px]">{upgradeMessage}</p>
                    <Button size="icon" className="h-6 w-6 bg-[#FF6B00] hover:bg-[#FF8533] text-white rounded-full">
                        <ExternalLink className="w-3 h-3" />
                    </Button>
                </div>
            )}
            
            <div className={cn("absolute top-0 left-0 w-full h-1", connected ? "bg-primary" : "bg-transparent")} />
            
            <div className="p-4 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl transition-all duration-300", colorClass)}>
                    <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-white text-sm">{name}</h4>
                        {connected && (
                            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{description}</p>
                </div>
            </div>

            {/* Footer Buttons */}
             <div className="px-4 pb-4 flex gap-2">
                 {connected ? (
                    <Button 
                         variant="ghost" 
                         size="sm"
                         className="w-full h-8 text-xs border border-white/5 bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                         onClick={onDisconnect}
                         disabled={isLoading}
                    >
                         {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Trash2 className="w-3 h-3 mr-2" />}
                         Disconnect
                    </Button>
                 ) : (
                    <Button 
                         size="sm"
                         className={cn(
                             "w-full h-8 text-xs font-semibold",
                             locked 
                               ? "bg-white/5 text-gray-500" 
                               : "bg-white text-black hover:bg-gray-200"
                         )}
                         onClick={onConnect}
                         disabled={locked || isLoading}
                    >
                         {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Connect"}
                    </Button>
                 )}
             </div>
        </div>
    );
}
