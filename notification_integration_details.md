# Notification API Integration Guide

## Endpoint
**URL**: `POST /api/v1/notifications/send`
**Content-Type**: `multipart/form-data` (browser handles this automatically)

## Authentication
The API requires an authenticated user session.
**Header**: `Authorization: Bearer <ACCESS_TOKEN>`

## Request Parameters (`FormData`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | **Yes** (or file) | The text content of the notification. |
| `channels` | string | No | JSON stringified array of channels (e.g., `'["telegram", "discord"]'` or `'["all"]'`). Defaults to `['all']`. |
| `imageUrl` | string | No | URL of an image to include. |
| `file` | File | No | A file object to upload directly. |

## Integration Example (TypeScript)

Use this function in your extension (background script or popup) to trigger notifications.

```typescript
interface NotificationPayload {
  message: string;
  channels?: string[]; // e.g., ['telegram'] or ['all']
  imageUrl?: string;
  file?: File;
  token: string; // The user's JWT access token
}

/**
 * Sends a notification via the AMZBoosted Web API.
 */
export async function sendNotification(payload: NotificationPayload) {
  const { message, channels, imageUrl, file, token } = payload;
  
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://app.amzboosted.com'}/api/v1/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Do NOT set Content-Type header manually for FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Notification API Error:', error);
    throw error;
  }
}
```

## Notes
1.  **Token**: Ensure you have the user's valid access token. Use `supabase.auth.getSession()` or your storage mechanism to retrieve it.
2.  **Base URL**: Replace the base URL with your local server (`http://localhost:3000`) for testing or production URL (`https://app.amzboosted.com`) for deployment.
