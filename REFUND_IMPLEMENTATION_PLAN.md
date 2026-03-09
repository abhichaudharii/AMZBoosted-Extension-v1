# AMZBoosted — Credit Refund Implementation Plan
### API Changes · Extension Changes · Security Model · March 2026

---

## Current State (The Problem)

From `Refund_Strategy.md` audit:

- Credits are deducted **immediately** at `checkPermission` when a task starts
- When a tool fails (partially or fully), `tool-execution.service.ts` only **logs** that "server should handle refund" — no API call is made
- Users are charged credits for **every attempted run** regardless of success or failure
- There is no refund mechanism. There is no credit ledger. There is no task finalization.

This is both a trust problem (users paying for failures) and a retention problem (sellers hitting credit limits due to Amazon-side errors they can't control).

---

## Guiding Principles

1. **No client-triggered refunds** — The extension never calls a `refund` endpoint directly. This prevents trivial abuse where a user spoofs `successCount: 0` on every run.
2. **Server finalizes, server refunds** — Only the backend decides how many credits to return, based on what the extension reports and what it can verify.
3. **Differentiate user errors vs system errors** — Users eat the cost of invalid input. We eat the cost of system failures.
4. **Full auditability** — Every credit movement (deduction, refund, top-up) goes through a transaction ledger, not a mutable integer.
5. **Abuse detection** — Users with abnormally high refund rates get flagged automatically.

---

## Architecture: The Batch Finalization Model

```
Extension                          Backend (Next.js API)
---------                          ---------------------

1. START TASK
   POST /api/v1/tasks/start     →  checkPermission()
   { toolId, inputCount }           deduct N credits
                                    create task record (status: processing)
                                ←  { taskId, creditsDeducted }

2. EXECUTE (local in extension)
   Run tool against Seller Central
   Track: successCount, failedCount, errorTypes per item

3. FINALIZE TASK
   POST /api/v1/tasks/{taskId}/finalize  →  verifyTaskOwnership()
   {                                         validateNotAlreadyFinalized()
     successfulCount: 8,                     calculateRefund()
     failedCount: 2,                         applyRefundToLedger()
     errorTypes: ["amazon_blocked", ...],    mark task: completed
     durationMs: 4200                        log to credit_ledger
   }                                     ←  { refunded: 2, newBalance: X }
```

---

## PART 1 — API CHANGES

### 1.1 New Database Tables

**Table: `tasks`**
```sql
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  tool_id         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'processing',
  -- Status values: processing | completed | errored | timeout
  credits_deducted INT NOT NULL DEFAULT 0,
  credits_refunded INT NOT NULL DEFAULT 0,
  input_count      INT NOT NULL DEFAULT 0,
  success_count    INT,
  failed_count     INT,
  error_types      JSONB,
  duration_ms      INT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  finalized_at     TIMESTAMPTZ,
  CONSTRAINT tasks_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

**Table: `credit_ledger`**
```sql
CREATE TABLE credit_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  amount      INT NOT NULL,   -- positive = credit added, negative = deducted
  type        TEXT NOT NULL,  -- 'deduction' | 'refund' | 'purchase' | 'trial_grant' | 'reset'
  task_id     UUID REFERENCES tasks(id),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT credit_ledger_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_credit_ledger_user_id ON credit_ledger(user_id);
CREATE INDEX idx_credit_ledger_task_id ON credit_ledger(task_id);
```

**Migrate existing `credits_used` column:** Keep the `users.credits_used` and `users.credits_total` integers as a cached/denormalized value for fast reads. The ledger is the source of truth; the integer is a performance cache updated on each ledger write.

---

### 1.2 New API Route: `POST /api/v1/tasks/start`

**Replaces / wraps existing `checkPermission` call.**

```typescript
// Request
{
  toolId: string,       // e.g. "sqp_snapshot"
  inputCount: number    // number of ASINs/queries being processed
}

// Response
{
  success: true,
  taskId: string,       // UUID — extension stores this for finalization
  creditsDeducted: number,
  newBalance: number
}

// Error responses
{ error: "insufficient_credits", creditsRequired: N, creditsAvailable: M }
{ error: "subscription_inactive" }
{ error: "rate_limited" }
```

**Server logic:**
1. Authenticate user (Clerk JWT)
2. Check subscription state (active trial or active plan)
3. Check `users.credits_remaining >= inputCount`
4. Deduct credits from `users.credits_remaining` (integer cache)
5. Insert row into `credit_ledger` (type: `deduction`, amount: `-inputCount`)
6. Insert row into `tasks` (status: `processing`, credits_deducted: inputCount)
7. Return `{ taskId, creditsDeducted, newBalance }`

---

### 1.3 New API Route: `POST /api/v1/tasks/[taskId]/finalize`

**Core of the refund system.**

```typescript
// Request
{
  successfulCount: number,
  failedCount: number,
  errorTypes: string[],   // e.g. ["invalid_asin", "amazon_blocked", "network_timeout"]
  durationMs: number
}

// Response
{
  success: true,
  creditsRefunded: number,
  finalBalance: number,
  taskId: string
}

// Error responses
{ error: "task_not_found" }
{ error: "task_already_finalized" }
{ error: "task_not_owned_by_user" }
```

**Server logic:**
```typescript
async function finalizeTask(taskId, userId, payload) {
  // 1. Fetch task, verify ownership, verify status === 'processing'
  const task = await db.tasks.findOne({ id: taskId, user_id: userId });
  if (!task) throw new Error("task_not_found");
  if (task.status !== 'processing') throw new Error("task_already_finalized");

  // 2. Calculate refund
  //    Only refund for SYSTEM errors (amazon_blocked, network_timeout, rate_limited)
  //    No refund for USER errors (invalid_asin, product_not_found, access_denied)
  const SYSTEM_ERROR_TYPES = ['amazon_blocked', 'network_timeout', 'rate_limited', 'server_error'];
  const systemFailedCount = payload.failedCount; // simplified — see note below
  
  // Security: refund cannot exceed original deduction
  const refundAmount = Math.min(systemFailedCount, task.credits_deducted - payload.successfulCount);
  const safeRefund = Math.max(0, refundAmount);

  // 3. Apply refund to ledger
  if (safeRefund > 0) {
    await db.credit_ledger.insert({
      user_id: userId,
      amount: safeRefund,     // positive = credit returned
      type: 'refund',
      task_id: taskId,
      note: `System error refund: ${payload.errorTypes.join(', ')}`
    });
    
    // Update cached integer
    await db.users.increment({ id: userId }, 'credits_remaining', safeRefund);
  }

  // 4. Mark task complete
  await db.tasks.update({ id: taskId }, {
    status: 'completed',
    success_count: payload.successfulCount,
    failed_count: payload.failedCount,
    error_types: payload.errorTypes,
    duration_ms: payload.durationMs,
    credits_refunded: safeRefund,
    finalized_at: new Date()
  });

  // 5. Abuse detection — check refund rate
  await checkRefundAbuse(userId);

  return { creditsRefunded: safeRefund, finalBalance: await getUserBalance(userId) };
}
```

**Error type classification (implement in a constants file):**
```typescript
// extension/src/constants/error-types.ts
export const SYSTEM_ERRORS = [
  'amazon_blocked',
  'network_timeout', 
  'rate_limited',
  'server_error',
  'session_expired',
  'captcha_required'
] as const;

export const USER_ERRORS = [
  'invalid_asin',
  'product_not_found',
  'access_denied',
  'invalid_url',
  'marketplace_not_supported'
] as const;
```

---

### 1.4 New API Route: `GET /api/v1/tasks/[taskId]`

For the extension to check task status (useful for async/background runs).

```typescript
// Response
{
  taskId: string,
  status: 'processing' | 'completed' | 'errored' | 'timeout',
  creditsDeducted: number,
  creditsRefunded: number,
  successCount: number | null,
  failedCount: number | null,
  createdAt: string,
  finalizedAt: string | null
}
```

---

### 1.5 New API Route: `GET /api/v1/user/credits/history`

Already exists in the codebase (`/api/v1/user/credits/history`). **Update it to read from `credit_ledger` table** instead of the current implementation, returning:

```typescript
{
  data: {
    history: Array<{
      id: string,
      amount: number,         // positive = added, negative = deducted
      type: string,           // 'deduction' | 'refund' | 'purchase' | etc.
      toolId: string | null,
      taskId: string | null,
      note: string | null,
      createdAt: string
    }>
  },
  pagination: { total, page, limit, hasMore }
}
```

---

### 1.6 Background Reconciliation Cron

Add to `scripts/trial-cron.ts` or a new `scripts/task-reconciliation.ts`:

**Run every hour. Logic:**
1. Find all tasks where `status = 'processing'` AND `created_at < NOW() - INTERVAL '4 hours'`
2. For each stale task:
   - Mark status → `timeout`
   - Refund full `credits_deducted` to user balance
   - Write refund entry to `credit_ledger` (type: `refund`, note: `Auto-refund: task timeout`)
3. Log all reconciled task IDs

```typescript
// scripts/task-reconciliation.ts
async function reconcileStuckTasks() {
  const staleThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000);
  
  const staleTasks = await db.tasks.findMany({
    where: { status: 'processing', created_at: { lt: staleThreshold } }
  });

  for (const task of staleTasks) {
    await db.$transaction([
      db.tasks.update({ where: { id: task.id }, data: { status: 'timeout' } }),
      db.credit_ledger.create({ data: {
        user_id: task.user_id,
        amount: task.credits_deducted,
        type: 'refund',
        task_id: task.id,
        note: 'Auto-refund: task timeout after 4 hours'
      }}),
      db.users.update({ where: { id: task.user_id }, data: {
        credits_remaining: { increment: task.credits_deducted }
      }})
    ]);
    console.log(`[Reconciliation] Refunded ${task.credits_deducted} credits for timed-out task ${task.id}`);
  }
}
```

---

### 1.7 Abuse Detection

```typescript
async function checkRefundAbuse(userId: string) {
  // Get last 30 days of credit activity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [totalDeducted, totalRefunded] = await Promise.all([
    db.credit_ledger.aggregate({
      where: { user_id: userId, type: 'deduction', created_at: { gte: thirtyDaysAgo } },
      _sum: { amount: true }
    }),
    db.credit_ledger.aggregate({
      where: { user_id: userId, type: 'refund', created_at: { gte: thirtyDaysAgo } },
      _sum: { amount: true }
    })
  ]);

  const deductedAbs = Math.abs(totalDeducted._sum.amount || 0);
  const refundedAbs = totalRefunded._sum.amount || 0;
  
  if (deductedAbs > 0) {
    const refundRate = refundedAbs / deductedAbs;
    
    if (refundRate > 0.20) {
      // Flag user for review — do NOT auto-block, just alert
      await db.user_flags.upsert({
        where: { user_id: userId },
        update: { refund_rate: refundRate, flagged_at: new Date() },
        create: { user_id: userId, reason: 'high_refund_rate', refund_rate: refundRate }
      });
      console.warn(`[AbuseDetection] User ${userId} has ${(refundRate * 100).toFixed(1)}% refund rate`);
    }
  }
}
```

---

## PART 2 — EXTENSION CHANGES

### 2.1 Update `tool-execution.service.ts`

**Current (broken) flow:**
```typescript
// Deducts at start
await checkPermission(toolId, inputCount);

// Runs tool
const results = await executeTool(inputs);

// NOTHING HAPPENS ON FAILURE — credits are just lost
```

**New flow:**
```typescript
async function executeTool(toolId: string, inputs: string[]) {
  let taskId: string | null = null;
  const startTime = Date.now();
  
  const successItems: string[] = [];
  const failedItems: string[] = [];
  const errorTypes: string[] = [];

  try {
    // 1. Start task — deducts credits, gets taskId
    const taskResponse = await fetch('/api/v1/tasks/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
      body: JSON.stringify({ toolId, inputCount: inputs.length })
    });
    
    if (!taskResponse.ok) {
      const err = await taskResponse.json();
      if (err.error === 'insufficient_credits') {
        showNotification('Not enough credits', `Need ${err.creditsRequired}, have ${err.creditsAvailable}`);
        return;
      }
      throw new Error(err.error);
    }
    
    const { taskId: tid } = await taskResponse.json();
    taskId = tid;

    // 2. Execute items, track results
    for (const input of inputs) {
      try {
        const result = await processItem(input);
        successItems.push(input);
      } catch (err: any) {
        failedItems.push(input);
        
        // Classify error type
        const errorType = classifyError(err);
        if (!errorTypes.includes(errorType)) {
          errorTypes.push(errorType);
        }
      }
    }

  } finally {
    // 3. ALWAYS finalize — even if execution throws
    if (taskId) {
      try {
        const finalizeResponse = await fetch(`/api/v1/tasks/${taskId}/finalize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken()}` },
          body: JSON.stringify({
            successfulCount: successItems.length,
            failedCount: failedItems.length,
            errorTypes: errorTypes,
            durationMs: Date.now() - startTime
          })
        });
        
        if (finalizeResponse.ok) {
          const { creditsRefunded } = await finalizeResponse.json();
          if (creditsRefunded > 0) {
            showNotification(`${creditsRefunded} credits refunded`, 'We detected system errors and returned your credits');
          }
        }
      } catch (finalizeErr) {
        // Finalization failed — will be caught by server reconciliation cron after 4h
        console.error('[TaskFinalize] Failed to finalize task:', taskId, finalizeErr);
      }
    }
  }
}
```

---

### 2.2 New Helper: `classifyError(err)`

```typescript
// extension/src/utils/error-classifier.ts
import { SYSTEM_ERRORS, USER_ERRORS } from '../constants/error-types';

export function classifyError(err: any): string {
  const message = (err?.message || '').toLowerCase();
  
  if (message.includes('blocked') || message.includes('robot') || message.includes('captcha')) {
    return 'amazon_blocked';
  }
  if (message.includes('timeout') || message.includes('network') || message.includes('fetch')) {
    return 'network_timeout';
  }
  if (message.includes('rate limit') || message.includes('429')) {
    return 'rate_limited';
  }
  if (message.includes('invalid asin') || message.includes('not found') || message.includes('no results')) {
    return 'invalid_asin';
  }
  if (message.includes('access denied') || message.includes('permission') || message.includes('403')) {
    return 'access_denied';
  }
  
  return 'unknown_error';
}
```

---

### 2.3 Update Credit Display in Extension UI

Currently the extension UI shows a static credit count fetched at load time. After implementing task finalization, add a **credit sync** call after every task finalization to update the displayed balance in real time.

```typescript
// After finalize API returns
const { creditsRefunded, finalBalance } = await finalizeResponse.json();
updateCreditDisplay(finalBalance);  // Update the UI credit badge
```

---

### 2.4 Background Heartbeat (Optional — Phase 2)

For very long-running tasks (Batch ASIN runs with 100+ inputs), add a heartbeat mechanism to prevent the 4-hour timeout from triggering prematurely:

```typescript
// Send heartbeat every 60 seconds for active tasks
const heartbeatInterval = setInterval(async () => {
  await fetch(`/api/v1/tasks/${taskId}/heartbeat`, { method: 'POST' });
}, 60_000);

// Clear heartbeat on completion
clearInterval(heartbeatInterval);
```

**New API route:** `POST /api/v1/tasks/[taskId]/heartbeat` — updates `tasks.last_heartbeat_at = NOW()`. Reconciliation cron uses `last_heartbeat_at` instead of `created_at` to determine staleness.

---

## PART 3 — DASHBOARD CHANGES

### 3.1 Credit History Table (Analytics Page)

Update `CreditHistoryTable` component to show:
- **Type badge:** deduction (red) / refund (green) / purchase (orange) / reset (blue)
- **Tool name** linked to tool description
- **Task ID** (truncated, clickable to expand)
- **Refund reason** when type is `refund`

This is currently pulling from an endpoint — just ensure the endpoint reads from `credit_ledger`.

### 3.2 Billing Page: Add Credit Ledger Section

Below the pricing plans on `/dashboard/billing`, add a **Credit History** section showing the last 10 ledger entries (deductions + refunds) with a "View all in Analytics" link.

### 3.3 Sidebar Credit Display

The sidebar footer currently shows trial state. Add a credit balance indicator in the navbar or sidebar footer for active subscribers:

```
[Credits: 1,847 / 2,500 remaining]
[████████░░░░░░░] 74% used
```

---

## PART 4 — IMPLEMENTATION ORDER

### Phase 1 — Foundation (Do First, ~1 week)
1. Create `tasks` and `credit_ledger` database tables
2. Implement `POST /api/v1/tasks/start` (wraps/replaces checkPermission)
3. Implement `POST /api/v1/tasks/[taskId]/finalize`
4. Update `tool-execution.service.ts` in extension to use new flow
5. Implement `classifyError()` helper in extension
6. Test end-to-end: happy path (all succeed), partial failure, full failure

### Phase 2 — Reliability (~3 days)
7. Add reconciliation cron (`task-reconciliation.ts`)
8. Add abuse detection to finalize handler
9. Update `GET /api/v1/user/credits/history` to read from `credit_ledger`
10. Test: stale task auto-refund, high refund rate flagging

### Phase 3 — UX (~2 days)
11. Update `CreditHistoryTable` component (show type badges, refund reasons)
12. Add real-time credit balance update in extension UI post-finalization
13. Add credit ledger section to billing page
14. Update sidebar credit display

### Phase 4 — Hardening (Ongoing)
15. Add heartbeat mechanism for long-running tasks
16. Add admin dashboard to review flagged users
17. Write integration tests for refund edge cases
18. Add alerting when reconciliation refunds > X credits/hour (anomaly detection)

---

## PART 5 — TESTING CHECKLIST

| Test Case | Expected Outcome |
|-----------|-----------------|
| All 10 inputs succeed | 0 credits refunded |
| 8 succeed, 2 fail (amazon_blocked) | 2 credits refunded |
| 8 succeed, 2 fail (invalid_asin) | 0 credits refunded |
| All 10 fail (network_timeout) | 10 credits refunded |
| Task never finalized (extension crashes) | Reconciliation refunds after 4h |
| Extension sends successCount > creditsDeducted | Server clamps refund to 0 |
| User finalize for someone else's taskId | 403 task_not_owned_by_user |
| Finalize called twice on same taskId | 400 task_already_finalized |
| User with 25% refund rate over 30 days | user_flags record created, alert logged |

---

*AMZBoosted Refund Implementation Plan — March 2026*
*Based on audit of: Refund_Strategy.md, tool-execution.service.ts patterns, existing API structure.*
