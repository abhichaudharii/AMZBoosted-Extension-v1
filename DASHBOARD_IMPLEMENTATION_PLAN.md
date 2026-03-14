# AMZBoosted — Dashboard Implementation Plan
### Protected Pages · Sidebar · Navbar · Missing Features · Design Upgrade
### March 2026

> **Status as of 2026-03-14:**
> This plan covers improvements to the **website dashboard** (app/(protected)/\*\*).
> Most items in this plan are **PENDING** — the plan was written and reviewed but implementation is not complete.
> Items that ARE done are noted with ✅ in-line.

---

## AUDIT SUMMARY

### Current Protected Pages
| Route | File | Status |
|-------|------|--------|
| `/dashboard` | `app/(protected)/dashboard/page.tsx` | Functional, needs content upgrades |
| `/dashboard/analytics` | `app/(protected)/dashboard/analytics/page.tsx` | Good foundation, missing data |
| `/dashboard/billing` | `app/(protected)/dashboard/billing/page.tsx` | Functional, has debug logs in prod |
| `/dashboard/integrations` | `app/(protected)/dashboard/integrations/page.tsx` | Best page — well built |
| `/dashboard/webhooks` | `app/(protected)/dashboard/webhooks/page.tsx` | Hardcoded mock data — not functional |
| `/settings` | `app/(protected)/settings/page.tsx` | Functional but settings tab is disconnected |

### Current Layout Components
| Component | File | Status |
|-----------|------|--------|
| Sidebar | `components/dashboard-sidebar.tsx` | Good design, missing nav items |
| Navbar | `components/dashboard-navbar.tsx` | Minimal — missing credits, search, notifications |
| Layout Provider | `components/layout/dashboard-layout-provider.tsx` | Solid |

---

## SECTION 1 — SIDEBAR CHANGES

### 1.1 Missing Navigation Items

The sidebar currently has: Dashboard, Analytics, Settings, Integrations, Billing, Help & Support.

**Add these missing items:**

```typescript
// Add to DASHBOARD_ITEMS in components/dashboard-sidebar.tsx

{
  label: "Webhooks",
  href: "/dashboard/webhooks",
  icon: Webhook,         // import from lucide-react
  group: "development",  // new group
  badge: "Beta"          // optional badge
},
{
  label: "Tool Catalog",
  href: "/dashboard/tools",    // new page to build
  icon: LayoutGrid,
  group: "main",
},
{
  label: "Schedules",
  href: "/dashboard/schedules", // new page to build
  icon: CalendarClock,
  group: "main",
},
```

**Update GROUPS to include "development":**
```typescript
const GROUPS = {
  main: "Workspace",      // rename from "Dashboard" to "Workspace"
  development: "Developer",
  account: "Account",
  support: "Support",
};
```

**Final sidebar nav order:**
```
WORKSPACE
  Dashboard
  Analytics
  Tool Catalog     [NEW]
  Schedules        [NEW]

ACCOUNT
  Settings
  Integrations
  Billing

DEVELOPER
  Webhooks

SUPPORT
  Help & Support
```

### 1.2 Active State Refinement

Current: only exact match or startsWith check.
Add: active glow background for active item — currently just changes text + border color.

**Change:** Replace `bg-[#FF6B00]/10` with a subtle gradient background on active items:
```css
/* Active state */
background: linear-gradient(90deg, rgba(255,107,0,0.12) 0%, transparent 100%);
border-left: 3px solid #FF6B00;
```

### 1.3 Sidebar Footer — Add Credit Meter

After the subscription state CTAs (trial active / new user / expired), add a **credit usage mini-meter** for active subscribers:

```tsx
{subscriptionStatus?.overallState === 'plan_active' && usageData && (
  <div className="px-1 py-2 space-y-1.5">
    <div className="flex justify-between text-[10px] font-medium text-gray-500">
      <span>Credits</span>
      <span className="text-white font-mono">{remaining} / {total}</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF914D] rounded-full transition-all duration-700"
        style={{ width: `${usagePercent}%` }}
      />
    </div>
    <p className="text-[9px] text-gray-600 text-center">
      Resets {resetDate}
    </p>
  </div>
)}
```

### 1.4 Sidebar Collapse Toggle Button

Currently the toggle is only in the navbar. Add a visible collapse toggle at the **bottom of the sidebar nav** (before the footer):

```tsx
<button
  onClick={toggleCollapse}
  className="hidden lg:flex items-center justify-center w-full p-2 text-gray-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
>
  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
  {!isCollapsed && <span className="text-xs ml-2">Collapse</span>}
</button>
```

---

## SECTION 2 — NAVBAR CHANGES

### 2.1 Current State

The navbar has: hamburger (mobile), sidebar toggle (desktop), help icon, user avatar dropdown.

**What's missing:** credit balance, global search / command palette, notifications bell.

### 2.2 Add Credit Balance Pill

Between the help icon and the divider, add a credits pill:

```tsx
{hasActiveSubscription && usageData && (
  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
    <Zap className="w-3.5 h-3.5 text-[#FF6B00]" />
    <span className="text-white font-mono font-bold">{remaining.toLocaleString()}</span>
    <span className="text-gray-500">credits</span>
  </div>
)}
```

On click, navigate to `/dashboard/billing`.

### 2.3 Add Command Palette Trigger (Cmd+K)

Add a search trigger button in the navbar center:

```tsx
<button
  onClick={() => openCommandPalette()}
  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-gray-400 transition-colors min-w-[200px]"
>
  <Search className="w-3.5 h-3.5" />
  <span>Search...</span>
  <kbd className="ml-auto font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
</button>
```

**Command palette items:** All nav links, tool names, quick actions (Run SQP Snapshot, View Credits, Go to Billing).

### 2.4 Add Notifications Bell

```tsx
<button className="relative text-gray-400 hover:text-white hover:bg-white/5 w-9 h-9 rounded-lg flex items-center justify-center transition-colors">
  <Bell className="w-5 h-5" />
  {unreadCount > 0 && (
    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
  )}
</button>
```

**Notification types to show:**
- Credit balance low (< 20% remaining)
- Scheduled run completed
- Payment failed
- Trial expiring in 3 days

### 2.5 Update User Dropdown

Add to the dropdown:
- Current plan badge next to user name
- "Upgrade" link if on Starter or trial
- Keyboard shortcut hints

```tsx
<DropdownMenuLabel>
  <div className="flex items-center gap-2">
    <Avatar ... />
    <div>
      <p className="text-sm font-bold text-white">{user?.fullName}</p>
      <p className="text-xs text-gray-500">{user?.email}</p>
    </div>
    <span className="ml-auto text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-1.5 py-0.5 rounded capitalize">
      {planName}
    </span>
  </div>
</DropdownMenuLabel>
```

---

## SECTION 3 — DASHBOARD HOME PAGE (`/dashboard`)

### 3.1 Issues Found
- "Getting Started" section is always shown even for users who have already installed and used the extension
- Sidebar column has `Resources` with dead `href="#"` links (Video Tutorials, Installation Guide)
- No tool shortcuts or quick-run panel
- No recent activity feed
- Stats are minimal (only credits used, monthly usage, days remaining)

### 3.2 Add a Tool Quick-Launch Grid

Replace or augment the "Getting Started" section for users who have already installed the extension:

```tsx
{/* Show after extension is installed */}
<GlassCard className="p-8">
  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
    <LayoutGrid className="w-6 h-6 text-[#FF6B00]" />
    Quick Launch
  </h2>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
    {TOP_TOOLS.map(tool => (
      <button
        key={tool.id}
        className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#FF6B00]/30 hover:bg-white/10 text-left transition-all group"
      >
        <tool.icon className="w-5 h-5 text-[#FF6B00] mb-3 group-hover:scale-110 transition-transform" />
        <p className="text-sm font-bold text-white">{tool.name}</p>
        <p className="text-xs text-gray-500 mt-1">{tool.outputFormat} · {tool.creditCost}</p>
      </button>
    ))}
  </div>
</GlassCard>
```

### 3.3 Add Recent Activity Feed

In the sidebar column, replace the dead `Resources` links with a real recent activity feed:

```tsx
<GlassCard className="p-6">
  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
    <Activity className="w-5 h-5 text-[#FF6B00]" />
    Recent Activity
  </h3>
  {recentActivity.length === 0 ? (
    <EmptyState message="No activity yet. Run your first tool to get started." />
  ) : (
    <ul className="space-y-3">
      {recentActivity.slice(0, 5).map(event => (
        <li key={event.id} className="flex items-center gap-3 text-sm">
          <div className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0" />
          <span className="text-gray-300 truncate">{event.toolName}</span>
          <span className="text-gray-600 text-xs ml-auto shrink-0">
            {timeAgo(event.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  )}
  <Link href="/dashboard/analytics" className="block text-xs text-[#FF6B00] mt-4 hover:underline">
    View all activity →
  </Link>
</GlassCard>
```

### 3.4 Fix Dead Resource Links

Replace `href="#"` with actual links:
- Video Tutorials → YouTube channel URL or `/help#tutorials`
- Installation Guide → Chrome Web Store URL
- Privacy & Data Handling → `/privacy-policy` (already correct)

### 3.5 Add Stats: Time Saved & Tools Run

Add two more stat cards to the 3-column grid (making it 2 rows or a wider grid):

```tsx
<StatCard 
  title="Tools Run"
  value={usageData?.toolsRun || 0}
  icon={Zap}
  color="purple"
  description="Total runs this month"
/>
<StatCard 
  title="Est. Time Saved"
  value={`${Math.round((usageData?.toolsRun || 0) * 15)}m`}
  icon={Clock}
  color="green"
  description="Based on 15 min avg per manual export"
/>
```

### 3.6 Remove Debug Console Logs from Billing Page

In `/dashboard/billing/page.tsx`, remove these before production:
```typescript
// Line 356-360 — DELETE THESE
console.log('trialDaysRemaining:- ', trialDaysRemaining);
console.log('isTrialing:- ', isTrialing);
console.log('!subscriptionStatus?.isActive:- ', !subscriptionStatus?.isActive);
console.log('subscriptionStatus:- ', subscriptionStatus);
```

---

## SECTION 4 — ANALYTICS PAGE (`/dashboard/analytics`)

### 4.1 Issues Found
- Only 2 charts (credit usage donut, tools run bar) — limited insight
- Activity log and credit history tables have no pagination controls visible to user
- "View All" opens a modal — good pattern but modal is basic
- No date range filter
- No export button for analytics data

### 4.2 Add Date Range Selector

Add a date range control to the `DashboardHeader` action area:

```tsx
<div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
  {['7d', '30d', '90d', 'All'].map(range => (
    <button
      key={range}
      onClick={() => setDateRange(range)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
        dateRange === range ? 'bg-[#FF6B00] text-white' : 'text-gray-400 hover:text-white'
      }`}
    >
      {range}
    </button>
  ))}
</div>
```

Pass `dateRange` to all data fetching queries.

### 4.3 Add Summary Stats Row

Add 4 stat cards above the charts:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Credits Used" value={credits.used} icon={Zap} color="orange" />
  <StatCard title="Credits Remaining" value={credits.remaining} icon={Shield} color="green" />
  <StatCard title="Tool Runs" value={totalEvents} icon={Activity} color="blue" />
  <StatCard title="Credits Refunded" value={totalRefunded} icon={RefreshCw} color="purple" />
</div>
```

### 4.4 Add Most-Used Tool Spotlight

Below the charts, add a "Top Tool This Month" card:

```tsx
{topTool && (
  <GlassCard className="p-6">
    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Most Used Tool</p>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-[#FF6B00]/10 text-[#FF6B00]">
        <topTool.Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{topTool.name}</p>
        <p className="text-sm text-gray-400">{topTool.runCount} runs · {topTool.creditsUsed} credits</p>
      </div>
    </div>
  </GlassCard>
)}
```

### 4.5 Add Export Button

Add CSV export of credit history and activity log:

```tsx
<Button
  variant="outline"
  className="bg-white/5 border-white/10 text-white gap-2"
  onClick={() => exportToCSV(transactions)}
>
  <Download className="w-4 h-4" />
  Export CSV
</Button>
```

---

## SECTION 5 — BILLING PAGE (`/dashboard/billing`)

### 5.1 Issues Found
- 4 debug `console.log` statements in production code (remove immediately)
- `window.confirm()` used for upgrade/downgrade confirmations — browser native dialog, not branded
- The "What is a credit?" tooltip works but is easy to miss — consider a dedicated explainer section
- FAQ has only 4 questions — expand to match the full FAQ from `EMAIL_STRATEGY.md`
- No annual savings amount shown in dollar terms (just "-20%" badge)
- No invoice download link from this page (redirects to settings → billing tab)

### 5.2 Replace `window.confirm()` with Custom Modal

Replace the native browser confirm dialog with a proper styled confirmation modal:

```tsx
// Create components/billing/ConfirmPlanChangeModal.tsx
<Dialog open={confirmModal.open}>
  <DialogContent className="bg-[#111214] border-white/10">
    <DialogHeader>
      <DialogTitle className="text-white">{confirmModal.title}</DialogTitle>
      <DialogDescription className="text-gray-400">{confirmModal.description}</DialogDescription>
    </DialogHeader>
    <div className="flex gap-3 mt-4">
      <Button variant="outline" onClick={() => setConfirmModal({ open: false })}>Cancel</Button>
      <Button className="bg-[#FF6B00] text-white" onClick={confirmModal.onConfirm}>Confirm</Button>
    </div>
  </DialogContent>
</Dialog>
```

### 5.3 Show Annual Savings in Dollars

When billing toggle is set to `annual`, show the actual dollar savings under the price:

```tsx
{billingInterval === 'annual' && (
  <p className="text-sm text-green-400 font-bold mt-1">
    Save ${((plan.price * 12) - plan.annualPrice).toFixed(0)}/year
  </p>
)}
```

### 5.4 Expand Billing FAQ

Add 4 more FAQ entries (currently only 4, expand to 8):
1. Can I cancel at any time? (exists)
2. Do I need a credit card for the trial? (exists)
3. What happens when my trial ends? (exists)
4. Are payments secure? (exists)
5. **NEW:** What's the difference between monthly and annual billing?
6. **NEW:** Do credits roll over?
7. **NEW:** Can I switch plans at any time?
8. **NEW:** What payment methods are accepted?

### 5.5 Add Credit Explainer Section

Below the plan grid, add a visual credit explainer (currently just text):

```tsx
<div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
  <h3 className="text-lg font-bold text-white mb-4">How Credits Work</h3>
  <div className="grid md:grid-cols-3 gap-6">
    <div>
      <p className="text-3xl font-black text-[#FF6B00] mb-1">1</p>
      <p className="text-sm font-bold text-white mb-1">Credit per input</p>
      <p className="text-xs text-gray-400">1 ASIN, 1 URL, or 1 query = 1 credit</p>
    </div>
    <div>
      <p className="text-3xl font-black text-[#FF6B00] mb-1">0</p>
      <p className="text-sm font-bold text-white mb-1">Rollover</p>
      <p className="text-xs text-gray-400">Credits reset on your billing date. No rollover.</p>
    </div>
    <div>
      <p className="text-3xl font-black text-[#FF6B00] mb-1">Auto</p>
      <p className="text-sm font-bold text-white mb-1">Refunds</p>
      <p className="text-xs text-gray-400">Credits refunded automatically for system errors.</p>
    </div>
  </div>
</div>
```

---

## SECTION 6 — SETTINGS PAGE (`/settings`)

### 6.1 Issues Found
- `activeTab === "billing"` renders `<BillingTab>` inline in Settings, which is a duplicate of what's already on `/dashboard/billing`. This creates maintenance burden.
- "Danger Zone" tab — Delete Account button is not connected to any API call. It's a dead button.
- "Cancel" button in Profile tab is not connected — clicking it does nothing.
- No notification preferences UI visible despite `settings.notifications` object being defined in the type.
- No timezone selector despite `settings.schedules.timezone` existing in the type.
- Security tab only has password change — no 2FA management, no session management.

### 6.2 Fix Billing Tab Duplication

Replace the inline `BillingTab` component with a redirect card:

```tsx
// Settings Billing Tab — redirect instead of duplicating
function BillingTab({ subscription }: { subscription: any }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-8 rounded-2xl bg-[#0A0A0B]/80 border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Billing & Subscription</h2>
        <p className="text-gray-400 mb-6">
          Manage your subscription, view invoices, and update payment methods.
        </p>
        <Link href="/dashboard/billing">
          <Button className="bg-[#FF6B00] hover:bg-[#FF8533] text-white gap-2">
            <CreditCard className="w-4 h-4" />
            Go to Billing Page
          </Button>
        </Link>
      </div>
      {/* Keep payment history table here since it's a different context */}
      <PaymentHistoryTable />
    </div>
  );
}
```

### 6.3 Fix "Cancel" Button in Profile Tab

Wire the Cancel button to reset `editedProfile` to the original `profile` value:

```tsx
<Button
  variant="outline"
  onClick={() => setEditedProfile(profile)}  // reset to original
  className="..."
>
  Cancel
</Button>
```

### 6.4 Connect Delete Account to API

Create `DELETE /api/v1/user/account` endpoint and wire it:

```tsx
function DangerZoneTab() {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') return;
    
    const res = await fetch('/api/v1/user/account', { method: 'DELETE' });
    if (res.ok) {
      await signOut();
      window.location.href = '/';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Delete Account</h2>
        <p className="text-red-400/70 mb-6">This is permanent. All data will be deleted.</p>
        
        {!confirming ? (
          <Button
            onClick={() => setConfirming(true)}
            variant="outline"
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-400">Type <strong>DELETE MY ACCOUNT</strong> to confirm:</p>
            <Input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              className="bg-red-500/5 border-red-500/20 text-red-400"
            />
            <div className="flex gap-3">
              <Button onClick={() => setConfirming(false)} variant="outline">Cancel</Button>
              <Button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE MY ACCOUNT'}
                className="bg-red-500 text-white disabled:opacity-50"
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6.5 Add Notification Preferences Tab Content

The `settings.notifications` object exists in the type but is not rendered. Add UI to the Profile tab or a new "Notifications" tab:

```tsx
{/* Notification Preferences */}
<div className="p-8 rounded-2xl bg-[#0A0A0B]/80 border border-white/10">
  <h2 className="text-xl font-bold text-white mb-6">Notification Preferences</h2>
  <div className="space-y-4">
    {[
      { key: 'task_completed', label: 'Tool run completed', desc: 'Get notified when a scheduled run finishes' },
      { key: 'task_failed', label: 'Tool run failed', desc: 'Get notified when a run encounters an error' },
      { key: 'credits_low', label: 'Credits running low', desc: 'Alert when less than 20% credits remain' },
      { key: 'schedule_run', label: 'Schedule about to run', desc: '15 minutes before a scheduled run starts' },
    ].map(pref => (
      <div key={pref.key} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
        <div>
          <p className="text-sm font-bold text-white">{pref.label}</p>
          <p className="text-xs text-gray-400">{pref.desc}</p>
        </div>
        <Switch
          checked={editedSettings?.settings?.notifications?.[pref.key] ?? true}
          onCheckedChange={(val) => updateNotificationPref(pref.key, val)}
        />
      </div>
    ))}
  </div>
</div>
```

### 6.6 Add Timezone Selector

In the Profile tab, add a timezone dropdown (used for scheduled run times):

```tsx
<div className="space-y-2">
  <Label className="text-gray-300">Timezone</Label>
  <Select
    value={editedSettings?.settings?.schedules?.timezone || 'UTC'}
    onValueChange={(val) => updateScheduleSetting('timezone', val)}
  >
    <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-[#111214] border-white/10">
      {TIMEZONES.map(tz => (
        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-gray-500">Used for scheduling tool runs at the right local time</p>
</div>
```

---

## SECTION 7 — MISSING PAGES TO BUILD

### 7.1 Tool Catalog Page — `/dashboard/tools` [HIGH PRIORITY]

A dashboard-side tool browser matching the landing page ToolCatalog but with direct "Run Now" buttons that trigger the extension:

```
Page: /dashboard/tools
Component: app/(protected)/dashboard/tools/page.tsx

Features:
- Same filterable grid as landing page ToolCatalog
- Each card has a "Run Now" button (triggers extension via postMessage)
- Each card shows: tool name, description, output format, credit cost, last run date
- "Schedule This Tool" CTA on each card → opens scheduler modal
- Search bar to filter tools
- Sorting: by name, by last run, by credit cost
```

### 7.2 Schedules Page — `/dashboard/schedules` [HIGH PRIORITY]

A full schedule management page (the extension has a scheduler but there's no web UI to manage it):

```
Page: /dashboard/schedules
Component: app/(protected)/dashboard/schedules/page.tsx

Features:
- List of all active schedules with: tool name, frequency, last run, next run, status
- Create new schedule: pick tool, set frequency (hourly/daily/weekly/custom), set time
- Toggle schedule on/off without deleting
- Delete schedule
- "Run Now" override for any schedule
- Schedule history (last 10 runs with success/fail status)
- Credit usage projection based on schedules (e.g. "This week's schedules will use ~240 credits")

API needed:
- GET /api/v1/schedules
- POST /api/v1/schedules
- PUT /api/v1/schedules/:id
- DELETE /api/v1/schedules/:id
- POST /api/v1/schedules/:id/run-now
```

### 7.3 Fix Webhooks Page — `/dashboard/webhooks` [MEDIUM PRIORITY]

Currently uses hardcoded mock data. Connect to real API:

```
Current state: Static array of 2 mock webhooks, no API calls
What to fix:
- Replace static array with GET /api/v1/webhooks
- Wire "New Webhook" button to actually call POST /api/v1/webhooks
- Wire delete button to DELETE /api/v1/webhooks/:id
- Wire play button to POST /api/v1/webhooks/:id/test
- Wire edit button to PUT /api/v1/webhooks/:id
- Add empty state when no webhooks configured
- Add event type selector: schedule.completed, schedule.failed, tool.run, credits.low
```

### 7.4 Help Page Improvements — `/help`

Check `app/help/page.tsx` — likely has placeholder content. Add:
- Searchable FAQ section (same content as landing page FAQAccordion)
- Video tutorial cards (even if linking to YouTube)
- Getting started checklist
- Contact form with topic selector
- Links to Discord community and email support

---

## SECTION 8 — DESIGN SYSTEM ALIGNMENT

### 8.1 Inconsistency: Integrations Page Layout vs Other Pages

The Integrations page uses its own layout (`min-h-screen bg-[#0A0A0B] p-6 lg:p-8`) instead of `<PageShell>`. This means:
- No shared ambient background orbs
- No `max-w-7xl mx-auto` constraint from PageShell
- Visual inconsistency with Dashboard and Analytics pages

**Fix:** Wrap Integrations page content in `<PageShell>` and `<DashboardHeader>`.

### 8.2 Inconsistency: Billing Page Layout

Same issue — Billing uses `<div className="min-h-screen">` and its own padding instead of `<PageShell>`. Wrap in PageShell for consistency.

### 8.3 Inconsistency: Settings Page Layout

Settings uses `<div className="min-h-screen bg-transparent">` — wrap in PageShell.

### 8.4 Standardize Page Headers

All pages should use `<DashboardHeader>` from `components/dashboard/DashboardHeader.tsx`. Currently:
- Dashboard: uses DashboardHeader ✓
- Analytics: uses DashboardHeader ✓
- Integrations: custom header ✗
- Billing: custom `<h1>` tag ✗
- Settings: custom `<h1>` tag ✗
- Webhooks: uses DashboardHeader ✓

### 8.5 Add Consistent Empty States

Use `<EmptyState>` from `components/dashboard/EmptyState.tsx` consistently across:
- Webhooks (when no webhooks) — currently no empty state
- Schedules (new page)
- Activity logs (when no recent activity)
- Tool Catalog (should never be empty, but handle gracefully)

---

## SECTION 9 — IMPLEMENTATION PRIORITY ORDER

### Immediate (Fix Bugs & Remove Risks)
1. Remove 4 debug `console.log` calls from `/dashboard/billing/page.tsx` (lines 356-360)
2. Fix Cancel button in Settings Profile tab (wire to reset state)
3. Fix dead `href="#"` links in Dashboard Resources card
4. Replace `window.confirm()` in billing with custom modal

### Phase 1 — Navigation & Layout (~3 days)
5. Add Tool Catalog, Schedules, Webhooks to sidebar nav
6. Add credit balance pill to navbar
7. Add command palette trigger to navbar (Cmd+K)
8. Wrap Integrations, Billing, Settings in `<PageShell>` and `<DashboardHeader>`
9. Add credit meter to sidebar footer for active subscribers
10. Rename "Dashboard" group to "Workspace" in sidebar

### Phase 2 — Dashboard Home Upgrades (~2 days)
11. Add Tool Quick-Launch grid (post-install state)
12. Add Recent Activity feed in sidebar column
13. Fix Resources links (YouTube, Chrome Web Store)
14. Add Tools Run + Est. Time Saved stat cards

### Phase 3 — Analytics Upgrades (~2 days)
15. Add date range selector (7d/30d/90d/All)
16. Add 4 summary stat cards above charts
17. Add Most-Used Tool spotlight card
18. Add CSV export button for analytics data

### Phase 4 — Billing & Settings Upgrades (~2 days)
19. Show annual savings in actual dollar amount
20. Expand billing FAQ from 4 to 8 questions
21. Add credit explainer visual section
22. Add notification preferences UI in Settings
23. Add timezone selector in Settings
24. Wire Delete Account to real API

### Phase 5 — New Pages (~1 week)
25. Build `/dashboard/tools` (Tool Catalog page)
26. Build `/dashboard/schedules` (Schedule Manager)
27. Fix `/dashboard/webhooks` (connect to real API)
28. Improve `/help` page content

---

## SECTION 10 — FILE MANIFEST

### Files to Modify
```
components/dashboard-sidebar.tsx         — Add nav items, credit meter, collapse toggle
components/dashboard-navbar.tsx          — Add credit pill, command palette, notifications
app/(protected)/dashboard/page.tsx       — Quick-launch, activity feed, fix resource links
app/(protected)/dashboard/analytics/page.tsx  — Date range, summary stats, top tool
app/(protected)/dashboard/billing/page.tsx    — Remove console.logs, custom modal, annual savings, FAQ
app/(protected)/dashboard/integrations/page.tsx  — Wrap in PageShell/DashboardHeader
app/(protected)/dashboard/webhooks/page.tsx  — Connect to real API
app/(protected)/settings/page.tsx        — Fix cancel, delete account, notifications, timezone
```

### Files to Create
```
app/(protected)/dashboard/tools/page.tsx     — Tool Catalog dashboard page
app/(protected)/dashboard/schedules/page.tsx — Schedule Manager page
components/billing/ConfirmPlanChangeModal.tsx
components/dashboard/CommandPalette.tsx
components/dashboard/NotificationBell.tsx
app/api/v1/schedules/route.ts
app/api/v1/schedules/[id]/route.ts
app/api/v1/user/account/route.ts         — DELETE endpoint for account deletion
```

---

*AMZBoosted Dashboard Implementation Plan — March 2026*
*Based on full audit of: app/(protected)/**, components/dashboard-sidebar.tsx, components/dashboard-navbar.tsx, components/layout/dashboard-layout-provider.tsx*
