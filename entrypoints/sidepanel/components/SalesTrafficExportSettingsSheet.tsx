import React from 'react';
import { OutputFormatSelector } from './OutputFormatSelector';
import { SettingsSheet } from './SettingsSheet';

interface SalesTrafficExportSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  outputFormat: string;
  onOutputFormatChange: (value: string) => void;
}

export const SalesTrafficExportSettingsSheet: React.FC<SalesTrafficExportSettingsSheetProps> = ({
  isOpen,
  onClose,
  outputFormat,
  onOutputFormatChange,
}) => {
  return (
    <SettingsSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Export Settings"
      description="Configure output format for Sales & Traffic Report"
    >
      <OutputFormatSelector
        value={outputFormat}
        onChange={onOutputFormatChange}
        allowedFormats={['csv', 'excel', 'json']}
      />
    </SettingsSheet>
  );
};
