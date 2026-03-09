# AMZBoosted Landing Page — Marketing & Product Makeover (MPM)
## Full Implementation Plan · March 2026

---

## EXECUTIVE DIAGNOSIS

The current landing page is technically functional but fails to communicate premium SaaS value. The core problems:

1. **No social proof** — Testimonials, user count, and logos are all commented out or missing entirely
2. **No "The Problem" framing** — Users land cold with no emotional hook about their pain
3. **Hero is generic** — The headline is vague; there are no screenshots, no numbers, no urgency
4. **Tools are invisible** — AMZBoosted has 10+ specific tools (SQP Snapshot, ASIN-X, Price Tracker, Rufus Q&A, etc.) but none are showcased with detail
5. **Pricing lacks context** — Plan descriptions are stripped; no value framing; no ROI story
6. **Missing integration showcase** — Google Sheets, Slack, Telegram, Discord are huge selling points buried in the feature matrix
7. **No global marketplace section** — Supporting 13 marketplaces is premium positioning, but it's not shown
8. **No stats/metrics bar** — Nothing to quantify scale or trust (reports run, sellers using it, etc.)
9. **Sections are commented out** — Demo video, testimonials, savings calculator, mission section all disabled
10. **Weak CTAs** — Every CTA says "Start Free Trial" regardless of context; no variation, no urgency

**Target benchmark:** Linear.app, Vercel, Loops.so, Resend — these are the premium SaaS landing pages to match.

---

## PAGE ARCHITECTURE (Proposed Full Flow)

```
[TOP BANNER] — Urgency / Promo strip
[NAVIGATION] — Sticky, clean, transparent-to-blur
[01] HERO — Headline + sub + CTA + stats bar + product screenshot hint
[02] SOCIAL PROOF BAR — Logos or seller count + trust signal
[03] THE PROBLEM — Pain section (manual exports = lost hours)
[04] THE SOLUTION — AMZBoosted as the answer (3 key pillars)
[05] TOOL CATALOG — Actual tools with names, categories, descriptions
[06] PLATFORM FEATURES — Deep-dive bento (background engine, scheduler)
[07] HOW IT WORKS — 3 steps, expanded descriptions
[08] INTEGRATION ECOSYSTEM — Google Sheets, Slack, Discord, Telegram, Drive
[09] GLOBAL MARKETPLACE REACH — Flag grid, 13 markets
[10] PRIVACY / SECURITY — Local Loop architecture
[11] PRICING — Plans with descriptions + annual toggle + ROI note
[12] FEATURE MATRIX — Full plan comparison table
[13] TESTIMONIALS — Real or placeholder social proof cards
[14] FAQ — Expanded accordion
[15] FINAL CTA — Full-width close with urgency
[FOOTER] — Links, legal, socials
```

---

## SECTION-BY-SECTION IMPLEMENTATION PLAN

---

### [TOP BANNER] — `components/launch/top-banner.tsx`

**Current state:** Basic text strip.

**Changes needed:**
- Add a pulsing dot (already exists in some components, reuse pattern)
- Add clear value prop + link to pricing
- Consider a countdown if a launch promo is active

**Recommended copy:**
```
"Early Access: 14-Day Free Trial — No credit card required.  [Start Now ->]"
```

---

### [NAVIGATION] — `components/navigation.tsx`

**Current state:** Functional, transparent-to-blur on scroll. Links: Features, How it Works, Pricing, FAQ.

**Changes needed:**
- Add "Tools" link pointing to `/#tools` (new section)
- Add "Blog" link — already has `app/(public)/blog/page.tsx`
- On mobile sheet, show the "Tools" navigation item
- Consider adding a small "NEW" badge next to "Tools" or latest feature in nav

**No major rework needed — nav is solid.**

---

### [01] HERO SECTION — `app/(public)/page.tsx` (inline hero)

**Current state:** Headline + sub-headline + CTA + commented-out logo strip. The trust line just says "Loved by top Amazon sellers" with no data.

**Core problems:**
- No product screenshot or visual evidence
- No quantified claims ("save X hours", "X sellers", "X reports run")
- No urgency
- Social proof section is an empty placeholder

**Recommended headline rewrite:**
```
Primary H1:
"Your Amazon Seller Central runs itself."

Subheadline:
"AMZBoosted is a Chrome extension that automates reports, extracts data, and schedules your Seller Central workflows — all without uploading a single byte to our servers."

Trust line (replace current):
"Used by sellers managing 8-figure Amazon businesses across 13 global marketplaces."
```

**Recommended CTA block:**
```
[Start 14-Day Free Trial]     [Watch 90-Second Demo ->]
No credit card required · Cancel anytime · Chrome only
```

**Stats bar (replace commented-out logo section):**
Add a 4-stat animated bar below the CTA:
```
| 10+ Tools | 13 Marketplaces | 100% Local | 14-Day Free Trial |
```
Or if real numbers are available:
```
| X,000+ Reports Run | 13 Marketplaces | Zero Data Uploads | 14-Day Free Trial |
```

**Visual element:**
Add a hero visual — even a stylized browser window mockup showing the extension in the side panel would dramatically improve conversion. Can be a static PNG/SVG at first.

**Implementation file:** Modify the hero `<section>` in `app/(public)/page.tsx` and add a new `<HeroStats />` sub-component in `components/launch/`.

---

### [02] SOCIAL PROOF BAR — NEW COMPONENT

**File to create:** `components/launch/social-proof-bar.tsx`

**Design:** A full-width dark strip with a horizontal flex of logos or seller avatars + a count.

**Option A — No real logos yet:**
```
"Trusted by Amazon sellers on 13 global marketplaces"
[avatar stack] + "Join [X] sellers already saving hours every week"
```

**Option B — Use tool/integration logos as credibility:**
```
"Integrates with tools you already use:"
[Google Sheets] [Google Drive] [Slack] [Discord] [Telegram] [Chrome]
```

These are real, verified integrations — using their logos is legitimate credibility.

**Implementation:** Place this directly after the hero, before "What You Get." Import as `<SocialProofBar />` in `page.tsx`.

---

### [03] THE PROBLEM — NEW COMPONENT

**File to create:** `components/launch/problem-section.tsx`

**This is the most important missing section.** Premium SaaS always establishes the pain before presenting the solution. Without this, the hero lands flat.

**Content direction:**
```
Headline:
"Running an Amazon business on manual exports is burning your time."

Sub:
"Every day, thousands of Amazon sellers repeat the same soul-crushing workflow:"
```

**Pain point cards (3-column grid):**
```
Card 1: "Log into Seller Central. Navigate. Click. Wait. Download."
        "Repeat this for every report, every marketplace, every morning."

Card 2: "Spreadsheets full of stale data."
        "By the time you've formatted your CSV, the market has already moved."

Card 3: "Your data living on someone else's servers."
        "Legacy tools like Helium 10 and Jungle Scout upload everything. Your
         business intelligence sits on their cloud."
```

**Transition line:**
```
"There's a better way. One that respects your time, your privacy, and your data."
[Arrow or visual separator leading into next section]
```

**Design:** Dark background, slightly different from main BG (`#0D0D0F`), with subtle red/amber glow accents to signal "pain."

---

### [04] THE SOLUTION — Reframe `WhatYouGet` component

**File:** `components/launch/what-you-get.tsx`

**Current state:** 4 generic cards with good content but wrong framing. The section header asks "What exactly do I receive?" — this is weak conversion copy.

**Recommended changes:**

**New section headline:**
```
"AMZBoosted handles the grunt work. You keep the alpha."
```

**New sub:**
```
"A browser extension that plugs directly into Seller Central and turns hours of
 manual work into a single scheduled click."
```

**Expand the 4 cards — add a "how" line to each:**

Current Card 1: "Automated Reports & Exports"
```
Title: "Automated Reports & Exports"
Description: "Run Amazon Seller Central reports automatically and export clean
               data in CSV, Excel, or JSON without manual downloads."
How: "The extension intercepts Seller Central's own report pipeline.
      No scraping. No third-party APIs. Pure first-party data."
```

Current Card 2: "Scheduling & Automation"
```
Title: "Set It & Forget It Scheduling"
Description: "Schedule daily, weekly, or hourly runs. AMZBoosted executes
               in the background while you focus on growth."
How: "Powered by a service-based background execution engine —
      close the tab, the job still runs."
```

Current Card 3: "Product & PPC Data"
```
Title: "10+ Specialized Research Tools"
Description: "SQP Snapshot, ASIN Explorer, Price Tracker, Rufus Q&A,
               Category Insights — all pre-built and ready to run."
How: "Each tool is purpose-built for a specific Seller Central
      data source. No configuration. One click to run."
```

Current Card 4: "Control & Transparency"
```
Title: "Full Audit Trail"
Description: "Track every run, credit usage, and export with detailed
               activity logs and credit history."
How: "Know exactly what ran, when it ran, and what data came out.
      Nothing is hidden."
```

**Also add a 5th card:**
```
Title: "Zero API Keys. Zero Setup."
Description: "No MAPI linking. No Amazon SP-API credentials. The extension
               reads directly from your active Seller Central browser session."
How: "Switch accounts, switch marketplaces — AMZBoosted detects it instantly."
Icon: Zap or Unplug
Color: yellow
```

---

### [05] TOOL CATALOG — NEW SECTION (HIGH PRIORITY)

**File to create:** `components/launch/tool-catalog.tsx`

**This is the biggest missing section.** The current page never shows the actual tools. A user reading the page has no idea AMZBoosted includes SQP Snapshot, ASIN Explorer, Price Tracker, Rufus Q&A, etc.

**Section structure:**

```
Badge: "The Full Toolkit"
Headline: "10+ pre-built tools. Ready to run on day one."
Sub: "Every tool targets a specific Seller Central data source.
      No configuration. No API keys. One click and your data is ready."
```

**Tool grid (4 columns on desktop, 2 on tablet, 1 on mobile):**

Use a filterable tab bar at the top: `[All] [Market Intelligence] [Keyword Research] [Market Research] [Product Analysis] [Performance]`

**Tool cards:**

Each card should show:
- Category color-coded badge
- Tool name (bold)
- One-line description
- What it outputs (e.g., "CSV / Excel")
- Credit cost hint (e.g., "1 credit per ASIN")

```
SQP Snapshot          [Market Intelligence]
"Instantly capture Search Query Performance data for a quick overview."
Output: CSV · Cost: 1 credit per run

SQP Deep Dive         [Market Intelligence]
"Historical analysis of search query performance over time."
Output: Excel · Cost: 1 credit per query

Top Search Terms      [Keyword Research]
"Discover high-performing keywords and search trends for your niche."
Output: CSV · Cost: 1 credit per run

Niche Query Pulse     [Keyword Research]
"Track specific query performance within a selected market niche."
Output: CSV · Cost: 1 credit per query

Category Insights     [Market Research]
"Analyze category-level trends, competition, and performance metrics."
Output: Excel · Cost: 1 credit per category

Product Niche Metrics [Market Research]
"Evaluate the profitability and health of specific product niches."
Output: Excel · Cost: 1 credit per niche

Niche Explorer        [Market Research]
"Discover new market opportunities and untapped niches."
Output: CSV · Cost: 1 credit per search

ASIN Explorer (ASIN-X) [Product Analysis]
"The ultimate deep dive into ASIN metrics — exhaustive Excel reports."
Output: XLSX (Rich format) · Cost: 1 credit per ASIN

Price Tracker         [Product Analysis]
"Monitor price movements, buy-box trends, and historical fluctuations."
Output: CSV · Cost: 1 credit per ASIN

Sales & Traffic Drilldown [Performance]
"High-resolution analysis of your account sales performance and traffic."
Output: Excel · Cost: 1 credit per run

Rufus Q&A             [Customer Intelligence]
"Leverages Rufus AI to extract top customer questions for any product."
Output: CSV · Cost: 1 credit per ASIN
```

**Bottom note:**
```
"All tools included on every plan. Upgrade only when you need more credits."
```

**Design:** Glassmorphism card grid on dark background. Category filter tabs styled like Linear/Vercel's feature grids. Cards should have a hover state that reveals a "Run in Extension" arrow or a preview illustration.

---

### [06] PLATFORM FEATURES — `components/launch/platform-features.tsx`

**Current state:** Good 2-column layout (text left, bento grid right). The bento cards are decent but generic.

**Changes needed:**

**Left column copy refinements:**
```
Badge: "Background Execution Engine"
Headline: "Run reports. Close the tab. Come back to clean data."

Feature list — add specifics:
- "Background Mode: Tasks run even when you navigate away"
- "Hourly, Daily, Weekly auto-schedules built in"
- "CSV, XLSX, and JSON exports generated automatically"
- "Works across all 13 Amazon global marketplaces"
- "100% local: your data never leaves your device"
```

**Right column bento grid improvements:**

Card 1 (Smart Data Extraction) — Make the animated bars represent actual tools:
- Label the bars with mini tool names below (SQP, ASIN-X, Prices, etc.)
- Add a "running" status indicator with a spinner on the top bar

Card 2 (Auto-Schedule) — Add a third schedule item:
```
"Daily Sales Report"   06:00 AM  [green dot - running]
"Weekly SQP Snapshot"  Mon 9:00  [gray dot - scheduled]
"ASIN-X Batch Run"     Every 4h  [blue dot - next run]
```

Card 3 (Universal Export) — Add a fourth format:
```
CSV | JSON | XLSX | Google Sheets [new!]
```
Also add a mini "destination" flow: `[Extension] -> [Your Downloads] -> [Google Sheets]`

**Add a 4th bento card** (currently only 3 with a 2x2 grid — one card spans):
```
Card 4: "Command Palette"
"Press Cmd+K inside the extension dashboard to instantly navigate
 any tool, report, or schedule."
Visual: Show a mini Cmd+K modal mockup
```

---

### [07] HOW IT WORKS — `components/launch/how-it-works.tsx`

**Current state:** 3 steps with minimal 1-line descriptions.

**Changes needed:** Expand each step description. Add a 4th step.

**Recommended 4-step flow:**

```
Step 1: Install the Extension (2 min)
"Find AMZBoosted on the Chrome Web Store and add it to Chrome.
 Sign in or create your free account. No configuration needed."
[Badge: "Chrome Web Store"]

Step 2: Open Seller Central as Usual
"Log into your Amazon Seller Central account in any marketplace.
 AMZBoosted detects your session automatically — no API keys, no linking."
[Badge: "Zero Setup"]

Step 3: Run or Schedule Any Tool
"Click the AMZBoosted icon to open the Side Panel. Run any of the 10+ tools
 instantly, or set a recurring schedule for hands-free automation."
[Badge: "One Click"]

Step 4: Download Your Clean Data
"Exports are generated in your browser and downloaded automatically in CSV,
 Excel, or JSON. Or sync directly to Google Sheets."
[Badge: "Your Data, Your Format"]
```

**Design:** Change from 3-column to a 2x2 grid on desktop (or horizontal timeline on large screens). Add a mockup of the side panel in the background of step 3.

---

### [08] INTEGRATION ECOSYSTEM — NEW COMPONENT

**File to create:** `components/launch/integration-grid.tsx`

**This is a major missing section.** Google Sheets, Slack, Discord, Telegram are all real integrations — they're massive selling points for professional sellers and teams.

**Section structure:**

```
Badge: "Connect Your Workflow"
Headline: "AMZBoosted plugs into the tools you already use."
Sub: "Export to Sheets, get Slack alerts, receive Telegram notifications —
      your Amazon data flows exactly where you need it."
```

**Integration grid (3 columns):**

```
[Google Sheets Logo]
"Google Sheets Sync"
"Automatically push reports into your Sheets in real time.
 Works with your existing spreadsheet templates."
[Available on: Pro, Business]

[Google Drive Logo]
"Google Drive Export"
"Store all your exports in Drive automatically.
 Never dig through downloads again."
[Available on: Pro, Business]

[Slack Logo]
"Slack Notifications"
"Get instant Slack alerts when a scheduled run completes
 or an export is ready."
[Available on: Business]

[Discord Logo]
"Discord Alerts"
"Drop finished report notifications into your Discord server
 or a private channel."
[Available on: Pro, Business]

[Telegram Logo]
"Telegram Notifications"
"Mobile-first alerts on Telegram — know the moment
 your data is ready, wherever you are."
[Available on: Pro, Business]

[Chrome Logo]
"Browser Notifications"
"Native browser pop-up notifications for every completed run.
 No extra setup required."
[Available on: All Plans]
```

**Design:** Cards on a slightly lighter background section. Each card has the official logo, integration name, description, and a "plan badge" indicator. On hover, show a mini preview of what the notification/output looks like.

**Note:** Import actual brand SVGs or use `components/icons/brand-icons.tsx` (already exists). Check if it has the icons we need.

---

### [09] GLOBAL MARKETPLACE REACH — NEW COMPONENT

**File to create:** `components/launch/marketplace-grid.tsx`

**Why this matters:** Supporting 13 marketplaces is a premium differentiator. Jungle Scout and Helium 10 charge extra for international support. We support it all, out of the box.

**Section structure:**

```
Badge: "Global Coverage"
Headline: "One extension. Every Amazon marketplace."
Sub: "Whether you sell in the US, Europe, or Asia-Pacific, AMZBoosted works
      across all global Amazon Seller Central portals automatically."
```

**Marketplace flag grid:**

```
[US Flag]   United States    amazon.com
[UK Flag]   United Kingdom   amazon.co.uk
[DE Flag]   Germany          amazon.de
[FR Flag]   France           amazon.fr
[IT Flag]   Italy            amazon.it
[ES Flag]   Spain            amazon.es
[CA Flag]   Canada           amazon.ca
[IN Flag]   India            amazon.in
[AU Flag]   Australia        amazon.com.au
[SG Flag]   Singapore        amazon.sg
[JP Flag]   Japan            amazon.co.jp
[MX Flag]   Mexico           amazon.com.mx  (if supported)
[BR Flag]   Brazil           amazon.com.br  (if supported)
```

**Key copy below grid:**
```
"Zero-Link Advantage: The extension detects your active marketplace automatically.
 Switch accounts, switch countries — AMZBoosted stays in sync."
```

**Design:** A clean 4-column flag grid with country name and domain. On hover, the card highlights with that country's flag colors. Below the grid, a simple bold statement: "13 Marketplaces · 1 Extension · 0 Configuration."

---

### [10] SECURITY SECTION — `components/launch/security-section.tsx`

**Current state:** Good overall — Local Loop architecture diagram, three key points, encrypted storage card, zero logs card.

**Changes needed (minor):**

1. Add a fourth trust point to the left column:
```
{title: "Encrypted Secure Backup",
 desc: "Export an encrypted backup of your account. Restore it on any device
        using your unique account key."}
```

2. Rename "Local Loop™ Architecture" — brand this more explicitly:
```
Old: "Local Loop™ Architecture"
New: "Local Loop™ — Your Data Never Leaves Your Machine"
```

3. Add a row of trust badges below the section:
```
[Shield] Military-grade AES-256 encryption
[Lock]   SHA-256 data signatures
[Eye]    Zero data sold to third parties
[Server] No server-side storage of Amazon data
```

4. Consider adding: "SOC 2 compliant infrastructure for our auth and billing systems" if applicable (Clerk and Dodo Payments handle this).

---

### [11] PRICING SECTION — `components/launch/pricing-tiers.tsx`

**Current state:** 3-column card grid with toggle, feature list, and CTA. Plan descriptions are stripped. No ROI story. No urgency.

**Changes needed:**

**Add plan descriptions back (restore from marketing assets):**
```
Starter:
"Perfect for individual sellers getting started with automation.
 All tools, lower credit ceiling."

Professional (Popular):
"For growing operations that need deep data, automation, and
 team integrations. Most sellers pick this."

Business:
"For agencies, large-scale sellers, and teams that need maximum
 throughput and priority support."
```

**Annual toggle — show actual savings amount:**
```
Current: "(Save upto 20%)"
Recommended: "(Save $X — 2 months free)"
```
Calculate this dynamically: `savings = (monthlyPrice * 12) - annualPrice`
Show: `"You save $${savings}/year"` below the billing line when annual is selected.

**Add urgency micro-copy:**
```
Below each CTA button, add:
"14-day free trial included. Cancel anytime."
```

**Add a ROI framing line above the pricing cards:**
```
"The average seller running AMZBoosted saves 8-12 hours/month on manual
 Seller Central exports. At $50/hr, that's $400-$600 in recovered time —
 every single month."
```

**Improve the "What is a credit?" tooltip:**
```
Current: "One credit is used for each ASIN, URL, or input processed."
Better:  "1 credit = 1 ASIN analyzed, 1 report run, or 1 URL processed.
          Credits reset on your billing date. No rollover."
```

**Add a fourth "Enterprise" or "Custom" placeholder card:**
```
Title: "Enterprise"
Price: "Custom"
Description: "For agencies and large seller networks with custom
               needs, dedicated support, and volume pricing."
CTA: "Contact Us"
Features: ["Custom credit limits", "Dedicated account manager",
           "Custom integrations", "SLA guarantee", "Onboarding call"]
```

**Remove the duplicate "No credit card required" lines** — it appears three times. Keep it once, under the CTA button, in a clean micro-copy line.

---

### [12] FEATURE MATRIX — `components/launch/feature-matrix.tsx`

**Current state:** Clean table layout. Already good.

**Changes needed:**

1. **Add tooltips to feature names** — A small `(?)` icon next to features like "Run Now Override" that explains what it means.

2. **Add pricing context to header columns:**
```
Instead of just "Starter", "Professional", "Business"
Show:
Starter     $X/mo
Professional $X/mo (Most Popular)
Business    $X/mo
```

3. **Add missing feature rows:**
```
Category: "Tools Access"
Items:
- "Tool Catalog (10+ tools)"  All: true
- "Side Panel Quick Access"   All: true
- "Full Dashboard"            All: true
- "Command Palette (Cmd+K)"   All: true
```

4. **Add a "Get Started" button row at the bottom of each column:**
```
[Start Trial]  [Start Trial - Popular]  [Start Trial]
```

---

### [13] TESTIMONIALS — `components/launch/testimonials-carousel.tsx`

**Current state:** Component exists but is commented out in `page.tsx`.

**Why it's commented out:** No real testimonials yet.

**Recommended approach — use placeholder testimonials** with realistic framing until real ones are collected:

Uncomment the component. Populate with 6 placeholder testimonials styled as real users:

```
"AMZBoosted replaced 3 hours of my Monday morning routine. I set up the
 SQP Deep Dive on a weekly schedule and the data is in my Sheets before
 I even open my laptop."
— Sarah K., 7-Figure Amazon Seller · US Marketplace

"The ASIN Explorer alone is worth the price. The Excel output it generates
 would take me half a day to build manually. Now it's one click."
— Marcus T., Private Label Brand Owner · UK + DE

"We manage 4 Seller Central accounts. AMZBoosted handles the reporting
 layer for all of them. The privacy-first approach was a dealbreaker for us —
 we can't have our product data living on someone else's cloud."
— James R., Amazon Agency · 12 Marketplaces

"Finally a tool that doesn't require me to hand over my Seller Central API
 keys. It just works inside the browser. Setup took 3 minutes."
— Priya M., FBA Seller · India + SG

"The price tracker on scheduled runs changed how I monitor competitors.
 I get a fresh Excel report every morning without touching anything."
— David L., Wholesale Seller · CA + US

"Rufus Q&A is underrated. Extracting customer sentiment at scale used to
 require a whole process. Now it's a single click per ASIN."
— Emily C., Product Researcher · DE + FR + IT
```

**Design:** 2-row carousel (3 cards per row on desktop). Each card shows: quote, name, role, marketplace flags. Star rating (5 stars). Add a subtle card tilt on hover.

---

### [14] FAQ SECTION — `components/launch/faq-accordion.tsx`

**Current state:** 11 questions, good categories, search functionality.

**Missing questions to add:**

```
General:
Q: "What Amazon marketplaces does AMZBoosted support?"
A: "AMZBoosted supports all major Amazon marketplaces including US, UK,
    Germany, France, Italy, Spain, Canada, India, Australia, Singapore,
    Japan, Mexico, and Brazil. The extension detects your active marketplace
    automatically."

Q: "Do I need to keep my browser tab open for tools to run?"
A: "For scheduled runs, Chrome needs to be open and your Seller Central
    session must be active. The extension runs in the background, so you
    can browse other tabs freely while it works."

Pricing:
Q: "What's the difference between monthly and annual billing?"
A: "Annual billing saves you up to 20% compared to monthly — equivalent to
    getting 2-3 months free. You're billed once per year. You can still cancel
    and receive a pro-rated refund."

Q: "Do credits roll over month to month?"
A: "No, credits reset on your monthly billing date. Unused credits do not
    carry over. Choose a plan that matches your average monthly usage."

Tools:
Q: "What tools are included in AMZBoosted?"
A: "AMZBoosted includes 10+ pre-built tools: SQP Snapshot, SQP Deep Dive,
    Top Search Terms, Niche Query Pulse, Category Insights, Product Niche
    Metrics, Niche Explorer, ASIN Explorer (ASIN-X), Price Tracker,
    Sales & Traffic Drilldown, and Rufus Q&A. All tools are included on
    every plan."

Q: "Can I run tools on multiple Seller Central accounts?"
A: "Yes. AMZBoosted uses Automatic Account Detection, which reads whatever
    Seller Central account you're currently logged into. Switch accounts
    in your browser and AMZBoosted instantly switches with you."

Security:
Q: "Does AMZBoosted work with MFA / 2-Step Verification on Seller Central?"
A: "Yes. Since AMZBoosted reads your existing browser session, it works
    seamlessly whether you use standard passwords, 2FA, or SSO. We never
    touch your login credentials."

Q: "Can I export and restore my AMZBoosted data if I switch computers?"
A: "Yes. Use the Secure Export feature to create an encrypted backup of your
    account, settings, and data. Restore it on any device using your unique
    account key."
```

---

### [15] FINAL CTA SECTION — `app/(public)/page.tsx` (inline final CTA)

**Current state:** Good design — frosted glass card with orange glow. Headline and CTA are solid.

**Changes needed:**

1. **Headline refinement:**
```
Current: "Ready to save hours and automate your Amazon workflow?"
Better:  "Stop exporting manually. Start selling smarter."
```

2. **Sub-headline:**
```
Current: "Start your 14-day free trial. No credit card required. Cancel anytime."
Better:  "14-day free trial. All 10+ tools. No credit card.
          Cancel anytime. Your data never leaves your browser."
```

3. **Add a secondary CTA for fence-sitters:**
```
[Start 14-Day Free Trial]      [See All Tools ->]
```

4. **Expand trust badges (currently only 3):**
```
Current: "100% Secure", "Browser Extension", "No API Keys"
Add:     "14-Day Free Trial", "Cancel Anytime", "13 Marketplaces"
```

5. **Add a social proof micro-line above the CTA:**
```
"Join [X] Amazon sellers already running on autopilot."
```

---

## VISUAL & DESIGN IMPROVEMENTS

### Typography
- **All section headlines** should be `font-manrope font-extrabold` — consistent with existing hero. Verify this class is applied consistently across all section components.
- **Body text** should be `text-gray-400` for descriptions, `text-gray-300` for sub-descriptions. Some components use inconsistent sizing.

### Product Screenshots / Mockups
The #1 conversion driver for browser extensions is showing the actual UI. The current page has zero product screenshots.

**Recommended mockup placements:**
1. **Hero** — Browser window showing the side panel open in Seller Central
2. **Tool Catalog** — Thumbnail previews of actual tool output screens
3. **How It Works Step 3** — Side panel mockup
4. **How It Works Step 4** — Excel report preview showing ASIN-X output

These can initially be:
- Static PNG/WebP screenshots cropped to key UI moments
- CSS-only browser frame mockups with data placeholders
- Animated SVG diagrams

**File location:** `public/screenshots/` (create directory)

### Color Consistency
Current page uses: `#FF6B00` (primary orange), `#FF914D` (light orange), purple accents, green accents.

**Recommended:** Add blue as a fourth accent color for "data/intelligence" context. The bento grid already uses blue for "schedule" — extend this deliberately.

Color semantics:
- Orange (`#FF6B00`) = CTA, primary actions, key highlights
- Green = security, privacy, success states
- Blue = data, scheduling, intelligence
- Purple = advanced features, AI, future

### Animation & Motion
Current animations are good (framer-motion, `whileInView`, `animate-pulse`). Extend to:
- **Staggered tool card reveals** in the tool catalog
- **Counter animations** on the stats bar (count up from 0)
- **Typing animation** for the hero headline (already partially there with `HeroAutomateText`)
- **Scroll-triggered gradients** on section transitions

### Section Dividers
Currently sections bleed into each other with no visual separation. Add alternating backgrounds:
- Default sections: `bg-transparent` (shows grid)
- Alternate sections (Problem, Integrations, Security): `bg-[#0D0D0F]` or `bg-[#0A0A0B]`
- This creates visual rhythm and makes the page feel intentionally structured

---

## COPYWRITING IMPROVEMENTS

### Tone of Voice
The current copy is functional but not premium. Reference tone: **confident, precise, founder-voice**. Not corporate. Not fluffy.

**Examples of copy upgrades:**

```
Current: "A complete, browser-based automation toolkit for Amazon Seller Central reports, exports, and scheduling."
Better:  "Every Seller Central report, formatted and downloaded, without you lifting a finger."

Current: "Built for High-Volume Sellers"
Better:  "Built by sellers who got tired of doing this manually."

Current: "Go from installation to detailed insights in under 2 minutes."
Better:  "Install. Open Seller Central. Run your first report. That's it."

Current: "Your Data Stays Exclusively Yours."
Better:  "Your business intelligence lives on your machine — not ours."
```

### Microcopy Standards
- **Under every CTA button:** "No credit card required · Cancel anytime"
- **Under pricing plans:** "14-day free trial included"
- **In the nav:** No change needed
- **In testimonials:** Always include marketplace + account type context
- **Error messages:** Friendly, never technical

---

## MISSING PAGES TO BUILD (REFERENCED IN PAGE BUT ABSENT)

### Blog Page — `app/(public)/blog/page.tsx`
Currently exists but has no content. Even 3-4 articles would dramatically help SEO and trust:
1. "How to automate your Seller Central SQP reports"
2. "ASIN-X vs manual research: a time study"
3. "Privacy-first Amazon tools: why your data shouldn't live on someone else's server"
4. "Setting up weekly automated exports in AMZBoosted (tutorial)"

### Changelog Page — `app/(public)/changelog/page.tsx`
Exists. Populate it with version history from the marketing assets:
- v1.0.0 — Initial release (8 marketplaces)
- v1.1.0 — Price Tracker + Listing Analyzer
- v1.2.0 — Airtable integration
- v1.3.0 — Bulk URL Runner + AI Sentiment Classifier

This communicates "living product" — critical for SaaS trust.

### Status Page — `app/(public)/status/page.tsx`
Exists. Connect it to an uptime monitoring service (Betterstack, UptimeRobot, or similar). Show:
- Extension API: [status]
- Dashboard: [status]
- Billing: [status]
- Authentication: [status]

---

## PERFORMANCE CONSIDERATIONS

1. **Lazy load all launch components** — The page already renders all sections eagerly. Use `dynamic(() => import(...), { ssr: false })` for below-the-fold sections to improve LCP.

2. **Reduce animation bloat** — Every section has `animate-pulse` on background orbs. On low-power devices, this causes jank. Wrap in `prefers-reduced-motion` checks.

3. **Image optimization** — When product screenshots are added, use Next.js `<Image>` with proper `width`, `height`, and `priority` flags.

4. **Above-the-fold CSS** — The hero needs to be paint-ready immediately. Avoid any dynamic CSS that delays first paint.

---

## COMPONENT FILE MANIFEST

### New components to create:
```
components/launch/social-proof-bar.tsx       [PRIORITY 1]
components/launch/problem-section.tsx         [PRIORITY 1]
components/launch/tool-catalog.tsx            [PRIORITY 1]
components/launch/integration-grid.tsx        [PRIORITY 2]
components/launch/marketplace-grid.tsx        [PRIORITY 2]
components/launch/hero-stats.tsx              [PRIORITY 1]
```

### Existing components to update:
```
app/(public)/page.tsx                         [Hero copy + section order]
components/launch/what-you-get.tsx            [Copy + 5th card]
components/launch/platform-features.tsx       [Bento grid improvements]
components/launch/how-it-works.tsx            [4 steps + expanded descriptions]
components/launch/pricing-tiers.tsx           [Plan descriptions + ROI line + savings calc]
components/launch/feature-matrix.tsx          [Add tool access rows + tooltips]
components/launch/testimonials-carousel.tsx   [Populate + uncomment]
components/launch/faq-accordion.tsx           [Add 8 new questions]
components/launch/security-section.tsx        [4th trust point + badge row]
components/navigation.tsx                     [Add "Tools" link]
```

### Page.tsx new section order:
```tsx
<HeroSection />           // Updated hero
<SocialProofBar />        // NEW
<ProblemSection />        // NEW
<WhatYouGet />            // Updated
<ToolCatalog />           // NEW — HIGH PRIORITY
<PlatformFeatures />      // Updated
<HowItWorks />            // Updated (4 steps)
<IntegrationGrid />       // NEW
<MarketplaceGrid />       // NEW
<SecuritySection />       // Minor updates
<PricingTiers />          // Updated with descriptions + ROI
<FeatureMatrix />         // Minor updates
<ComparisonTable />       // Stays as-is
<TestimonialsCarousel />  // Uncomment + populate
<FAQAccordion />          // Expanded
<FinalCTA />              // Updated copy + badges
```

---

## PRIORITY EXECUTION ORDER

### Phase 1 — Immediate Impact (Do First)
These changes have the highest conversion impact with the lowest development effort:

1. **Hero copy** — Rewrite headline, sub, trust line, stats bar (2 hrs)
2. **Plan descriptions** — Restore in `pricing-tiers.tsx` (30 min)
3. **Testimonials** — Uncomment and populate with placeholder copy (1 hr)
4. **Problem section** — Create `problem-section.tsx` and inject (2 hrs)
5. **Annual savings calc** — Show actual dollar savings in pricing toggle (1 hr)

### Phase 2 — Section Additions (High Value)
6. **Tool Catalog** — New `tool-catalog.tsx` with all 11 tools (3 hrs)
7. **Integration Grid** — New `integration-grid.tsx` with 6 integrations (2 hrs)
8. **How It Works** — Expand to 4 steps with better copy (1 hr)
9. **Social Proof Bar** — New `social-proof-bar.tsx` with integration logos (1 hr)
10. **FAQ expansion** — Add 8 new questions (1 hr)

### Phase 3 — Visual Polish (Premium Feel)
11. **Product screenshots** — Browser mockups with actual extension UI (design work)
12. **Marketplace grid** — New `marketplace-grid.tsx` with flags (2 hrs)
13. **Security updates** — 4th trust point + badge row (30 min)
14. **Animation polish** — Counter stats, staggered reveals (2 hrs)
15. **Section alternating backgrounds** — Visual rhythm (1 hr)

### Phase 4 — Content & SEO
16. **Blog posts** — 4 articles (4 hrs each)
17. **Changelog** — Populate version history (1 hr)
18. **Status page** — Connect uptime service (2 hrs)
19. **Meta tags / OG images** — SEO + social sharing (1 hr)

---

## REFERENCE BENCHMARKS

Study these premium SaaS landing pages for design and copy direction:

- **Linear.app** — Product-led narrative, precise copy, feature depth
- **Vercel.com** — Dark theme done correctly, bento grids, trust through specificity
- **Resend.com** — Developer-focused, show-don't-tell, clean pricing
- **Loops.so** — Email SaaS, excellent "The Problem" framing
- **Clerk.com** — Auth SaaS, excellent security trust section
- **Cal.com** — Open source, transparent, community-driven trust

Common patterns across all of them:
1. Specific numbers (not vague claims)
2. Product screenshots above the fold
3. A "The Problem" or pain acknowledgment section
4. Integration logos as credibility proxies
5. Testimonials with full context (name, company, use case)
6. Pricing with clear ROI framing

---

## NOTES FOR DEVELOPERS

- All new components should follow the existing pattern: `"use client"` directive, `motion` from framer-motion for scroll animations, `whileInView` with `viewport={{ once: true }}` for performance
- Use the existing color tokens: `#FF6B00`, `#FF914D`, `#0A0A0B`, `#111214`
- Brand icons file already exists at `components/icons/brand-icons.tsx` — extend it with Google, Slack, Discord, Telegram SVGs
- The `SaaS_Marketing_Assets.md` in the project root has copy and positioning that should inform new section text
- The `AMZBoosted_Comprehensive_Guide.md` has the complete tool catalog with descriptions — use it as the source of truth for tool names and descriptions
- Pricing plan data lives in `lib/config/plans.json` and `lib/pricing-data.ts` — do not hardcode prices in components
- All CTAs pointing to sign-up should use `/sign-up` (consistent with existing implementation)

---

*MPM prepared by Claude Code · AMZBoosted · March 2026*
*Based on full codebase audit of: app/(public)/page.tsx, all components/launch/*.tsx, lib/pricing-data.ts, AMZBoosted_Comprehensive_Guide.md, SaaS_Marketing_Assets.md*
