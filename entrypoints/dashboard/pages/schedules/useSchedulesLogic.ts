import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { secureStorage } from '@/lib/storage/secure-storage';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { usePageState } from '@/lib/hooks/usePersistedState';
import { checkAccess } from '@/lib/utils/access-control';
import { SubscriptionState } from '@/lib/utils/subscription';
import type { Schedule as ScheduleType } from '@/lib/db/schema';

// UI representation of a schedule (mapped from database Schedule)
export interface UISchedule {
    id: string;
    name: string;
    tool: string;
    toolId: string;
    frequency: string;
    nextRun: Date;
    lastRun: Date | null;
    status: 'active' | 'paused';
    marketplace: string;
    urlCount: number;
    enabled: boolean;
    createdAt: Date;
    outputFormat: string;
    targetPreview: string;
    time?: string;
    days?: string[];
    timezone?: string;
    cronExpression?: string;
}

export const useSchedulesLogic = () => {
    // Persisted page state (filters, search, etc)
    const [pageState, updatePageState] = usePageState('schedules', {
        toolFilter: 'all',
        statusFilter: 'all',
        frequencyFilter: 'all',
        marketplaceFilter: 'all',
        searchQuery: '',
        columnVisibility: {},
    });

    // Use dynamic tools
    const { tools } = useRemoteTools();

    // Use IndexedDB hook
    const {
        schedules: allSchedules,
        loading,
        error,
        loadSchedules,
        createSchedule,
        createSchedulesBatch,
        updateSchedule,
        deleteSchedule,
        getScheduleById,
    } = useSchedules({ autoLoad: true, pollInterval: 50000 });

    const [toggling, setToggling] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [filteredSchedules, setFilteredSchedules] = useState<UISchedule[]>([]);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [pendingRun, setPendingRun] = useState<any | null>(null);
    const [pendingToggle, setPendingToggle] = useState<any | null>(null);
    const [pendingDelete, setPendingDelete] = useState<any | null>(null);
    const [runningSchedules, setRunningSchedules] = useState<Set<string>>(new Set());
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Restriction State
    const [restrictionOpen, setRestrictionOpen] = useState(false);
    const [restrictionState, setRestrictionState] = useState<SubscriptionState>(SubscriptionState.NO_PLAN);

    const checkPermission = async (_feature: string): Promise<boolean> => {
        const result = await secureStorage.get('subscriptionStatus');
        const status = result.subscriptionStatus;
        const { allowed, reason } = checkAccess(status);

        if (!allowed && reason) {
            setRestrictionState(reason);
            setRestrictionOpen(true);
            return false;
        }
        return true;
    };

    // Map IndexedDB schedules to UI format
    const mappedSchedules = allSchedules.map((schedule) => {
        const tool = tools.find(t => t.id === schedule.toolId);
        const toolName = tool?.name || 'Unknown Tool';

        // Determine target preview
        let targetPreview = `${schedule.urls.length} items`;
        if (schedule.toolId === 'category-insights' && schedule.options?.keywords) {
            const keywords = schedule.options.keywords.split('\n').filter((k: string) => k.trim());
            targetPreview = `${keywords.length} Keywords`;
        } else if (schedule.toolId.includes('sqr')) {
            targetPreview = `${schedule.urls.length} ASINs`;
        } else {
            targetPreview = `${schedule.urls.length} URLs`;
        }

        return {
            id: schedule.id,
            name: schedule.name || 'Unnamed Schedule',
            tool: toolName,
            toolId: schedule.toolId,
            frequency: schedule.frequency || 'daily',
            nextRun: schedule.nextRunAt ? new Date(schedule.nextRunAt) : new Date(),
            lastRun: schedule.lastRunAt ? new Date(schedule.lastRunAt) : null,
            status: (schedule.enabled ? 'active' : 'paused') as 'active' | 'paused',
            marketplace: (schedule.marketplace || 'US').toUpperCase(),
            urlCount: Array.isArray(schedule.urls) ? schedule.urls.length : 0,
            enabled: schedule.enabled,
            createdAt: schedule.createdAt ? new Date(schedule.createdAt) : new Date(),
            outputFormat: schedule.outputFormat || 'csv',
            targetPreview,
            time: schedule.time,
            days: schedule.days,
            timezone: schedule.timezone,
            cronExpression: schedule.cronExpression,
        };
    });

    // Filter handlers
    const applyFilters = () => {
        let filtered = mappedSchedules;

        // Search filter
        if (pageState.searchQuery) {
            const query = pageState.searchQuery.toLowerCase();
            filtered = filtered.filter((s) =>
                s.tool.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
            );
        }

        if (pageState.toolFilter !== 'all') {
            filtered = filtered.filter((s) => s.toolId === pageState.toolFilter);
        }

        if (pageState.statusFilter !== 'all') {
            filtered = filtered.filter((s) => s.status === pageState.statusFilter);
        }

        if (pageState.frequencyFilter !== 'all') {
            filtered = filtered.filter((s) => s.frequency === pageState.frequencyFilter);
        }

        if (pageState.marketplaceFilter !== 'all') {
            filtered = filtered.filter((s) => s.marketplace === pageState.marketplaceFilter);
        }

        setFilteredSchedules(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [pageState.searchQuery, pageState.toolFilter, pageState.statusFilter, pageState.frequencyFilter, pageState.marketplaceFilter, allSchedules, tools]);

    // Show error toast if loading fails
    useEffect(() => {
        if (error) {
            toast.error('Failed to load schedules', {
                description: error,
            });
        }
    }, [error]);


    // Wrapper for createSchedule to handle Limit errors
    const handleScheduleCreation = async (data: Partial<ScheduleType>) => {
        // 1. Client-side Pre-check
        if (!(await checkPermission('Schedule Creation'))) {
            setIsCreateDialogOpen(false);
            return;
        }

        try {
            await createSchedule(data as any);
            setIsCreateDialogOpen(false);
        } catch (error: any) {
            console.error('[SchedulesPage] Creation failed:', error);
            const msg = error instanceof Error ? error.message : String(error);

            const lowerMsg = msg.toLowerCase();
            if (lowerMsg.includes('limit') || lowerMsg.includes('maximum')) {
                setIsCreateDialogOpen(false); // Close create dialog
                setRestrictionState(SubscriptionState.PLAN_ACTIVE); // Assume active plan if Limit reached (usually)
                setRestrictionOpen(true);
            } else if (lowerMsg.includes('expired') || lowerMsg.includes('plan') || lowerMsg.includes('upgrade') || lowerMsg.includes('trial') || lowerMsg.includes('allowed')) {
                setIsCreateDialogOpen(false);
                setRestrictionState(SubscriptionState.TRIAL_EXPIRED);
                setRestrictionOpen(true);
            } else {
                // Re-throw or toast for other errors
                toast.error('Failed to create schedule', { description: msg });
                throw error; // Re-throw so the dialog knows it failed
            }
        }
    };

    const handleUpdateSchedule = async (id: string, data: any) => {
        // 1. Client-side Pre-check
        if (!(await checkPermission('Schedule Editing'))) {
            setEditingScheduleId(null);
            return;
        }

        try {
            await updateSchedule(id, data);
            setIsCreateDialogOpen(false);
            setEditingScheduleId(null);
        } catch (error: any) {
            console.error('[SchedulesPage] Update failed:', error);

            const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
            if (msg.includes('expired') || msg.includes('upgrade') || msg.includes('trial') || msg.includes('allowed')) {
                setRestrictionState(SubscriptionState.TRIAL_EXPIRED);
                setRestrictionOpen(true);
            } else {
                toast.error('Failed to update schedule');
            }
        }
    }

    // Handle toggle schedule (pause/resume)
    const handleToggleSchedule = async (schedule: any) => {
        if (!(await checkPermission('Automated Schedules'))) return;
        setPendingToggle(schedule);
    };

    const confirmToggleSchedule = async () => {
        if (!pendingToggle) return;

        // 2. Client-side Pre-check (Double check before API call and loading state)
        if (!(await checkPermission('Automated Schedules'))) {
            setPendingToggle(null);
            return;
        }

        try {
            setToggling(pendingToggle.id);
            const newStatus = pendingToggle.status === 'active' ? false : true;
            const action = newStatus ? 'Resuming' : 'Pausing';

            toast.loading(`${action} schedule...`, {
                id: `toggle-${pendingToggle.id}`,
            });

            await updateSchedule(pendingToggle.id, {
                enabled: newStatus,
            });

            toast.success(`Schedule ${newStatus ? 'resumed' : 'paused'}`, {
                id: `toggle-${pendingToggle.id}`,
                description: `${pendingToggle.tool} is now ${newStatus ? 'active' : 'paused'}`,
            });

            setPendingToggle(null);
        } catch (error: any) {
            console.error('[SchedulesPage] Error toggling schedule:', error);

            const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
            if (msg.includes('expired') || msg.includes('upgrade') || msg.includes('trial') || msg.includes('allowed')) {
                setRestrictionState(SubscriptionState.TRIAL_EXPIRED);
                setRestrictionOpen(true);
            } else {
                toast.error('Failed to update schedule', {
                    id: `toggle-${pendingToggle.id}`,
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            setPendingToggle(null);
        } finally {
            setToggling(null);
        }
    };

    // Handle edit schedule
    const handleEditSchedule = async (schedule: UISchedule) => {
        if (!(await checkPermission('Schedule Editing'))) return;
        setEditingScheduleId(schedule.id);
        setIsCreateDialogOpen(true);
    };

    const handleCreateNew = async () => {
        if (!(await checkPermission('Schedule Creation'))) return;
        setEditingScheduleId(null);
        setIsCreateDialogOpen(true);
    };

    // Handle delete single schedule
    const handleDeleteSingleSchedule = async (schedule: any) => {
        if (!(await checkPermission('Schedule Deletion'))) return;
        setPendingDelete(schedule);
    };

    const confirmDeleteSchedule = async () => {
        if (!pendingDelete) return;

        try {
            setDeleting(true);

            // Get the full schedule data before deletion
            const fullSchedule = await getScheduleById(pendingDelete.id);
            if (!fullSchedule) {
                toast.error('Schedule not found');
                setPendingDelete(null);
                setDeleting(false);
                return;
            }

            // Delete immediately
            await deleteSchedule(pendingDelete.id);

            // Store timeout ID for cancellation
            let timeoutId: NodeJS.Timeout | null = null;

            // Show success toast with undo action
            toast.success('Schedule deleted', {
                id: `delete-${pendingDelete.id}`,
                description: `${pendingDelete.tool} has been removed`,
                duration: 5000,
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        try {
                            // Restore the schedule
                            await createSchedule(fullSchedule);
                            await loadSchedules();
                            toast.success('Schedule restored', {
                                description: `${fullSchedule.name} has been restored`,
                            });
                        } catch (error) {
                            console.error('[SchedulesPage] Error restoring schedule:', error);
                            toast.error('Failed to restore schedule');
                        }
                    },
                },
            });

            setPendingDelete(null);
        } catch (error) {
            console.error('[SchedulesPage] Error deleting schedule:', error);
            toast.error('Failed to delete schedule', {
                id: `delete-${pendingDelete.id}`,
                description: error instanceof Error ? error.message : 'Unknown error',
            });
            setPendingDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        updatePageState({
            searchQuery: '',
            toolFilter: 'all',
            statusFilter: 'all',
            frequencyFilter: 'all',
            marketplaceFilter: 'all',
        });
    };

    // Bulk action handlers
    const [pendingBulkDelete, setPendingBulkDelete] = useState<{ schedules: UISchedule[], clearSelection: () => void } | null>(null);

    // ... (existing state) ...

    // Bulk action handlers
    const handleBulkDelete = async (selectedSchedules: UISchedule[], clearSelection: () => void) => {
        if (!(await checkPermission('Schedule Deletion'))) return;
        setPendingBulkDelete({ schedules: selectedSchedules, clearSelection });
    };

    const confirmBulkDelete = async () => {
        if (!pendingBulkDelete) return;
        const { schedules: selectedSchedules, clearSelection } = pendingBulkDelete;

        try {
            setDeleting(true);
            const count = selectedSchedules.length;

            toast.loading(`Deleting ${count} schedule${count > 1 ? 's' : ''}...`, {
                id: 'bulk-delete-schedules',
            });

            // Get full schedule data before deletion
            const fullSchedules = await Promise.all(
                selectedSchedules.map(schedule => getScheduleById(schedule.id))
            );
            const validSchedules = fullSchedules.filter(s => s != null);

            // Delete schedules via IndexedDB
            const deletePromises = selectedSchedules.map(schedule =>
                deleteSchedule(schedule.id)
            );

            await Promise.all(deletePromises);

            // Store timeout ID for cancellation
            let timeoutId: NodeJS.Timeout | null = null;

            toast.success(`${count} schedule${count > 1 ? 's' : ''} deleted`, {
                id: 'bulk-delete-schedules',
                description: 'The selected schedules have been removed',
                duration: 5000,
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                        }
                        try {
                            // Restore all schedules
                            await Promise.all(validSchedules.map(schedule => createSchedule(schedule)));
                            await loadSchedules();
                            toast.success(`${count} schedule${count > 1 ? 's' : ''} restored`, {
                                description: 'All deleted schedules have been restored',
                            });
                        } catch (error) {
                            console.error('[SchedulesPage] Error restoring schedules:', error);
                            toast.error('Failed to restore schedules');
                        }
                    },
                },
            });

            clearSelection();
        } catch (error) {
            console.error('[SchedulesPage] Error deleting schedules:', error);
            toast.error('Failed to delete schedules', {
                id: 'bulk-delete-schedules',
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setDeleting(false);
            setPendingBulkDelete(null);
        }
    };

    const handleBulkPauseResume = async (selectedSchedules: UISchedule[], clearSelection: () => void) => {
        if (!(await checkPermission('Automated Schedules'))) return;

        try {
            const activeCount = selectedSchedules.filter((s) => s.status === 'active').length;
            const shouldPause = activeCount > 0;
            const count = selectedSchedules.length;
            const action = shouldPause ? 'Pausing' : 'Resuming';

            toast.loading(`${action} ${count} schedule${count > 1 ? 's' : ''}...`, {
                id: 'bulk-pause-resume',
            });

            // Update all selected schedules
            const updatePromises = selectedSchedules.map(schedule =>
                updateSchedule(schedule.id, {
                    enabled: !shouldPause,
                })
            );

            await Promise.all(updatePromises);

            const actionPast = shouldPause ? 'paused' : 'resumed';
            toast.success(`${count} schedule${count > 1 ? 's' : ''} ${actionPast}`, {
                id: 'bulk-pause-resume',
                description: `All selected schedules have been ${actionPast}`,
            });

            clearSelection();
        } catch (error) {
            console.error('[SchedulesPage] Error updating schedules:', error);
            toast.error('Failed to update schedules', {
                id: 'bulk-pause-resume',
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleBulkDuplicate = async (selectedSchedules: UISchedule[], clearSelection: () => void) => {
        if (!(await checkPermission('Schedule Creation'))) return;

        try {
            const count = selectedSchedules.length;

            toast.loading(`Duplicating ${count} schedule${count > 1 ? 's' : ''}...`, {
                id: 'bulk-duplicate-schedules',
            });

            // Get full details for each schedule and prepare duplicates
            const schedulesToCreate: ScheduleType[] = [];

            for (const schedule of selectedSchedules) {
                const fullSchedule = await getScheduleById(schedule.id);

                if (!fullSchedule) {
                    console.warn(`Schedule ${schedule.id} not found, skipping`);
                    continue;
                }

                // Create a duplicate with all the original data
                const newSchedule: ScheduleType = {
                    ...fullSchedule,
                    id: crypto.randomUUID(),
                    name: `${fullSchedule.name} (Copy)`,
                    enabled: false, // Create as paused so user can review
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    nextRunAt: new Date().toISOString(),
                };

                schedulesToCreate.push(newSchedule);
            }

            // Create all schedules in batch (checks permission once)
            if (schedulesToCreate.length > 0) {
                await createSchedulesBatch(schedulesToCreate);
            }

            toast.success(`${count} schedule${count > 1 ? 's' : ''} duplicated`, {
                id: 'bulk-duplicate-schedules',
                description: 'New copies created (paused for review)',
            });

            clearSelection();
        } catch (error) {
            console.error('[SchedulesPage] Error duplicating schedules:', error);
            toast.error('Failed to duplicate schedules', {
                id: 'bulk-duplicate-schedules',
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleRunSchedule = async (schedule: any) => {
        if (!(await checkPermission('Manual Execution'))) return;
        setPendingRun(schedule);
    };

    const confirmRunSchedule = async () => {
        if (!pendingRun) return;

        // 2. Client-side Pre-check 
        if (!(await checkPermission('Manual Execution'))) {
            setPendingRun(null);
            return;
        }

        try {
            // Add to running set
            setRunningSchedules(prev => new Set(prev).add(pendingRun.id));
            const toastId = `run-schedule-${pendingRun.id}-${Date.now()}`;

            toast.loading(`Running ${pendingRun.name}...`, {
                id: toastId,
            });

            // Send message to background script to run the schedule with manual trigger flag
            const response = await chrome.runtime.sendMessage({
                type: 'RUN_SCHEDULE',
                scheduleId: pendingRun.id,
                triggeredBy: 'manual', // Mark as manually triggered
            });

            if (!response.success) {
                throw new Error(response.result?.reason || response.error || 'Failed to run schedule');
            }

            const result = response.result;

            // Refresh the list to show updated lastRunAt
            await loadSchedules();

            if (result.success) {
                toast.success(`Schedule "${pendingRun.name}" completed`, {
                    id: toastId,
                    description: `Processed ${result.urlsProcessed || pendingRun.urlCount} URLs using ${result.creditsUsed || 0} credits`,
                });
            } else {
                toast.warning(`Schedule "${pendingRun.name}" completed with errors`, {
                    id: toastId,
                    description: result.reason || 'Some URLs failed to process',
                });
            }

            setPendingRun(null);
        } catch (error: any) {
            console.error('[SchedulesPage] Error running schedule:', error);

            const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
            if (msg.includes('expired') || msg.includes('upgrade') || msg.includes('trial') || msg.includes('allowed')) {
                setRestrictionState(SubscriptionState.TRIAL_EXPIRED);
                setRestrictionOpen(true);
            } else {
                toast.error('Failed to run schedule', {
                    id: `run-schedule-${pendingRun.id}-error`, // Unique ID for error too
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            setPendingRun(null);
        } finally {
            // Remove from running set
            setRunningSchedules(prev => {
                const next = new Set(prev);
                next.delete(pendingRun?.id);
                return next;
            });
        }
    };

    // Handle loading saved view
    const handleLoadView = (filters: Record<string, any>) => {
        updatePageState(filters);
    };

    return {
        // State
        pageState,
        allSchedules,
        filteredSchedules,
        mappedSchedules,
        loading,
        error,
        tools,
        toggling,
        deleting,
        editingScheduleId,
        pendingRun,
        pendingToggle,
        pendingDelete,
        runningSchedules,
        isCreateDialogOpen,
        restrictionOpen,
        restrictionState,

        // Actions
        updatePageState,
        setIsCreateDialogOpen,
        setRestrictionOpen,
        setPendingToggle,
        setPendingDelete,
        setPendingRun,
        pendingBulkDelete,
        setPendingBulkDelete,
        confirmBulkDelete,

        // Handlers
        loadSchedules,
        handleScheduleCreation,
        handleUpdateSchedule,
        handleToggleSchedule,
        confirmToggleSchedule,
        handleEditSchedule,
        handleCreateNew,
        handleDeleteSingleSchedule,
        confirmDeleteSchedule,
        handleClearFilters,
        handleBulkDelete,
        handleBulkPauseResume,
        handleBulkDuplicate,
        handleRunSchedule,
        confirmRunSchedule,
        handleLoadView,
    };
};
