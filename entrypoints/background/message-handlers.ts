import { dataSyncService } from '@/lib/services/data-sync.service';
import { secureStorage } from '@/lib/storage/secure-storage';
import { encryptionService } from '@/lib/services/encryption.service';

export async function handleInitDB() {
    try {
        await dataSyncService.initialize();
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function handleGetStorageStats() {
    try {
        const stats = await dataSyncService.getStorageStats();
        return { success: true, stats };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function handleClearAllData() {
    try {
        await dataSyncService.clearAllData();
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function handleExportData() {
    try {
        const data = await dataSyncService.exportAllData();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function handleImportData(data: any) {
    try {
        const result = await dataSyncService.importData(data);
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function handleSecureExport() {
    try {
        // 1. Get User
        const { user } = await secureStorage.get('user');
        if (!user) {
            throw new Error('User not authenticated');
        }

        // 2. Get All Data
        // IndexedDB
        const indexedDBData = await dataSyncService.exportAllData();

        // Local Storage (Decrypted)
        const localStorageData = await secureStorage.get(null);

        // Extension Storage (Sync)
        const syncStorageData = await chrome.storage.sync.get(null);

        const fullBackup = {
            indexedDB: indexedDBData,
            localStorage: localStorageData,
            syncStorage: syncStorageData,
            backupMetadata: {
                version: '2.0',
                createdAt: new Date().toISOString(),
                platform: 'extension'
            }
        };

        // 3. Encrypt
        const encryptedData = await encryptionService.encrypt(fullBackup, user);

        // 4. Create Backup History Record
        const backupRecord = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            sizeBytes: new Blob([encryptedData]).size,
            type: 'manual',
            version: '2.0'
        };

        // Save history
        const { backupHistory = [] } = await secureStorage.get('backupHistory');
        const updatedHistory = [backupRecord, ...backupHistory];
        await secureStorage.set({ backupHistory: updatedHistory });

        // 5. Trigger Download
        const filename = `amz-boosted-backup-${new Date().toISOString().split('T')[0]}.json`;

        // Create a blob and use FileReader to get base64 data url
        const blob = new Blob([encryptedData], { type: 'application/json' });
        const reader = new FileReader();

        return new Promise((resolve) => {
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
                const base64data = reader.result as string;
                chrome.downloads.download({
                    url: base64data,
                    filename: filename,
                    saveAs: true
                }, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error('Download failed:', chrome.runtime.lastError);
                        resolve({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        resolve({ success: true, downloadId });
                    }
                });
            };
        });

    } catch (error) {
        console.error('Secure export failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
    }
}

// ...existing code...
export function handleDownloadFile(payload: { url: string; filename: string }) {
    return new Promise((resolve) => {
        const { url, filename } = payload;
        chrome.downloads.download(
            {
                url,
                filename,
                saveAs: false,
                conflictAction: 'uniquify',
            },
            (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error('[Background] Download failed:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    console.log('[Background] Download started:', filename, 'ID:', downloadId);
                    resolve({ success: true, downloadId });
                }
            }
        );
    });
}

export async function handleOpenSidepanel(payload: { toolId: string; windowId?: number }) {
    try {
        // 1. Set the quick run request (Fire and forget, do not await to preserve user gesture)
        secureStorage.set({
            quickRunRequest: {
                toolId: payload.toolId,
                timestamp: Date.now()
            }
        }).catch(err => console.error('Failed to save quickRunRequest:', err));

        // 2. Open the side panel IMMEDIATELY
        // Chrome requires this to be in the same tick as the user gesture
        if (payload.windowId) {
            // @ts-ignore - open options might vary by types definition, but windowId is standard
            await chrome.sidePanel.open({ windowId: payload.windowId });
        } else {
            // Fallback for missing windowId - attempt to get current
            // This 'await' might still break the gesture chain if window retrieval takes time
            // So we highly recommend passing windowId from client
            const window = await chrome.windows.getCurrent();
            if (window.id) {
                await chrome.sidePanel.open({ windowId: window.id });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('[Background] Failed to open sidepanel:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
