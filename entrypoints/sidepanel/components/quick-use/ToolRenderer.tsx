import React, { Suspense } from 'react';
import type { Tool } from '../../lib/tools';
import { DownloadType } from '../../components/inputs/DownloadTypeSelector';
import { toolDefinitions } from '@/lib/tool-definitions';
import { GenericToolInputs } from './GenericToolInputs';
import { Skeleton } from '@/components/ui/skeleton';

interface ToolRendererProps {
  tool: Tool;
  customToolData: any;
  setCustomToolData: (data: any) => void;
  sqpDownloadType: DownloadType;
  sqpOutputFormat: string;
  isProcessing: boolean;
  // Generic Props
  marketplace: string;
  setMarketplace: (value: string) => void;
  urls: string;
  setUrls: (value: string) => void;
  handleClearUrls: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingCsv: boolean;
}

export const ToolRenderer: React.FC<ToolRendererProps> = ({
  tool,
  customToolData,
  setCustomToolData,
  sqpDownloadType,
  sqpOutputFormat,
  isProcessing,
  marketplace,
  setMarketplace,
  urls,
  setUrls,
  handleClearUrls,
  handleFileChange,
  isLoadingCsv
}) => {


  const toolDef = toolDefinitions.find(t => t.id === tool.id) || toolDefinitions.find(t => t.name === tool.name);
  const ToolComponent = (toolDef?.component || GenericToolInputs) as React.ComponentType<any>;

  return (
    <Suspense fallback={
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    }>
        <ToolComponent
            // Standard Props
            toolId={tool.id}
            onDataChange={setCustomToolData}
            initialData={customToolData}
            
            // SQP / Export Specific Props
            downloadType={sqpDownloadType}
            outputFormat={sqpOutputFormat}
            
            // Generic / Metrics Props
            marketplace={marketplace}
            setMarketplace={setMarketplace}
            urls={urls}
            setUrls={setUrls}
            isProcessing={isProcessing}
            handleClearUrls={handleClearUrls}
            handleFileChange={handleFileChange}
            isLoadingCsv={isLoadingCsv}
            
            // Fallback for GenericToolInputs
            inputLabel="Enter URLs"
            helperText="One URL per line"
        />
    </Suspense>
  );
};
