# API Documentation for Extension Developer

## Overview
This document details the API endpoints for managing Integrations, Notification Channels, and Data Synchronization.

**Base URL**: `https://api.yourdomain.com/api/v1` (Replace with actual production URL)
**Authentication**: All endpoints require the standard authentication headers (Session Token / Cookie).

---

## 1. Integrations

> [!NOTE]
> **Dummy Implementation**: The current endpoints for connecting/disconnecting integrations are mocked. They simulate the connection process without actually authenticating with third-party providers (Google, etc.).


### List Available Integrations
Get a list of all supported integrations, including their availability for the user's plan and connection status.

- **Endpoint**: `GET /api/v1/integrations/available`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": "uuid-string",
          "name": "Google Sheets",
          "key": "google_sheets",
          "min_plan_tier": "PRO",
          "logo_url": "...",
          "category": "integration",
          "is_locked": false,      // true if user's plan is too low
          "is_connected": true     // true if user has already connected this
        },
        ...
      ]
    }
  }
  ```

### Connect / Update Integration
Save or update credentials and settings for a specific integration. This endpoint performs an "upsert" (inserts if new, updates if existing).

- **Endpoint**: `POST /api/v1/integrations/connect`
- **Request Body**:
  ```json
  {
    "definition_id": "uuid-string-from-available-list",
    "credentials": {
      "access_token": "...",
      "refresh_token": "..."
    },
    "settings": {
      "spreadsheet_id": "...",
      "default_folder": "..."
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "connection-uuid",
      "user_id": "...",
      "definition_id": "...",
      "is_active": true,
      "updated_at": "2024-..."
    }
  }
  ```

### Disconnect Integration
Remove a connection.

- **Endpoint**: `DELETE /api/v1/integrations/connect?definition_id=uuid-string`
- **Response**:
  ```json
  {
    "success": true,
    "data": { "success": true }
  }
  ```

---

## 2. Notification Channels

> [!NOTE]
> **Dummy Implementation**: Notification channels (Slack, Telegram) are currently simulated. Configuring them will save the settings locally/server-side but will not send actual messages to external platforms.


### List Configured Channels
Get a list of the user's configured notification channels (e.g., Slack Webhook, Discord Webhook).

- **Endpoint**: `GET /api/v1/notifications/channels`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "channel-uuid",
        "definition_id": "...",
        "config": { "webhook_url": "..." },
        "is_active": true,
        "definition": {
           "name": "Slack",
           "logo_url": "..."
        }
      }
    ]
  }
  ```

### Save / Update Channel
Configure a notification channel.

- **Endpoint**: `POST /api/v1/notifications/channels`
- **Request Body**:
  ```json
  {
    "definition_id": "uuid-string-from-available-list",
    "config": {
      "webhook_url": "https://hooks.slack.com/...",
      "channel_name": "#alerts"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "channel-uuid",
      "is_active": true,
      ...
    }
  }
  ```

---

## 3. Data Synchronization

> [!NOTE]
> **Sync Status**: The sync logic below is implemented to handle the mocked states. It will fetch the "dummy" configurations to ensure the UI reflects the simulated connections.


### Check for Updates
Use this endpoint to efficiently check if local data needs to be refreshed. The server returns timestamps for when different data categories were last updated.

- **Endpoint**: `GET /api/v1/sync/check`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "user": "2024-12-20T10:00:00Z",          // User profile changed
      "subscription": "2024-12-19T15:30:00Z",  // Plan/Status changed
      "credits": "2024-12-20T11:45:00Z",       // Credits balance changed
      "limits": "2024-12-19T15:30:00Z",        // Plan limits changed
      "settings": "2024-12-20T09:20:00Z",      // Integrations/Channels changed
      "serverTime": "2024-12-20T12:00:00Z"
    }
  }
  ```
- **Logic**:
  1.  Store these timestamps in the extension's local storage.
  2.  Poll this endpoint periodically (e.g., every 60 seconds).
  3.  Compare the returned timestamps with stored values.
  4.  If `server_timestamp > local_timestamp`:
      - **credits**: Re-fetch `/api/v1/user/usage`
      - **settings**: Re-fetch `/api/v1/integrations/available` and `/api/v1/notifications/channels`
      - **subscription/limits**: Re-fetch `/api/v1/user/limits`
