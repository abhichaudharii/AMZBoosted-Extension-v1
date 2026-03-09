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
13 Amazon marketplaces, auto-detected, zero configuration:
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

**1. No product screenshots on the landing page**
The number one conversion driver for a browser extension is showing the actual UI. The current landing page has zero product screenshots. Sellers cannot visualize what they're installing. This is the single highest-impact fix available.

**2. Testimonials are placeholders**
The testimonials carousel component exists and is built, but it is populated with placeholder copy. Until real user quotes are collected, this section underperforms. We need a structured testimonial collection process — even 6 real quotes from real sellers would dramatically improve trust.

**3. Blog has no content**
`/blog` exists as a page but is empty. Without content, we miss SEO entirely on high-intent queries like "how to automate Seller Central reports" or "Amazon SQP data export tool." Four articles would meaningfully change our organic reach.

**4. Changelog is not updated**
`/changelog` exists but has no version history populated. A living changelog signals "active product" — which is critical for SaaS trust. Sellers don't want to install an abandoned extension.

**5. Status page is not connected**
`/status` exists as a page but is not connected to any uptime monitoring service. When something breaks, sellers have nowhere to check. Betterstack or UptimeRobot could be integrated in an afternoon.

**6. No product demo video**
The `<DemoVideo />` component exists and is imported, but there is no actual video. A 90-second screen recording showing the extension running a real SQP Snapshot and downloading the CSV would close more trials than any copy rewrite.

**7. No Enterprise / Custom tier**
The current pricing tops out at Business. Agencies managing multiple Seller Central accounts across marketplaces have no obvious home. A simple "Contact Us for Enterprise" entry point would capture this segment.

**8. Scheduler requires Chrome to stay open**
Scheduled runs require the Chrome browser to be running with an active Seller Central session. This means sellers who close their laptops at night miss scheduled overnight runs. A future cloud-hybrid mode (where the schedule triggers remotely and the extension runs on session restore) would resolve this.

**9. Mobile experience is zero**
The extension is Chrome-only, desktop-only by design — and that's fine. But the web dashboard (`/dashboard`) is not fully optimized for mobile. Sellers checking their data on phones get a degraded experience.

**10. No team / multi-user support**
The current architecture is single-user per account. Agencies or brands with multiple team members (a VA running exports, an analyst reviewing data) have no way to share access or manage permissions. Role-based access control (RBAC) would open the agency market.

---

### Marketing Gaps

**1. No "The Problem" framing on the landing page**
The current page leads with the solution. Premium SaaS always establishes the pain first. Sellers landing cold need to see their own frustration reflected back at them before they're ready to hear the solution. A dedicated Problem section is missing and critically needed.

**2. No social proof bar**
The hero has no trust signals. Showing that 1,000+ sellers are already using AMZBoosted, alongside integration logos (Google, Slack, Discord), would immediately signal legitimacy to new visitors.

**3. Tool catalog is invisible**
AMZBoosted has 11 specific, named tools. The current landing page never lists them. A visitor reading the page has no idea what tools they're getting. This is the biggest missed positioning opportunity — our competitors charge extra for individual tools; we include all of them on every plan.

**4. Integration story is buried**
Google Sheets Sync, Discord Alerts, Telegram Notifications — these are major selling points for professional sellers and teams. They are mentioned in the feature matrix but never showcased as a first-class section with context, plan availability, and visuals.

**5. Global marketplace reach is not highlighted**
Supporting 13 marketplaces is a premium differentiator. Jungle Scout and Helium 10 charge extra for international support. We support it all, out of the box, zero configuration — and we don't say it loudly enough anywhere on the page.

**6. ROI framing is absent from pricing**
The pricing section shows numbers but no value framing. The average seller running AMZBoosted saves 8–12 hours per month on manual exports. At $50/hour, that's $400–$600 in recovered time monthly. None of this math is on the page.

**7. No content marketing strategy**
We have no blog, no SEO content, no YouTube presence, no community presence on seller forums (Seller Forums, Reddit r/FulfillmentByAmazon, Facebook groups). The entire acquisition funnel is paid or direct. Organic is zero.

---

### Technical Debt

**1. Sections lazy-loaded incorrectly**
The landing page renders all sections eagerly at load time. Below-the-fold sections like the Testimonials Carousel, FAQ, and Tool Catalog should use `dynamic(() => import(...), { ssr: false })` to improve LCP scores and Time to Interactive.

**2. Animation performance on low-power devices**
Multiple sections use `animate-pulse` on background orbs simultaneously. On older hardware or battery-saving mode, this causes visible jank. These should be wrapped in `prefers-reduced-motion` checks.

**3. Plans data partially hardcoded**
Some components reference plan names and features directly instead of pulling from `lib/config/plans.json` and `lib/pricing-data.ts`. If pricing changes, multiple files need updates instead of one.

**4. No A/B testing infrastructure in production**
The `<ABTestProvider />` component exists and wraps the landing page, but no active tests are running. Headline variants, CTA copy variants, and pricing layout tests would generate real conversion data.

**5. Email flows not fully tested end-to-end**
Welcome email, trial expiry, payment receipt — the templates are built, but there is no automated QA for these flows. A broken welcome email on signup kills early activation.

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
*This document reflects the current product state and known gaps as of the latest codebase audit.*
