# AMZBoosted Extension Performance & Size Reduction Plan

> Current state: all issues identified from live codebase analysis.
> Priority levels: 🔴 High impact, 🟡 Medium impact, 🟢 Low impact / nice-to-have.

---

## Current Bundle Breakdown (Estimated)

| Package | Size (minified+gzip) | Used by | Notes |
|---------|---------------------|---------|-------|
| react + react-dom | ~42 KB | Everything | Required |
| recharts | ~80 KB | PriceTrackerPage | Only one page |
| xlsx | ~300 KB | Download service | Loaded eagerly |
| lucide-react | ~120 KB | All pages | 344 icons, only ~40 used |
| @tanstack/react-table | ~50 KB | 5–6 pages | Could lazy-load |
| @tanstack/react-query | ~35 KB | Installed but mostly unused | See below |
| react-router-dom | ~45 KB | Dashboard | Required |
| @radix-ui (17 pkgs) | ~80 KB | UI components | Mostly tree-shaken |
| react-joyride | ~40 KB | Onboarding only | Load once |
| canvas-confetti | ~20 KB | Onboarding only | Load once |
| date-fns | ~30 KB | Multiple pages | Partially tree-shaken |

**Estimated total: ~900 KB uncompressed, ~280–320 KB gzipped**

---

## 🔴 Issue 1: `xlsx` loaded eagerly across all bundles

**Where:** `lib/services/download.service.ts` imports `xlsx` at the top of the file. The download service is imported by tool services, which are imported in `tool-definitions.ts`, which is imported at startup.

**Impact:** ~300 KB added to every bundle that touches tool execution — including the background service worker, even though it doesn't render Excel files.

**Fix:**
```typescript
// lib/services/download.service.ts — change static import to dynamic
// Before:
import * as XLSX from 'xlsx';

// After: inside the method that generates Excel
async function toExcel(data: any[], filename: string) {
  const XLSX = await import('xlsx'); // ~300 KB loaded only when needed
  const ws = XLSX.utils.json_to_sheet(data);
  // ...
}
```

The Excel generation code is only called when `outputFormat === 'excel'`. Users who always download CSV never pay the 300 KB cost.

**Effort:** 1–2 hours. Low risk.

---

## 🔴 Issue 2: All tool service classes eagerly imported at startup

**Where:** `lib/tool-definitions.ts` imports all 10 service instances at the top:
```typescript
import { sqpUniversalService } from '@/lib/services/tools/sqp-universal.service';
import { topTermsService } from '@/lib/services/tools/top-terms.service';
// ... 8 more
```

This means all tool service code — and all their dependencies — loads into the background service worker on every browser start, even if the user doesn't use any tool.

**Impact:** Every service file is ~350–750 lines. Loading 10 of them adds ~20–40 KB of JavaScript that runs on startup.

**Fix: Dynamic service loading**
```typescript
// In tool-definitions.ts, instead of static imports:

{
  id: 'sqr-simple',
  execute: async (options, onProgress) => {
    const { sqpUniversalService } = await import(
      '@/lib/services/tools/sqp-universal.service'
    );
    return sqpUniversalService.execute([], options, onProgress);
  },
  // ...
},
```

Each service file is only loaded when that specific tool is actually invoked. The background worker stays lean.

**Effort:** 3–4 hours. Medium risk (test each tool after change).

---

## 🔴 Issue 3: `recharts` loaded in dashboard bundle unconditionally

**Where:** `PriceTrackerPage.tsx` imports recharts at the top. The dashboard bundle includes recharts for all users even if they never open the Price Tracker.

**Fix:** Lazy-load the entire PriceTrackerPage since it's already routed:
```typescript
// entrypoints/dashboard/App.tsx (or router)
const PriceTrackerPage = lazy(() =>
  import('./pages/tools/PriceTrackerPage')
);
```

recharts is only bundled when `PriceTrackerPage` is first visited. Same pattern should apply to any page with a heavy dependency.

**Effort:** 30 minutes.

---

## 🔴 Issue 4: IndexedDB price history `getAll` — full table scan per click

**Where:** `priceTrackerService.getHistory(trackerId)` at `lib/services/tools/price-tracker.service.ts:328–331`:
```typescript
async getHistory(trackerId: string): Promise<PriceHistory[]> {
  const allHistory = await indexedDBService.getAll<PriceHistory>(STORES.PRICE_HISTORY);
  return allHistory.filter(h => h.trackerId === trackerId);
}
```

This reads **all price history for all ASINs** from IndexedDB, then filters client-side. If a user has 50 tracked ASINs with 90 days of hourly checks each, that's 50 × 90 × 24 = **108,000 rows** loaded into memory on every detail panel click.

**Fix: Add an IndexedDB index on `trackerId`**

In `lib/services/indexed-db.service.ts`, when creating the `PRICE_HISTORY` object store:
```typescript
// In the DB upgrade handler:
if (!db.objectStoreNames.contains(STORES.PRICE_HISTORY)) {
  const store = db.createObjectStore(STORES.PRICE_HISTORY, { keyPath: 'id' });
  store.createIndex('by_tracker', 'trackerId', { unique: false });
  store.createIndex('by_tracker_timestamp', ['trackerId', 'timestamp'], { unique: false });
}
```

Then query directly:
```typescript
async getHistory(trackerId: string): Promise<PriceHistory[]> {
  return await indexedDBService.getByIndex<PriceHistory>(
    STORES.PRICE_HISTORY, 'by_tracker', trackerId
  );
}
```

This reduces the read from O(all history) to O(this tracker's history). On a table with 100K rows this is the difference between 500 ms and 5 ms.

**Effort:** 2–3 hours (DB migration requires version bump + migration handler).

---

## 🟡 Issue 5: `useIntegrations` fetches fresh on every page visit

**Where:** `lib/hooks/useIntegrations.ts` — checks cache but still does a fresh API fetch on every mount. Every page that calls `useIntegrations()` (NotificationsPage, IntegrationsPage) triggers a network request.

**Fix: Global React Query cache**

React Query is already installed (`@tanstack/react-query: ^5.90.21`) but barely used. A single `QueryClient` at the app root means integrations fetched once are shared across every component that queries the same key:

```typescript
// lib/hooks/useIntegrations.ts
import { useQuery } from '@tanstack/react-query';

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const result = await apiClient.request<IntegrationDefinition[]>('/integrations');
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,  // Treat as fresh for 5 minutes
    gcTime: 30 * 60 * 1000,    // Keep in memory for 30 minutes
  });
}
```

Apply the same pattern to:
- `useRemoteTools` → `queryKey: ['tools']`
- User limits: `queryKey: ['user-limits']`
- Subscription status: `queryKey: ['subscription']`

The integration page opening 3 times in a session goes from 3 API calls to 1.

**Effort:** 4–6 hours to migrate the key hooks.

---

## 🟡 Issue 6: `lucide-react` — all 344 icons in the bundle

**Where:** Lucide exports 344 icons. Even with tree-shaking, if any part of the codebase does `import * as Icons from 'lucide-react'` the entire library loads.

**Audit command:**
```bash
grep -r "from 'lucide-react'" . | grep -v node_modules | \
  grep -oP "(?<=\{ ).*(?= \})" | tr ',' '\n' | sort -u
```

**Fix:** Ensure every import is named (already likely the case), and ensure no `import *` pattern exists. Also consider `lucide-react/dist/esm/icons/bar-chart.js` direct imports for the background bundle where React icons shouldn't be needed at all.

**Effort:** 1 hour audit + fix.

---

## 🟡 Issue 7: `react-joyride` and `canvas-confetti` ship to all users

**Where:** Both are used only in the onboarding flow (`OnboardingFlow.tsx`). Onboarding runs once per user — but every user pays the bundle cost forever.

**Fix:** Dynamic imports inside the component:
```typescript
// In OnboardingFlow.tsx
const [{ default: confetti }, Joyride] = await Promise.all([
  import('canvas-confetti'),
  import('react-joyride').then(m => ({ default: m.default })),
]);
```

Or wrap the entire `OnboardingFlow` component in `React.lazy()` since it's conditionally rendered.

**Effort:** 1 hour.

---

## 🟡 Issue 8: Background service loads all message handlers eagerly

**Where:** `entrypoints/background.ts` imports all handlers at startup:
```typescript
import { handleInitDB, handleGetStorageStats, handleClearAllData, ... } from './background/message-handlers';
import { handleRunSchedule, ... } from './background/scheduler-handlers';
```

Handlers for rarely-used operations (import/export backup, clear all data) load on every browser start.

**Fix: Message-driven lazy loading**
```typescript
// background.ts message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {
      case 'EXPORT_DATA': {
        const { handleExportData } = await import('./background/message-handlers');
        return handleExportData(message, sender);
      }
      // Frequent operations keep static imports
      case 'START_TOOL': {
        return handleToolMessage(message, sender, sendResponse); // static
      }
    }
  };
  handle().then(sendResponse);
  return true; // keep channel open
});
```

**Effort:** 2 hours.

---

## 🟢 Issue 9: `@tanstack/react-table` loaded for 6 pages

Every page with a DataTable loads the full react-table library (~50 KB). Since pages are already route-based in the dashboard, each page component can be lazy-loaded and react-table only loads when that page is first visited.

**Fix:** Ensure all dashboard page components in the router use `React.lazy()`:
```typescript
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ExportsPage = lazy(() => import('./pages/ExportsPage'));
// etc.
```

If the router already does this, verify it's not being imported eagerly elsewhere.

**Effort:** 1 hour audit.

---

## 🟢 Issue 10: `secureStorage` reads on every hook init

Many hooks do `secureStorage.get(...)` to check a cache on every mount. These are async and block the initial render with a loading state even when the data hasn't changed.

**Fix:** Initialize a shared in-memory cache layer in front of `secureStorage`. First read goes to disk; subsequent reads within the same session return the in-memory copy. Invalidate on write.

```typescript
class MemoryCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs = 5 * 60 * 1000) {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
export const memoryCache = new MemoryCache();
```

**Effort:** 3–4 hours to wrap key storage reads.

---

## Implementation Priority Order

| # | Change | Impact | Effort | Do First? |
|---|--------|--------|--------|-----------|
| 1 | Dynamic `xlsx` import | ~300 KB savings | Low | ✅ Yes |
| 2 | IndexedDB index for price history | 100x faster queries | Medium | ✅ Yes |
| 3 | Lazy-load `recharts` (PriceTrackerPage) | ~80 KB savings | Low | ✅ Yes |
| 4 | Dynamic tool service imports | ~30 KB bg worker savings | Medium | ✅ Yes |
| 5 | React Query for API hooks | Network call reduction | High | 🔜 Next sprint |
| 6 | Dynamic joyride + confetti | ~60 KB savings | Low | 🔜 Next sprint |
| 7 | Message-driven bg lazy loading | Startup time | Medium | 🔜 Next sprint |
| 8 | Lucide audit | Varies | Low | 🔜 Next sprint |
| 9 | Lazy-load dashboard pages | Per-page savings | Low | 🔜 Next sprint |
| 10 | Memory cache for secureStorage | Render speed | Medium | 🔜 Later |

---

## Quick Wins Checklist (can do in one session)

```bash
# 1. Verify no import * from lucide-react
grep -r "import \* " . --include="*.tsx" --include="*.ts" | grep -v node_modules

# 2. Verify xlsx is the only dynamic import blocker
grep -r "from 'xlsx'" . --include="*.ts" --include="*.tsx" | grep -v node_modules

# 3. Find all pages NOT wrapped in React.lazy()
grep -rn "^import.*Page.*from" entrypoints/dashboard/App.tsx

# 4. Find all React Query keys in use (to plan migration)
grep -rn "queryKey\|useQuery" lib/hooks/ --include="*.ts"
```

---

## What NOT to Do

- **Don't remove `@tanstack/react-query`** — it's the right tool, just underused. Use it more, not less.
- **Don't switch charting libraries** — recharts is fine for the price tracker, just lazy-load it.
- **Don't code-split the background script** — Chrome MV3 service workers don't support dynamic `import()` for script splitting in the same way. Use dynamic `import()` for data modules but not for the background entry itself.
- **Don't worry about Radix UI** — it's well tree-shaken and each component is a separate package. The 17 installed packages only include what's imported.
