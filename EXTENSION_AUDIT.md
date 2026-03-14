# Extension UI & Copywriting Audit
**Status:** Pre-launch review
**Scope:** Chrome Extension (Sidepanel + Dashboard + All Pages + Static HTML)
**Last updated:** 2026-03-14

This document covers every screen, page, and component of the AMZBoosted Chrome extension. Each section has:
- Current state
- Specific issues found
- Exact copy/design changes required
- Priority (🔴 Critical / 🟡 High / 🔵 Polish)

---

## Extension Structure

```
Sidepanel (380px chrome panel):
  └── LoginScreen         — unauthenticated state
  └── ToolsHome           — tool browser with search + categories
  └── QuickUse            — tool execution view
  └── ProcessingView      — live run status

Dashboard (full-tab web app):
  └── DashboardHome       — overview, stats, charts
  └── AllToolsPage        — tool grid
  └── ReportsPage         — report history
  └── SchedulesPage       — schedule manager
  └── ExportsPage         — export history
  └── ActivityPage        — activity log
  └── IntegrationsPage    — connected services
  └── NotificationsPage   — notification settings
  └── BillingPage         — subscription management
  └── CreditHistoryPage   — credit usage
  └── AccountPage         — account settings
  └── ChangelogPage       — release history
  └── SupportPage         — help & support

Static Pages (bundled HTML):
  └── install-success.html  — post-install welcome page
  └── uninstall.html        — post-uninstall feedback page
```

---

## 1. Login Screen (Sidepanel)

**This is the first thing every new user sees. It's the single most important screen.**

### 🔴 Critical Issues

**Tagline "The Elite Edge OS" doesn't mean anything.** Under the logo, the tagline reads in orange:
```
THE ELITE EDGE OS
```
Nobody knows what an "Edge OS" is. The website says "Your Amazon Seller Central runs itself." The extension says "The Elite Edge OS." These are completely different products in the user's mind.

**Fix:** Replace with a consistent brand tagline. Options:
- `"Amazon Seller Automation"` — clear, simple, searchable
- `"Your Seller Central, Automated"` — mirrors the website headline
- `"Privacy-First Amazon Tools"` — emphasizes the core differentiator

**Copy "Stop Guessing. Start Dominating." is the wrong tone.** This is gaming/aggressive language. The website copy is professional, privacy-focused, and efficiency-oriented. The login screen feels like a crypto trading app or a Fortnite skin store.

**Fix:**
```
BEFORE: "Stop Guessing. Start Dominating."
AFTER:  "Automate your Seller Central in minutes."
```

Or, to match the website headline directly:
```
"Your Amazon Seller Central runs itself."
```

**"Level Up Your Business" card title** — same issue. Gaming language. Change to:
```
"Connect Your Account"
```

**"New Partner?" divider** — Users are not "Partners." This is confusing (it sounds like a referral/affiliate context). Change to:
```
"New here?"
```

**"Elite Trial Active" box uses fake trademarked terms:**
- `"Zero-Link™ Discovery"` — not a user-facing feature name anywhere in the extension or website
- `"Privacy Fortress™ Protection"` — same
- `"Unrestricted ASIN-X Access"` — ASIN-X is an internal tool name, not branded this way anywhere

These sound impressive in a pitch deck but when a user sees them in the login screen they have no idea what they mean. Replace with concrete benefit statements:

```
BEFORE:
  ✓ Zero-Link™ Discovery
  ✓ Privacy Fortress™ Protection
  ✓ Unrestricted ASIN-X Access

AFTER:
  ✓ 10+ Amazon Seller Central tools, ready to run
  ✓ Data never leaves your browser
  ✓ No API keys, no MAPI setup required
```

---

## 2. ToolsHome (Sidepanel — Main Screen)

**Current:** Category-grouped tool list with search bar and collapsible sections.

### 🔵 Polish

**Navbar title "AMZBoosted"** paired with `Zap` icon — fine. But the Zap icon is already used as the icon for "Credit History" in the sidebar and "Tools & AI" in sidebar. Using the same icon in 3 places makes the UI feel unpolished. The navbar icon should be the AMZBoosted logo image (same as what's used in LoginScreen), not the generic Zap.

**Tool description text is truncated to 1 line** (`line-clamp-1`) on hover. This is acceptable in a compact panel. But for tools whose names and descriptions are similar (e.g., multiple "Reports" tools), the single-line truncation makes it impossible to distinguish them. Consider expanding to 2 lines (`line-clamp-2`) or adding a category chip above the description.

**"No tools found" empty state is minimal.** When search returns nothing, it shows:
```
"No tools found"
"Try a different search term"
```
Add a subtle icon (e.g., `SearchX`) and a "Clear search" button link to make this more polished.

**Tool categories shown in order:** Listing Optimization → Product Research → Competitor Analysis → Customer Intelligence → Inventory Management → Performance Reports → Business Reports → PPC & Advertising.

This is a logical order but `"Competitor Analysis"` as a category is wrong — AMZBoosted doesn't scrape competitor data. It reads your own Seller Central data. Consider renaming:
- `"Competitor Analysis"` → `"Market Research"` or `"Niche Research"`

**Missing: credit cost badge on each tool.** Users on Starter need to know how many credits each tool costs before running it. Add a small badge to each tool row (e.g., `"2 credits"`) so they can make informed decisions before clicking.

---

## 3. QuickUse / Tool Execution Screen (Sidepanel)

**Not fully audited without runtime access, but from source code review:**

### 🔴 Critical Issue

**No error state messaging for "wrong page" scenarios.** When a user opens a tool but isn't on the correct Seller Central page (e.g., they open SQP Snapshot but are on the Orders page), the extension needs a clear, friendly error:

```
MISSING STATE:
  "Navigate to [Seller Reports → Business Reports → Search Query Performance]
   in Seller Central to use this tool."
```

Currently the extension relies on the browser detecting the right URL and shows a spinner. If that detection fails silently, the user is confused. Add explicit navigation guidance per tool in the empty/error state.

**"Run Now" button copy is generic.** Change to tool-specific CTAs:
- SQP Snapshot: `"Fetch SQP Data"`
- Sales Traffic: `"Pull Sales Report"`
- Category Insights: `"Analyze Category"`

This gives users confidence they know what's about to happen.

### 🟡 Issues

**Schedule button is in the Quick Use footer** — but scheduling requires opening the Dashboard. The transition from "quick use" in sidepanel to "schedule in dashboard" is jarring. Add a small tooltip on the Schedule button:
> `"Scheduling opens your AMZBoosted dashboard in a new tab."`

**Output format selector (CSV/Excel/JSON) should remember the last selection** per tool, not reset to default on every run. Users who always want Excel should get Excel without selecting it each time.

**Processing view spinner is generic.** When a tool is running, the processing view should show what's actually happening:
```
GENERIC: "Running..."
BETTER:  "Fetching your SQP data from Seller Central..."
         "Parsing 847 search terms..."
         "Building your export..."
```
Use the tool name and progress messages to make the wait feel productive.

---

## 4. Dashboard Home

**Current:** Stats grid + charts + What's New + Recent Activity + Quick Actions + Upcoming Schedules.

### 🟡 Issues

**Stats cards show "Unlimited" for exports** regardless of plan. Starter doesn't have unlimited exports. The stat card should reflect the actual plan limit:
- Starter: Show `"500 / 500 credits"`
- Pro: Show `"1,000 / 2,000 credits"`
- Business: Show `"Unlimited"` if no credit cap

**"What's New" section** — need to verify it doesn't show placeholder content on first load. If it pulls from a remote endpoint and that endpoint is slow/down, the section should have a proper skeleton loader, not an empty/broken state.

**Quick Actions grid** — the actions available here should be personalized based on what the user has done. If the user has never created a schedule, the first Quick Action should be `"Create your first schedule"` not a generic action. This is an onboarding/empty-state opportunity.

**Upcoming Schedules widget** shows schedules but has no direct "Create Schedule" button within the widget. Add a `"+ Add Schedule"` text button at the widget footer for zero-state users.

**DashboardHeader period selector** — the dropdown options (Today, This Week, This Month) don't show data counts. Change to:
- `"Today (12 runs)"`
- `"This Week (47 runs)"`
- `"This Month (182 runs)"`

---

## 5. Sidebar Navigation

### 🟡 Issues

**"Credit History" nav item uses `Zap` icon** — Zap is already the icon for "Tools & AI" above it. This creates visual confusion. Change to `ReceiptText` or `Coins`.

**Sidebar section labels are inconsistent:**
- `"General"` — too vague. Change to `"Overview"`
- `"Intelligence"` — this is the Tools section. Change to `"Tools"` for clarity
- `"Workflows"` — good, keep
- `"Account & Billing"` — good, keep
- `"Support"` — good, keep

**No Community link in sidebar.** Users looking for Discord or Telegram help have no way to find it from within the extension. Add to the Support section:
```js
{ id: 'community', label: 'Community', icon: Users, path: '/community' }
```
This should open the Discord URL (`LINKS.discord`) in a new tab.

**Sidebar tagline says "Seller Tools"** (under the AMZBoosted logo when expanded). Consider changing to `"Seller Central Automation"` — more specific and reinforces the core value.

**Collapsed sidebar tooltip for "Tools & AI"** shows `"Tools & AI"` but the group contains 10+ individual tools. The tooltip should say `"Tools (10+ available)"` to set expectations.

---

## 6. Billing Page

### 🔴 Critical Issues

**"Starting at just $19/mo" text on trial expired screen.** This is wrong — Starter is $29/mo. A user who sees "$19/mo" and then discovers the cheapest plan is $29 will feel deceived.

```
WRONG:  "Starting at just $19/mo"
FIXED:  "Starting at $29/mo"
```

**"SQR & Category Insights" is a typo.** In the Premium Features list (start trial card):
```
WRONG:  "SQR & Category Insights"
FIXED:  "SQP & Category Insights"
```

**"Pro Performance" card is hardcoded.** When a user is on an active non-trialing plan, the sidebar card says:
> `"You are on the most popular plan for scaling Amazon sellers."`

This is hardcoded regardless of which plan the user is actually on. A Starter user sees "Pro Performance" (wrong plan name) and a Business user sees "you are on the most popular plan" (also wrong). Fix to use the actual plan name dynamically:
```tsx
<h3>{currentPlan?.name || 'Active Plan'}</h3>
<p>Your {currentPlan?.name} plan is active and running.</p>
```

**`handleSyncNow` is a fake implementation.** The "Sync Now" button on the Integrations page calls:
```tsx
await new Promise(resolve => setTimeout(resolve, 1500)); // Mock sync delay
```
This is a 1.5 second fake delay that does nothing. Either wire it to a real API endpoint (`POST /integrations/:id/sync`) or remove the button entirely. Shipping a button that appears to work but does nothing is a trust destroyer.

---

## 7. Integrations Page

### 🟡 Issues

**"Request New" button has no destination.** The top-right `"Request New"` button doesn't have an `href` or `onClick` that opens a form or Discord link. It's an inert button. Wire it to:
- Discord `#feature-requests` channel link, or
- A Typeform/Google Form for integration requests

**"Documentation" button also has no destination.** Similarly, the "Documentation" button in the top bar links to nowhere visible in the code. If `https://docs.amzboosted.com` doesn't exist yet, remove the button or replace with `"Help Center"` linking to the website help page.

**Integration description text is auto-generated template text:**
```
"Automate real-time alerts and reports directly in ${integration.name}."
"Seamlessly sync your Amazon Seller data to ${integration.name} automatically."
```
These are assembly-line descriptions. Replace with specific, benefit-driven copy for each integration:

| Integration | Better Description |
|---|---|
| Google Sheets | `"Auto-sync your reports to a designated Google Sheet. New rows added with each scheduled run."` |
| Google Drive | `"Export files directly to your Drive folder. Never hunt for downloads again."` |
| Slack | `"Get notified in Slack when a scheduled tool finishes. Send results to any channel."` |
| Discord | `"Deliver report summaries to your Discord server. Great for agency team updates."` |
| Telegram | `"Receive instant Telegram alerts when your scheduled runs complete."` |

**"Premium Feature" overlay copy** on locked integrations says:
```
"Premium Access Only"
```
And the overlay message just shows `upgradeMessage` which is dynamic. Make sure the upgrade message is specific:
- Wrong: `"Upgrade to access Google Sheets"`
- Right: `"Google Sheets sync is available on Professional and Business plans. Upgrade to automate your data pipeline."`

---

## 8. Changelog Page

### 🔴 Critical Issues

**Changelog data is completely outdated.** The latest version shown is `v1.3.0` from `2024-01-20`. It's now 2026. Users who view the changelog will see over a year of silence, which signals an abandoned product.

**The changelog references features that do NOT exist in the current product:**
- `"Bulk URL Runner tool"` — not in the extension
- `"Review Sentiment Classifier"` — not in the extension
- `"New webhook system"` — not in the extension
- `"Airtable integration"` — not in the extension
- `"Notion sync"` — not in the extension (appears twice: v1.1.1 bug fix and v1.0.0 feature)
- `"Keyword Insights tool"` — not in the extension
- `"Inventory Alerts with real-time monitoring"` — not in the extension
- `"Listing Analyzer"` — not in the extension by that name
- `"8 Amazon regions"` — we now support 13

This is not just inaccurate — it actively undermines trust. If users Google these features and can't find them, or if they're paying customers who feel like they're missing functionality, this creates support burden.

**Required action:** Rewrite the entire changelog to reflect the actual product. Add a `v2.0.0` (or whatever the real current version is) entry. Minimum required entries:

```
v2.0.0 — 2026-01-xx (Launch)
Features:
  - 10+ Seller Central automation tools (SQP Snapshot, Sales Traffic Drilldown,
    ASIN Explorer, Price Tracker, Rufus Q&A, Category Insights, Top Terms,
    Niche X, Product Niche Metrics, Niche Query Pulse)
  - Background scheduling engine — runs while browser is open, no open tabs needed
  - 13 Amazon marketplace support via native account switcher
  - Google Sheets sync — auto-append rows on each scheduled run
  - Google Drive export — send files directly to your Drive folder
  - Slack, Discord, Telegram notifications on schedule completion
  - Credit-based usage tracking with monthly reset
  - Multi-account Seller Central switching (Professional + Business)
  - Dashboard with activity logs, export history, and usage analytics
  - Export formats: CSV, Excel (.xlsx), JSON
```

---

## 9. Install Success Page (`install-success.html`)

**This is the very first thing a user sees after installing from the Chrome Web Store. It's a conversion and activation moment.**

### 🔴 Critical Issues

**"8 Powerful Tools" — wrong number.** We have 10+ tools.
```
WRONG:  "8 Powerful Tools"
FIXED:  "10+ Seller Central Tools"
```

**Feature descriptions are entirely wrong.** The features listed on the install success page describe old/non-existent features:
```
WRONG:
  "Review scraper, Q&A extractor, sentiment analysis, and more"
  "AI-powered insights and sentiment classification"

FIXED:
  "SQP Snapshot, Sales Traffic, ASIN Explorer, and 10+ more"
  "Run any tool once or schedule it to run automatically"
```

**"https://docs.amzboosted.com" link** — if this documentation site doesn't exist, the link is broken on the very first page new users see. Either:
1. Build the docs and verify the URL works before launch
2. Change the link to `"https://amzboosted.com/help"` (which exists)

**The CTA button "Open Dashboard"** is the right action. Good. But it's a plain `<a href="#">` with `onclick="openDashboard()"`. The `href="#"` means if JavaScript fails, the button goes nowhere. Change to `href="javascript:openDashboard()"` or keep it as-is if JavaScript is reliable in this context.

**The page is light-mode by default** (`--background: 0 0% 100%`). The extension and website are both dark-mode first. The install success page should default to dark mode since it represents the extension — not the OS web default.

```css
/* WRONG: Forces light mode default */
body { background-color: hsl(var(--background)); /* = white */ }

/* FIXED: Default to dark mode, match the extension */
/* Remove the light-mode :root vars, keep only .dark vars as the base */
```

**No mention of signing in / creating an account.** The install page should tell the user the next step:
> `"Now click the extension icon in your Chrome toolbar to sign in and get started."`

Or better — show a GIF/animation of the extension icon being clicked.

---

## 10. Uninstall Page (`public/uninstall.html`)

Not fully read — do a pass to ensure:
- Correct feature count (10+ not 8)
- Correct plan prices if mentioned
- Consistent dark-mode design
- A feedback survey link (Google Form / Typeform) to understand why users left
- Discord community link so users don't churn but instead join the community

---

## 11. Onboarding Flow (`OnboardingFlow.tsx`)

Not fully read — these patterns commonly apply:

### 🟡 Must Verify

- **Step 1** should be: "Navigate to Seller Central" — not skippable. Without this step, the extension does nothing.
- **Steps should be completable** — don't just be a slideshow. Each step should have a "Mark as done" or auto-detect completion.
- **Onboarding must mention credits** early: `"Your first 14 days include X credits per month. Credits reset monthly."`
- **Skip button should not skip all onboarding.** Minimal onboarding (just Seller Central navigation) should be non-skippable. Advanced steps (scheduling, integrations) can be skipped.

---

## 12. Missing Features / Pages (Expected but Not Found)

These are features that are promised on the website or implied by the product, but don't exist as visible pages or components in the extension:

| Expected Feature | Status | Impact |
|---|---|---|
| **Price Tracker dashboard view** | Only `PriceTrackerPage.tsx` exists but not linked from `AllToolsPage` | Users can't track prices over time without knowing the URL |
| **Export re-download** | `ExportsPage` exists but unclear if past exports can be re-downloaded | Users expect to access their historical data |
| **Schedule "Run Now"** | Need to verify if a scheduled task can be triggered manually | Common user need |
| **Notification preview** | No way to test if Discord/Slack notifications work before enabling | Users expect a "Send test notification" button |
| **Community link** | No link to Discord/Telegram from within the extension | Users who need help have to find it themselves |
| **Referral / invite** | No invite mechanism visible | Missed growth loop |
| **Keyboard shortcuts help** | `KeyboardShortcutsDialog.tsx` exists — is it accessible from the UI? | Premium UX feature that should be findable |

---

## 13. Brand Voice Consistency Audit

**The extension uses multiple conflicting tones.** This confuses users and makes the product feel unpolished.

| Location | Current Tone | Problem |
|---|---|---|
| Login screen | `"Stop Guessing. Start Dominating."` | Gaming/aggressive |
| Login badge | `"Elite Trial Active"` | Overhyped |
| Login features | `"Zero-Link™ Discovery"` | Made-up jargon |
| Website hero | `"Your Amazon Seller Central runs itself."` | Professional, clear |
| Dashboard billing | `"Unlock the full power of AMZBoosted"` | Generic SaaS |
| Dashboard billing | `"Pro Performance"` | Hardcoded, wrong |
| Install page | `"supercharge your Amazon selling experience"` | Marketing fluff |

**Target voice:** Professional. Direct. Specific. Privacy-conscious. Calm confidence — not hype.

Every user-facing string should pass this test: **"Would a logistics manager at a serious e-commerce company read this and respect it, or roll their eyes?"**

---

## 14. Missing UI States

These empty/error/loading states are missing or inadequate:

| Screen | Missing State | Impact |
|---|---|---|
| ToolsHome | No loading skeleton during tool fetch | Flash of empty content |
| QuickUse | No "wrong page" guidance | Users confused when tool won't start |
| Dashboard | Empty state for zero activity (new user) | New users see empty charts, feel abandoned |
| Schedules | Empty state should prompt first schedule creation | Missed activation |
| Exports | Empty state should explain how exports are generated | Confusing for new users |
| IntegrationsPage | Confetti triggers on every connect — on reconnect this feels weird | Polish issue |
| Notifications | No "test notification" button | Users can't verify it works |

---

## Priority Summary

### 🔴 Critical — Fix Before Any User Sees the Extension

| # | Issue | File |
|---|---|---|
| 1 | Login screen: "The Elite Edge OS" tagline — meaningless | `LoginScreen.tsx` |
| 2 | Login screen: "Stop Guessing. Start Dominating." — wrong tone | `LoginScreen.tsx` |
| 3 | Login screen: Made-up trademark terms (Zero-Link™, Privacy Fortress™) | `LoginScreen.tsx` |
| 4 | Changelog is entirely outdated (latest = 2024-01-20, a year+ old) | `ChangelogPage.tsx` |
| 5 | Changelog references features that don't exist (Airtable, Notion, Sentiment, etc.) | `ChangelogPage.tsx` |
| 6 | Install success page says "8 Powerful Tools" (we have 10+) | `install-success.html` |
| 7 | Install success page describes non-existent features (sentiment analysis, etc.) | `install-success.html` |
| 8 | Billing page says "Starting at just $19/mo" (Starter is $29/mo) | `BillingPage.tsx` |
| 9 | Billing page: "SQR & Category Insights" — typo, should be SQP | `BillingPage.tsx` |
| 10 | `handleSyncNow` is a fake setTimeout — does nothing | `IntegrationsPage.tsx` |

### 🟡 High — Ship Within 7 Days

| # | Issue | File |
|---|---|---|
| 11 | Login: "Level Up Your Business" / "New Partner?" — wrong tone | `LoginScreen.tsx` |
| 12 | Billing: "Pro Performance" card is hardcoded regardless of plan | `BillingPage.tsx` |
| 13 | Sidebar: Credit History uses Zap icon (duplicates Tools icon) | `Sidebar.tsx` |
| 14 | Sidebar: Section label "Intelligence" is unclear — change to "Tools" | `Sidebar.tsx` |
| 15 | Sidebar: No community link | `Sidebar.tsx` |
| 16 | Integrations: "Request New" button goes nowhere | `IntegrationsPage.tsx` |
| 17 | Integrations: "Documentation" button goes nowhere | `IntegrationsPage.tsx` |
| 18 | Integrations: Auto-generated description text for each integration | `IntegrationsPage.tsx` |
| 19 | Install page: link to `docs.amzboosted.com` (likely 404) | `install-success.html` |
| 20 | Install page: light mode default doesn't match extension dark UI | `install-success.html` |
| 21 | ToolsHome: "Competitor Analysis" category name inaccurate | `ToolsHome.tsx` |
| 22 | ToolsHome: No credit cost badge per tool | `ToolsHome.tsx` |
| 23 | QuickUse: No "wrong page" error state with navigation guidance | Tool screens |
| 24 | Dashboard: Empty state for brand new users (zero activity) | `DashboardHome.tsx` |

### 🔵 Polish — After Launch

| # | Issue | File |
|---|---|---|
| 25 | Navbar icon in Sidepanel should be logo not Zap | `Navbar.tsx` |
| 26 | ProcessingView should show tool-specific progress messages | `ProcessingView.tsx` |
| 27 | Output format selector should persist selection per tool | `QuickUse` |
| 28 | Dashboard period selector should show counts per period | `DashboardHeader.tsx` |
| 29 | Schedules widget needs "+ Add Schedule" in empty state | `UpcomingSchedules.tsx` |
| 30 | Add "Send Test Notification" button to Notifications page | `NotificationsPage.tsx` |
| 31 | Price Tracker ensure accessible from AllToolsPage and sidebar | `PriceTrackerPage.tsx` |
| 32 | Keyboard shortcuts dialog — verify it's discoverable in UI | `KeyboardShortcutsDialog.tsx` |
| 33 | Verify uninstall.html for consistent branding | `uninstall.html` |
| 34 | Tool search: add "Clear search" button in empty results state | `ToolsHome.tsx` |
