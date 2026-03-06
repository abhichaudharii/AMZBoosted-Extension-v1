import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoading } from '@/components/ui/page-loading';
import {
  FileSpreadsheet,
  RefreshCw,
  HardDrive,
  Plug,
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
  Loader2
} from 'lucide-react';
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
        connectIntegration(rec.id);
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
      {/* Ambient Background - Matched to Web */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />

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
    let colorClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]';
    if (integration.key.includes('google')) colorClass = 'text-green-400 bg-green-500/10 border-green-500/20 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]';
    else if (integration.key === 'telegram') colorClass = 'text-sky-400 bg-sky-500/10 border-sky-500/20 shadow-[0_0_15px_-3px_rgba(14,165,233,0.1)]';
    else if (integration.key === 'discord') colorClass = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.1)]';
    else if (integration.key === 'slack') colorClass = 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_-3px_rgba(168,85,247,0.1)]';

    return (
        <div 
          className={cn(
            "relative overflow-hidden rounded-2xl border transition-all duration-500 group flex flex-col h-full",
            integration.is_connected 
              ? "bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B] border-[#FF6B00]/30 shadow-[0_0_30px_-10px_rgba(255,107,0,0.15)]" 
              : "bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
          )}
        >
            {/* Ambient Background Glow for connected items */}
            {integration.is_connected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B00]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            )}
            
            {/* Locked Overlay */}
            {locked && !integration.is_connected && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0A0A0B]/80 backdrop-blur-sm p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                        <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Upgrade Required</p>
                    <p className="text-xs text-gray-400 mb-3 text-balance">
                        {upgradeMessage}
                    </p>
                    <Button size="sm" className="h-7 text-xs bg-[#FF6B00] hover:bg-[#FF8533] text-white">
                        View Plans
                    </Button>
                </div>
            )}
            
            <div className="p-6 relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorClass)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    
                    {integration.is_connected && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6B00]"></span>
                            </span>
                            <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider">Active</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 mb-6 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B00] transition-colors duration-300">
                        {integration.name}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 min-h-[40px]">
                         {integration.category === 'notification_channel' 
                            ? `Receive real-time alerts and reports directly in ${integration.name}.`
                            : `Sync and export your Amazon data to ${integration.name}.`
                        }
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-white/5 flex gap-2">
                    {integration.is_connected ? (
                        <>
                            <Button 
                                variant="ghost" 
                                className="flex-1 h-9 text-xs justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                                onClick={onDisconnect}
                                disabled={isLoading}
                            >
                                <span className="flex items-center gap-2">
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Disconnect
                                </span>
                            </Button>
                            
                            <Button 
                                variant="ghost" 
                                className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={onSync}
                                disabled={syncing || isLoading}
                            >
                                <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
                            </Button>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-white hover:bg-white/10">
                                        <Info className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-[#1A1A1C] border-white/10 text-white p-4">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm border-b border-white/10 pb-2">
                                        <ShieldCheck className="w-4 h-4 text-green-500" />
                                        Connection Details
                                    </h4>
                                    <div className="space-y-3 text-xs text-gray-400">
                                        <div className="flex justify-between items-center">
                                            <span>Status</span>
                                            <span className="text-green-400 font-mono bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Connected Since</span>
                                            <span className="text-white font-medium">
                                                {integration.connected_at 
                                                    ? new Date(integration.connected_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                    : 'Just now'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Type</span>
                                            <span className="capitalize">{integration.category.replace('_', ' ')}</span>
                                        </div>
                                        <div className="p-2.5 bg-black/40 rounded-lg mt-1 border border-white/5 leading-relaxed">
                                            <div className="flex gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-pulse" />
                                                This integration is listening for events and ready to process data.
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </>
                    ) : (
                        <Button 
                            className={cn(
                                "w-full justify-center font-bold shadow-lg transition-all duration-300",
                                locked 
                                   ? "bg-white/5 text-gray-500 hover:bg-white/10 shadow-none hover:text-white"
                                   : "bg-white text-black hover:bg-gray-200 shadow-white/10 hover:shadow-white/20"
                            )}
                            onClick={onConnect}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Plug className="w-4 h-4 mr-2" />
                            )}
                            {locked ? "Upgrade to Connect" : "Connect Now"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}