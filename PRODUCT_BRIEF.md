# AMZBoosted — Product Brief
### Who We Are · What We Do · What We Offer · What's Next

---

## Who We Are

AMZBoosted is a **privacy-first Chrome extension** built for Amazon sellers who are done doing things manually.

We are not another Helium 10 clone. We are not a dashboard that stores your data on our servers, charges you per seat, and makes you hand over your Seller Central API keys. We are the opposite of that.

We built AMZBoosted because we were sellers ourselves — and we got tired of spending Monday mornings clicking through Seller Central, waiting for reports to load, downloading CSVs, reformatting spreadsheets, and repeating the exact same process for every marketplace, every account, every week.

**We automated it. Then we packaged that automation as a product.**

AMZBoosted is trusted by sellers managing 8-figure Amazon businesses across 13 global marketplaces. It runs inside your browser, reads your active Seller Central session, and does the work — without ever touching our servers.

---

## What We Do

**We turn hours of manual Seller Central work into a single scheduled click.**

Specifically:

- We **extract data** directly from Amazon Seller Central using your active browser session — no API keys, no MAPI linking, no OAuth flows
- We **run reports** across 10+ purpose-built tools covering market intelligence, keyword research, product analysis, performance tracking, and customer intelligence
- We **schedule automation** so your most critical data is always ready before you even open your laptop
- We **export clean data** in CSV, Excel, and JSON — or sync it directly to Google Sheets
- We **keep everything local** — your business intelligence lives on your machine, not ours

The extension works inside the Seller Central interface itself. When you log in, AMZBoosted detects your account and marketplace automatically. Switch accounts — it follows. Switch countries — it follows. No configuration. No setup. It just works.

---

## What We Offer

### The Extension
A Chrome extension with two interfaces:
- **Side Panel** — Quick-access overlay that runs tools without leaving your current Amazon page
- **Full Dashboard** — Command center for managing schedules, exports, credit usage, and activity logs

### 11 Pre-Built Tools

| Tool | Category | Output |
|------|----------|--------|
| SQP Snapshot | Market Intelligence | CSV |
| SQP Deep Dive | Market Intelligence | Excel |
| Top Search Terms | Keyword Research | CSV |
| Niche Query Pulse | Keyword Research | CSV |
| Category Insights | Market Research | Excel |
| Product Niche Metrics | Market Research | Excel |
| Niche Explorer (Niche-X) | Market Research | CSV |
| ASIN Explorer (ASIN-X) | Product Analysis | XLSX |
| Price Tracker | Product Analysis | CSV |
| Sales & Traffic Drilldown | Performance | Excel |
| Rufus Q&A | Customer Intelligence | CSV |

All tools are available on every plan. Credits are the only limit.

### Scheduling Engine
Set any tool to run Hourly, Daily, Weekly, or on Custom intervals. The extension runs in the background — close the tab, the job still completes.

### Integration Layer
Your data flows wherever you need it:

| Integration | Plans |
|-------------|-------|
| Google Sheets Sync | Pro, Business |
| Google Drive Export | Pro, Business |
| Discord Alerts | Pro, Business |
| Telegram Notifications | Pro, Business |
| Slack Notifications | Business |
| Native Browser Notifications | All Plans |

### Global Marketplace Support
13 Amazon marketplaces supported. Log in once at `sellercentral.amazon.com` and use Amazon's native account switcher to access any marketplace account. AMZBoosted auto-detects your active marketplace — zero configuration required.
**US · UK · DE · FR · IT · ES · CA · IN · AU · SG · JP · MX · BR**

### Privacy-First Architecture
- 100% local data storage — nothing sensitive ever leaves your PC
- Military-grade encryption + SHA-256 data signatures
- Secure encrypted backup and restore across devices
- No Seller Central credentials or API keys ever handled by us
- Zero third-party data sharing

### Plans
| | Starter | Pro | Business |
|--|---------|-----|----------|
| Monthly Credits | 250 | 2,500 | 15,000 |
| Active Schedules | 5 | 50 | Unlimited |
| Schedule Frequency | Daily, Weekly | Hourly, Daily, Weekly | Custom |
| Integrations | None | Sheets, Drive, Discord, Telegram | + Slack |
| Support | Standard | Priority | Dedicated Lead |

**14-day free trial on all plans. No credit card required.**

---

## What's Missing

This is where we're honest with ourselves. AMZBoosted has a strong product core — the tools work, the extension is solid, the privacy story is real. But the product still has gaps that limit growth.

### Product Gaps

**1. No product screenshots on the landing page** ← STILL MISSING
The number one conversion driver for a browser extension is showing the actual UI. Sellers cannot visualize what they're installing without real screenshots. This is the single highest-impact fix available.

**2. Testimonials are placeholders** ← STILL MISSING
The testimonials carousel is populated with placeholder copy. Until real user quotes are collected, this section underperforms. We need a structured testimonial collection process — even 6 real quotes would dramatically improve trust.

**3. Blog has partial content** ← PARTIALLY DONE
3 blog posts exist (`/content/blog/`). The `/blog` page needs more content to meaningfully impact SEO on high-intent queries like "how to automate Seller Central reports."

**4. Changelog is not updated** ← STILL MISSING
`/changelog` exists but has no version history. A living changelog signals "active product" — critical for SaaS trust.

**5. Status page is not connected** ← STILL MISSING
`/status` exists as a page but is not connected to any uptime monitoring service (Betterstack, UptimeRobot).

**6. No product demo video** ← STILL MISSING
The `<DemoVideo />` component exists but has no actual video. A 90-second screen recording would close more trials than any copy rewrite.

**7. No Enterprise / Custom tier** ← STILL MISSING
The pricing tops out at Business. Agencies managing multiple accounts need a "Contact Us for Enterprise" entry point.

**8. Scheduler requires Chrome to stay open** ← KNOWN LIMITATION
Scheduled runs require Chrome with an active Seller Central session. A future cloud-hybrid mode would resolve this.

**9. Mobile experience is zero** ← STILL MISSING
The web dashboard (`/dashboard`) is not fully optimized for mobile.

**10. No team / multi-user support** ← STILL MISSING
Single-user per account. Role-based access control (RBAC) would open the agency market.

---

### Marketing Gaps

**1. Landing page sections** ← ✅ DONE (March 2026)
Problem section, Tool Catalog, Integration Grid, Marketplace Grid, Social Proof Bar, How It Works (4 steps), What You Get (5 cards) — all built and live.

**2. Marketplace copy clarity** ← ✅ DONE (March 2026)
Updated marketplace-grid.tsx and what-you-get.tsx to accurately explain `.com` login + account switcher model.

**3. ROI framing is absent from pricing** ← STILL MISSING
The pricing section shows numbers but no value framing. The average seller running AMZBoosted saves 8–12 hours per month at $50/hour = $400–$600 recovered time monthly. None of this math is on the page.

**4. No content marketing strategy** ← PARTIALLY DONE
3 blog posts exist. No YouTube presence, no community presence on seller forums. The entire acquisition funnel is paid or direct.

---

### Technical Debt

**1. Sections lazy-loaded incorrectly** ← STILL PENDING
Below-the-fold sections should use `dynamic(() => import(...), { ssr: false })` to improve LCP scores.

**2. Animation performance on low-power devices** ← STILL PENDING
Multiple `animate-pulse` orbs running simultaneously. Should be wrapped in `prefers-reduced-motion` checks.

**3. Plans data partially hardcoded** ← STILL PENDING
Some components reference plan names/features directly instead of pulling from `lib/config/plans.json`.

**4. No A/B testing infrastructure in production** ← STILL PENDING
`<ABTestProvider />` exists and wraps the landing page, but no active tests are running.

**5. Email flows not fully tested end-to-end** ← STILL PENDING
Welcome email, trial expiry, payment receipt templates are built but have no automated QA.

**6. Category Insights domain hardcoding** ← ✅ FIXED (March 2026)
`category-insights.service.ts` now uses `getBaseDomain()` for regional domain switching. `marketplaceMap` updated with UK alias and additional regions.

---

## Where We're Headed

AMZBoosted is a product with real differentiation — privacy-first, local-only, no API keys required, 11 specialized tools, 13 marketplaces, and a clean scheduling engine. The core works.

The gap between where we are and where we need to be is primarily:

1. **Showing the product** — screenshots, demo video, real testimonials
2. **Telling the story** — pain framing, ROI context, integration showcase
3. **Building trust** — blog content, changelog, status page, enterprise path
4. **Expanding the product** — mobile dashboard, multi-user, cloud scheduler

The landing page changes (Problem section, Tool Catalog, Integration Grid, Marketplace Grid) are the highest-leverage marketing work available right now. None of them require changes to the extension itself.

The product work (cloud scheduler, RBAC, mobile) requires extension and backend architecture changes and should follow after the marketing foundation is solid.

---

*AMZBoosted · Built by sellers, for sellers · March 2026*
*Last updated: 2026-03-14 — reflects landing page completion, marketplace clarity update, Category Insights domain fix.*
