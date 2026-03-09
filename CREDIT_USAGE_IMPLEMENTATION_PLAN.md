# Credit & Usage Tracking — Implementation Plan

Based on full audit of `CREDIT_AND_USAGE_TRACKING.md` against all live code.
Date: 2026-03-07

---

## Status Summary

| Area | Status |
|---|---|
| Permission-first credit deduction | Done |
| Schedule permission + credit deduction | Done |
| Analytics event ingestion | Done |
| Sync check timestamps | Done |
| Credit history pagination | Done |
| Usage stats endpoint | Done |
| Billing usage endpoint | Done |
| Schedule completion + webhooks | Done |
| Refund endpoint | **BROKEN — wrong table** |
| Tool run analytics tracking | **MISSING** |
| User metrics (tool runs) | **MISSING** |
| Analytics stats — date ranges | **MISSING** |
| Analytics stats — success rate, marketplace, velocity | **MISSING** |
| Pre-aggregated daily metrics table | **MISSING** |
| Cross-device task history | **MISSING** |
| Error code tracking | **MISSING** |
| Credit waste projection | **MISSING** |
| Explicit task failure endpoint | **MISSING** |

---

## Critical Bugs (Fix Before Anything Else)

### Bug 1 — Refund writes to wrong table
**File**: `app/api/v1/credits/refund/route.ts`
**Lines**: 71–88

The refund handler reads `users.credits` and writes back to the `users` table:
```ts
const { data: userData } = await supabase.from('users').select('credits').eq('id', userId).single();
const newCredits = currentCredits + amount;
await supabase.from('users').update({ credits: newCredits }).eq('id', userId);
```

Every other part of the system — `deductCredits()`, `getUserCredits()`, `user/usage`, `billing/usage`, `permissions/check` — reads and writes the `user_credits` table (`user_credits.remaining`, `user_credits.used`, `user_credits.total`).

**Result**: Refunds silently update a stale `users.credits` column that nothing reads. The user's displayed balance never changes after a refund. They are being charged for failed tool runs permanently.

**Fix required**:
- Replace the `users.credits` read/write block with:
  ```ts
  // Read from user_credits
  const { data: credits } = await supabase
      .from('user_credits').select('remaining, used').eq('user_id', userId).single();

  // Update user_credits
  await supabase.from('user_credits')
      .update({
          remaining: credits.remaining + amount,
          used: Math.max(0, credits.used - amount),
      })
      .eq('user_id', userId);
  ```
- Return `newBalance: credits.remaining + amount` in the response

---

### Bug 2 — Standalone deduct endpoint bypasses all permission checks
**File**: `app/api/v1/user/credits/deduct/route.ts`

This endpoint calls `deductCredits()` directly with no plan check, subscription check, tool access check, or credit sufficiency guard beyond what `deductCredits()` itself enforces. Any authenticated extension client can call this endpoint with any `amount` and it will deduct credits without verifying the user has an active plan, valid subscription, or access to the requested tool.

The `permissions/check` endpoint already deducts credits as part of its flow. This standalone endpoint is redundant and a security hole.

**Fix required**:
- Remove `app/api/v1/user/credits/deduct/route.ts` entirely
- Ensure the extension always goes through `permissions/check` for credit deduction

---

### Bug 3 — Tool run events never fire automatically
**File**: `app/api/v1/permissions/check/route.ts`, lines 40–62

When a `run_tool` permission is granted and credits are deducted, no analytics event is inserted. The `analytics_events` table only receives tool run data if the extension explicitly calls `POST /analytics/track` with `type: 'tool_run'`. If the extension skips that call (bug, crash, or version mismatch), the tool run disappears from analytics entirely.

**Fix required**:
- After deducting credits in `run_tool` branch, insert an `analytics_events` row server-side:
  ```ts
  await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'tool_run',
      tool_id: body.toolId,
      marketplace: body.marketplace || null,
      url_count: urlCount,
      credits_used: creditsNeeded,
      timestamp: new Date().toISOString(),
      metadata: { taskId, source: 'permission_check' },
  });
  ```

---

### Bug 4 — user_metrics never updated for tool runs
**File**: `app/api/v1/analytics/track/route.ts`, line 75

```ts
if (eventType.startsWith('schedule_run')) {
    await updateUserMetrics(userId, eventType, body);
}
```

`updateUserMetrics()` is only called for `schedule_run_*` events. Regular `tool_run`, `tool_complete`, and `tool_error` events do not update `user_metrics`. This means:
- `user_metrics.total_tools_run` (if it exists) is never incremented
- Total credits used on manual tool runs is not tracked in metrics
- Success/failure rates for manual tool runs are unavailable for aggregated stats

**Fix required**:
- Extend the condition to also handle `tool_run`, `tool_complete`, and `tool_error`:
  ```ts
  if (eventType.startsWith('schedule_run') || eventType.startsWith('tool_')) {
      await updateUserMetrics(userId, eventType, body);
  }
  ```
- Add counters to `updateUserMetrics()` for `total_tool_runs`, `total_tool_successes`, `total_tool_failures`, `credits_used_tools`

---

## Missing Features — Implement in Order

### Feature 1 — Add error_code to analytics events

**Why**: Section 5.4 of the doc requires error categorization. The refund endpoint hardcodes `reason: 'Task failed'` with no machine-readable code. Without error codes, you cannot identify which errors to prioritize fixing (proxy errors vs Amazon auth vs invalid ASIN).

**DB change**: Add `error_code VARCHAR(50)` column to `analytics_events` table.

**API change** — `POST /api/v1/analytics/track`:
- Accept `errorCode` in the request body
- Save it to the new column

**API change** — `POST /api/v1/credits/refund`:
- Accept `errorCode` in the request body (optional)
- Include it in the `credit_transactions.metadata` for audit

**Valid error codes to document and accept**:
```
SYSTEM_ERRORS (eligible for refund):
  amazon_blocked        — Amazon returned a captcha or block
  network_timeout       — Request timed out
  rate_limited          — Amazon rate limited the request
  proxy_error           — Proxy/scraper layer failed

USER_ERRORS (not eligible for refund):
  invalid_asin          — ASIN does not exist
  product_not_found     — Product page returned 404
  marketplace_mismatch  — ASIN not available in selected marketplace
  invalid_url           — URL format was wrong
```

---

### Feature 2 — Explicit task failure endpoint

**Why**: Section 5.2 recommends `/tasks/{taskId}/report-failure`. Currently the extension calls the generic refund endpoint with a `transactionId`. The refund endpoint verifies the transaction exists but has no server-side record of the task, so it cannot validate whether the task was actually run or determine which error class it falls into.

**New route**: `POST /api/v1/tasks/[taskId]/report-failure`

Request body:
```ts
{
  transactionId: string;   // The credit_transactions.id from permissions/check
  urlsFailed: number;      // How many URLs failed (for partial refund)
  urlsTotal: number;       // Total URLs in the task
  errorCode: string;       // From the error code list above
  errorMessage?: string;   // Human-readable (optional, for debugging)
}
```

Server logic:
1. Auth check: verify `userId` owns the `transactionId`
2. Error classification: check if `errorCode` is a `SYSTEM_ERROR` (auto-refund) or `USER_ERROR` (no refund)
3. Calculate refund: `Math.floor((urlsFailed / urlsTotal) * creditsDeducted)` — only for SYSTEM_ERRORS
4. If refund eligible: call the fixed refund logic (writing to `user_credits` table)
5. Log to `credit_transactions` with `type: 'refund'` and `metadata.errorCode`
6. Return: `{ refunded: number, reason: string, newBalance: number }`

This replaces the need for the extension to calculate refund amounts itself.

---

### Feature 3 — Cross-device task history

**Why**: Section 5.3. Current "Recent Activity" lives in IndexedDB only. New device = blank history. This kills the dashboard for users with multiple machines or after a browser reinstall.

**New route**: `GET /api/v1/user/task-history`

Query params: `?limit=50&offset=0&toolId=&marketplace=&status=`

This requires a server-side `tasks` table. **DB schema**:
```sql
CREATE TABLE tasks (
  id            UUID PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id),
  tool_id       VARCHAR(100),
  tool_name     VARCHAR(255),
  marketplace   VARCHAR(10),
  status        VARCHAR(20) CHECK (status IN ('running', 'completed', 'failed')),
  url_count     INTEGER DEFAULT 0,
  credits_used  INTEGER DEFAULT 0,
  error_code    VARCHAR(50),
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}'
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

**How tasks get created**:
- In `permissions/check` route (`run_tool` branch): after deducting credits, insert a row with `status: 'running'`
- The `taskId` returned to the extension is this row's `id`

**How tasks get completed**:
- Extension calls existing `POST /analytics/track` with `type: 'tool_complete'` or `type: 'tool_error'`
- The track endpoint should also update the `tasks` row: `UPDATE tasks SET status, completed_at, duration_ms, error_code WHERE id = metadata.taskId`

**Response from `GET /api/v1/user/task-history`**:
```ts
{
  tasks: [{
    id, toolId, toolName, marketplace, status,
    urlCount, creditsUsed, errorCode, durationMs,
    createdAt, completedAt
  }],
  pagination: { total, limit, offset, hasMore }
}
```

**Extension sync behavior**:
- On first load or after IndexedDB wipe: fetch last 50 tasks from this endpoint and seed IndexedDB
- On subsequent loads: compare `tasks[0].created_at` vs most recent IndexedDB entry; pull delta only

---

### Feature 4 — Pre-aggregated daily metrics table

**Why**: Section 5.1. The analytics/stats endpoint currently does a live `SELECT` of up to 1000 raw `analytics_events` rows per request, then aggregates in JavaScript. At 100 active users running 10 tools/day, that's 730,000 rows after a year. Query time will exceed 5 seconds.

**DB schema**:
```sql
CREATE TABLE user_tool_daily_metrics (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  tool_id         VARCHAR(100) NOT NULL,
  marketplace     VARCHAR(10) NOT NULL DEFAULT 'US',
  date            DATE NOT NULL,
  runs_total      INTEGER DEFAULT 0,
  runs_success    INTEGER DEFAULT 0,
  runs_failed     INTEGER DEFAULT 0,
  credits_used    INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  UNIQUE(user_id, tool_id, marketplace, date)
);

CREATE INDEX idx_daily_metrics_user_date ON user_tool_daily_metrics(user_id, date DESC);
```

**How rows are maintained**:
- In `POST /analytics/track`, when `event_type IN ('tool_complete', 'tool_error', 'schedule_run_complete', 'schedule_run_failed')`:
  ```sql
  INSERT INTO user_tool_daily_metrics (user_id, tool_id, marketplace, date, runs_total, runs_success, runs_failed, credits_used)
  VALUES ($1, $2, $3, CURRENT_DATE, 1, $success::int, (1-$success::int), $credits)
  ON CONFLICT (user_id, tool_id, marketplace, date)
  DO UPDATE SET
    runs_total   = user_tool_daily_metrics.runs_total + 1,
    runs_success = user_tool_daily_metrics.runs_success + EXCLUDED.runs_success,
    runs_failed  = user_tool_daily_metrics.runs_failed + EXCLUDED.runs_failed,
    credits_used = user_tool_daily_metrics.credits_used + EXCLUDED.credits_used;
  ```
- Use a Supabase RPC function or raw SQL via the service role client for the upsert

---

### Feature 5 — Improved analytics/stats with date range and full metrics

**Why**: The current `/analytics/stats` returns only top-5 tool run counts. The doc specifies: success rate, marketplace distribution, tool popularity, credit velocity, peak usage times. The website analytics page has no date range selector.

**Updated route**: `GET /api/v1/analytics/stats?period=7d|30d|90d|all`

New response shape:
```ts
{
  period: { start: string, end: string, label: string },
  summary: {
    totalRuns: number,
    successRate: number,           // percentage
    totalCreditsUsed: number,
    avgRunsPerDay: number,
    mostActiveDay: string,         // ISO date
    topTool: { id: string, name: string, runs: number }
  },
  toolsBreakdown: [{
    toolId: string,
    toolName: string,
    runs: number,
    successRate: number,
    creditsUsed: number,
  }],
  marketplaceDistribution: [{
    marketplace: string,
    runs: number,
    percentage: number,
  }],
  creditVelocity: [{
    date: string,       // YYYY-MM-DD
    creditsUsed: number,
    runsTotal: number,
  }],
  peakUsageHours: [{
    hour: number,       // 0-23 UTC
    runs: number,
  }],
}
```

**Implementation**:
- Use `user_tool_daily_metrics` table (Feature 4) for `toolsBreakdown`, `creditVelocity`, `marketplaceDistribution`
- Use `analytics_events` only for `peakUsageHours` (GROUP BY EXTRACT(HOUR FROM timestamp))
- Apply `date >= NOW() - INTERVAL '7 days'` filter based on period param

---

### Feature 6 — Credit waste projection

**Why**: Section 5.5. Users on a 2,500-credit Pro plan who use 400 credits by day 28 are wasting 2,100 credits. Surfacing this can either push them to a lower plan (churn prevention) or encourage more usage (revenue protection).

**Add to `GET /api/v1/user/usage` response**:
```ts
creditInsights: {
  projectedUsageEOMonth: number,   // linear extrapolation
  projectedWaste: number,          // total - projected
  wastePercentage: number,
  recommendation: 'downgrade' | 'on_track' | 'at_risk' | null,
  // 'downgrade' = projected < 30% of allocation
  // 'on_track'  = 30–85% of allocation
  // 'at_risk'   = projected > 85% (might run out)
}
```

**Calculation**:
```ts
const daysInMonth = new Date(year, month + 1, 0).getDate();
const dayOfMonth = new Date().getDate();
const dailyRate = usedThisMonth / dayOfMonth;
const projectedEOM = Math.round(dailyRate * daysInMonth);
const projectedWaste = Math.max(0, totalCredits - projectedEOM);
const wastePercentage = Math.round((projectedWaste / totalCredits) * 100);
```

---

## Database Changes Summary

All changes to run as SQL migrations in Supabase:

```sql
-- 1. Fix analytics_events to store error codes
ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS error_code VARCHAR(50);

-- 2. Create tasks table for cross-device history
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id       VARCHAR(100),
  tool_name     VARCHAR(255),
  marketplace   VARCHAR(10),
  status        VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  url_count     INTEGER DEFAULT 0,
  credits_used  INTEGER DEFAULT 0,
  error_code    VARCHAR(50),
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  metadata      JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- 3. Pre-aggregated daily metrics
CREATE TABLE IF NOT EXISTS user_tool_daily_metrics (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id         VARCHAR(100) NOT NULL,
  marketplace     VARCHAR(10) NOT NULL DEFAULT 'US',
  date            DATE NOT NULL,
  runs_total      INTEGER DEFAULT 0,
  runs_success    INTEGER DEFAULT 0,
  runs_failed     INTEGER DEFAULT 0,
  credits_used    INTEGER DEFAULT 0,
  avg_duration_ms INTEGER DEFAULT 0,
  UNIQUE(user_id, tool_id, marketplace, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON user_tool_daily_metrics(user_id, date DESC);

-- 4. Add tool run counters to user_metrics (if table exists)
ALTER TABLE user_metrics
  ADD COLUMN IF NOT EXISTS total_tool_runs   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_successes   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_failures    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_used_tools INTEGER DEFAULT 0;
```

---

## API Changes Summary

### Routes to fix (bugs):
| Route | Fix |
|---|---|
| `POST /api/v1/credits/refund` | Write to `user_credits` table, not `users.credits` |
| `POST /api/v1/user/credits/deduct` | Delete — bypass of permission checks |
| `POST /api/v1/permissions/check` (`run_tool`) | Insert `analytics_events` row server-side after deduction |
| `POST /api/v1/analytics/track` | Call `updateUserMetrics` for `tool_*` events too; upsert `user_tool_daily_metrics` |

### Routes to create (new):
| Route | Purpose |
|---|---|
| `POST /api/v1/tasks/[taskId]/report-failure` | Classify error, calculate and issue auto-refund |
| `GET /api/v1/user/task-history` | Paginated server-side task list for cross-device sync |

### Routes to upgrade:
| Route | Upgrade |
|---|---|
| `GET /api/v1/analytics/stats` | Add `?period=` param, rewrite to use `user_tool_daily_metrics`, add success rate + marketplace + credit velocity + peak hours |
| `GET /api/v1/user/usage` | Add `creditInsights` block with waste projection |

---

## Implementation Order

### Phase 1 — Critical bugs (do first, breaks user trust)
1. Fix `POST /api/v1/credits/refund` — wrong table write
2. Delete `POST /api/v1/user/credits/deduct` — security bypass
3. Add server-side `analytics_events` insert in `permissions/check` `run_tool` branch
4. Extend `updateUserMetrics` to handle `tool_run`, `tool_complete`, `tool_error`

### Phase 2 — Database schema (run migrations)
5. Add `error_code` column to `analytics_events`
6. Create `tasks` table + indexes
7. Create `user_tool_daily_metrics` table + indexes
8. Add new columns to `user_metrics`

### Phase 3 — New routes
9. Create `POST /api/v1/tasks/[taskId]/report-failure` with error classification + auto-refund
10. Create `GET /api/v1/user/task-history` with pagination and filters

### Phase 4 — Upgrade existing routes
11. Rewrite `GET /api/v1/analytics/stats` with period filter + full metrics from daily_metrics table
12. Add `creditInsights` to `GET /api/v1/user/usage`

### Phase 5 — Extension side (coordinate with extension developer)
13. In `tool-execution.service.ts`: always call `POST /analytics/track` with `type: 'tool_complete'` or `type: 'tool_error'` and include `errorCode` on failures
14. Replace direct refund calls with calls to `POST /api/v1/tasks/[taskId]/report-failure`
15. In `SyncService`: seed IndexedDB from `GET /api/v1/user/task-history` when local store is empty

---

## Testing Checklist

After each phase, verify:

**Phase 1 tests:**
- [ ] Run a tool, observe credit deduction in `user_credits.remaining` ✓
- [ ] Call `/credits/refund` with valid `transactionId`, confirm `user_credits.remaining` increases (not `users.credits`)
- [ ] Confirm `analytics_events` has a `tool_run` row after `permissions/check` approval, even if extension never calls `/analytics/track`
- [ ] Confirm `user_metrics` is updated after `tool_complete` event hits `/analytics/track`

**Phase 2 tests:**
- [ ] Insert a `tool_complete` event and verify `user_tool_daily_metrics` upsert fires
- [ ] Run same tool twice in same day/marketplace: verify `runs_total = 2` not two separate rows

**Phase 3 tests:**
- [ ] Call `report-failure` with `errorCode: 'amazon_blocked'` → verify refund issued, credits returned
- [ ] Call `report-failure` with `errorCode: 'invalid_asin'` → verify no refund, 200 response with `refunded: 0`
- [ ] Call `report-failure` twice with same `taskId` → verify idempotency, no double refund
- [ ] Call `GET /user/task-history` from a fresh session → verify tasks from previous session appear

**Phase 4 tests:**
- [ ] `GET /analytics/stats?period=7d` returns data scoped to last 7 days only
- [ ] `successRate` in stats matches manual count of completed vs failed events
- [ ] `GET /user/usage` `creditInsights.projectedWaste` is non-negative and non-null when user has credits
