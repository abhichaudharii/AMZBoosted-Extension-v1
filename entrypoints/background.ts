import { defineBackground } from 'wxt/sandbox';
import { dataSyncService } from '@/lib/services/data-sync.service';
import { schedulerService } from '@/lib/services/scheduler.service';
import { backgroundFetcherService } from '@/lib/services/background-fetcher.service';
import { syncService } from '@/lib/services/sync.service';
import {
    handleInitDB,
    handleGetStorageStats,
    handleClearAllData,
    handleExportData,
    handleImportData,
    handleSecureExport,
    handleDownloadFile,
    handleOpenSidepanel
} from './background/message-handlers';
import {
    handleRunSchedule,
    handleCheckScheduleRunning,
    handleGetActiveRuns
} from './background/scheduler-handlers';
import { handleCheckAmazonLogin } from './background/auth-handlers';
import { handleToolMessage, handleToolControlMessage } from './background/tool-registry';

export default defineBackground(() => {
    /**
     * Background Script
     * Initializes IndexedDB and handles extension events
     */
    chrome.runtime.onInstalled.addListener(async (details) => {
        console.log('[Background] Extension installed/updated:', details.reason);

        try {
            // Initialize IndexedDB
            await dataSyncService.initialize();
            console.log('[Background] IndexedDB initialized successfully');

            // Initialize scheduler service
            await schedulerService.initialize();
            console.log('[Background] Scheduler service initialized successfully');

            // Initialize background fetcher
            backgroundFetcherService.initialize();

            if (details.reason === 'install') {
                // First time install
                console.log('[Background] First time install - opening welcome page');
                // Optionally open a welcome page
                // chrome.tabs.create({ url: 'https://amzboosted.com/welcome' });
            } else if (details.reason === 'update') {
                // Extension updated
                console.log('[Background] Extension updated from', details.previousVersion);
            }

        } catch (error) {
            console.error('[Background] Failed to initialize DB/Scheduler:', error);
        }

        // Initialize sync service independently to ensure it runs even if DB fails
        try {
            syncService.init();
            console.log('[Background] Sync service started');
        } catch (error) {
            console.error('[Background] Failed to start SyncService:', error);
        }
        // Set side panel behavior to open on action click
        if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
            chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
                .catch((error) => console.error('[Background] Failed to set side panel behavior:', error));
        }

    });

    // Initialize scheduler service immediately to ensure alarm listeners are registered
    schedulerService.initialize().catch(err => {
        console.error('[Background] Failed to initialize scheduler:', err);
    });

    // Handle extension startup (browser restart)
    chrome.runtime.onStartup.addListener(async () => {
        console.log('[Background] Browser started');

        try {
            // Ensure IndexedDB is initialized
            await dataSyncService.initialize();
            console.log('[Background] IndexedDB ready');

            // Ensure scheduler is initialized
            await schedulerService.initialize();
            console.log('[Background] Scheduler ready');

            // Initialize background fetcher
            backgroundFetcherService.initialize();
            console.log('[Background] Background fetcher started');

        } catch (error) {
            console.error('[Background] Failed to initialize services on startup:', error);
        }

        try {
            // Initialize sync service
            syncService.init();
            console.log('[Background] Sync service started');
        } catch (error) {
            console.error('[Background] Failed to start SyncService on startup:', error);
        }
    });

    // Handle messages from content scripts or popup
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
        console.log('[Background] Message received:', message);

        // --- Tool Execution Handlers ---
        const toolResponse = handleToolMessage(message);
        if (toolResponse) {
            sendResponse(toolResponse);
            return false;
        }

        const controlResponse = handleToolControlMessage(message);
        if (controlResponse) {
            sendResponse(controlResponse);
            return false;
        }

        // --- Scheduler Handlers ---
        if (message.type === 'RUN_SCHEDULE') {
            handleRunSchedule(message.scheduleId).then(sendResponse);
            return true;
        }
        if (message.type === 'CHECK_SCHEDULE_RUNNING') {
            sendResponse(handleCheckScheduleRunning(message.scheduleId));
            return false;
        }
        if (message.type === 'GET_ACTIVE_RUNS') {
            sendResponse(handleGetActiveRuns());
            return false;
        }

        // --- Auth Handlers ---
        if (message.type === 'CHECK_AMAZON_LOGIN') {
            console.log('[Background] Processing CHECK_AMAZON_LOGIN...');
            handleCheckAmazonLogin()
                .then(response => {
                    console.log('[Background] Sending Amazon login response:', response);
                    sendResponse(response);
                })
                .catch(error => {
                    console.error('[Background] Critical error in CHECK_AMAZON_LOGIN:', error);
                    sendResponse({ loggedIn: false, error: String(error) });
                });
            return true;
        }

        // --- General Handlers ---
        if (message.type === 'INIT_DB') {
            handleInitDB().then(sendResponse);
            return true;
        }
        if (message.type === 'GET_STORAGE_STATS') {
            handleGetStorageStats().then(sendResponse);
            return true;
        }
        if (message.type === 'CLEAR_ALL_DATA') {
            handleClearAllData().then(sendResponse);
            return true;
        }
        if (message.type === 'EXPORT_DATA') {
            handleExportData().then(sendResponse);
            return true;
        }
        if (message.type === 'IMPORT_DATA') {
            handleImportData(message.data).then(sendResponse);
            return true;
        }
        if (message.type === 'SECURE_EXPORT') {
            handleSecureExport().then(sendResponse);
            return true;
        }
        if (message.type === 'DOWNLOAD_FILE') {
            handleDownloadFile(message.payload).then(sendResponse);
            return true;
        }
        if (message.type === 'OPEN_SIDEPANEL') {
            const payload = { ...message, windowId: message.windowId || _sender.tab?.windowId };
            handleOpenSidepanel(payload).then(sendResponse);
            return true;
        }

        // Ignore other messages
        return false;
    });

});