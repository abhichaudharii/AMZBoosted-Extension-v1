# New Tool Integration Guide: The Service-Based Pattern (Unified)

This guide documents the streamlined process for adding a new tool to the extension. The new architecture revolves around a **Central Registry** (`lib/tool-definitions.ts`), which automatically handles background routing, side panel rendering, and dashboard page creation.

## Overview of the Architecture
Adding a tool now involves just 3 primary steps:
1.  **Service Layer**: Define *how* the tool works.
2.  **Side Panel UI**: Create the input component.
3.  **Registry**: Register the tool in `lib/tool-definitions.ts`.

---

## Phase 1: The Service Layer (Business Logic)
Create a new service class that handles the heavy lifting. This file usually lives in `lib/services/tools/`.

**File:** `lib/services/tools/my-new-tool.service.ts`

**Template:**
```typescript
import { downloadService } from '@/lib/services/download.service';

interface MyToolOptions {
    marketplace: string;
    asinList: string[]; // Standardize on 'asinList' for inputs
    outputFormat?: string; // Support dynamic formats (csv, json)
    runId?: string;
    // ... other specific options
}

class MyNewToolService {
    async execute(
        _urls: string[] | null,
        options: MyToolOptions,
        onProgress: (progress: any) => void
    ): Promise<any> {
        const { asinList, marketplace, runId } = options;

        // 1. Validation Logic
        // ...

        // 2. Execution Loop
        for (const input of asinList) {
             onProgress({
                 total: asinList.length,
                 completed: 0, 
                 currentUrl: input,
                 statusMessage: `Processing ${input}...`
             });
             
             // ... fetch data ...
        }
        
        return { 
            results: [/* ... */],
            processedCount: asinList.length,
            creditsUsed: 5
        };
    }
}

export const myNewToolService = new MyNewToolService();
```

---

## Phase 2: The Side Panel UI (Inputs)
Create the React component for the input form shown in the side panel.

**File:** `entrypoints/sidepanel/tools/MyNewTool.tsx`

> [!IMPORTANT]
> Your component MUST call `onDataChange` to update the parent state. The parent wrapper (`QuickUse.tsx`) handles the "Run Tool" button and validation.

**Template:**
```tsx
interface MyNewToolProps {
  onDataChange: (data: any) => void;
  initialData?: any;
}

export const MyNewTool: React.FC<MyNewToolProps> = ({ onDataChange, initialData }) => {
  const [marketplace, setMarketplace] = useState('us');
  const [inputs, setInputs] = useState('');

  // Sync with Parent
  useEffect(() => {
    onDataChange({
        marketplace,
        asinList: inputs.split('\n').filter(s => s.trim()), 
        // ... other data
    });
  }, [marketplace, inputs, onDataChange]);

  return (
      <div>
          {/* Your UI Inputs Here */}
      </div>
  );
};
```

---

## Phase 3: Register in Central Registry (The Magic Step)
This single step automatically wires up background execution logic, side panel rendering, and the dashboard route.

**File:** `lib/tool-definitions.ts`

Add your tool to the `toolDefinitions` array:

```typescript
{
    id: 'my-new-tool',
    name: 'My New Tool',
    description: 'Description of what it does.',
    iconName: 'Zap', // Lucide icon name
    category: 'Market Intelligence',
    
    // Execution Logic
    service: myNewToolService,
    execute: (opts, cb) => myNewToolService.execute(null, opts, cb),
    filenamePrefix: 'MyNewTool', // For file downloads
    isBackground: true,

    // UI Component
    component: lazy(() => import('@/entrypoints/sidepanel/tools/MyNewTool').then(m => ({ default: m.MyNewTool })))
}
```

**That's it!**
- **Dashboard**: A page at `/tools/my-new-tool` is automatically created.
- **Side Panel**: Selecting "My New Tool" will automatically render your component.
- **Background**: `START_TOOL` messages for this ID will automatically route to your `execute` function.

### 3.1 Configuration (Critical)
To ensure the "Run" button validates your custom inputs (instead of the default URL list) and to enable Export Settings, add these configurations to your definition:

```typescript
{
    // ...
    // Input Validation: Tells the Run button what to check
    validation: {
        type: 'asinList', // Options: 'asinList', 'urlList', 'keywordList', 'mixed', 'none'
        requireInput: true,
        message: 'Please enter at least one ASIN' // Optional custom error
    },

    // Export Settings: Enables the menu item and binds to correct state
    exportParams: {
        supportsExportSettings: true,
        stateBinding: 'asin' // Options: 'asin', 'category', 'sqp', 'salesTraffic'
    }
}
```

---

## Phase 4: Database Config (Menu Visibility)
To make the tool appear in the side panel grid and dashboard list, add it to your external database (Supabase/Postgres) or local mock config. you dont need to do this user will enable it in the dashboard database

**Tool Object Structure:**

---


## Phase 5: Advanced Features & Polish


### 5.1 Export Settings (Side Panel)
To enable custom export settings (e.g., specific columns or formats) in the Quick Use side panel, you no longer need to edit UI files.

**Simply add the `exportParams` configuration to your tool definition in `lib/tool-definitions.ts`:**

```typescript
{
    id: 'my-new-tool',
    // ...
    exportParams: {
        supportsExportSettings: true, // Enables the menu item
        stateBinding: 'asin' // Binds to the ASIN output format state (use 'category', 'sqp', etc. as needed)
    }
}
```

The system will automatically:
1.  Show the "Export Settings" menu item in the Quick Use navbar.
2.  Bind the settings sheet to the correct state variable (`asinOutputFormat` vs `categoryOutputFormat`).
3.  Pass the selected format to your service during execution.

*No changes to `QuickUse.tsx` or `QuickUseSheets.tsx` are required!*

*Persistence:* Settings are automatically saved to `chrome.storage.local` using a key derived from your tool ID.

### 5.2 Scheduler Integration (Create Schedule UI)
The Scheduler Wizard does **NOT** reuse your Side Panel component. It uses a configuration-driven approach.

**Option A: Generic Inputs (Default)**
If you do nothing, the Scheduler will show a generic "URLs / ASINs" drop zone. The input will be passed to your service as `options.urls` (string[]).

**Option B: Custom Inputs (Recommended)**
To define specific inputs (e.g., "Search Term" vs "ASIN List"), add an `inputConfig` object to your definition in `lib/tool-definitions.ts`:

```typescript
{
    id: 'my-new-tool',
    // ...
    inputConfig: {
        inputs: [
            {
                key: 'search_term',
                label: 'Search Term',
                type: 'text',
                placeholder: 'Enter keyword...',
                required: true
            },
            {
                key: 'asins',
                label: 'ASIN List',
                type: 'textarea', // Supports file upload automatically
                placeholder: 'Paste ASINs here...',
                required: false
            }
        ]
    }
}
```
*Note: Your service will receive these in `options.inputs['search_term']`, etc.*

### 5.3 Paywalls & Protection
All tools should be protected by the subscription system.
1.  **Standard Check**: The `useToolExecution` hook automatically calls `checkAccess()` before running a tool.
2.  **Logic**: `checkAccess` (in `lib/utils/access-control.ts`) verifies if the user has an active plan or trial.
3.  **UI Feedback**: If access is denied, `PlanRestrictionDialog` is automatically shown.
4.  **Credit System**: Ensure your service returns the correct `creditsUsed` count in its execution result so the user's balance is updated.

### 5.4 File Downloads & Formats
The system supports both automatic and custom download behavior.

**Automatic CSV (Simple):**
If you just return an array of objects in `results`, the system will automatically convert it to CSV and trigger a download if `filenamePrefix` is set.
*   **Filename**: `[Prefix]_[Marketplace]_[Date]_[Source].csv`

**Excel & Custom Formats (Advanced):**
If you need to generate specific Excel files (like `asin-x`), your service must handle it manually at the end of `execute`.

```typescript
import { downloadService } from '@/lib/services/download.service';
import { generateExcel } from '@/lib/utils/excel';

// ... inside execute() ...

// 1. Generate Content
if (outputFormat === 'xlsx') {
    const { content, mimeType } = generateExcel(data, 'Sheet Name');
    
    // 2. Trigger Download Manualy
    await downloadService.downloadTaskResults({
        taskId: runId,
        toolId: 'my-tool',
        toolName: 'My Tool',
        marketplace: marketplace,
        data: data, // Raw data for export record
        source: 'quick_run',
        format: 'xlsx',
        preGeneratedContent: content, // Pass the blob content
        mimeType: mimeType
    });
}
```

### 5.5 Categories & Themes
If you are introducing a **NEW Category**, you must register its theme color to ensure the UI looks consistent.

1.  **Update `lib/hooks/useRemoteTools.ts`**:
    *   Find the `processTools` function -> `switch (category)` statement.
    *   Add your category case and assign a color (violet, emerald, blue, rose, amber, cyan).
    *   *Example*: `case 'My New Category': colorTheme = 'rose'; break;`

2.  **Update Dashboard Components**:
    *   Update `entrypoints/dashboard/components/ToolDashboardTemplate.tsx` -> `getThemeForCategory`.
    *   Update `entrypoints/dashboard/pages/AllToolsPage.tsx` -> `getThemeForCategory`.
    *   Update `entrypoints/sidepanel/screens/ToolsHome.tsx` -> `getThemeForCategory`.
    *   Ensure your new category keyword maps to the same color theme across all files.

### 5.6 Troubleshooting Integration
**Issue: My tool shows the default "Generic" UI instead of my custom component.**
*   **Cause**: ID Mismatch. The tool ID from the backend (e.g., `my_tool`) might not strictly match your local definition (`my-tool`).
*   **Fix 1 (Robust Lookup)**: In `entrypoints/sidepanel/components/quick-use/ToolRenderer.tsx`, ensure the lookup checks for name matches too:
    `const toolDef = toolDefinitions.find(t => t.id === tool.id) || toolDefinitions.find(t => t.name === tool.name);`
*   **Fix 2 (Alias)**: In `lib/tool-definitions.ts`, add a duplicate tool definition with the alternate ID (e.g., one with hyphens, one with underscores) pointing to the same component and service.

**Issue: Theme colors are inconsistent.**
*   **Cause**: Different files handle theme mapping separately.
*   **Fix**: Check Section 5.5 and ensure all 3 file locations have the updated category-to-theme mapping.

---



