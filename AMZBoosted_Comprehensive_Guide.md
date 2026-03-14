# AMZBoosted: Premium Amazon Seller Tools Suite

## 🚀 Who We Are & Mission
**AMZBoosted** is a premier SaaS platform built by sellers, for sellers. We believe that professional Amazon selling shouldn't be a game of manual data entry and guesswork. Our mission is to provide an elite, high-performance edge through automation, precision data extraction, and seamless workflow integration.

We focus on delivering **actionable intelligence** directly to your browser, empowering you to make billion-dollar decisions with a few simple clicks.

---

## 🎯 Core Focus
- **Data Precision**: Extracting and processing real-time data directly from Amazon marketplaces with unmatched accuracy.
- **Workflow Automation**: Reducing manual tasks through powerful background execution and scheduled reports.
- **Actionable Insights**: Turning raw metrics into clear market, keyword, and product intelligence.
- **Performance at Scale**: Built for efficiency with a service-based architecture that handles bulk operations effortlessly.

---

## 🛡️ Privacy & Security: Your Data, Your PC
We take a radical approach to data privacy. Unlike traditional SaaS tools that scrape and store your sensitive business data on their servers, **AMZBoosted is 100% Privacy-First.**

- **Local-Only Storage**: All your scraped data, reports, and settings are stored 100% locally on your machine via the extension's secure database. Nothing sensitive ever leaves your PC.
- **Heavy Encryption**: We use military-grade encryption (`lib/services/encryption.service.ts`) and SHA-256 signatures to ensure your data is safe and tamper-proof.
- **Secure Backup & Restore**: Switch computers without losing data. Our **Secure Export** feature creates an encrypted backup of your entire account, which can be restored on any device using your unique account key.
- **Minimal Footprint**: We only track basic extension usage and logs—your Amazon data is yours alone.

---

## 🛰️ The "Zero-Link" Advantage
Stop wrestling with MAPI or complex account linking. AMZBoosted features **Automatic Account Detection**:
- **One Login**: Log in at `sellercentral.amazon.com` — Amazon's global hub. From there, use the native account switcher to access any of your marketplace accounts (US, UK, DE, JP, etc.).
- **Instant Recognition**: The extension automatically picks up whatever Seller Central account or Marketplace is currently active.
- **Switch with Ease**: When you switch marketplace accounts in Seller Central, AMZBoosted stays in sync instantly.
- **Global Support**: Full support for 13 Amazon marketplaces — US, UK, DE, FR, IT, ES, CA, IN, AU, SG, JP, MX, BR.
- **No Regional Logins Required**: You do not need to log into regional Seller Central domains (`.co.uk`, `.de`, etc.) separately. Everything works through `sellercentral.amazon.com` with marketplace selection handled by Amazon's own account switcher.

---

## 🛠️ Features & Capabilities

### 📱 Dual-Interface Experience
- **Quick-Use Side Panel**: A powerful overlay that allows you to run scans without leaving the Amazon search results or product pages. Perfect for quick lookups and on-the-fly analysis.
- **Full Dashboard**: A comprehensive Command Center for managing your business, viewing detailed analytics, tracking activity, and managing exports.
- **Smart Credit Tracking**: Real-time display of usage limits and remaining credits.
- **Command Palette (Cmd+K)**: Instant search and navigation across all tools and reports.
- **Premium Animations**: Smooth count-up statistics and staggered page entry for a fluid feel.
- **Celebratory Interactions**: Confetti rewards for key milestones like upgrades and new connections.

### ⚙️ Background Execution Engine
Never wait for a scan again. Our service-based architecture allows tools to run in the background. Close the tab or browse elsewhere—AMZBoosted handles the data extraction and processing independently.

### 📅 Advanced Scheduler
Automate your business 24/7. Schedule any tool to run at specific intervals (Hourly, Daily, Weekly) and get the latest data delivered exactly when you need it.

### 📊 Multi-Format Exports
Export your data in professional, ready-to-use formats:
- **CSV**: Simple, clean data for quick analysis.
- **XLSX (Excel)**: Rich, pre-formatted spreadsheets (like ASIN-X Explorer) ready for deep analysis.
- **Custom Export Settings**: Full control over exactly which columns and data points are included in your outputs.

### 🔄 Real-Time Sync & Notifications
- **Live Updates**: Local data stays in sync with our production servers for the latest tool definitions and marketplace changes.
- **Smart Notifications**: Integrated Slack and Telegram support (coming soon) ensures you never miss a finished task or critical market update.

### 💳 Subscription & Credit System
Tiered plans tailored to your needs, with a transparent credit-based system for resource-intensive tools.

---

## 🧰 The Full Tool Catalog

### 📈 Market Intelligence
- **SQP Snapshot**: Instantly capture Search Query Performance data for a quick overview.
- **SQP Deep Dive**: Perform a comprehensive, historical analysis of search query performance over time.

### 🔍 Keyword Research
- **Top Search Terms**: Discover high-performing keywords and search trends tailored to your niche.
- **Niche Query Pulse**: Track specific query performance within a selected market niche.

### 🔬 Market Research
- **Category Insights**: Analyze category-level trends, competition, and performance metrics.
- **Product Niche Metrics**: Evaluate the profitability and health of specific product niches.
- **Niche Explorer (Niche-X)**: Discover new market opportunities and untapped niches.

### 📦 Product Analysis
- **ASIN Explorer (ASIN-X)**: The ultimate deep dive into ASIN metrics, generating high-fidelity Excel reports with exhaustive data.
- **Price Tracker**: Monitor product price movements, buy-box trends, and historical fluctuations.

### 📊 Performance Reports
- **Sales & Traffic Drilldown**: High-resolution analysis of your account sales performance and traffic patterns.

### 🤖 Customer Intelligence
- **Rufus Q&A**: Leverages Rufus AI to extract and summarize top customer questions and answers for any product.

---

## 🏗 Technical Overview
AMZBoosted uses a modern, **Service-Based Architecture** centered around a **Central Registry** (`lib/tool-definitions.ts`).
- **Unified Logic**: Tools are defined once and work seamlessly across Side Panel, Dashboard, and Schedules.
- **Lazy Loading**: UI components are loaded on-demand for maximum browser performance.
- **Isolated Execution**: Dedicated service layers ensure long-running background tasks never bloat the UI thread.

---

## 📋 Getting Started
1. **Login**: Sign in to your AMZBoosted account.
2. **Open the Side Panel**: Click the AMZBoosted icon while browsing Amazon to run a quick scan.
3. **Visit the Dashboard**: For detailed reports, analytics, and data management.
4. **Set a Schedule**: Automate your most critical scans to ensure you always have the latest data.

---
*Generated by Antigravity for AMZBoosted.*
