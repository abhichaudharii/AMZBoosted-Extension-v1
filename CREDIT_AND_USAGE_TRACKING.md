# AMZBoosted — Credit & Usage Tracking Architecture

This document provides a detailed breakdown of how credits are deducted, how tools are tracked, and how data is synchronized between the extension and the backend.

---

## 1. Credit Deduction Architecture

The system uses a **"Permission-First"** model. Credits are not deducted by the extension alone; they are deducted by the backend during a pre-execution check.

### Flow of Execution:
1. **Initiation**: User clicks 'Run Tool' or a schedule triggers.
2. **Permission Check**: The `ToolExecutionService` calls `apiClient.checkPermission` (or `startScheduleRun`).
3. **Backend Deduction**:
   - The server verifies the user's current `remaining` credits.
   - If allowed, the server **immediately deducts** the credits.
   - The server creates a `taskId` (and a `transactionId`) and returns it to the extension.
4. **Execution**: The extension proceeds to execute the tool logic locally using the provided `taskId`.
5. **UI Update**: `CreditsService` refreshes the local credit balance from the backend response.

### Calculation Logic:
- **Base Rate**: Most tools follow a `1 credit = 1 URL/ASIN` rule.
- **Deduction Timing**: Credits are deducted *before* execution to prevent "free" runs if the user disconnects or closes the browser during the process.

---

## 2. Tool & Usage Tracking

AMZBoosted uses a hybrid tracking approach to ensure the dashboard remains fast and responsive while the backend stays updated.

### A. Local Tracking (IndexedDB)
- **Store**: `STORES.TASKS` (IndexedDB).
- **Purpose**: Powering the extension's Dashboard "Recent Activity" and Analytics charts.
- **Data Saved**: `toolId`, `toolName`, `marketplace`, `status` (processing/completed/failed), `creditsUsed`, `createdAt`, `completedAt`, and the raw `inputData`/`outputData`.
- **Status Updates**: The `updateTaskStatus` utility is called throughout the task lifecycle to update the local DB.

### B. Remote Tracking (Analytics API)
- **Endpoint**: `/analytics/track`.
- **Service**: `AnalyticsService` in the extension.
- **Trigger Points**:
  - `trackToolRun`: Sent at the **start** and **end** of every run.
  - `trackScheduleExecution`: Sent when an automated schedule finishes.
  - `trackLimitReached`: Sent if a user hits a plan limit (e.g., max schedules).
- **Metadata**: Includes `browserVersion`, `extensionVersion`, `marketplace`, and `duration`.

---

## 3. Data Synchronization

The extension keeps its local state in sync with the backend using a background polling mechanism.

- **BackgroundFetcherService**: 
  - Polls the backend every **60 seconds** when the tab/sidepanel is active.
  - Calls `apiClient.getUsageStats(true)` and `apiClient.getCredits(true)`.
  - Uses TanStack Query to invalidate keys like `['credits']` and `['usage']`, ensuring the UI updates Reactively.

---

## 4. Analytics Strategy (Backend/Website)

Since the extension reports every `tool_run` to the `/analytics/track` endpoint, the backend database already contains the raw events needed for a website-based analytics page.

### Available Data for Website Dashboard:
- **Success Rate**: Calculated as `completed` vs `failed` events.
- **Marketplace Distribution**: Grouped by the `marketplace` field in tracking events.
- **Tool Popularity**: Frequency of each `toolId`.
- **Credit Velocity**: Total `creditsUsed` over a specific time period.
- **Peak Usage Times**: Derived from the `timestamp` of tracking events.

---

## 5. Recommendations for Improvement

To build a professional analytics page on the website, we suggest the following optimizations:

### 1. Backend Aggregate Tables
Instead of querying raw event logs (which can grow to millions of rows), the backend should maintain a pre-aggregated table (e.g., `user_tool_daily_metrics`) that increments counts on every tool run.

### 2. Explicit Refund Endpoint
Currently, the server is expected to "handle refunds" if a task fails. We should implement an explicit `/tasks/{taskId}/report-failure` endpoint.
- If a tool fails (e.g., product not found), the client calls this endpoint.
- The server verifies the `taskId` and issues an **instant credit refund**.
- This makes "failed but paid for" issues much rarer.

### 3. Cross-Device Task Sync
Current "Recent Activity" is local to the user's browser (IndexedDB). If a user logs in from a new PC, their history is gone.
- **Fix**: Implement a `getTaskHistory` API on the backend.
- The `SyncService` should pull the last 50 tasks from the server if the local IndexedDB is empty.

### 4. Error Categorization
Tracking should include an `errorCode` for failures (e.g., `PROXY_ERROR`, `AMZ_AUTH_REQUIRED`, `PRODUCT_MISSING`). This will allow you to see *why* users are experiencing failures on the website analytics page.

### 5. Credit Rollover Audit
Since credits don't rollover, users might be "wasting" credits at the end of the month. Adding a "Projected Credit Waste" metric to your analytics can help convert users to lower/higher plans or encourage more usage.

---
*Created by Antigravity AI Engine · March 2026*
