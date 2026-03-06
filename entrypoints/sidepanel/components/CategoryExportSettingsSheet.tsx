import React from 'react';
import { SettingsSheet } from './SettingsSheet';
import { OutputFormatSelector } from './OutputFormatSelector';

interface CategoryExportSettingsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    outputFormat: string;
    onOutputFormatChange: (format: string) => void;
}

export const CategoryExportSettingsSheet: React.FC<CategoryExportSettingsSheetProps> = ({
    open,
    onOpenChange,
    outputFormat,
    onOutputFormatChange,
}) => {
    return (
        <SettingsSheet
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title="Export Settings"
            description="Configure how your category insights data is exported."
        >
            <div className="space-y-6">
                <OutputFormatSelector
                    value={outputFormat}
                    onChange={onOutputFormatChange}
                    allowedFormats={['csv', 'excel', 'json']}
                />
            </div>
        </SettingsSheet>
    );
};
