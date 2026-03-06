import React from 'react';
import type { Tool } from '../../../lib/tools';
import { ProcessingSettingsSheet } from '../../../components/ProcessingSettingsSheet';
import { GenericExportSettingsSheet } from '../../../components/GenericExportSettingsSheet';
import { useQuickUseState } from '../hooks/useQuickUseState';

interface QuickUseSheetsProps {
  tool: Tool;
  state: ReturnType<typeof useQuickUseState>;
}

export const QuickUseSheets: React.FC<QuickUseSheetsProps> = ({ tool, state }) => {
  const {
      showSettings, setShowSettings, settings, setSettings,
      showExportSettings, setShowExportSettings, sqpDownloadType, handleSqpDownloadTypeChange,
      sqpOutputFormat, handleSqpOutputFormatChange,
      showCategoryExportSettings, setShowCategoryExportSettings,
      asinOutputFormat, categoryOutputFormat, handleCategoryOutputFormatChange, handleAsinOutputFormatChange,
      showSalesTrafficExportSettings, setShowSalesTrafficExportSettings, salesTrafficOutputFormat, handleSalesTrafficOutputFormatChange
  } = state;

  return (
    <>
      <ProcessingSettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <GenericExportSettingsSheet
        isOpen={showExportSettings}
        onClose={() => setShowExportSettings(false)}
        title="SQP Export Settings"
        description="Configure SQP download preferences"
        downloadType={sqpDownloadType}
        onDownloadTypeChange={handleSqpDownloadTypeChange}
        outputFormat={sqpOutputFormat}
        onOutputFormatChange={handleSqpOutputFormatChange}
      />
      
      <GenericExportSettingsSheet
        isOpen={showCategoryExportSettings}
        onClose={() => setShowCategoryExportSettings(false)}
        title="Export Settings"
        description="Configure export format"
        outputFormat={tool.exportParams?.stateBinding === 'asin' ? asinOutputFormat : categoryOutputFormat}
        onOutputFormatChange={tool.exportParams?.stateBinding === 'asin' ? handleAsinOutputFormatChange : handleCategoryOutputFormatChange}
      />

      <GenericExportSettingsSheet
        isOpen={showSalesTrafficExportSettings}
        onClose={() => setShowSalesTrafficExportSettings(false)}
        title="Sales & Traffic Export"
        description="Configure output format for Sales & Traffic Report"
        outputFormat={salesTrafficOutputFormat}
        onOutputFormatChange={handleSalesTrafficOutputFormatChange}
      />
    </>
  );
};
