# Account Selection Integration Guide

Last updated: 2026-03-14

---

## Overview

The **Plan-Gated Account Selector** pattern lets tools support multi-account Seller Central users
on Pro/Business plans while gracefully degrading to a simple marketplace picker for Starter.

- **Pro / Business**: `AccountMarketplaceSelector` — user picks a specific Seller Central account
  + marketplace. The scheduler (and optionally the sidepanel runner) auto-switches to that account
  before executing the tool.
- **Starter**: `MarketplaceSelector` — uses whatever account is currently active in Seller Central.
  An amber upgrade banner is shown inline.

---

## The Component

```
entrypoints/sidepanel/components/inputs/PlanGatedAccountSelector.tsx
```

Drop-in wrapper. Replace every `AccountMarketplaceSelector` import in a sidepanel tool with this.

### Props

```typescript
interface PlanGatedAccountSelectorProps {
    // Pro / Business path (AccountMarketplaceSelector)
    selectedGlobalAccountId?: string;
    onGlobalAccountChange: (account: GlobalAccount | null) => void;
    selectedMarketplace?: Marketplace | null;
    onMarketplaceChange: (marketplace: Marketplace) => void;

    // Starter path (MarketplaceSelector fallback)
    marketplaceValue?: string;          // default: 'US'
    onMarketplaceValueChange?: (value: string) => void;
}
```

---

## Integration Pattern

### 1 — Add state for both paths

```typescript
// Pro/Business path
const [selectedGlobalAccountId, setSelectedGlobalAccountId] = useState<string | undefined>();
const [selectedGlobalAccount, setSelectedGlobalAccount] = useState<GlobalAccount | null>(null);
const [selectedMarketplace, setSelectedMarketplace] = useState<Marketplace | null>(null);

// Starter fallback path
const [simpleMarketplace, setSimpleMarketplace] = useState('US');
```

### 2 — Replace the import

```typescript
// Before
import { AccountMarketplaceSelector } from '../components/AccountMarketplaceSelector';

// After
import { PlanGatedAccountSelector } from '../components/inputs/PlanGatedAccountSelector';
```

### 3 — Render the component

```tsx
<PlanGatedAccountSelector
    selectedGlobalAccountId={selectedGlobalAccountId}
    onGlobalAccountChange={(account) => {
        setSelectedGlobalAccount(account);
        setSelectedGlobalAccountId(account?.merchantId);
    }}
    selectedMarketplace={selectedMarketplace}
    onMarketplaceChange={setSelectedMarketplace}
    marketplaceValue={simpleMarketplace}
    onMarketplaceValueChange={setSimpleMarketplace}
/>
```

### 4 — Emit dual data payloads

In your `useEffect` that calls `onDataChange`, emit both paths so the tool runner and scheduler
can handle whichever is populated:

```typescript
useEffect(() => {
    onDataChange({
        // Pro/Business fields (populated when account is selected)
        globalAccountId: selectedGlobalAccountId,
        marketplaceIds: selectedMarketplace
            ? [selectedMarketplace.marketplaceId]
            : undefined,

        // Starter fallback field
        marketplace: simpleMarketplace,

        // ... other tool-specific fields
    });
}, [selectedGlobalAccountId, selectedMarketplace, simpleMarketplace, /* ...other deps */]);
```

### 5 — Tool service must handle both

In the tool's service / execution layer, check which path is active:

```typescript
// Account-switching path (Pro/Business)
if (params.globalAccountId && params.marketplaceIds?.length) {
    // Scheduler handles the switch before calling the service
    // Service receives the already-switched context
    const marketplaceCode = resolveMarketplaceCode(params.marketplaceIds[0]);
    return await this.runForMarketplace(marketplaceCode);
}

// Simple path (Starter)
return await this.runForMarketplace(params.marketplace ?? 'US');
```

---

## How Account Switching Works

Account switching happens **before tool execution** in `scheduler.service.ts` (for scheduled runs).
For manual sidepanel runs, the user is expected to already be on the correct account, or the
extension prompts them to switch.

### Scheduler flow

```
schedule.options.globalAccountId + marketplaceIds set?
  ↓ YES
  accountService.switchAccount(merchantId, marketplaceId, partnerAccountId)
    ↓ SUCCESS → execute tool as normal
    ↓ FAIL    → notify user, abort run (do NOT deduct credits)
  ↓ NO (Starter / no account set)
  execute tool using current active Seller Central session
```

### `accountService.switchAccount()` internals

Located at `lib/services/account.service.ts`.

Uses Amazon's native account-switcher API endpoints:
- `GET /account-switcher/regional-accounts/` — lists regional accounts
- `GET /account-switcher/global-accounts/` — lists global accounts
- Switch target: `https://sellercentral.amazon.com/home?mons_sel_mkid={marketplaceId}&mons_sel_mcid={merchantId}&mons_sel_mmid={partnerAccountId}`
  with `credentials: 'include'` to carry the active browser session
- Verification: re-fetches `/account-switcher/global-and-regional-account/merchantMarketplace`

The switch is transparent to the tool service — it just reads from the active session context.

---

## Tools Status

| Tool | Account-Specific? | Status |
|---|---|---|
| `SalesTrafficDrilldown.tsx` | ✅ Yes | ✅ Integrated |
| `SQPSnapshotTool.tsx` | ✅ Yes (SQP data is per-account) | ✅ Integrated |
| `TopTermsTool.tsx` | ✅ Yes (Brand Analytics is per-account) | ✅ Integrated |
| `CategoryInsightsTool.tsx` | ⬜ No (public catalog data) | Not needed |
| `AsinExplorerTool.tsx` | ⬜ No (public ASIN data) | Not needed |
| `NicheX.tsx` | ⬜ No (niche/keyword research) | Not needed |
| `RufusQA.tsx` | ⬜ No (public Q&A data) | Not needed |
| `PriceTrackerTool.tsx` | ⬜ No (public price data) | Not needed |
| `ProductNicheMetrics.tsx` | ⬜ No (public metrics) | Not needed |

**Rule of thumb:** A tool needs account selection if it reads data from Amazon Seller Central
pages that are locked behind authentication AND specific to the merchant's catalog
(e.g., SQP, Sales/Traffic reports, Brand Analytics, Inventory, Advertising).

---

## Scheduler — Wiring Account Selection

When creating a schedule, `StepFrequency.tsx` and the schedule `options` object must carry:

```typescript
interface ScheduleOptions {
    globalAccountId?: string;       // merchant ID from GlobalAccount
    marketplaceIds?: string[];      // e.g. ['ATVPDKIKX0DER'] for US
    partnerAccountId?: string;      // used for account-switch URL param
    // ... other options
}
```

`scheduler.service.ts` reads these options and calls `accountService.switchAccount()` before
each scheduled execution. If not set, runs on the currently active account.

---

## Adding a New Tool — Checklist

1. [ ] Does the tool read account-specific data? If yes, continue.
2. [ ] Add `selectedGlobalAccountId`, `selectedGlobalAccount`, `selectedMarketplace`, `simpleMarketplace` state.
3. [ ] Replace `AccountMarketplaceSelector` (or add) with `PlanGatedAccountSelector`.
4. [ ] Wire `onGlobalAccountChange` and `onMarketplaceChange` handlers.
5. [ ] Emit both `globalAccountId + marketplaceIds` AND `marketplace` in `onDataChange`.
6. [ ] Update the tool service to handle both payload shapes.
7. [ ] Test: Starter sees `MarketplaceSelector` + amber banner. Pro sees `AccountMarketplaceSelector`.
8. [ ] Update the Tools Status table above.
