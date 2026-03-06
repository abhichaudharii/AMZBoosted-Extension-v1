import { secureStorage } from '@/lib/storage/secure-storage';
import { apiClient } from '@/lib/api/client';

interface NotificationPayload {
    message: string;
    channels?: string[]; // e.g., ['telegram'] or ['all']
    imageUrl?: string;
    file?: File;
    token?: string; // Optional here, we fetches it if missing
}

/**
 * Sends a notification via the AMZBoosted Web API.
 */
export async function sendNotification(payload: NotificationPayload) {
    let { message, channels, imageUrl, file, token } = payload;

    // If token not provided, get from storage
    if (!token) {
        const result = await secureStorage.get('accessToken');
        token = result.accessToken;
    }

    if (!token) {
        console.warn('[Notification API] No access token found. Cannot send notification.');
        return;
    }

    const formData = new FormData();
    formData.append('message', message);

    if (channels && channels.length > 0) {
        formData.append('channels', JSON.stringify(channels));
    } else {
        formData.append('channels', JSON.stringify(['all']));
    }

    if (imageUrl) {
        formData.append('imageUrl', imageUrl);
    }

    if (file) {
        formData.append('file', file);
    }

    try {
        console.log('[Notification API] 🚀 Preparing to send notification:', { message, channels });

        const baseURL = apiClient.getBaseURL().replace(/\/+$/, ''); // Remove trailing slash

        console.log(`[Notification API] Sending POST request to ${baseURL}/notifications/send`);

        const response = await fetch(`${baseURL}/notifications/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Do NOT set Content-Type header manually for FormData
            },
            body: formData
        });

        console.log('[Notification API] Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[Notification API] ❌ Request failed with data:', errorData);
            throw new Error(errorData.error || 'Failed to send notification');
        }

        const data = await response.json();
        console.log('[Notification API] ✅ Notification sent successfully:', data);
        return data;
    } catch (error) {
        console.error('[Notification API] 💥 Error sending notification:', error);
        // We catch here to prevent tool failure due to notification failure
    }
}
