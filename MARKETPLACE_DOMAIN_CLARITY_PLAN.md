# Marketplace vs Domain Clarity Plan

> **Problem in one sentence:** The website says "One extension. Every marketplace." — but users
> could reasonably interpret that to mean they can log into any regional Seller Central domain
> (`.co.uk`, `.de`, etc.). The reality is more nuanced and needs to be stated clearly everywhere.

---

## Current Reality (What's Actually True)

### How login and marketplace switching works

Amazon Seller Central has a global hub at `sellercentral.amazon.com` (the .com domain).
Every seller — including UK, DE, FR, JP sellers — can log into this .com URL. Once logged in,
the top-right account switcher lets them select which marketplace account they want to work in.
This is Amazon's own design. Selecting "UK" in the switcher does NOT redirect you to
`sellercentral.amazon.co.uk` — it switches the active seller account context while keeping you
on `.com`.

AMZBoosted uses this exact mechanism. When a user selects a marketplace in the extension, it
calls Amazon's own account-switcher API (`/account-switcher/regional-accounts/...`) and switches
the active session — all within `sellercentral.amazon.com`.

**So the correct statement is:**
> "Users log in once at `sellercentral.amazon.com`. From there, the extension supports all
> major marketplaces via Amazon's native account switcher."

This is NOT a limitation — it is how Amazon itself works. We just need to say it clearly.

### Per-tool domain behavior

After the account switcher sets the active marketplace, individual tools navigate to extract
data. Each tool handles this differently:

| Tool | Domain Behavior | Status |
|------|----------------|--------|
| **SQP Snapshot** | Maps marketplace → correct Seller Central domain (8 regions) | ✅ Works |
| **Top Terms** | Maps marketplace → correct Seller Central domain (19 regions) | ✅ Works |
| **Sales & Traffic** | Maps marketplace → correct Seller Central domain (14 regions) | ✅ Works |
| **Category Insights** | **HARDCODED to `sellercentral.amazon.com`** | ❌ Bug — US only |
| **Rufus Q&A** | Uses consumer `www.amazon.{tld}` — no Seller Central needed | ✅ Works |
| **Price Tracker** | Uses consumer `amazon.{tld}` (7 regions) | ✅ Works |
| **ASIN Explorer** | Uses consumer domain via marketplace mapping | ✅ Works |
| **Niche X** | Consumer domain | ✅ Works |
| **Product Niche Metrics** | Consumer domain | ✅ Works |

### The gap between website copy and reality

| What the website says | What's actually true |
|----------------------|---------------------|
| "One extension. Every marketplace." | Mostly true — but Category Insights is US only |
| "Works across all global Amazon portals automatically" | Misleading — requires login at `.com`, not regional portals |
| "Switch accounts, switch countries — AMZBoosted stays in sync" | True for most tools |
| "Detects your active marketplace automatically" | True via account-switcher API |
| Lists 13 marketplaces with flags | Accurate for most tools; not for Category Insights |

---

## The Fix — Three Layers

### Layer 1 — Fix the Code Bug (Category Insights)

**File:** `lib/services/tools/category-insights.service.ts`

Currently hardcodes `sellercentral.amazon.com` for all API calls. Needs the same
`getBaseDomain()` pattern every other Seller Central tool uses:

```typescript
private getBaseDomain(marketplace: string): string {
    const domains: Record<string, string> = {
        'US': 'sellercentral.amazon.com',
        'UK': 'sellercentral.amazon.co.uk',
        'CA': 'sellercentral.amazon.ca',
        'DE': 'sellercentral.amazon.de',
        'FR': 'sellercentral.amazon.fr',
        'IT': 'sellercentral.amazon.it',
        'ES': 'sellercentral.amazon.es',
        'IN': 'sellercentral.amazon.in',
        'JP': 'sellercentral.amazon.co.jp',
        'AU': 'sellercentral.amazon.com.au',
        'MX': 'sellercentral.amazon.com.mx',
    };
    return domains[marketplace?.toUpperCase()] || 'sellercentral.amazon.com';
}
```

Then replace all hardcoded `https://sellercentral.amazon.com/next/v2/searchSGAR`
with `https://${this.getBaseDomain(marketplace)}/next/v2/searchSGAR`.

This is the only code change needed on the extension side.

---

### Layer 2 — Clarify in the Extension UI

Three places inside the extension where a single sentence eliminates confusion:

#### A) MarketplaceSelector tooltip

**File:** `entrypoints/sidepanel/components/MarketplaceSelector.tsx`

Add a small `(?)` info icon or subtitle below the selector:

```
Marketplace
[🇺🇸 United States ▼]
ⓘ Requires login at sellercentral.amazon.com
```

This is one line. It immediately answers the "do I need to be on the UK Seller Central?" question.

#### B) Onboarding / First-run screen

**File:** `entrypoints/sidepanel/screens/LoginScreen.tsx` (or wherever first-run setup lives)

Add a setup note:

```
Getting started:
1. Open sellercentral.amazon.com and sign in
2. Use Amazon's account switcher to select your marketplace
3. Come back here and click Refresh — you're ready
```

#### C) Tool-level warning for Category Insights (short-term, until code fix ships)

While the Category Insights bug is being fixed, show an inline notice when a non-US
marketplace is selected in that tool:

```
⚠ Category Insights currently returns US data regardless of marketplace selection.
  A fix is in progress.
```

This prevents user-facing confusion in the gap between "we know about it" and "it's shipped."

---

### Layer 3 — Fix the Website Copy

**Files to update:**
- `components/launch/marketplace-grid.tsx`
- `components/launch/what-you-get.tsx`

#### marketplace-grid.tsx — current vs proposed

**Current headline:**
```
One extension. Every marketplace.
```

**Proposed:**
```
One login. Every marketplace.
```

**Current subtitle:**
```
Whether you sell in the US, Europe, or Asia-Pacific, AMZBoosted works across all global
Amazon portals automatically.
```

**Proposed:**
```
Log in once at sellercentral.amazon.com and use Amazon's native account switcher to access
any of your marketplace accounts. AMZBoosted follows your active session automatically.
```

**Current "Zero-Link Advantage" description:**
```
Switch accounts, switch countries—AMZBoosted stays in sync.
```

This line is fine — keep it. Just add one sentence before it:

```
Works from sellercentral.amazon.com, Amazon's global hub for all marketplace accounts.
Switch accounts, switch countries—AMZBoosted stays in sync.
```

#### what-you-get.tsx — current vs proposed

**Current:**
```
Switch accounts, switch marketplaces—AMZBoosted detects it instantly.
```

**Proposed:**
```
Switch accounts, switch marketplaces on sellercentral.amazon.com—AMZBoosted detects it instantly.
No need to log in to regional Seller Central domains separately.
```

---

## Where NOT to Over-Explain

Don't add a wall of text to the landing page. The `.com` requirement is not a limitation — it
is how Amazon works. Most sellers already log in on `.com` because that is the primary URL.
The clarification just needs to be present, not prominent. One accurate sentence in the right
place is enough.

Do NOT change the marketplace grid (the 13 flags). Those marketplaces genuinely are supported
for data extraction once the user is on `.com` with the right account active.

---

## Implementation Order

| # | Task | File | Effort | Priority |
|---|------|------|--------|----------|
| 1 | Fix Category Insights domain bug | `category-insights.service.ts` | 30 min | P0 — this is the only real bug |
| 2 | Add `.com` note to MarketplaceSelector | `MarketplaceSelector.tsx` | 15 min | P1 |
| 3 | Update marketplace-grid.tsx copy | Website | 15 min | P1 |
| 4 | Update what-you-get.tsx copy | Website | 10 min | P1 |
| 5 | Add setup steps to onboarding | `LoginScreen.tsx` or onboarding | 20 min | P2 |
| 6 | Add Category Insights warning (temp) | `CategoryInsightsTool.tsx` | 15 min | P2 (skip if #1 ships fast) |

**Total: ~1.5 hours of work.**

---

## Summary

The situation is not a product limitation — it is a communication gap.

Most sellers in the world already log into `sellercentral.amazon.com`. Amazon designed it as
the global hub. Regional Seller Central URLs (`sellercentral.amazon.co.uk` etc.) exist but
most experienced sellers use the `.com` hub with the account switcher.

What we need to do:
1. **Fix the Category Insights hardcoding** — the only real code bug
2. **Add one accurate sentence** to the extension UI and website copy
3. **Avoid rewriting** the marketing — just make it precise

After these changes, the product's marketplace support story is clean, accurate, and defensible.
