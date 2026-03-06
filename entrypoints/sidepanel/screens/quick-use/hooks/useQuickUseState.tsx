import { useState, useEffect } from 'react';
import { secureStorage } from '@/lib/storage/secure-storage';
import type { Tool } from '../../../lib/tools';
import type { Settings, LogEntry, JobStatus } from '../../../lib/types';
import { DownloadType } from '../../../components/inputs/DownloadTypeSelector';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

export const useQuickUseState = (tool: Tool) => {
    const [settings, setSettings] = useState<Settings>({
        delay: 2000,
        marketplace: 'us',
        autoRetry: true,
        slowMode: false,
        smartScrape: true,
        skipCreditConfirmation: false,
    });

    const [urls, setUrls] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [marketplace, setMarketplace] = useState<string>('us');
    const [showLogs, setShowLogs] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showExportSettings, setShowExportSettings] = useState(false);
    const [isLoadingCsv, setIsLoadingCsv] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingUrlList, setPendingUrlList] = useState<string[]>([]);

    const [showHelp, setShowHelp] = useState(false);
    const [customToolData, setCustomToolData] = useState<any>(null);
    const [isStateLoaded, setIsStateLoaded] = useState(false);

    // SQP Tool Specific State
    const [sqpDownloadType, setSqpDownloadType] = useState<DownloadType>('all-in-one');
    const [sqpOutputFormat, setSqpOutputFormat] = useState('csv');

    // Category Insights Tool Specific State
    const [categoryOutputFormat, setCategoryOutputFormat] = useState('csv');
    const [showCategoryExportSettings, setShowCategoryExportSettings] = useState(false);

    // ASIN Explorer State
    const [asinOutputFormat, setAsinOutputFormat] = useState('csv');

    // Sales Traffic Drilldown State
    const [salesTrafficOutputFormat, setSalesTrafficOutputFormat] = useState('csv');
    const [showSalesTrafficExportSettings, setShowSalesTrafficExportSettings] = useState(false);

    // Jobs and Logs
    const [jobs, setJobs] = useState<JobStatus[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Load Persisted State
    useEffect(() => {
        const loadState = async () => {
            try {
                // 1. Core Tool State
                const stateKey = `quickuse_${tool.id}_state`;
                const secureState = await secureStorage.get(stateKey);

                let loadedState = secureState[stateKey];
                if (!loadedState) {
                    const localState = localStorage.getItem(stateKey);
                    if (localState) {
                        try { loadedState = JSON.parse(localState); } catch (e) { }
                    }
                }

                if (loadedState) {
                    if (loadedState.settings) setSettings(loadedState.settings);
                    if (loadedState.marketplace) setMarketplace(loadedState.marketplace);
                    if (loadedState.customToolData) setCustomToolData(loadedState.customToolData);
                    if (loadedState.showLogs !== undefined) setShowLogs(loadedState.showLogs);
                    if (loadedState.logs) {
                        setLogs(loadedState.logs.map((log: any) => ({
                            ...log,
                            timestamp: new Date(log.timestamp),
                        })));
                    }
                }

                // 2. SQP Settings
                const sqpKey = `sqp_settings_${tool.id}`;
                const secureSqp = await secureStorage.get(sqpKey);
                let loadedSqp = secureSqp[sqpKey];

                if (!loadedSqp) {
                    const localSqp = localStorage.getItem(sqpKey);
                    if (localSqp) {
                        try { loadedSqp = JSON.parse(localSqp); } catch (e) { }
                    }
                }

                if (loadedSqp) {
                    if (loadedSqp.downloadType) setSqpDownloadType(loadedSqp.downloadType);
                    if (loadedSqp.outputFormat) setSqpOutputFormat(loadedSqp.outputFormat);
                }

                // 3. Category Settings
                const catKey = `category_settings_${tool.id}`;
                const secureCat = await secureStorage.get(catKey);
                let loadedCat = secureCat[catKey];
                if (loadedCat && loadedCat.outputFormat) {
                    setCategoryOutputFormat(loadedCat.outputFormat);
                }

                // 4. ASIN Explorer Settings (and shared tools like Price Tracker)
                const asinKey = `asin_settings_${tool.id}`;
                const secureAsin = await secureStorage.get(asinKey);
                let loadedAsin = secureAsin[asinKey];
                if (loadedAsin && loadedAsin.outputFormat) {
                    setAsinOutputFormat(loadedAsin.outputFormat);
                }

                // 5. Sales Traffic Settings
                const stKey = `st_settings_${tool.id}`;
                const secureSt = await secureStorage.get(stKey);
                let loadedSt = secureSt[stKey];
                if (loadedSt && loadedSt.outputFormat) {
                    setSalesTrafficOutputFormat(loadedSt.outputFormat);
                }

            } catch (error) {
                console.error('Failed to load QuickUse state', error);
            }
            finally {
                setIsStateLoaded(true);
            }
        };

        loadState();
    }, [tool.id]);

    // Persist Core State
    useEffect(() => {
        const stateToSave = {
            settings,
            marketplace,
            showLogs,
            customToolData,
            logs: logs.map(log => ({
                ...log,
                timestamp: log.timestamp.toISOString(),
            })),
        };
        secureStorage.set({ [`quickuse_${tool.id}_state`]: stateToSave });
    }, [settings, marketplace, showLogs, customToolData, logs, tool.id]);

    // Logger
    const addLog = (level: LogEntry['level'], message: string) => {
        const newLog: LogEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            level,
            message,
        };
        setLogs((prev) => [...prev, newLog]);
    };

    // URL Persistence
    const STORAGE_KEY = `saved_urls_${tool.id}`;
    useEffect(() => {
        secureStorage.get([STORAGE_KEY]).then((result) => {
            if (result[STORAGE_KEY]) {
                setUrls(result[STORAGE_KEY]);
            }
        });
    }, [tool.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            secureStorage.set({ [STORAGE_KEY]: urls });
        }, 500);
        return () => clearTimeout(timer);
    }, [urls, tool.id]);

    const handleClearUrls = () => {
        setUrls('');
        setCsvFile(null);
        addLog('info', 'Cleared all URLs');
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove(STORAGE_KEY);
        }
    };

    const parseCsvUrls = (csvContent: string): string[] => {
        const lines = csvContent.split('\n');
        const urls: string[] = [];
        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
                urls.push(trimmed);
            } else {
                const columns = trimmed.split(',').map(col => col.trim().replace(/"/g, ''));
                columns.forEach(col => {
                    if (col.startsWith('http://') || col.startsWith('https://')) {
                        urls.push(col);
                    }
                });
            }
        });
        return urls;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoadingCsv(true);
            addLog('info', `Processing CSV file: ${file.name}`);
            const loadingToast = toast.loading('Processing CSV file...', { description: `Reading ${file.name}` });

            try {
                const text = await file.text();
                const extractedUrls = parseCsvUrls(text);
                if (extractedUrls.length > 0) {
                    const currentUrls = urls ? urls.split('\n').filter(u => u.trim()) : [];
                    const allUrls = [...currentUrls, ...extractedUrls];
                    setUrls(allUrls.join('\n'));
                    addLog('success', `Loaded ${extractedUrls.length} URLs from CSV`);
                    toast.success('CSV Loaded Successfully!', {
                        id: loadingToast,
                        description: `${extractedUrls.length} URL${extractedUrls.length !== 1 ? 's' : ''} loaded from ${file.name}`,
                        icon: <CheckCircle2 className="h-5 w-5" />,
            duration: 4000,
                    });
                } else {
                    addLog('warning', 'No URLs found in CSV file');
                    toast.warning('No URLs Found', {
                        id: loadingToast,
                        description: 'The CSV file does not contain any valid URLs',
                        duration: 4000,
                    });
                }
                setCsvFile(null);
                e.target.value = '';
            } catch (error) {
                addLog('error', `Failed to parse CSV: ${error}`);
                toast.error('Failed to Load CSV', {
                    id: loadingToast,
                    description: `Error: ${error}`,
                    duration: 5000,
                });
            } finally {
                setIsLoadingCsv(false);
            }
        }
    };

    // Save Settings Handlers
    const handleSqpDownloadTypeChange = (type: string) => {
        setSqpDownloadType(type as DownloadType);
        secureStorage.set({
            [`sqp_settings_${tool.id}`]: {
                downloadType: type,
                outputFormat: sqpOutputFormat
            }
        });
    };

    const handleSqpOutputFormatChange = (format: string) => {
        setSqpOutputFormat(format);
        secureStorage.set({
            [`sqp_settings_${tool.id}`]: {
                downloadType: sqpDownloadType,
                outputFormat: format
            }
        });
    };

    const handleCategoryOutputFormatChange = (format: string) => {
        setCategoryOutputFormat(format);
        secureStorage.set({
            [`category_settings_${tool.id}`]: {
                outputFormat: format
            }
        });
    };

    const handleSalesTrafficOutputFormatChange = (format: string) => {
        setSalesTrafficOutputFormat(format);
        secureStorage.set({
            [`st_settings_${tool.id}`]: {
                outputFormat: format
            }
        });
    };

    const handleAsinOutputFormatChange = (format: string) => {
        setAsinOutputFormat(format);
        secureStorage.set({
            [`asin_settings_${tool.id}`]: {
                outputFormat: format
            }
        });
    };

    return {
        settings, setSettings,
        urls, setUrls,
        csvFile, setCsvFile,
        marketplace, setMarketplace,
        showLogs, setShowLogs,
        isPaused, setIsPaused,
        showSettings, setShowSettings,
        showExportSettings, setShowExportSettings,
        isLoadingCsv, setIsLoadingCsv,
        showConfirmDialog, setShowConfirmDialog,
        pendingUrlList, setPendingUrlList,
        showHelp, setShowHelp,
        customToolData, setCustomToolData,
        isStateLoaded,
        sqpDownloadType, setSqpDownloadType,
        sqpOutputFormat, setSqpOutputFormat,
        categoryOutputFormat, setCategoryOutputFormat,
        showCategoryExportSettings, setShowCategoryExportSettings,
        asinOutputFormat, setAsinOutputFormat,
        salesTrafficOutputFormat, setSalesTrafficOutputFormat,
        showSalesTrafficExportSettings, setShowSalesTrafficExportSettings,
        jobs, setJobs,
        logs, setLogs,
        addLog,
        handleClearUrls,
        handleFileChange,
        handleSqpDownloadTypeChange,
        handleSqpOutputFormatChange,
        handleCategoryOutputFormatChange,
        handleSalesTrafficOutputFormatChange,
        handleAsinOutputFormatChange
    };
};
