import React, { useState } from 'react';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, ExternalLink, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ToolDashboardTemplate } from '../../components/ToolDashboardTemplate';
import { usePriceTrackers } from '@/lib/hooks/usePriceTrackers';
import { DataTable } from '@/components/data-table/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { PriceTracker } from '@/lib/db/schema';
import { priceTrackerService } from '@/lib/services/tools/price-tracker.service';
import { formatDistanceToNow } from 'date-fns';
import { CreateScheduleDialog } from '../../components/CreateScheduleDialog';
import { useSchedulesLogic } from '../schedules/useSchedulesLogic';

export const PriceTrackerPage: React.FC = () => {
    const { tools, loading: toolsLoading } = useRemoteTools();
    const { trackers, loading: trackersLoading, refresh } = usePriceTrackers();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Reuse scheduling logic for creation
    const { handleScheduleCreation } = useSchedulesLogic();

    const toolId = 'price-tracker';
    const tool = tools.find(t => t.id === toolId);
    
    // ... (lines omitted)

            <CreateScheduleDialog 
                open={isCreateOpen} 
                setOpen={setIsCreateOpen} 
                onScheduleCreated={refresh}
                onCreateSchedule={handleScheduleCreation}
                preselectedTool="price-tracker"
            />

    const handleRunNow = async () => {
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

    const handleCreateTracker = () => {
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this tracker? History will be lost.')) {
            await priceTrackerService.deleteTracker(id);
            refresh();
        }
    };

    if (toolsLoading || trackersLoading) {
        return <PageLoading text="Loading Price Tracker..." />;
    }

    if (!tool) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold">Tool Not Found</h2>
                <Button variant="outline" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }

    const columns: ColumnDef<PriceTracker>[] = [
        {
            accessorKey: 'image',
            header: 'Product',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    {row.original.image ? (
                        <img src={row.original.image} alt="" className="w-10 h-10 object-contain rounded bg-white p-1 border" />
                    ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">No Img</div>
                    )}
                    <div className="flex flex-col max-w-[300px]">
                        <span className="font-medium truncate text-sm" title={row.original.title}>{row.original.title || row.original.asin}</span>
                        <span className="text-xs text-muted-foreground font-mono">{row.original.asin}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'marketplace',
            header: 'Market',
            cell: ({ row }) => <Badge variant="outline">{row.getValue('marketplace')}</Badge>
        },
        {
            accessorKey: 'lastRunAt',
            header: 'Last Check',
            cell: ({ row }) => {
                const date = row.getValue('lastRunAt') as string;
                return <span className="text-xs text-muted-foreground">
                    {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'Never'}
                </span>
            }
        },
        {
            accessorKey: 'frequency',
            header: 'Frequency',
            cell: ({ row }) => <span className="capitalize text-sm">{row.getValue('frequency')}</span>
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const asin = row.original.asin;
                const mkp = row.original.marketplace;
                const domain = mkp === 'us' ? 'com' : mkp; // Simplified
                const url = `https://www.amazon.${domain}/dp/${asin}`;
                
                return (
                    <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon" title="View on Amazon" onClick={() => window.open(url, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete Tracker" onClick={() => handleDelete(row.original.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            }
        }
    ];

    const config = {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        icon: tool.icon,
        category: tool.category,
    };


    return (
        <ToolDashboardTemplate 
            config={config} 
            hideHeader={false}
            hideCharts={true}
            hideRecentItems={true}
            onRunNow={handleRunNow}
            runLabel="Quick Check"
        >

            {/* My Trackers Section */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">My Trackers</CardTitle>
                            <CardDescription>Monitor {trackers.length} active products</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                            <Button size="sm" onClick={handleCreateTracker} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Tracker
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable 
                        columns={columns} 
                        data={trackers} 
                        showGlobalFilter={true}
                        searchPlaceholder="Search by ASIN..."
                    />
                </CardContent>
            </Card>

            <CreateScheduleDialog 
                open={isCreateOpen} 
                setOpen={setIsCreateOpen} 
                onScheduleCreated={refresh}
                onCreateSchedule={handleScheduleCreation}
                preselectedTool="price-tracker"
            />

        </ToolDashboardTemplate>
    );
};

export default PriceTrackerPage;
