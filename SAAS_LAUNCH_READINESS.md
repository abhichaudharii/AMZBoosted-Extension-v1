# AMZBoosted — Full SaaS Launch Readiness Plan
**Status:** Pre-launch planning
**Covers:** Website → Extension → Post-install flow → Growth → Chrome Web Store → Email → SEO → Future features
**Last updated:** 2026-03-15

---

## TABLE OF CONTENTS

1. [Install / Uninstall Flow — Move to Website](#1-install--uninstall-flow--move-to-website)
2. [Extension — Critical Fixes Before Launch](#2-extension--critical-fixes-before-launch)
3. [Website — Critical Fixes Before Launch](#3-website--critical-fixes-before-launch)
4. [Chrome Web Store Listing](#4-chrome-web-store-listing)
5. [Email Sequences — Full Lifecycle](#5-email-sequences--full-lifecycle)
6. [Analytics & Tracking](#6-analytics--tracking)
7. [SEO Foundation](#7-seo-foundation)
8. [Legal & Compliance](#8-legal--compliance)
9. [Support & Documentation](#9-support--documentation)
10. [Growth & Virality](#10-growth--virality)
11. [Nice-to-Have Features (Roadmap)](#11-nice-to-have-features-roadmap)
12. [Launch Sequence — Day-by-Day](#12-launch-sequence--day-by-day)

---

## 1. Install / Uninstall Flow — Move to Website

### Why Move These Pages to the Website

The extension's `public/install-success.html` and `public/uninstall.html` are static HTML pages with no ability to:
- Identify the user (no auth/session)
- Trigger email sequences
- Store install/uninstall data in the database
- Personalize content
- A/B test variants
- Detect if the user is already registered

**Moving them to `amzboosted.com` solves all of this.**

> Chrome's `chrome.runtime.setUninstallURL()` already requires a web URL — the uninstall page MUST live on the website.

---

### 1a. Changes Needed in the Extension

**File: `entrypoints/background.ts`**

Uncomment and update line 48. Add the uninstall URL.
Change this section (lines 44–52):

```typescript
// CURRENT (does nothing):
if (details.reason === 'install') {
    console.log('[Background] First time install - opening welcome page');
    // chrome.tabs.create({ url: 'https://amzboosted.com/welcome' });
}

// CHANGE TO:
if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://amzboosted.com/welcome' });
}

// ADD after the onInstalled block (before the schedulerService.initialize() call):
chrome.runtime.setUninstallURL('https://amzboosted.com/goodbye');
```

**File: `lib/config/links.ts`**

Add two new entries to the `LINKS` object:
```typescript
welcome: 'https://amzboosted.com/welcome',
goodbye: 'https://amzboosted.com/goodbye',
```

**File: `public/install-success.html`** — DELETE

This file is now replaced by `amzboosted.com/welcome`. Remove it from the extension so it doesn't ship in the package and confuse anyone.

**File: `public/uninstall.html`** — DELETE

Same reason. Remove it.

---

### 1b. New Page: `/app/(public)/welcome/page.tsx` (Website)

This page opens automatically in a new tab when the user installs the extension.

**Design:**
```
┌────────────────────────────────────────────────┐
│  ✓ AMZBoosted Installed Successfully           │
│                                                │
│  [Confetti animation]                          │
│                                                │
│  Welcome to AMZBoosted!                        │
│  Your 30-day free trial has started.           │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  ✓  10+ extraction tools                 │  │
│  │  ✓  Schedule automation                  │  │
│  │  ✓  Export to Google Sheets & CSV        │  │
│  │  ✓  All 13 Amazon marketplaces           │  │
│  │  ✓  No credit card required              │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [Sign up to activate your trial →]            │
│  Already have an account? Sign in              │
│                                                │
│  ─────────────────────────────────────────     │
│  Step 1 of 3: Create account                   │
│  Step 2: Connect your Amazon marketplace       │
│  Step 3: Run your first extraction             │
└────────────────────────────────────────────────┘
```

**Behavior:**
- If user is already logged in (Clerk session exists) → skip signup form, show "Welcome back [name]! Your trial is active." + "Go to Dashboard" button
- If not logged in → Show Clerk `<SignUp />` component with redirect to `/dashboard?onboarding=true`
- On mount: fire analytics event `extension_installed` (also fires the install-check email via API)
- Query param `?source=extension` to track installs from this page vs direct signups

**URL:** `https://amzboosted.com/welcome`

---

### 1c. New Page: `/app/(public)/goodbye/page.tsx` (Website)

This page opens automatically when the user removes the extension from Chrome.

**Design:**
```
┌────────────────────────────────────────────────┐
│  We're sorry to see you go 😞                  │
│                                                │
│  Why did you remove AMZBoosted?                │
│                                                │
│  ○ I didn't find it useful                    │
│  ○ It's too expensive                         │
│  ○ Missing features I need                    │
│  ○ Technical issues / bugs                    │
│  ○ I found a better alternative               │
│  ○ Just testing / not ready yet               │
│  ○ Other                                      │
│                                                │
│  [Optional: tell us more...]                   │
│                                                │
│  [Submit Feedback]                             │
│                                                │
│  ─────────────────────────────────────────     │
│  Wait — before you go:                         │
│                                                │
│  If it was a bug, we'll fix it for you.        │
│  Reply to our email and we'll personally help. │
│                                                │
│  Or: Use the free plan — no card needed.       │
│  [Reinstall Extension]                         │
└────────────────────────────────────────────────┘
```

**Behavior:**
- On mount: detect user from Clerk session (if still logged in)
- Form submission: POST to `/api/v1/user/feedback/uninstall` — stores reason + email + timestamp
- If reason = "too-expensive": show special offer card (20% off, 3 months)
- If reason = "missing-features": show upcoming features roadmap teaser
- If reason = "technical-issues": show support chat button (Crisp/Intercom/Tally)
- After submit: trigger `uninstall_feedback` email (from existing winback templates)
- Show confetti/thank-you message after submission

**URL:** `https://amzboosted.com/goodbye`

---

### 1d. API Route Needed

**File:** `/app/api/v1/user/feedback/uninstall/route.ts`

```
POST /api/v1/user/feedback/uninstall
Body: { reason, comment, userId? (from Clerk session or anonymous) }
```
- Saves to Supabase `uninstall_feedback` table
- Triggers appropriate email from winback sequence
- Returns 200

---

## 2. Extension — Critical Fixes Before Launch

These are blocking issues. Nothing should go to the Chrome Web Store until these are resolved.

### 🔴 P0 — Ship Blockers

| # | Issue | File | Fix |
|---|---|---|---|
| 1 | Install tab never opens (commented out) | `background.ts:48` | Uncomment + change URL to `https://amzboosted.com/welcome` |
| 2 | No uninstall URL set (missed 100% of uninstall data) | `background.ts` | Add `chrome.runtime.setUninstallURL('https://amzboosted.com/goodbye')` |
| 3 | `manifest.json` host_permissions only covers 8 Amazon domains — 5 marketplaces completely broken | `wxt.config.ts` | Add `.co.jp`, `.com.au`, `.com.br`, `.mx`, `.ae` |
| 4 | Manifest version `1.1.0` ≠ changelog latest `v1.3.0` | `manifest.json` / `wxt.config.ts` | Pick one version, update both. Recommend `1.0.0` for first CWS release. |
| 5 | `AnalyticsPage.tsx` (328 lines, fully built) has no sidebar nav link | `Sidebar.tsx` | Add Analytics item to sidebar nav |

### 🟡 P1 — Before Public Users See It

| # | Issue | File | Fix |
|---|---|---|---|
| 6 | Login screen: "The Elite Edge OS" / "Stop Guessing. Start Dominating." | `LoginScreen.tsx` | Rewrite with clean, benefit-focused copy |
| 7 | Login screen: Made-up trademarks (Zero-Link™, Privacy Fortress™) | `LoginScreen.tsx` | Remove all fake trademarks |
| 8 | Sidepanel loading says "Initializing Intelligence" | `App.tsx` (sidepanel) | Change to "Loading AMZBoosted..." or just show spinner |
| 9 | Changelog shows 2024 dates and features that don't exist | `ChangelogPage.tsx` | Full rewrite with real version history |
| 10 | Billing page says "Starting at just $19/mo" (Starter is $29/mo) | `BillingPage.tsx` | Fix to match real pricing |
| 11 | "SQR & Category Insights" — SQR is not a thing | `BillingPage.tsx` | Fix to "SQP & Category Insights" |
| 12 | `handleSyncNow` is a 2-second fake setTimeout | `IntegrationsPage.tsx` | Wire to real sync API or remove the button |
| 13 | Install success page says "8 Powerful Tools" | `install-success.html` | DELETE file (replaced by website page) |
| 14 | Install success page mentions non-existent "sentiment analysis" | `install-success.html` | DELETE file |

### 🔵 P2 — Polish

| # | Issue | File | Fix |
|---|---|---|---|
| 15 | Keyboard shortcuts `Alt+1-5` may not appear in KeyboardShortcutsDialog | `KeyboardShortcutsDialog.tsx` | Verify all shortcuts are listed |
| 16 | Sidepanel tool list section collapse state may reset on update | `ToolsHome.tsx` | Verify chrome.storage persistence survives extension update |
| 17 | Dashboard has no "first run" empty state for new users | All data pages | Add empty states with CTAs to run tools |
| 18 | No visual indicator if user has never connected an Amazon account | `Sidebar.tsx` / `QuickUse.tsx` | Show onboarding prompt if no account detected |

---

## 3. Website — Critical Fixes Before Launch

Full audit is in `LANDING_PAGE_AUDIT.md`. Summary of remaining items not yet implemented:

### 🔴 P0

| # | Issue | Component | Fix |
|---|---|---|---|
| 1 | No `/welcome` page (post-install) | NEW | Build as described in Section 1b |
| 2 | No `/goodbye` page (post-uninstall) | NEW | Build as described in Section 1c |
| 3 | Demo video placeholder (no actual video) | `DemoVideoSection` | Record a 2-3 min screen recording of real tool usage, embed via YouTube/Loom |
| 4 | Testimonial section has no real photos | `TestimonialsSection` | Get 3-5 real beta user photos + quotes, or use initials-avatar fallback |

### 🟡 P1

| # | Issue | Component | Fix |
|---|---|---|---|
| 5 | No dedicated `/pricing` page (only landing page section) | NEW | Build `/pricing` page — needed for direct linking from extension billing page, ads, etc. |
| 6 | No `/tools` index page (only individual `/tools/[slug]`) | NEW | Build a tools catalog page listing all available tools with categories |
| 7 | Missing Open Graph image | `layout.tsx` | Create 1200x630 OG image with AMZBoosted branding |
| 8 | Missing favicon variants (16px, 32px, apple-touch-icon) | `app/` | Generate full favicon set from logo |
| 9 | Blog has no content | `/blog` | Write 3-5 launch posts (SEO targeting, see Section 7) |
| 10 | No real changelog on website | `/changelog` | Port the real version history here |
| 11 | `/status` page is likely a stub | `/status` | Wire to a real status provider (BetterUptime / Instatus) |
| 12 | No cookie consent banner | Layout | Add Cookiebot or custom cookie consent for GDPR compliance |
| 13 | `/community` page likely empty | `/community` | Add Discord widget + community guidelines + link to Discord server |

### 🔵 P2

| # | Issue | Fix |
|---|---|---|
| 14 | No social proof counter ("X sellers trust AMZBoosted") | Wire to real user count from DB or hardcode a conservative number |
| 15 | No "Powered by" badge for Google Sheets exports | Add optional watermark + "export_type" tracking |
| 16 | No referral/affiliate page | Build `/affiliate` page (see Section 10) |
| 17 | No Product Hunt or AppSumo badge | Prepare launch assets (see Section 12) |

---

## 4. Chrome Web Store Listing

The listing is the first thing users see before installing. This is marketing copy.

### Required Assets

| Asset | Size | Notes |
|---|---|---|
| Extension icon | 128×128 PNG | Use AMZBoosted logo, no transparency on main icon |
| Small promo tile | 440×280 PNG | Used in search results |
| Large promo tile | 920×680 PNG | Used on extension detail page |
| Screenshots | Min 1280×800 PNG | Need 3-5 showing key features |
| Marquee promo image | 1400×560 PNG | Optional but increases CTR by ~30% |

### Screenshots to Create (in order)

1. **Sidepanel open on Amazon product page** — Shows the extension in real use context. Caption: "One click to extract data from any Amazon page"
2. **QuickUse in action** — Shows URLs input + progress bars running. Caption: "Batch extract from 100+ ASINs in minutes"
3. **Dashboard — Reports page** — Shows the data table with multiple reports. Caption: "All your Amazon data, organized in one place"
4. **Schedules page** — Shows automated tasks. Caption: "Set it and forget it — automate your data collection"
5. **Google Sheets export** — Shows data flowing into a spreadsheet. Caption: "Export directly to Google Sheets or CSV"

### Store Copy

**Name:** AMZBoosted — Amazon Seller Tools Suite

**Short description (132 chars max):**
```
Extract Amazon data, automate reports, and export to Google Sheets. The all-in-one toolkit for Amazon sellers.
```

**Category:** Productivity

**Long description (template — fill in real details):**
```
AMZBoosted is the most powerful Chrome extension for Amazon sellers who want to stop wasting time on manual data collection.

WHAT IT DOES:
• Extract product data, reviews, Q&As, and more from any Amazon marketplace
• Export to CSV, Excel, or directly to Google Sheets
• Schedule automated extractions — daily, weekly, or on demand
• View all your data in a clean dashboard with charts and reports

TOOLS INCLUDED:
[List each tool by name and what it does — one line each]

MARKETPLACES SUPPORTED:
Amazon.com, .co.uk, .ca, .de, .fr, .it, .es, .in, .co.jp, .com.au, .com.br, .mx, .ae

WHO IT'S FOR:
Amazon sellers, brand owners, agencies, and VAs who need reliable data fast.

PRIVACY:
All processing happens in your browser. Your Amazon session is never stored or transmitted. Full privacy policy: https://amzboosted.com/privacy-policy

SUPPORT:
support@amzboosted.com | https://amzboosted.com/help
```

**Privacy policy URL:** `https://amzboosted.com/privacy-policy`

### Justification for Sensitive Permissions

Chrome Web Store reviewers will ask about these. Prepare answers:
- `cookies` — Required to read Amazon session cookies to verify user is logged in before running extractions
- `scripting` — Required to inject content scripts into Amazon pages to extract DOM data
- `identity` — Required for Google OAuth integration (Google Sheets export)
- `unlimitedStorage` — Required to store large datasets from bulk extractions (IndexedDB)
- `alarms` — Required for scheduled automation (wake up background script at specified times)

---

## 5. Email Sequences — Full Lifecycle

The email templates already exist in `/lib/email/templates/`. This section defines **when each email fires** and what the trigger is.

### Onboarding Sequence (Trial Users)

| Day | Email Template | Trigger | Goal |
|---|---|---|---|
| 0 (install) | `welcome.tsx` | User creates account on `/welcome` page | Set expectations, link to dashboard |
| 0+1hr | `onboarding-install-check.tsx` | Scheduled 1hr after signup | Confirm extension is installed, prompt first run |
| Day 1 | `onboarding-first-win.tsx` | Fires if user ran ≥1 tool | Celebrate first extraction, show next step |
| Day 1 (fallback) | `extension-nag.tsx` | Fires if user has NOT run a tool yet | "We noticed you haven't tried it yet" |
| Day 3 | `onboarding-mid-trial.tsx` | 3 days after signup | Mid-trial check-in, highlight underused features |
| Day 5 | `onboarding-scheduler.tsx` | If user hasn't created a schedule yet | Show scheduling feature |
| Day 7 | `onboarding-sqp-deep-dive.tsx` | All trial users | Deep dive on SQP tool (highest value tool) |
| Day 25 | `trial-warning.tsx` | 5 days before trial expiry | "Your trial ends in 5 days" |
| Day 28 | `onboarding-trial-warning.tsx` | 2 days before expiry | Final nudge with upgrade CTA |
| Day 30 | `trial-expiry.tsx` | Day trial expires | Trial expired, upgrade offer |

### Behavioral Triggers

| Trigger | Email | When |
|---|---|---|
| User extracts 50+ items | `run-celebration.tsx` | Immediate |
| User exports first time | `export-ready.tsx` | Immediate |
| User enables first schedule | `scheduler-activated.tsx` | Immediate + 1hr |
| User connects Google Sheets | `integrations/connected.tsx` | Immediate |
| User asks about ASINs | `asin-help.tsx` | Based on support ticket or help page visit |
| User runs first ASIN extraction | `asin-success.tsx` | After successful run |
| Credits drop below 20% | `credit-warning.tsx` | Real-time check |
| User inactive for 7 days | `inactivity.tsx` | Cron job, 7 days after last activity |

### Post-Cancellation / Winback

| Day after cancel | Email | Goal |
|---|---|---|
| Day 1 | `winback/feedback.tsx` | Ask why they cancelled |
| Day 7 | `winback/limited-offer.tsx` | 20% off offer |
| Day 30 | `winback/final.tsx` | Final farewell + "we'll keep your data for 90 days" |

### Uninstall-Specific

| Trigger | Email | When |
|---|---|---|
| Uninstall form submitted | `winback/feedback.tsx` (variant) | Immediate |
| If reason = "too-expensive" | Special discount offer | Immediate |
| If no feedback after uninstall | `winback/feedback.tsx` | 24hr after visiting `/goodbye` without submitting |

### Transactional

| Event | Email |
|---|---|
| Payment successful | `payment/receipt.tsx` or `payment/subscription-confirmation.tsx` |
| Payment failed | `payment/payment-failed.tsx` |
| Account deleted | `transactional/account-deleted.tsx` |
| Password reset | Clerk handles this natively |
| Trial started | `transactional/trial-started.tsx` |

---

## 6. Analytics & Tracking

### Events to Track (PostHog / Mixpanel / Amplitude)

**Acquisition:**
- `page_viewed` (all pages, with path)
- `extension_install_page_viewed` (someone hits `/welcome`)
- `extension_installed` (on `/welcome` page load — indicates successful CWS install)
- `signup_started` (clicked sign up CTA)
- `signup_completed` (Clerk webhook)
- `signin_completed`

**Activation:**
- `first_tool_run` — First extraction after signup
- `first_export` — First file downloaded
- `first_schedule_created`
- `first_google_sheets_connected`
- `onboarding_step_completed` (step number 1/2/3)

**Engagement:**
- `tool_run` (with `tool_id`, `marketplace`, `item_count`, `duration_ms`)
- `report_downloaded` (format: CSV/Excel/JSON)
- `schedule_created` / `schedule_paused` / `schedule_deleted`
- `integration_connected` (type: google_sheets, telegram, etc.)
- `dashboard_page_viewed` (page name)
- `help_article_viewed`

**Revenue:**
- `trial_started`
- `trial_expiry_viewed` (billing page)
- `upgrade_clicked` (with plan name)
- `subscription_started` (Dodo webhook)
- `subscription_cancelled`
- `payment_failed`

**Retention / Churn:**
- `session_started` (daily active)
- `extension_uninstalled` (from `/goodbye` page visit)
- `uninstall_reason_submitted` (with reason category)

### Funnels to Monitor

1. **Install Funnel:** CWS page → Install → `/welcome` → Signup → Dashboard → First run
2. **Activation Funnel:** Signup → First run → First export → First schedule
3. **Upgrade Funnel:** Trial user → Billing page view → Plan selected → Payment complete
4. **Reactivation Funnel:** Inactive user → Email click → Dashboard → Tool run

### Key Metrics (Weekly Review)

| Metric | Target |
|---|---|
| CWS → Install conversion rate | >40% |
| Install → Signup rate | >60% |
| Signup → First run rate (D1) | >50% |
| D7 retention | >30% |
| D30 retention | >20% |
| Trial → Paid conversion | >8% |
| Monthly churn | <5% |

---

## 7. SEO Foundation

### Target Keywords (Primary)

| Keyword | Monthly Volume | Difficulty | Landing Page |
|---|---|---|---|
| amazon seller tools | 8,100 | Medium | Homepage |
| amazon review scraper | 2,400 | Low | `/tools/review-extractor` |
| amazon product research tool | 6,600 | High | `/tools/product-research` |
| amazon asin extractor | 1,600 | Low | `/tools/asin-extractor` |
| amazon search query performance | 1,900 | Low | `/tools/sqp-analyzer` |
| extract amazon reviews | 2,900 | Low | `/tools/review-extractor` |
| amazon data extractor chrome extension | 720 | Low | Homepage |
| bulk amazon asin lookup | 880 | Low | `/tools/asin-extractor` |

### Blog Posts to Write (Launch Content)

1. **"How to Extract Amazon Reviews in Bulk (2026 Guide)"** — Targets "amazon review scraper", "extract amazon reviews"
2. **"Amazon Search Query Performance Report: Complete Guide"** — Targets "search query performance amazon", "SQP report"
3. **"Best Amazon Seller Tools in 2026 — Comparison"** — Targets "amazon seller tools", category traffic
4. **"How to Export Amazon Data to Google Sheets (Step-by-Step)"** — Targets "amazon google sheets integration"
5. **"Amazon Category Insights Report: How to Read and Use It"** — Targets "amazon category insights"

### Technical SEO

- [ ] `sitemap.xml` generated and submitted to Google Search Console
- [ ] `robots.txt` configured (allow all, disallow `/api/`, `/dashboard/`)
- [ ] Open Graph meta tags on all public pages (1200×630 image)
- [ ] Twitter Card meta tags
- [ ] Structured data (JSON-LD) for homepage (SoftwareApplication schema)
- [ ] Core Web Vitals passing (check via PageSpeed Insights)
- [ ] Canonical URLs on all pages

---

## 8. Legal & Compliance

### Documents Needed

| Document | Status | Notes |
|---|---|---|
| Privacy Policy | ✅ Exists at `/privacy-policy` | Review: must mention Amazon data, Google OAuth, Stripe/Dodo, cookies |
| Terms of Service | ✅ Exists at `/terms-of-service` | Review: mention Chrome extension usage |
| Refund Policy | ✅ Exists at `/refund-policy` | Review: align with Dodo/Stripe actual terms |
| GDPR Page | ✅ Exists at `/gdpr` | Review: ensure data deletion request process is documented |
| Cookie Policy | ❌ Missing | Create or merge into Privacy Policy with dedicated cookie section |

### Cookie Consent

Add a cookie consent banner (required for EU users). Options:
- **Cookiebot** (free tier available, GDPR certified)
- **CookieYes** (simple, free tier)
- **Custom** — lightweight banner with localStorage preference storage

The banner should appear on first visit for unrecognized sessions. Accepted state stored in localStorage.

### GDPR Data Deletion

Must be possible for EU users to:
1. Request all their data via `/account` → "Request Data Export"
2. Delete their account via `/account` → "Delete Account"
3. Both flows must purge Supabase records, Clerk user, IndexedDB data

Verify all three work end-to-end before launch.

### Amazon ToS Alignment

The extension reads data from Amazon pages that the user is actively viewing while logged into their own account. This is consistent with Amazon's terms for sellers using their own data. Do not scrape data from pages the user hasn't navigated to. Do not store raw Amazon HTML. Do not re-sell extracted data. These points should be mentioned in the ToS.

---

## 9. Support & Documentation

### Minimum Viable Help Center

These pages are needed before launch (can be simple Notion docs or `/helps` pages):

| Article | URL | Priority |
|---|---|---|
| Getting started (3-step setup) | `/helps/getting-started` | P0 |
| How to run your first extraction | `/helps/first-extraction` | P0 |
| Supported Amazon marketplaces | `/helps/marketplaces` | P0 |
| How to connect Google Sheets | `/helps/google-sheets` | P0 |
| How to create a schedule | `/helps/schedules` | P1 |
| Understanding credits | `/helps/credits` | P1 |
| Exporting data (CSV, Excel) | `/helps/exports` | P1 |
| How to use the SQP tool | `/helps/sqp-tool` | P1 |
| Keyboard shortcuts | `/helps/keyboard-shortcuts` | P2 |
| FAQ | `/helps/faq` | P0 |
| Contact support | `/helps/contact` | P0 |

### In-App Support

- [ ] Add live chat (Crisp.chat or Intercom) to website — free tier for <100 conversations/month
- [ ] Add "Report a Bug" button in extension sidebar footer → opens pre-filled email to support@amzboosted.com
- [ ] Add "Help" keyboard shortcut in sidepanel → opens relevant help article

### Onboarding Checklist (In-App)

The `OnboardingFlow` component exists. Wire it to these 5 steps:

1. ✓ Create your account
2. ○ Install the extension (check via API if extension is sending heartbeats)
3. ○ Open the extension on an Amazon product page
4. ○ Run your first extraction
5. ○ Export your first report

Show progress in the dashboard sidebar. Each completed step = dopamine hit (confetti, checkmark, credit reward).

---

## 10. Growth & Virality

### Referral Program

Build `/affiliate` or `/refer` page:
- Each user gets a unique referral link: `https://amzboosted.com/?ref=USERNAME`
- Referred user gets 14 extra trial days (instead of 30)
- Referrer gets 1 month free for each paying referral
- Track in Supabase `referrals` table
- Show referral stats in `/account` → "Referral Program" tab

### Viral Loops

1. **"Export footer"** — CSV/Excel exports include a subtle footer row: "Data extracted with AMZBoosted — amzboosted.com". Optional, toggleable in settings.
2. **"Share results"** — After a big extraction (100+ items), show "Share what you found" button → generates a shareable stats card (screenshot-friendly) showing marketplace, item count, time saved
3. **Twitter/X share button** — On "first win" moment in dashboard, show "Share your win → X" button with pre-filled copy

### Community

- **Discord server** — Required. Create a `#wins` channel where sellers share results, a `#feature-requests` channel, and a `#help` channel.
- **Telegram group** — Optional but some Amazon seller communities prefer Telegram
- **Product Hunt page** — Prepare launch assets (see Section 12)

### Agency / Team Plan (Future)

Later: multi-seat plans where one account can be used by a VA team, with separate usage tracking per user. This is a high-revenue upsell path.

---

## 11. Nice-to-Have Features (Roadmap)

These are NOT needed for launch but are high-value additions. Ordered by impact.

### Tier 1 — High Impact, Medium Effort

| Feature | Description | Why |
|---|---|---|
| **Bulk CSV import for ASINs** | Upload a CSV of ASINs instead of pasting them manually | Power user request, enables "agency" workflows |
| **Browser push notifications** | Notify when a scheduled extraction completes | Increases activation + retention, extension already has `notifications` permission |
| **Export to Airtable** | Airtable webhook integration for structured data | Popular with Amazon agencies who use Airtable for tracking |
| **Rank Tracker (BSR history)** | Track BSR over time for specific ASINs | High demand feature, shows trends |
| **Email report delivery** | Send report as attachment to any email when schedule runs | Replaces manual download habit |

### Tier 2 — Medium Impact, Medium Effort

| Feature | Description | Why |
|---|---|---|
| **Zapier / Make.com integration** | Webhook output to 5,000+ apps | Opens enterprise market |
| **API access** | REST API for power users who want to build on top | Developer audience, premium plan upsell |
| **Custom webhooks** | POST extraction results to any URL | Power users, agency use case |
| **Competitor price tracking** | Watch a set of ASINs for price changes | High demand, complements existing tools |
| **Review sentiment analysis** | AI categorization of reviews (positive/negative + topic) | Was already promised in old copy — build the real thing |

### Tier 3 — Nice to Have

| Feature | Description | Why |
|---|---|---|
| **White-label / agency plan** | Remove AMZBoosted branding from exports | High-margin enterprise tier |
| **Google Sheets add-on** | Run extractions directly from a Google Sheet | Different distribution channel |
| **Slack export** | Post extraction summaries to a Slack channel | Integration already in UI, just not wired for data delivery |
| **Mobile companion app** | React Native app to view reports on phone | Long-term retention play |
| **Multi-user workspaces** | Teams with role-based permissions | Enterprise sales |
| **"Ask AI" about your data** | Chat with your extracted data (Claude API) | Differentiation vs competitors |

---

## 12. Launch Sequence — Day-by-Day

### T-14 Days (Preparation)

- [ ] All P0 extension fixes shipped
- [ ] All P0 website fixes shipped
- [ ] `/welcome` and `/goodbye` pages built and tested
- [ ] Install → website open → signup → dashboard flow tested end-to-end
- [ ] Uninstall URL tested (install extension → remove → confirm `/goodbye` opens)
- [ ] Chrome Web Store assets created (screenshots, promo tiles, copy written)
- [ ] Privacy policy reviewed for Chrome Web Store compliance
- [ ] All 13 marketplace host_permissions added and tested
- [ ] At least 3 real beta users have tested the full flow
- [ ] Email welcome sequence tested (all templates send correctly)
- [ ] Billing / trial flow tested end-to-end (sign up → trial starts → upgrade → payment → confirms)

### T-7 Days (Soft Launch)

- [ ] Submit extension to Chrome Web Store (review takes 3-7 days)
- [ ] Enable signups on website (remove any beta/waitlist gates)
- [ ] Post in 2-3 Amazon seller Facebook groups / subreddits for early feedback
- [ ] Send to 10-20 beta users for final feedback
- [ ] Fix any P1 bugs from beta feedback
- [ ] Record and publish demo video
- [ ] Write 2 blog posts (target keywords from Section 7)
- [ ] Set up Google Search Console and submit sitemap

### T-0 (Launch Day)

- [ ] Chrome Web Store extension goes live (approved)
- [ ] Post on Product Hunt (coordinate with community for upvotes)
- [ ] Announce on Twitter/X (founder account + any Amazon seller influencers)
- [ ] Post in Discord/Telegram Amazon seller communities
- [ ] Send launch announcement email to waitlist
- [ ] Monitor Supabase for signup flow errors in real-time
- [ ] Monitor Sentry/error tracking for extension crashes
- [ ] Have support@amzboosted.com monitored all day

### T+7 Days (Post-Launch)

- [ ] Respond to all Chrome Web Store reviews (good and bad)
- [ ] Analyze install → activation funnel (what % are running their first tool?)
- [ ] Check uninstall survey data — any common reasons to fix?
- [ ] Fix any bugs from launch week
- [ ] Post "launch week results" tweet/update for social proof
- [ ] Identify top-requested feature from feedback and add to roadmap

---

## MASTER CHECKLIST — BEFORE GOING PUBLIC

### Extension
- [ ] `background.ts` — uncomment install tab, add uninstall URL
- [ ] `manifest.json` — add all 13 Amazon host_permissions
- [ ] `manifest.json` — fix version number
- [ ] `Sidebar.tsx` — add Analytics page link
- [ ] `LoginScreen.tsx` — rewrite copy
- [ ] `App.tsx` (sidepanel) — fix "Initializing Intelligence"
- [ ] `ChangelogPage.tsx` — rewrite with real history
- [ ] `BillingPage.tsx` — fix pricing and SQP typo
- [ ] `IntegrationsPage.tsx` — fix fake sync button
- [ ] Delete `public/install-success.html` and `public/uninstall.html`

### Website
- [ ] Build `/welcome` page
- [ ] Build `/goodbye` page
- [ ] Build `/api/v1/user/feedback/uninstall` API route
- [ ] Record and embed demo video
- [ ] Add real testimonials (photos + names)
- [ ] Create `/pricing` standalone page
- [ ] Add Open Graph image
- [ ] Add full favicon set
- [ ] Add cookie consent banner
- [ ] Verify GDPR data deletion works

### Chrome Web Store
- [ ] Create all 5 screenshots (1280×800)
- [ ] Create promo tiles (440×280, 920×680)
- [ ] Write store copy (name, short desc, long desc)
- [ ] Document sensitive permission justifications
- [ ] Submit for review

### Infrastructure
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (PostHog or similar)
- [ ] Verify all email sequences send correctly
- [ ] Set up uptime monitoring for website + API
- [ ] Test payment flow end-to-end (Dodo webhook → subscription active → dashboard shows Pro)
