# AMZBoosted Tool Development Guide

> **How to add a new tool end-to-end in ~30 minutes.**

---

## What You Need to Touch (Minimal)

| File | What to do |
|------|------------|
| `lib/services/tools/your-tool.service.ts` | Write the tool execution logic |
| `entrypoints/sidepanel/tools/YourTool.tsx` | Sidepanel input UI |
| `lib/tool-definitions.ts` | Register 1 entry |
| `lib/config/tools.json` | Add 1 entry for the public website |

That's it. The background executor, export system, download, and progress tracking all work automatically.

---

## Step 1 — Create the Service File

Copy the template below to `lib/services/tools/your-tool.service.ts`:

```typescript
import { downloadService } from '@/lib/services/download.service';

interface YourToolOptions {
  marketplace: string;
  asins: string[];           // or: searchTerms, urls, etc.
  outputFormat?: 'csv' | 'excel' | 'json';
  delay?: number;            // ms between requests — default 2000
}

class YourToolService {
  async execute(
    _urls: string[],
    options: YourToolOptions,
    onProgress: (p: { current: number; total: number; status: string; phase?: string }) => void
  ) {
    const { marketplace, asins, outputFormat = 'csv', delay = 2000 } = options;
    const results: any[] = [];
    const errors: string[] = [];
    const total = asins.length;

    for (let i = 0; i < total; i++) {
      const asin = asins[i];

      onProgress({
        current: i + 1,
        total,
        status: `Processing ${asin}…`,
        phase: 'extracting',
      });

      try {
        // ── Your data fetch here ────────────────────────────────────
        // Use fetch(), chrome.tabs.create() scrape, or Amazon API call.
        // Example:
        // const data = await fetchAmazonData(asin, marketplace);
        // results.push({ asin, ...data });
        // ────────────────────────────────────────────────────────────
      } catch (err: any) {
        errors.push(`${asin}: ${err.message}`);
      }

      if (i < total - 1 && delay > 0) {
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // Download result
    if (results.length > 0) {
      await downloadService.downloadTaskResults(results, {
        filenamePrefix: 'YourTool',
        marketplace,
        outputFormat,
      });
    }

    return {
      success: errors.length === 0,
      processedCount: results.length,
      results,
      errors,
    };
  }
}

export const yourToolService = new YourToolService();
```

### Key rules for service files
- Always call `onProgress` before processing each item (powers the live UI)
- Always use `downloadService.downloadTaskResults()` — never call `downloadService` methods directly
- `outputFormat` is passed in from the export settings sheet — respect it
- Keep `delay` configurable (scheduler runs use different values than manual runs)

---

## Step 2 — Create the Sidepanel UI Component

Copy to `entrypoints/sidepanel/tools/YourTool.tsx`:

```tsx
import React from 'react';
import { GenericToolInput } from '@/entrypoints/sidepanel/components/GenericToolInput';

// Most tools just need this generic ASIN list input.
// See GenericToolInput props for customization options.

export const YourTool: React.FC = () => {
  return (
    <GenericToolInput
      placeholder="Enter ASINs, one per line"
      inputType="asin"        // 'asin' | 'keyword' | 'url'
      helpText="Paste up to 50 ASINs"
    />
  );
};
```

**If your tool needs custom inputs** (date range, keyword fields, dropdowns), add them above the `GenericToolInput` using standard shadcn components. The tool execution state (marketplace, asins, format) is managed by `useQuickUseState` in QuickUse — your UI just renders the inputs.

**Tools that don't need any URL/ASIN input** (like Top Search Terms which navigates to an existing page):

```tsx
export const YourTool: React.FC = () => {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Navigate to the target page in Amazon, then click Run.
    </div>
  );
};
```

---

## Step 3 — Register in tool-definitions.ts

Add one entry to the `toolDefinitions` array in `lib/tool-definitions.ts`:

```typescript
// Lazy import at top of file (with the others):
const YourTool = lazy(() =>
  import('@/entrypoints/sidepanel/tools/YourTool')
    .then(m => ({ default: m.YourTool }))
);

// In the toolDefinitions array:
{
  id: 'your-tool-id',             // Must match what the API returns
  name: 'Your Tool Name',
  description: 'One-line description shown in the sidebar',
  category: 'Market Intelligence', // Match categories in tools.json

  execute: (options, onProgress) =>
    yourToolService.execute([], options, onProgress),

  filenamePrefix: 'YourTool',

  component: YourTool,

  validation: {
    type: 'asinList',             // 'asinList' | 'urlList' | 'keywordList' | 'none'
    requireInput: true,
  },

  exportParams: {
    supportsExportSettings: true,
    // stateBinding omitted → uses GenericExportSettingsSheet (csv/excel/json)
    // Use 'asin' for ASIN-based tools with category grouping
    // Use 'sqp' for SQP tools with one/separate CSV choice
    // Use 'salesTraffic' for Sales & Traffic
  },
},
```

---

## Step 4 — Add to tools.json (Website)

Add one entry to `lib/config/tools.json`:

```json
{
  "slug": "your-tool-slug",
  "name": "Your Tool Name",
  "category": "Market Intelligence",
  "description": "Short description for SEO and tool cards.",
  "whatItDoes": "2-3 sentences describing what data it extracts and why it matters.",
  "howToUse": "Step-by-step: where to navigate in Seller Central, what to click, what the tool does.",
  "outputFormats": ["CSV"],
  "costPerRun": "1 credit",
  "sampleOutputUrl": "",
  "icon": "BarChart",
  "color": "blue",
  "screenshots": [],
  "videoUrl": "",
  "changelog": [],
  "notes": "Pro tip or important caveat."
}
```

---

## Export Settings — Which Sheet to Use

The export sheet is automatically chosen by `stateBinding` in your `exportParams`.

| Your tool type | stateBinding | Sheet rendered |
|----------------|-------------|----------------|
| ASIN list tool (default) | `'asin'` or omit | `CategoryExportSettingsSheet` — output format only |
| Generic tool | omit | `GenericExportSettingsSheet` — format + one/separate download |
| SQP tools | `'sqp'` | `SQPExportSettingsSheet` — SQP-specific options |
| Sales & Traffic | `'salesTraffic'` | `SalesTrafficExportSettingsSheet` |

**For the vast majority of new tools**, omit `stateBinding` entirely. The generic sheet gives the user CSV/Excel/JSON choice and that's all that's needed.

### Supporting all 3 output formats

In your service, the `outputFormat` option is passed automatically. The `downloadService.downloadTaskResults()` method handles all three:

```typescript
await downloadService.downloadTaskResults(results, {
  filenamePrefix: 'YourTool',
  marketplace,
  outputFormat,  // 'csv' | 'excel' | 'json' — whatever user selected
});
```

Nothing else needed. CSV, Excel, and JSON all work automatically.

---

## Checklist Before Marking Complete

- [ ] Service file: `lib/services/tools/your-tool.service.ts`
- [ ] Sidepanel component: `entrypoints/sidepanel/tools/YourTool.tsx`
- [ ] Registered in `lib/tool-definitions.ts` (lazy import + array entry)
- [ ] Added to `lib/config/tools.json`
- [ ] `outputFormat` is read from options and passed to `downloadService`
- [ ] `onProgress` called for each item with `current`, `total`, `status`
- [ ] Tool tested manually: runs, downloads, correct format, credits deducted
- [ ] Test CSV output, Excel output, JSON output

---

## What You Do NOT Need to Touch

- ❌ Background service (`entrypoints/background.ts`) — auto-discovers tools via `getToolDefinition()`
- ❌ Progress tracking UI — QuickUse renders progress automatically from `onProgress` callbacks
- ❌ Credit deduction — handled by `useToolExecution` hook before calling `execute()`
- ❌ Error handling UI — QuickUse catches errors and shows them automatically
- ❌ Scheduling system — tools become schedulable as soon as they're in `tool-definitions.ts`
- ❌ Export record saving — `downloadService` saves to IndexedDB automatically
- ❌ Google Drive upload — background executor handles this automatically after tool completes

---

## Common Patterns

### Fetching from a Seller Central API (JSON endpoint)

```typescript
const response = await fetch('https://sellercentral.amazon.com/api/your/endpoint', {
  method: 'POST',
  credentials: 'include',  // Uses existing Seller Central session
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ /* params */ }),
});
const data = await response.json();
```

### Scraping a page via content script (tab-based)

```typescript
const tab = await chrome.tabs.create({ url: targetUrl, active: false });
await new Promise(r => setTimeout(r, 5000)); // Wait for JS to render
const result = await chrome.tabs.sendMessage(tab.id!, {
  type: 'extractData',
  url: targetUrl,
});
await chrome.tabs.remove(tab.id!);
```

### Paginating through results

```typescript
let pageIndex = 1;
let hasMore = true;
while (hasMore) {
  const page = await fetchPage(pageIndex);
  results.push(...page.items);
  hasMore = page.hasNextPage;
  pageIndex++;
  await new Promise(r => setTimeout(r, delay));
}
```

---

## Tool ID conventions

| Pattern | Example |
|---------|---------|
| Kebab-case, noun-verb | `sqp-snapshot`, `asin-explorer`, `niche-query-pulse` |
| Match the API `id` field exactly | Check the `/tools` API response before choosing |
| Aliases: list all in tool-definitions | `rufus-qa`, `rufus_qa`, `rufus-qna` all map to same definition |
