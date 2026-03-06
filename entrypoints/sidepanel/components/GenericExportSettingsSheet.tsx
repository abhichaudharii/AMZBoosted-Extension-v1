import React from 'react';
import { DownloadTypeSelector, DownloadType } from './inputs/DownloadTypeSelector';
import { OutputFormatSelector } from './OutputFormatSelector';
import { SettingsSheet } from './SettingsSheet';

interface GenericExportSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  outputFormat: string;
  onOutputFormatChange: (value: string) => void;
  downloadType?: DownloadType;
  onDownloadTypeChange?: (value: DownloadType) => void;
  title?: string;
  description?: string;
}

export const GenericExportSettingsSheet: React.FC<GenericExportSettingsSheetProps> = ({
  isOpen,
  onClose,
  outputFormat,
  onOutputFormatChange,
  downloadType,
  onDownloadTypeChange,
  title = "Export Settings",
  description = "Configure export preferences and output formats",
}) => {
  return (
    <SettingsSheet
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      {/* Only show Download Type selector if props are provided */}
      {downloadType && onDownloadTypeChange && (
        <DownloadTypeSelector
          value={downloadType}
          onChange={onDownloadTypeChange}
        />
      )}
      
      <OutputFormatSelector
        value={outputFormat}
        onChange={onOutputFormatChange}
        allowedFormats={['csv', 'excel', 'json']}
      />
    </SettingsSheet>
  );
};
