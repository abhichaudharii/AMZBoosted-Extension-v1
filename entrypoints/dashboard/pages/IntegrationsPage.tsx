import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import {
  FileSpreadsheet,
  RefreshCw,
  HardDrive,
  Lock,
  Cloud,
  Info,
  ShieldCheck,
  Bell,
  Rocket,
  Send,
  Hash,
  MessageSquare,
  ExternalLink,
  Trash2,
  Zap,
  Loader2,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PlanRestrictionDialog } from '@/components/PlanRestrictionDialog';
import { GoogleServicesConnectModal } from '../components/integrations/GoogleSheetsConnectModal';
import { TelegramConnectModal } from '../components/integrations/TelegramConnectModal';
import { DiscordConnectModal } from '../components/integrations/DiscordConnectModal';
import { SlackConnectModal } from '../components/integrations/SlackConnectModal';
import { useFeatures } from '@/lib/hooks/useFeatures';
import { cn } from '@/lib/utils';
// import { PageHeader } from '../components/shared/PageHeader'; // Removed to match Web Header style directly
import { useIntegrations, IntegrationDefinition } from '@/lib/hooks/useIntegrations';
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
import { SubscriptionState } from '@/lib/utils/subscription';

export const IntegrationsPage: React.FC = () => {
  const { integrations, loading, connectIntegration, disconnectIntegration } = useIntegrations();
  
  // Local UI State
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalMode, setGoogleModalMode] = useState<'sheets' | 'drive'>('sheets');
  
  // UX States
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [targetDefinitionId, setTargetDefinitionId] = useState<string | null>(null);

  // Notification Modals State
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [slackOpen, setSlackOpen] = useState(false);

  // Restriction State
  const [restrictionOpen, setRestrictionOpen] = useState(false);
  const [restrictionState, setRestrictionState] = useState<SubscriptionState>(SubscriptionState.TRIAL_EXPIRED);
  const [featureName, setFeatureName] = useState('');

  // Filter for tools and notifications
  const integrationTools = integrations.filter(i => i.category === 'integration');
  const notificationChannels = integrations.filter(i => i.category === 'notification_channel');

  // --- Plan Capability Logic ---
  const { checkPermission, getUpgradeMessage } = useFeatures();

  const isIntegrationLocked = (integrationKey: string) => !checkPermission('integration', integrationKey);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleConnectClick = (rec: IntegrationDefinition) => {
    // Check lock status
    if (isIntegrationLocked(rec.key) || rec.is_locked) {
        setRestrictionState(SubscriptionState.NO_PLAN); 
        setFeatureName(rec.name);
        setRestrictionOpen(true);
        return;
    }

    setTargetDefinitionId(rec.id);
    
    // Open specific modal based on key
    if (rec.key === 'google_sheets' || rec.key === 'google_drive') {
        setGoogleModalMode(rec.key === 'google_drive' ? 'drive' : 'sheets');
        setShowGoogleModal(true);
    } else if (rec.key === 'telegram') {
        setTelegramOpen(true);
    } else if (rec.key === 'discord') {
        setDiscordOpen(true);
    } else if (rec.key === 'slack') {
        setSlackOpen(true);
    } else {
        // Fallback for direct connect
        connectIntegration(rec.id).then(() => triggerConfetti());
    }
  };

  const handleDisconnectClick = (rec: IntegrationDefinition) => {
      setDisconnectId(rec.id);
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

  
  const onGoogleConnect = async (config: any) => {
      if (targetDefinitionId) {
          await connectIntegration(targetDefinitionId, null, config);
          triggerConfetti();
          setShowGoogleModal(false);
      }
  };

  const handleSyncNow = async (id: string) => {
      setSyncing(id);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Mock sync delay
      setSyncing(null);
  };

  if (loading) {
    return <PageLoading text="Loading integrations..." subtitle="Fetching your connected services" />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground">
      {/* Ambient Background - Relaxed Neutral Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-slate-500/2 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-400/2 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
        {/* Page Header - Matched to Web */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                    <ShieldCheck className="w-3 h-3 text-[#FF6B00]" />
                    <span>Secure Data Sync</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Integrations & <span className="text-[#FF6B00]">Connections</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Supercharge your workflow by connecting your favorite tools. 
                Automate data export and receive real-time notifications where you work.
                </p>
            </div>
            
            <div className="flex gap-3">
                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Documentation
                </Button>
                <Button className="bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold gap-2">
                    <Zap className="w-4 h-4" />
                    Request New
                </Button>
            </div>
        </div>

        {/* Section 1: Data Sources */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00]">
                    <Rocket className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Data Sources & Exports</h2>
                    <p className="text-sm text-gray-400">Sync your Amazon data directly to these platforms.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {integrationTools.map((integration) => {
                    const locked = isIntegrationLocked(integration.key);
                    return (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        locked={locked}
                        upgradeMessage={getUpgradeMessage('integration', integration.key)}
                        syncing={syncing === integration.id}
                        onConnect={() => handleConnectClick(integration)}
                        onDisconnect={() => handleDisconnectClick(integration)}
                        onSync={() => handleSyncNow(integration.id)}
                        isLoading={processingId === integration.id}
                    />
                    );
                })}
                {integrationTools.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-gray-400">
                        <Cloud className="w-12 h-12 mb-4 opacity-20" />
                        <p>No data integrations available.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Section 2: Notification Channels */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
                    <Bell className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Notification Channels</h2>
                    <p className="text-sm text-gray-400">Get alerts and reports delivered to your team chat.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                {notificationChannels.map((integration) => {
                    const locked = isIntegrationLocked(integration.key);
                    return (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        locked={locked}
                        upgradeMessage={getUpgradeMessage('integration', integration.key)}
                        syncing={syncing === integration.id}
                        onConnect={() => handleConnectClick(integration)}
                        onDisconnect={() => handleDisconnectClick(integration)}
                        onSync={() => handleSyncNow(integration.id)}
                        isLoading={processingId === integration.id}
                    />
                    );
                })}
                 {notificationChannels.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed text-gray-400">
                        <Cloud className="w-12 h-12 mb-4 opacity-20" />
                        <p>No notification channels available.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Modals */}
      <GoogleServicesConnectModal
        isOpen={showGoogleModal}
        mode={googleModalMode}
        onClose={() => setShowGoogleModal(false)}
        onConnect={onGoogleConnect} 
      />
      
      <TelegramConnectModal
        isOpen={telegramOpen}
        onClose={() => setTelegramOpen(false)}
        onConnect={async (config) => {
            if (targetDefinitionId) {
                await connectIntegration(targetDefinitionId, null, { chat_id: config.chatId });
                setTelegramOpen(false);
            }
        }}
      />
      
      <DiscordConnectModal
        isOpen={discordOpen}
        onClose={() => setDiscordOpen(false)}
        onConnect={async (config) => {
            if (targetDefinitionId) {
                await connectIntegration(targetDefinitionId, null, { webhook_url: config.webhookUrl });
                setDiscordOpen(false);
            }
        }}
      />
      
      <SlackConnectModal
        isOpen={slackOpen}
        onClose={() => setSlackOpen(false)}
        onConnect={async (config) => {
            if (targetDefinitionId) {
                await connectIntegration(targetDefinitionId, null, { webhook_url: config.webhookUrl });
                setSlackOpen(false);
            }
        }}
      />
        
      <AlertDialog open={!!disconnectId} onOpenChange={() => !processingId && setDisconnectId(null)}>
        <AlertDialogContent className="bg-[#1A1A1C] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will disconnect the integration. Any automated workflows relying on this connection will pause.
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

      <PlanRestrictionDialog
        open={restrictionOpen}
        onClose={() => setRestrictionOpen(false)}
        state={restrictionState}
        featureName={featureName}
        variant="access"
      />
    </div>
  );
};

// Internal Component matching Web Premium Style
function IntegrationCard({ 
    integration, locked, upgradeMessage, syncing, onConnect, onDisconnect, onSync, isLoading
}: { 
    integration: IntegrationDefinition, 
    locked: boolean, 
    upgradeMessage: string,
    syncing: boolean,
    onConnect: () => void, 
    onDisconnect: () => void,
    onSync: () => void,
    isLoading?: boolean
}) {
    // Map key to icon
    let Icon = Cloud;
    if (integration.key === 'google_sheets') Icon = FileSpreadsheet;
    else if (integration.key === 'google_drive') Icon = HardDrive;
    else if (integration.key === 'telegram') Icon = Send;
    else if (integration.key === 'discord') Icon = Hash;
    else if (integration.key === 'slack') Icon = MessageSquare;

    // Color mapping
    let colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (integration.key.includes('google')) colorClass = 'text-green-400 bg-green-500/10 border-green-500/20';
    else if (integration.key === 'telegram') colorClass = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    else if (integration.key === 'discord') colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    else if (integration.key === 'slack') colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20';

    return (
        <div 
          className={cn(
            "relative overflow-hidden rounded-3xl border transition-all duration-500 group flex flex-col h-full cursor-pointer",
            integration.is_connected 
              ? "bg-[#0A0A0B]/80 border-primary/30 shadow-[0_0_40px_-15px_rgba(255,107,0,0.1)] hover:border-primary/50" 
              : "bg-[#0A0A0B]/40 backdrop-blur-md border-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50"
          )}
          onClick={() => {
              if (locked && !integration.is_connected) return; // Let the overlay handle it
              if (integration.is_connected) return; // Don't trigger connect if already connected
              onConnect();
          }}
        >
            {/* Ambient Background Glow for connected items */}
            {integration.is_connected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
            )}
            
            {/* Locked Overlay */}
            {locked && !integration.is_connected && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm p-6 text-center" onClick={(e) => { e.stopPropagation(); onConnect(); }}>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-400 group-hover:text-primary group-hover:border-primary/50 transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <p className="text-base font-bold text-white mb-2">Premium Feature</p>
                    <p className="text-xs text-gray-500 mb-4 px-4 leading-relaxed">
                        {upgradeMessage}
                    </p>
                    <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                        View Upgrade Options <ChevronRight className="w-3 h-3" />
                    </span>
                </div>
            )}
            
            <div className="p-8 relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:border-current shadow-lg shadow-black/20", colorClass)}>
                        <Icon className="w-7 h-7" />
                    </div>
                    
                    {integration.is_connected ? (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Connected</span>
                        </div>
                    ) : (
                         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">
                            Ready to Setup 
                         </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                        {integration.name}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                         {integration.category === 'notification_channel' 
                            ? `Automate real-time alerts and reports directly in ${integration.name}.`
                            : `Seamlessly sync your Amazon Seller data to ${integration.name} automatically.`
                        }
                    </p>
                </div>

                {/* Footer / Status Actions */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    {integration.is_connected ? (
                        <>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-9 px-3 text-xs font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                    onClick={(e) => { e.stopPropagation(); onDisconnect(); }}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Trash2 className="w-3.5 h-3.5 mr-2" />}
                                    Disconnect
                                </Button>

                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-9 w-9 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                    onClick={(e) => { e.stopPropagation(); onSync(); }}
                                    disabled={syncing || isLoading}
                                >
                                    <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin text-primary")} />
                                </Button>
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                        <Info className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-[#141416] border-white/10 text-white p-5 rounded-3xl shadow-2xl shadow-black/80" align="end" onClick={(e) => e.stopPropagation()}>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-bold text-sm">Active Connection</h4>
                                        </div>
                                        <div className="space-y-4 text-xs font-medium text-gray-400">
                                            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                                                <span>Status</span>
                                                <span className="text-green-500 uppercase tracking-tighter font-black">Stable</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Encryption</span>
                                                <span className="text-white">AES-256 Bit</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span>Connected</span>
                                                <span className="text-white">
                                                    {integration.connected_at 
                                                        ? new Date(integration.connected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                        : 'Recent'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed italic bg-black/20 p-3 rounded-xl border border-white/5">
                                            This connection is fully authenticated and synced. Reports will flow automatically according to your schedules.
                                        </p>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    ) : (
                        <div className="w-full flex items-center justify-between group/action">
                             <span className="text-[11px] font-bold text-gray-500 group-hover:text-primary transition-colors">
                                {locked ? 'Premium Access Only' : 'Click to Setup Service'}
                             </span>
                             <div className="p-2 rounded-full bg-white/5 text-gray-500 ring-1 ring-white/5 group-hover:bg-primary group-hover:text-black group-hover:ring-primary/20 transition-all duration-300">
                                <Zap size={14} className={cn(locked && "opacity-20")} />
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
