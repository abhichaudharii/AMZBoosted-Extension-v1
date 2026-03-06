import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ToolDashboardTemplate, ToolDashboardConfig } from '../../components/ToolDashboardTemplate';
import { getToolDefinition } from '@/lib/tool-definitions';

export const GenericToolPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const { tools, loading } = useRemoteTools();
  const navigate = useNavigate();

  // Try to find in remote tools (database source of truth)
  const remoteTool = tools.find(t => t.id === toolId);
  // Fallback to local definitions for static metadata if remote fails or is inconsistent
  const localDef = toolId ? getToolDefinition(toolId) : undefined;

  const handleRunNow = async () => {
    if (!toolId) return;
    try {
      const window = await chrome.windows.getCurrent();
      if (window.id) {
        await chrome.runtime.sendMessage({ 
          type: 'OPEN_SIDEPANEL', 
          windowId: window.id,
          toolId
        });
      }
    } catch (error) {
      console.error('Failed to open sidepanel:', error);
    }
  };

  if (loading) {
    return <PageLoading text="Loading Tool..." />;
  }

  // We need at least one source of truth
  const toolName = remoteTool?.name || localDef?.name;
  
  if (!toolId || !toolName) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <h2 className="text-xl font-semibold">Tool Not Found</h2>
              <p className="text-muted-foreground">Could not load configuration for {toolId || 'unknown tool'}</p>
              <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
              </Button>
          </div>
      );
  }

  const config: ToolDashboardConfig = {
      id: toolId,
      name: toolName,
      description: remoteTool?.description || localDef?.description || '',
      icon: remoteTool?.icon || localDef?.iconName || 'Activity',
      category: remoteTool?.category || localDef?.category || 'General',
  };

  return (
    <ToolDashboardTemplate 
      config={config} 
      hiddenTabs={['quick-use', 'reports', 'settings']}
      hideRecentItems={true}
      onRunNow={handleRunNow}
    />
  );
};

export default GenericToolPage;
