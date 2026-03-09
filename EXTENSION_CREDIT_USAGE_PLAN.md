# Extension Implementation Plan: Credit & Usage Tracking

This plan outlines the changes required on the extension side to align with the server-side credit usage system documented in `CREDIT_USAGE_IMPLEMENTATION_PLAN.md`.

## Goal
Enable the extension to support permission-first credit deduction, automatic task failure reporting (with auto-refunds), cross-device task history synchronization, and advanced usage analytics.

## Proposed Changes

### 1. API Client Layer
We need to add support for the new and upgraded endpoints defined in the server plan.

#### [MODIFY] [client.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/api/client.ts) & [api/services/user.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/api/services/user.ts)
- Add `getTaskHistory(params: { limit?: number; offset?: number; toolId?: string })` to call `GET /api/v1/user/task-history`.
- Update `getUsageStats()` and `getCredits()` to handle the new `creditInsights` object (Feature 6).

#### [NEW] [tasks.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/api/services/tasks.ts)
- Add `reportTaskFailure(taskId: string, data: { transactionId: string; urlsFailed: number; urlsTotal: number; errorCode: string; errorMessage?: string })` to call `POST /api/v1/tasks/[taskId]/report-failure` (Feature 2).

#### [MODIFY] [analytics.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/api/services/analytics.ts)
- Update `getAnalyticsStats(period: string)` to support the `?period=` query parameter (Feature 5) and handle the expanded response shape.

---

### 2. Tool Execution Logic
The extension must explicitly report failures to the backend to trigger the new auto-refund system.

#### [MODIFY] [tool-execution.service.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/services/tool-core/tool-execution.service.ts)
- **Error Classification**: Update catch blocks to identify and map errors to standard codes:
  - `amazon_blocked`, `network_timeout`, `rate_limited`, `proxy_error` (System errors -> Refundable)
  - `invalid_asin`, `product_not_found`, `marketplace_mismatch` (User errors -> Non-refundable)
- **Automatic Reporting**: Call `apiClient.reportTaskFailure()` when a tool run finishes with errors (either partial or full).
- **Analytics Update**: Pass the `errorCode` to `analyticsService.trackToolComplete()`.

---

### 3. Data Synchronization
Enable cross-device visibility by syncing the server-side task history with the local IndexedDB.

#### [MODIFY] [sync.service.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/services/sync.service.ts)
- Update `refreshAll()` to check if the local `tasks` store is empty.
- If empty (e.g., new device or cleared data), call `apiClient.getTaskHistory()` to fetch the last 50 tasks and seed the local IndexedDB.

#### [MODIFY] [data-sync.service.ts](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/lib/services/data-sync.service.ts)
- Add `syncTasksFromServer()` method to coordinate fetching from API and writing to `indexedDBService`.

---

### 4. UI Components (Dashboard & Billing)
Surface the new insights and analytics to the user.

#### [MODIFY] [DashboardStats.tsx](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/entrypoints/dashboard/pages/dashboard-home/components/DashboardStats.tsx)
- Update to display:
  - Tool Success Rate (%)
  - Marketplace Distribution chart
  - Peak Usage times (if applicable to user view)

#### [MODIFY] [BillingPage.tsx](file:///c:/Users/abhib/Documents/AMZBoosted_v1/AMZBoosted-Extension/entrypoints/dashboard/pages/BillingPage.tsx)
- Add "Credit Insights" section showing:
  - Projected usage by end of month.
  - Potential credit waste projection.
  - Plan recommendation (Downgrade/On Track/At Risk).

---

## Verification Plan

### Automated Tests
- Mock API responses for `/tasks/[taskId]/report-failure` and verify `tool-execution.service.ts` calls it correctly on error.
- Verify error mapping logic correctly distinguishes between system (refundable) and user (non-refundable) errors.
- Test `SyncService.refreshAll()` with an empty IndexedDB to ensure tasks are populated correctly from the server mock.

### Manual Verification
- Trigger a simulated Amazon Block error and verify that the "Reported failure" appears in the logs and the credit balance updates (once server logic is ready).
- Log in on a fresh browser profile and verify that "Recent Activity" is populated from the server-side task history.
- Check the Billing page to see if the projected usage and recommendations are displayed.
