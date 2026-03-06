import React from 'react';
import { DownloadTypeSelector, DownloadType } from './inputs/DownloadTypeSelector';
import { OutputFormatSelector } from './OutputFormatSelector';
import { SettingsSheet } from './SettingsSheet';

interface SQPExportSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  downloadType: DownloadType;
  onDownloadTypeChange: (value: DownloadType) => void;
  outputFormat: string;
  onOutputFormatChange: (value: string) => void;
}

export const SQPExportSettingsSheet: React.FC<SQPExportSettingsSheetProps> = ({
  isOpen,
  onClose,
  downloadType,
  onDownloadTypeChange,
  outputFormat,
  onOutputFormatChange,
}) => {
  return (
    <SettingsSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Export Settings"
      description="Configure download preferences and output formats"
    >
      <DownloadTypeSelector
        value={downloadType}
        onChange={onDownloadTypeChange}
      />
      <OutputFormatSelector
        value={outputFormat}
        onChange={onOutputFormatChange}
        allowedFormats={['csv', 'excel', 'json']}
      />
    </SettingsSheet>
  );
};
