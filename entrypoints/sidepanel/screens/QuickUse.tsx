import React from 'react';
import { HelpCircle, LayoutDashboard, FileCog, Settings2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Navbar } from '../components/Navbar';
import { LogsPanel } from '../components/LogsPanel';
import type { Tool } from '../lib/tools';
import { HelpModal } from '@/components/sidepanel/HelpModal';
import { PlanRestrictionDialog } from '@/components/PlanRestrictionDialog';
import { ProcessingView } from '../components/ProcessingView';
import { ToolRenderer } from '../components/quick-use/ToolRenderer';

import { useQuickUseState } from './quick-use/hooks/useQuickUseState';
import { useToolExecution } from './quick-use/hooks/useToolExecution';
import { QuickUseFooter } from './quick-use/components/QuickUseFooter';
import { QuickUseSheets } from './quick-use/components/QuickUseSheets';

interface QuickUseProps {
  tool: Tool;
  onBack: () => void;
  onOpenDashboard?: () => void;
}

export const QuickUse: React.FC<QuickUseProps> = ({ tool, onBack }) => {
  const state = useQuickUseState(tool);
  
  const {
      handleStart, handlePause, handleStop, confirmStart,
      isProcessing, restrictionOpen, setRestrictionOpen, restrictionState
  } = useToolExecution(tool, state);

  const {
      isStateLoaded, customToolData, setCustomToolData, sqpDownloadType, sqpOutputFormat,
      marketplace, setMarketplace, urls, setUrls, handleClearUrls, handleFileChange, isLoadingCsv,
      jobs, isPaused, showLogs, setShowLogs, logs, setLogs,
      setShowSettings, showConfirmDialog, setShowConfirmDialog, pendingUrlList,
      setShowCategoryExportSettings, setShowSalesTrafficExportSettings, setShowExportSettings,
      showHelp, setShowHelp
  } = state;

  const handleOpenDashboard = (toolId: string) => {
    const url = chrome.runtime.getURL(`dashboard.html#/tools/${toolId}`);
    chrome.tabs.create({ url });
  };

  const menuItems = [
    {
      label: 'Settings',
      icon: Settings2,
      onClick: () => setShowSettings(true),
    },
    ...((tool.exportParams?.supportsExportSettings) ? [{
        label: 'Export Settings',
        icon: FileCog,
        onClick: () => {
                  if (tool.exportParams?.stateBinding === 'category' || tool.exportParams?.stateBinding === 'asin') { // Reusing generic sheet for these
                      setShowCategoryExportSettings(true); 
                  } else if (tool.exportParams?.stateBinding === 'salesTraffic') {
                      setShowSalesTrafficExportSettings(true);
                  } else {
                      setShowExportSettings(true); // Default to SQP/Generic
                  }
        },
    }] : []),
    {
      label: 'Open Dashboard',
      icon: LayoutDashboard,
      onClick: () => handleOpenDashboard(tool.id)
    },
    {
      label: 'Help & Instructions',
      icon: HelpCircle,
      onClick: () => setShowHelp(true),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B]">
      <Navbar
        title={tool.name}
        icon={tool.icon}
        showBack={true}
        onBack={onBack}
        showMenu={true}
        menuItems={menuItems}
      >
      </Navbar>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20">
          {!isStateLoaded ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                  <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      <img 
                          src="/amzboosted_logo.png" 
                          alt="Loading" 
                          className="h-12 w-12 relative z-10 animate-pulse" 
                      />
                  </div>
                  <div className="flex gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></div>
                  </div>
              </div>
          ) : !isProcessing ? (
            <ToolRenderer
                tool={tool}
                customToolData={customToolData}
                setCustomToolData={setCustomToolData}
                sqpDownloadType={sqpDownloadType}
                sqpOutputFormat={sqpOutputFormat}
                isProcessing={isProcessing}
                marketplace={marketplace}
                setMarketplace={setMarketplace}
                urls={urls}
                setUrls={setUrls}
                handleClearUrls={handleClearUrls}
                handleFileChange={handleFileChange}
                isLoadingCsv={isLoadingCsv}
            />
          ) : (
            <ProcessingView
               jobs={jobs}
               isPaused={isPaused}
               onPause={handlePause}
               onStop={handleStop}
            />
          )}

          {showLogs && (
             <div className="animate-in slide-in-from-bottom-4 duration-300">
               <LogsPanel logs={logs} onClear={() => setLogs([])} />
             </div>
          )}
        </div>
      </ScrollArea>

      <QuickUseFooter
          handleStart={handleStart}
          isProcessing={isProcessing}
          showLogs={showLogs}
          setShowLogs={setShowLogs}
      />

      <QuickUseSheets tool={tool} state={state} />

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirm Processing"
        description={`This will process ${
            tool.id === 'sales-traffic-drilldown' ? (Math.max(pendingUrlList.length, 1)) :
            pendingUrlList.length
        } items. Are you sure you want to continue?`}
        confirmText={`Start (${
             // Logic for credit calculation display (Front-end only estimation)
             // Sales Traffic Drilldown: min 1 credit
             tool.id === 'sales-traffic-drilldown' ? (Math.max(pendingUrlList.length, 1) * ((tool as any).creditsPerUrl || 1)) :
             pendingUrlList.length * ((tool as any).creditsPerUrl || 1)
        } Credits)`}
        onConfirm={() => confirmStart()}
      />

      <PlanRestrictionDialog 
        open={restrictionOpen} 
        onClose={() => setRestrictionOpen(false)}
        state={restrictionState}
      />

      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        tool={tool} 
      />
    </div>
  );
};
