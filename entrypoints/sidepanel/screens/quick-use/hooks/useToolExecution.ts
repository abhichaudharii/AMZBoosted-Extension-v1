import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { checkAccess } from '@/lib/utils/access-control';
import { SubscriptionState } from '@/lib/utils/subscription';
import { secureStorage } from '@/lib/storage/secure-storage';
import type { Tool } from '../../../lib/tools';
import type { JobStatus } from '../../../lib/types';
import { useQuickUseState } from './useQuickUseState';

export const useToolExecution = (
    tool: Tool,
    state: ReturnType<typeof useQuickUseState>
) => {
    const [activeRunId, setActiveRunId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [restrictionOpen, setRestrictionOpen] = useState(false);
    const [restrictionState, setRestrictionState] = useState<SubscriptionState>(SubscriptionState.NO_PLAN);

    const {
        settings, marketplace, customToolData, sqpDownloadType, categoryOutputFormat,
        salesTrafficOutputFormat, asinOutputFormat, sqpOutputFormat, setJobs,
        urls, csvFile, setPendingUrlList, setShowConfirmDialog, addLog
    } = state;

    const checkPermission = async (): Promise<boolean> => {
        try {
            const result = await secureStorage.get('subscriptionStatus');
            const status = result.subscriptionStatus;
            const { allowed, reason } = checkAccess(status);

            if (!allowed && reason) {
                setRestrictionState(reason);
                setRestrictionOpen(true);
                return false;
            }
            return true;
        } catch (e) {
            console.error('Permission check failed', e);
            return false;
        }
    };

    const executeToolRun = async (urlList: string[]) => {
        try {
            const { toolService } = await import('@/lib/services/tool.service');
            addLog('info', 'Checking permissions and credits...');
            const result = await toolService.executeTool({
                toolId: tool.id,
                toolName: tool.name,
                marketplace: customToolData?.marketplace || marketplace,
                urls: urlList,
                options: {
                    delay: settings.delay,
                    autoRetry: settings.autoRetry,
                    slowMode: settings.slowMode,
                    smartScrape: settings.smartScrape,
                    ...customToolData,
                    downloadType: sqpDownloadType,
                    outputFormat: tool.id === 'category-insights' ? categoryOutputFormat :
                        (tool.id === 'sales-traffic-drilldown' || tool.exportParams?.stateBinding === 'salesTraffic' ? salesTrafficOutputFormat :
                            (tool.exportParams?.stateBinding === 'asin' ? asinOutputFormat : sqpOutputFormat))
                },
            });

            if (!result.success) {
                addLog('error', `Failed: ${result.error}`);
                toast.error('Tool Run Failed', { description: result.error || 'An error occurred' });
                setIsProcessing(false);
                return;
            }

            addLog('success', `Credits deducted: ${result.creditsUsed}`);
            addLog('success', `Run ID: ${result.runId}`);
            if (result.runId) setActiveRunId(result.runId);

            if (result.results && result.results.length > 0) {
                setJobs((prev) =>
                    prev.map((job, index) => {
                        if (result.results![index]) {
                            return { ...job, status: 'completed', progress: 100 };
                        }
                        return job;
                    })
                );
            }

            if (result.errors && result.errors.length > 0) {
                result.errors.forEach((error) => addLog('error', error));
            }

            const processedCount = result.processedCount !== undefined ? result.processedCount : (result.results?.length || 0);
            addLog('success', `All jobs completed. Processed ${processedCount} inputs`);

            toast.success('Tool Run Complete', {
                description: `Successfully processed ${processedCount} inputs using ${result.creditsUsed} credits`,
            });

            setIsProcessing(false);
            setActiveRunId(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addLog('error', `Execution failed: ${errorMessage}`);
            toast.error('Execution Failed', { description: errorMessage });
            setIsProcessing(false);
        }
    };

    const confirmStart = async (urlsToProcess?: string[]) => {
        const urlList = urlsToProcess || state.pendingUrlList;
        let newJobs: JobStatus[] = urlList.map((url, index) => ({
            id: `job-${Date.now()}-${index}`,
            url: url.trim(),
            status: 'pending',
            progress: 0,
        }));

        if (tool.id === 'sales-traffic-drilldown' && newJobs.length === 0) {
            newJobs = [{
                id: `job-${Date.now()}-all`,
                url: 'Full Date Range Report (All Items)',
                status: 'pending',
                progress: 0
            }];
        }

        setJobs(newJobs);
        setIsProcessing(true);
        setShowConfirmDialog(false);
        addLog('info', `Processing started with ${newJobs.length} URLs`);

        await executeToolRun(urlList);
    };

    const handleStart = async () => {
        try {
            const hasAccess = await checkPermission();
            if (!hasAccess) return;
        } catch (error) {
            console.error('[QuickUse] Permission check error:', error);
            return;
        }

        if (tool.id === 'sqr-simple' || tool.id === 'sqr-detail') {
            if (!customToolData || !customToolData.asins || customToolData.asins.length === 0) {
                toast.error('No ASINs provided', { description: 'Please enter at least one ASIN or URL' });
                return;
            }
            if (!customToolData.weeks || customToolData.weeks.length === 0) {
                toast.error('No weeks selected', { description: 'Please select at least one week' });
                return;
            }
            setPendingUrlList(customToolData.asins);
            if (settings.skipCreditConfirmation) confirmStart(customToolData.asins);
            else setShowConfirmDialog(true);
            return;
        }

        if (tool.id === 'top-terms') {
            const asins = customToolData.asins || [];
            const terms = customToolData.searchTerms || [];

            if (asins.length === 0 && terms.length === 0) {
                toast.error('No Inputs provided', { description: 'Please enter at least one ASIN or Search Term' });
                return;
            }
            if (!customToolData.weeks || customToolData.weeks.length === 0) {
                toast.error('No weeks selected', { description: 'Please select at least one week' });
                return;
            }

            const allItems = [...asins, ...terms];
            setPendingUrlList(allItems);

            if (settings.skipCreditConfirmation) confirmStart(allItems);
            else setShowConfirmDialog(true);
            return;
        }

        if (tool.id === 'asin-x' || tool.id === 'niche-x' || tool.id === 'product-niche-metrics' || tool.id === 'niche-query-pulse' || tool.id === 'price-tracker' || tool.id === 'rufus-qna') {
            if (!customToolData?.asinList || customToolData.asinList.length === 0) {
                toast.error('No ASINs/Keywords provided', { description: 'Please enter at least one ASIN/Keyword' });
                return;
            }
            setPendingUrlList(customToolData.asinList);
            if (settings.skipCreditConfirmation) confirmStart(customToolData.asinList);
            else setShowConfirmDialog(true);
            return;
        }

        const effectiveUrls = urls.split('\n').filter((url) => url.trim());
        const hasValidInput = tool.id === 'category-insights' || tool.id === 'sales-traffic-drilldown' || (effectiveUrls.length > 0) || csvFile;
        if (!hasValidInput) {
            toast.error('Please enter at least one URL/ASIN');
            return;
        }

        if (tool.id === 'category-insights') {
            if (!customToolData?.keywords) {
                toast.error('No Keywords provided', { description: 'Please enter at least one keyword' });
                return;
            }
            const keywordList = customToolData.keywords.split('\n').filter((k: string) => k.trim());
            setPendingUrlList(keywordList);
            if (settings.skipCreditConfirmation) confirmStart(keywordList);
            else setShowConfirmDialog(true);
            return;
        }



        if (tool.id === 'sales-traffic-drilldown') {
            const asins = customToolData?.asinList || [];
            setPendingUrlList(asins);
            if (settings.skipCreditConfirmation) confirmStart(asins);
            else setShowConfirmDialog(true);
            return;
        }

        const urlList = urls.split('\n').filter((url) => url.trim());
        if (urlList.length === 0 && !csvFile) {
            addLog('error', 'Please provide URLs or upload a CSV file');
            toast.error('No URLs provided', { description: 'Please enter URLs or upload a CSV file' });
            return;
        }

        setPendingUrlList(urlList);
        if (settings.skipCreditConfirmation) confirmStart(urlList);
        else setShowConfirmDialog(true);
    };

    const handlePause = async () => {
        if (!(await checkPermission())) return;
        if (!activeRunId) return;

        const newPausedState = !state.isPaused;
        state.setIsPaused(newPausedState);
        await chrome.runtime.sendMessage({
            type: newPausedState ? 'PAUSE_TOOL' : 'RESUME_TOOL',
            runId: activeRunId
        });
        addLog('info', newPausedState ? 'Processing paused' : 'Processing resumed');
    };

    const handleStop = async () => {
        if (activeRunId) {
            addLog('warning', 'Stopping processing...');
            toast.info('Stopping...', { description: 'Finishing current tasks and generating report' });
            await chrome.runtime.sendMessage({
                type: 'STOP_TOOL',
                runId: activeRunId
            });
        }
    };

    // Listeners
    useEffect(() => {
        const handleMessage = (message: any) => {
            if (message.type === 'TOOL_PROGRESS' && isProcessing) {
                const { progress } = message;
                setJobs(prevJobs => {
                    return prevJobs.map((job, index) => {
                        if (index < progress.completed) {
                            return { ...job, status: 'completed', progress: 100, statusMessage: undefined };
                        }
                        if ((progress.currentUrl && job.url === progress.currentUrl) ||
                            (index === progress.completed && job.status === 'pending')) {
                            return {
                                ...job,
                                status: 'processing',
                                progress: 50,
                                statusMessage: progress.statusMessage
                            };
                        }
                        return job;
                    });
                });
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, [isProcessing]);

    useEffect(() => {
        const checkActiveRun = async () => {
            try {
                const response = await chrome.runtime.sendMessage({
                    type: 'GET_ACTIVE_TOOL_RUN',
                    toolId: tool.id
                });

                if (response && response.success && response.activeRun) {
                    const { runId, progress, startTime } = response.activeRun;
                    setIsProcessing(true);
                    setActiveRunId(runId);

                    let currentUrls = urls;
                    if (!currentUrls) {
                        const STORAGE_KEY = `saved_urls_${tool.id}`;
                        const result = await chrome.storage.local.get([STORAGE_KEY]);
                        currentUrls = result[STORAGE_KEY] || '';
                        if (currentUrls) state.setUrls(currentUrls);
                    }

                    if (currentUrls) {
                        const urlList = currentUrls.split('\n').filter((u: string) => u.trim());
                        const restoredJobs: JobStatus[] = urlList.map((url: string, index: number) => ({
                            id: `job-${startTime}-${index}`,
                            url: url.trim(),
                            status: index < progress.completed ? 'completed' :
                                (index === progress.completed ? 'processing' : 'pending'),
                            progress: index < progress.completed ? 100 : (index === progress.completed ? 50 : 0),
                        }));
                        setJobs(restoredJobs);
                    }
                    addLog('info', 'Restored active session from background');
                }
            } catch (error) {
                console.error('Failed to check active run:', error);
            }
        };
        checkActiveRun();
    }, [tool.id]);

    return {
        handleStart,
        handlePause,
        handleStop,
        confirmStart,
        activeRunId,
        isProcessing,
        restrictionOpen,
        setRestrictionOpen,
        restrictionState,
        addLog
    };
};
