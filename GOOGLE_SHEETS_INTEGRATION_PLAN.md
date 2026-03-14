# Google Sheets Integration Plan

> **Status of related work:**
> - ✅ Google Drive — fully implemented (OAuth, folder hierarchy, file upload on schedules)
> - ✅ `GoogleSheetsConnectModal` — UI exists, simulated (no real API calls)
> - ❌ Google Sheets write — not implemented anywhere

---

## What We're Solving

Google Drive already works: when a scheduled task completes, the output CSV/Excel/JSON file is
uploaded to `Amzboosted / {Year} / {Month} / Schedules /` in the user's Drive. That's file
storage — a finished file lands in a folder.

Google Sheets is different. Instead of dropping a file, the tool's output rows are **appended
to a live spreadsheet** the user already has open. The sheet updates; no file download required.
This is what sellers actually want — a master sheet that accumulates data week over week, ready
to pivot or chart inside Google Sheets without any manual import step.

---

## What's Already Done (Don't Touch)

| Component | Location | Status |
|-----------|----------|--------|
| OAuth client ID | `wxt.config.ts` | ✅ Done |
| `drive.file` scope | `wxt.config.ts` | ✅ Done (needs expansion — see below) |
| Chrome Identity token flow | `google-drive.service.ts` | ✅ Done |
| Token refresh on 401 | `google-drive.service.ts` | ✅ Done |
| `GoogleServicesConnectModal` | `integrations/GoogleSheetsConnectModal.tsx` | UI only — simulated |
| Drive folder creation | `google-drive.service.ts::getTargetFolderId()` | ✅ Done |
| Drive file upload | `google-drive.service.ts::uploadFile()` | ✅ Done |
| `tool-drive.service.ts` | Format → Drive call | ✅ Done |
| `googleDriveEnabled` in schedule form | `create-schedule/StepNotifications.tsx` | ✅ Done |
| `googleDriveEnabled` in schedule options | `types.ts`, `CreateScheduleDialog.tsx` | ✅ Done |

---

## The Gap — What Needs to Be Built

### 1. OAuth scope expansion

Currently only `drive.file` is requested. Google Sheets API requires an additional scope:

```
https://www.googleapis.com/auth/spreadsheets
```

**File:** `wxt.config.ts` lines 27–29

```typescript
// Before:
scopes: ["https://www.googleapis.com/auth/drive.file"]

// After:
scopes: [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets"
]
```

> The `spreadsheets` scope gives read/write access only to spreadsheets the extension opens or
> creates (matching the existing `drive.file` trust model). It does not give access to all Drive files.

---

### 2. Google Sheets Service

New file: `lib/services/integrations/google-sheets.service.ts`

**Core capability needed:** Append rows to a tab in an existing spreadsheet.

```typescript
class GoogleSheetsService {
  // Reuse the same token flow as google-drive.service.ts
  private async getAccessToken(): Promise<string> { /* same as Drive */ }

  /**
   * Ensure a tab named `tabName` exists in the spreadsheet.
   * Creates it if missing. Returns the sheet ID.
   */
  async ensureTab(spreadsheetId: string, tabName: string): Promise<void>

  /**
   * Append rows to a tab. If the tab is empty, writes a header row first.
   * Rows: array of objects — keys become headers on first write.
   */
  async appendRows(
    spreadsheetId: string,
    tabName: string,
    rows: Record<string, any>[]
  ): Promise<void>
}

export const googleSheetsService = new GoogleSheetsService();
```

**Key Google Sheets API calls:**

```
GET  https://sheets.googleapis.com/v4/spreadsheets/{id}
     → Check if tab exists (response.sheets[].properties.title)

POST https://sheets.googleapis.com/v4/spreadsheets/{id}/sheets:batchUpdate
     body: { requests: [{ addSheet: { properties: { title: tabName } } }] }
     → Create a tab if it doesn't exist

GET  https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{tab}!A1:A1
     → Check if the tab has any data (empty = need header row)

POST https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}:append
     body: { values: [[col1, col2, ...], [val1, val2, ...]] }
     params: valueInputOption=USER_ENTERED, insertDataOption=INSERT_ROWS
     → Append rows (always safe — never overwrites existing data)
```

All calls share the same `fetchWithAuth()` pattern from `google-drive.service.ts`, including
the 401-retry token refresh loop.

---

### 3. Connection modal — make it real

**File:** `entrypoints/dashboard/components/integrations/GoogleSheetsConnectModal.tsx`

Currently the modal simulates everything (`setTimeout` mocks). Replace with:

**Step 1 — Auth:**
```typescript
// Real: use chrome.identity.getAuthToken with interactive: true
// Same call as google-drive.service.ts::getAccessToken()
const token = await chrome.identity.getAuthToken({ interactive: true });
```

**Step 2 — Verify spreadsheet URL:**
```typescript
// Extract spreadsheetId from pasted URL
const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
const spreadsheetId = match?.[1];

// Verify we can read the sheet
const res = await fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title`,
  { headers: { Authorization: `Bearer ${token}` } }
);
// If 200 → verified. If 403 → user needs to share the sheet with themselves (shouldn't happen if they own it).
```

**Step 3 — Save config:**
```typescript
// Store in secureStorage so all tools can read it
await secureStorage.setItem('local:googleSheetsConfig', {
  spreadsheetId,
  sheetName,        // default tab name — can be overridden per tool
  connectedAt: new Date().toISOString(),
});

onConnect({ spreadsheetId, sheetName });
```

---

### 4. Tool-level Sheets service — mirror of `tool-drive.service.ts`

New file: `lib/services/tool-core/tool-sheets.service.ts`

```typescript
export class ToolSheetsService {
  async uploadToSheets(
    toolName: string,
    results: any[],
    options: any,
    config: any
  ) {
    const sheetsConfig = await secureStorage.getItem('local:googleSheetsConfig');
    if (!sheetsConfig?.spreadsheetId) return;

    // Tab name: "SQPSnapshot" or "SQPSnapshot_2026-03" (monthly accumulation)
    const tabName = options.sheetsTabPerMonth
      ? `${toolName}_${format(new Date(), 'yyyy-MM')}`
      : toolName;

    await googleSheetsService.ensureTab(sheetsConfig.spreadsheetId, tabName);
    await googleSheetsService.appendRows(sheetsConfig.spreadsheetId, tabName, results);

    notificationService.notifyIntegrationSync('Google Sheets', true);
  }
}

export const toolSheetsService = new ToolSheetsService();
```

---

### 5. Where to trigger it — matching the Drive pattern exactly

**File:** `lib/services/tool-core/tool-execution.service.ts` (after the Drive block at line ~413)

```typescript
// Google Drive upload (existing)
if (isBackground && options.googleDriveEnabled && results?.length > 0) {
  await toolDriveService.uploadToDrive(toolName, toolId, marketplace, results, options, taskId, config);
}

// Google Sheets append (new — same guard pattern)
if (isBackground && options.googleSheetsEnabled && results?.length > 0) {
  await toolSheetsService.uploadToSheets(toolName, results, options, config);
}
```

Also add the same guard in `entrypoints/background/utils.ts` (the alternate execution path).

---

### 6. Where to show the option to users

There are **two surfaces** where the user controls this:

#### A) Scheduled Tasks (primary surface)

**File:** `entrypoints/dashboard/components/create-schedule/StepNotifications.tsx`

Currently shows: Google Drive toggle (when `googleDriveConnected`).

Add below it: Google Sheets toggle (when `googleSheetsConnected`).

```tsx
{googleSheetsConnected && (
  <div className="flex items-center justify-between" onClick={() => setFormData({ ...formData, googleSheetsEnabled: !formData.googleSheetsEnabled })}>
    <div className="flex items-center gap-3">
      <FileSpreadsheet className="w-4 h-4 text-green-600" />
      <div>
        <p className="text-sm font-medium">Google Sheets</p>
        <p className="text-xs text-muted-foreground">
          Append results to your connected spreadsheet
        </p>
      </div>
    </div>
    <Switch checked={formData.googleSheetsEnabled} onCheckedChange={...} />
  </div>
)}
{formData.googleSheetsEnabled && (
  <p className="text-xs text-muted-foreground ml-7">
    Results will be appended to the <strong>{sheetsTabName}</strong> tab, creating a new row for each run.
  </p>
)}
```

Add `googleSheetsEnabled?: boolean` to `create-schedule/types.ts` alongside `googleDriveEnabled`.

#### B) Quick Run (sidepanel) — secondary surface

Quick Run currently does **not** offer Google Drive either — file uploads only happen in
background/scheduled context. The same should apply to Sheets: Quick Run always downloads
locally. Sheets append happens on scheduled runs only.

This is the right design. Quick runs are interactive — the user is present, they can see the
download, and they may be testing. Scheduled runs are unattended — that's when you want the
data to accumulate somewhere permanent without manual steps.

> **Decision: Do not add Sheets toggle to QuickRun export settings sheet.**
> Keep it in schedules only, consistent with Drive behavior.

If you decide in the future to allow manual Sheets push (e.g. a "Send to Sheets" button after
a Quick Run completes), add it as a post-run action button in the QuickUse completion state —
not as a pre-run setting.

---

## Tab Naming Strategy

This is the key UX decision for Sheets. Options:

| Strategy | Tab name | Behavior |
|----------|----------|----------|
| **By tool** (recommended) | `SQPSnapshot` | All runs for that tool accumulate in one tab. Row count grows over time. |
| **By tool + month** | `SQPSnapshot_2026-03` | A new tab appears each month. Easier to compare months. |
| **By run** | `SQPSnapshot_2026-03-13_1430` | One tab per execution. Clean but quickly unmanageable. |

**Recommendation: "By tool" as the default, "by tool + month" as an opt-in per schedule.**

Headers are written once (when the tab is empty). Subsequent runs append rows below. Each row
should include a `run_date` column added by `tool-sheets.service.ts` automatically, so the user
can always tell which run a row came from even in the accumulating view.

```typescript
// Automatically inject run metadata into every row before append
const enrichedRows = results.map(row => ({
  run_date: format(new Date(), 'yyyy-MM-dd'),
  run_time: format(new Date(), 'HH:mm'),
  marketplace: options.marketplace,
  ...row,
}));
```

---

## Data Flow — End to End

```
Scheduled task fires (auto or manual trigger)
  ↓
schedulerService.executeSchedule() → toolExecutionService
  ↓
Tool executes in background service worker
  ↓
results[] returned
  ↓
┌─────────────────────────────────────────────────────┐
│  Parallel post-processing (all apply if enabled)    │
│                                                     │
│  1. downloadService.downloadTaskResults()           │
│     → Creates export record in IndexedDB            │
│     → (No browser download for background runs)     │
│                                                     │
│  2. if googleDriveEnabled:                          │
│     toolDriveService.uploadToDrive()                │
│     → CSV/Excel/JSON file → Drive folder            │
│                                                     │
│  3. if googleSheetsEnabled:                         │
│     toolSheetsService.uploadToSheets()              │
│     → Rows appended to spreadsheet tab              │
└─────────────────────────────────────────────────────┘
  ↓
Schedule marked complete in IndexedDB
Notifications sent (success/fail per channel)
```

---

## Spreadsheet ID Storage — Where and How

The user connects one spreadsheet globally (stored in `secureStorage`). Individual schedules
toggle whether to use it — they don't each specify a different spreadsheet.

```
secureStorage key: 'local:googleSheetsConfig'

Value: {
  spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  sheetName: "Sheet1",    // fallback tab name if tool creates no named tab
  connectedAt: "2026-03-13T14:30:00Z"
}
```

The `googleSheetsConnected` boolean used in `StepNotifications.tsx` comes from checking
whether `secureStorage.getItem('local:googleSheetsConfig')` returns a non-null value.

---

## Implementation Order

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 1 | Add `spreadsheets` OAuth scope | `wxt.config.ts` | 5 min |
| 2 | Make `GoogleSheetsConnectModal` real | `GoogleSheetsConnectModal.tsx` | 2 h |
| 3 | Create `google-sheets.service.ts` | `lib/services/integrations/` | 3 h |
| 4 | Create `tool-sheets.service.ts` | `lib/services/tool-core/` | 1 h |
| 5 | Add `googleSheetsEnabled` to schedule types | `create-schedule/types.ts`, `CreateScheduleDialog.tsx` | 30 min |
| 6 | Add Sheets toggle to StepNotifications | `StepNotifications.tsx` | 30 min |
| 7 | Trigger Sheets upload after tool run | `tool-execution.service.ts`, `background/utils.ts` | 30 min |
| 8 | Test: schedule runs → rows appear in Sheet | Manual test | 1 h |

**Total: ~8–9 hours of work.**

---

## What NOT to Do

- **Don't create a new spreadsheet automatically** — always require the user to provide one. Creating spreadsheets in the user's Drive without their explicit knowledge is bad UX and violates the trust model of `drive.file` scope.
- **Don't overwrite existing sheet data** — always use the `append` API with `insertDataOption=INSERT_ROWS`. Never use `values.update` or `values.clear`.
- **Don't put Sheets config in the schedule form itself** — the spreadsheet ID is global (one connected sheet), not per-schedule. The schedule only toggles whether to use it.
- **Don't add Sheets to Quick Run export settings** — Quick Run is interactive and already downloads locally. Sheets accumulation is a background/scheduled concern only.
- **Don't request broader scopes** (`spreadsheets` alone covers everything needed — don't add `drive` or `drive.readonly`).
- **Don't use service accounts or server-side auth** — this is a Chrome extension. All auth flows through `chrome.identity.getAuthToken()`. No backend OAuth proxy needed.

---

## Quick Visual: What the User Sees

### In the Integrations page (Dashboard):
```
┌────────────────────────────────────────────────┐
│  Google Sheets                      [Connect]  │
│  Append tool results to a spreadsheet          │
│  Requires: Professional plan                   │
└────────────────────────────────────────────────┘
```

After connecting:
```
┌────────────────────────────────────────────────┐
│  Google Sheets                   ✓ Connected   │
│  My Brand Analytics Sheet                      │
│  Connected March 13, 2026       [Disconnect]   │
└────────────────────────────────────────────────┘
```

### In Create Schedule → Step 4 (Notifications):
```
Backup & Export
─────────────────────────────────────────────────
🗂  Google Drive                           [  ○  ]
    Save output file to Drive folder

📊  Google Sheets                          [  ●  ]
    Append results to your connected spreadsheet
    → Rows will be added to the "SQPSnapshot" tab
```

### In the spreadsheet itself:
```
Tab: SQPSnapshot

run_date   | run_time | marketplace | search_term | search_volume | click_share | ...
2026-03-06 | 02:00    | US          | yoga mat    | 84,200        | 12.4%       | ...
2026-03-13 | 02:00    | US          | yoga mat    | 86,100        | 13.1%       | ...
2026-03-20 | 02:00    | US          | yoga mat    | 81,900        | 12.8%       | ...
```

Every scheduled run appends new rows. The user gets a live, growing dataset with no manual work.
