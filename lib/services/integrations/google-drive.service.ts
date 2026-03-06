

class GoogleDriveService {
    private static ROOT_FOLDER_NAME = 'Amzboosted';

    private async getAccessToken(interactive: boolean = true): Promise<string> {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive }, (token) => {
                if (chrome.runtime.lastError || !token) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(token);
                }
            });
        });
    }

    private async removeCachedAuthToken(token: string): Promise<void> {
        return new Promise((resolve) => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
                resolve();
            });
        });
    }

    private async fetchWithAuth(url: string, options: RequestInit = {}, retry: boolean = true): Promise<Response> {
        try {
            const token = await this.getAccessToken();
            const headers = {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            };

            const response = await fetch(url, { ...options, headers });

            if (response.status === 401 && retry) {
                console.log('[GoogleDrive] Access token expired. Refreshing...');
                await this.removeCachedAuthToken(token);
                return this.fetchWithAuth(url, options, false);
            }

            return response;
        } catch (error) {
            console.error('[GoogleDrive] Fetch failed:', error);
            if (retry) {
                // If getAccessToken failed above?
                throw error;
            }
            throw error;
        }
    }

    /**
     * Search for a folder by name and parent ID
     */
    private async findFolder(name: string, parentId: string = 'root'): Promise<string | null> {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;

        const response = await this.fetchWithAuth(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`
        );

        if (!response.ok) throw new Error('Failed to search Drive folders');

        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0].id : null;
    }

    /**
     * Create a folder
     */
    private async createFolder(name: string, parentId: string = 'root'): Promise<string> {
        const metadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };

        const response = await this.fetchWithAuth('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });

        if (!response.ok) throw new Error('Failed to create Drive folder');

        const data = await response.json();
        return data.id;
    }

    /**
     * Get or create the folder hierarchy: Amzboosted > Year > Month > Schedules
     */
    private async getTargetFolderId(): Promise<string> {
        // 1. Root Folder
        let rootId = await this.findFolder(GoogleDriveService.ROOT_FOLDER_NAME);
        if (!rootId) {
            rootId = await this.createFolder(GoogleDriveService.ROOT_FOLDER_NAME);
        }

        // 2. Year Folder
        const year = new Date().getFullYear().toString();
        let yearId = await this.findFolder(year, rootId);
        if (!yearId) {
            yearId = await this.createFolder(year, rootId);
        }

        // 3. Month Folder
        const month = new Date().toLocaleString('default', { month: 'long' });
        let monthId = await this.findFolder(month, yearId);
        if (!monthId) {
            monthId = await this.createFolder(month, yearId);
        }

        // 4. Schedules Folder
        let schedulesId = await this.findFolder('Schedules', monthId);
        if (!schedulesId) {
            schedulesId = await this.createFolder('Schedules', monthId);
        }

        return schedulesId;
    }

    /**
     * Upload file to the target folder
     */
    async uploadFile(content: string | Blob, filename: string, mimeType: string = 'text/csv'): Promise<string> {
        const folderId = await this.getTargetFolderId();

        const metadata = {
            name: filename,
            parents: [folderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', content instanceof Blob ? content : new Blob([content], { type: mimeType }));

        const response = await this.fetchWithAuth(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                body: form,
            }
        );

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Drive upload failed: ${err}`);
        }

        const data = await response.json();
        return data.id;
    }
}

export const googleDriveService = new GoogleDriveService();
