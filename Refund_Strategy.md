# Refund Strategy & Credit Integrity Protocol

## 🔍 Investigation Findings
- **Current State**: The extension **does not** currently refund credits.
- **Deduction Flow**: Credits are deducted by the backend immediately during the `checkPermission` call at the start of a task.
- **Failure Handling**: When a tool fails (partially or fully), `tool-execution.service.ts` merely logs that a "server should handle refund." No API call is made to trigger a refund.
- **The Verdict**: As you suspected, users are currently charged for every attempted URL/ASIN regardless of whether the processing succeeds or fails.

---

## 🛡️ Secure Refund Strategy (SaaS Best Practices)

To prevent abuse (users calling a refund endpoint manually to gain unlimited credits), we should move away from client-triggered refunds.

### 1. The "Batch Finalization" Model
Instead of a simple "Refund" endpoint, implement a **Task Finalization** workflow.

1.  **Task Start (Current)**: Client calls `checkPermission`. Server deducts `N` credits and returns a `taskId`.
2.  **Task Execution**: Client processes the items.
3.  **Task Finalization (New)**: Client calls `POST /api/v1/tasks/{taskId}/finalize`.
    - **Payload**: `{ "successfulCount": 8, "failedCount": 2, "errorLogs": [...] }`
    - **Server Logic**: 
        - Verify `taskId` belongs to the authenticated user.
        - Verify task is not already finalized.
        - Calculate `refund = (initialDeduction - successfulCount)`.
        - **Security Check**: To prevent spoofing `successfulCount = 0`, the server can periodically "sample" results or require the client to send a hash of the successful data as "proof of work."

### 2. Auto-Refund for System Failures
If the Task times out on the server or the client heartbeats stop, the server can implement a "Reconciliation" job that runs every hour.
- If a task is `processing` for > 4 hours, mark it `errored` and refund credits automatically.

### 3. Partial Refund Logic
Differentiate between **User Errors** and **System Errors**:
- **User Error** (e.g., "Invalid ASIN", "Product Not Found"): **No Refund**. The system spent resources attempting to find the data.
- **System Error** (e.g., "Amazon Blocked", "Network Timeout"): **Refund**. The user shouldn't pay if the tool couldn't perform its duty.

### 4. Implementation Suggestion: "Credit Ledger"
Instead of just a `credits_remaining` integer in the database, use a **Transaction Ledger**:
- `id`, `user_id`, `amount`, `type` (deduction/refund/purchase), `task_id`, `timestamp`.
- This ensures full auditability and makes it easy to spot users who have an abnormal number of "refunds."

---

## 🚀 Recommended Next Steps
1.  **Backend**: Implement the `/finalize` endpoint that takes a summary of the run.
2.  **Frontend**: Update `tool-execution.service.ts` to call this endpoint in the `finally` block of `executeTool`.
3.  **Security**: Log every refund transaction. If a user's refund rate exceeds 20% of their total usage, flag for manual review.

---
*Prepared by Antigravity for AMZBoosted Infrastructure.*
