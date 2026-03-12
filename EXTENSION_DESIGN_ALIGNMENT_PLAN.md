# AMZBoosted Extension — Design Alignment Plan
### Match the Extension UI to the Website Dashboard

Last updated: 2026-03-12

---

## Goal

The website dashboard (`app.amzboosted.com`) has been redesigned with a refined dark design system: deep `#0A0A0B` background, glass-morphism cards, tight side padding, semantic color palette, and consistent typography. The Chrome extension side panel currently uses a lighter/mixed design with mismatched spacing, different card styles, and overuse of the orange primary color.

This document is the implementation plan to bring the extension into full visual alignment.

---

## Current State vs Target State

| Property | Extension Today | Website Dashboard Target |
|---|---|---|
| Background | `#09090b` dark mode, `#ffffff` light mode — but forced dark rarely applied | Always `#0A0A0B` (forced dark, no light mode toggle in side panel) |
| Side padding | `p-4` or `px-4` inconsistently applied | `px-4 py-4` on mobile, `px-5 py-5` on wider contexts |
| Card style | Plain `bg-card rounded-lg border` | `glass-card`: `bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 rounded-2xl` |
| Card radius | `rounded-lg` (8px) | `rounded-2xl` (16px) |
| Border color | `border-border` (`hsl(240 5.9% 90%)` in dark = very faint gray) | `border-white/10` |
| Primary color overuse | Orange backgrounds on headers, glow effects everywhere, active nav items fully orange | Orange reserved for CTAs and active indicators only. Structural elements use `white/5–white/10` |
| Typography — headings | `text-base font-semibold` or `text-lg font-bold` | `text-sm font-bold` (compact) or `text-xs font-bold` for sub-headings |
| Typography — body | `text-sm text-muted-foreground` | `text-xs text-muted-foreground` |
| Button primary | Orange gradient, various sizes | `bg-primary text-primary-foreground rounded-xl h-9 px-4 text-xs font-bold` |
| Button ghost/secondary | `variant="outline"` with orange hover borders | `bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl` |
| Stat/metric cards | `bg-card` with colored icons | `glass-card` with `bg-[color]/10 border-[color]/20` icon containers |
| Chart colors | `--chart-1` through `--chart-5` (orange, blue, green, purple, red) | Keep chart tokens but align: primary=orange for owned data, blue for benchmark, green for positive delta |
| Loading skeletons | `animate-pulse bg-muted` | `animate-pulse bg-secondary/50` or `bg-white/5` |
| Empty states | Missing on most screens | Glass card with muted icon + CTA button |
| Navbar/toolbar | Custom header with mixed spacing | Compact `h-12` navbar with `px-4`, icon buttons `w-8 h-8 rounded-lg` |

---

## CSS Token Alignment

Update `/entrypoints/sidepanel/style.css` dark mode block to match the website's tokens exactly:

```css
/* entrypoints/sidepanel/style.css — DARK MODE TOKENS (ALIGN WITH WEBSITE) */
.dark, :root {  /* Side panel is always dark */
  --background: 240 10% 3.9%;          /* #0A0A0B — same as website */
  --foreground: 0 0% 98%;

  --card: 240 3% 6.1%;                 /* #0f0f10 */
  --card-foreground: 0 0% 98%;

  --border: 0 0% 100% / 0.1;           /* white/10 */
  --input: 240 3.7% 15.9%;

  --primary: 25 100% 50%;              /* #FF6B00 */
  --primary-foreground: 0 0% 100%;

  --secondary: 240 3.7% 15.9%;        /* zinc-800 */
  --secondary-foreground: 0 0% 98%;

  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;   /* zinc-400 */

  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;

  --radius: 1rem;                       /* 16px — match rounded-2xl default */

  /* Chart palette — keep aligned with website */
  --chart-1: 25 100% 50%;   /* orange — primary metric */
  --chart-2: 217 91% 60%;   /* blue-400 — benchmark/comparison */
  --chart-3: 142 71% 45%;   /* green-500 — positive/growth */
  --chart-4: 262 83% 58%;   /* purple-500 — secondary metric */
  --chart-5: 0 72% 51%;     /* red-500 — negative/loss */
}

/* glass-card utility — add to @layer components */
@layer components {
  .glass-card {
    @apply rounded-2xl border border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl relative overflow-hidden;
  }
  .glass-card-hover {
    @apply glass-card transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-black/20;
  }
}
```

---

## Component Changes

### 1. Navbar / Header (`components/sidepanel/Navbar.tsx`)

**Current:** Custom header, variable height, sometimes orange icon backgrounds.

**Target:**
```
height: h-12 (48px)
padding: px-4
background: bg-[#0A0A0B]/95 backdrop-blur-sm border-b border-white/5
Logo: 20px, text-white font-bold
Icon buttons: w-8 h-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10
Active indicator: 2px bottom border in primary color only — no background fill
```

**Changes needed:**
- Remove orange background from any nav icon containers
- Standardise all icon button sizes to `w-8 h-8 rounded-lg`
- Change border to `border-white/5`

---

### 2. Tool Cards / Tool Grid (`screens/ToolsHome.tsx` + `components/sidepanel/`)

**Current:** Cards use `bg-card border rounded-lg` with orange icons.

**Target:**
```
Card: glass-card rounded-2xl p-4 hover:border-white/20 transition-all
Icon container: w-9 h-9 rounded-xl bg-[category-color]/10 border border-[category-color]/20
Icon: w-4 h-4 text-[category-color]
Title: text-xs font-bold text-gray-200
Description: text-[10px] text-muted-foreground
```

**Category color map (matches website tool catalog):**
| Category | Color |
|---|---|
| Analytics / Intelligence | `blue-400` |
| SQP / Search | `purple-400` |
| Sales / Revenue | `green-400` |
| Scheduling / Automation | `primary` (orange) |
| Settings / Config | `gray-400` |

**Changes needed:**
- Map every tool to a category color — no more universal orange icon backgrounds
- Update card container from `rounded-lg` to `rounded-2xl`
- Add `backdrop-blur` and `bg-[#0A0A0B]/80` to card backgrounds

---

### 3. Processing / Run View (`components/sidepanel/ProcessingView.tsx`)

**Current:** Progress bar is orange gradient, status text uses `text-primary` heavily.

**Target:**
```
Progress bar: bg-gradient-to-r from-primary to-[hsl(30,100%,64%)] — keep orange (it's a CTA/active state)
Container: glass-card p-5
Status text: text-xs text-muted-foreground
Step indicators: green checkmarks for completed, primary dot for current, white/20 for pending
```

**Changes needed:**
- Wrap progress container in `glass-card`
- Replace any `bg-primary/20` step backgrounds with `bg-white/5`
- Keep orange only on the active progress fill and CTA buttons

---

### 4. Results Table (`components/data-table/`)

**Current:** Standard table with `border-border` rows.

**Target:**
```
Table wrapper: glass-card rounded-2xl overflow-hidden
Header row: bg-white/[0.03] border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground
Data rows: border-b border-white/5 hover:bg-white/[0.03] text-xs
Selected rows: bg-primary/5 border-l-2 border-l-primary
```

**Changes needed:**
- Remove `border-border` (too light gray in dark mode — visually disappears)
- Replace with `border-white/5` for row dividers and `border-white/10` for section dividers
- Header text: reduce from `text-sm` to `text-[10px]` uppercase

---

### 5. Settings Sheet (`components/sidepanel/SettingsSheet.tsx`)

**Current:** Sheet with `bg-background` and standard form elements.

**Target:**
```
Sheet background: bg-[#0A0A0B]/95 backdrop-blur-xl border-l border-white/10
Section headers: text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3
Input fields: bg-white/5 border border-white/10 rounded-xl h-9 text-xs focus:border-primary/50
Labels: text-xs font-medium text-gray-300
```

**Changes needed:**
- Update all `Input`, `Select`, `Switch` components to use `bg-white/5 border-white/10 rounded-xl`
- Replace label typography from `text-sm` to `text-xs`

---

### 6. Export Settings Sheets
(`CategoryExportSettingsSheet`, `GenericExportSettingsSheet`, `SQPExportSettingsSheet`, `SalesTrafficExportSettingsSheet`)

Same changes as SettingsSheet above — they share the same structure.

---

### 7. Job Row (`components/sidepanel/JobRow.tsx`)

**Current:** Row with icon + text, `text-sm`.

**Target:**
```
Row: p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10
Icon: w-8 h-8 rounded-lg bg-[status-color]/10 border border-[status-color]/20 text-[status-color]
Status badge: text-[10px] px-2 py-0.5 rounded-full
  - running: bg-blue-500/10 text-blue-400 border border-blue-500/20
  - completed: bg-green-500/10 text-green-400 border border-green-500/20
  - failed: bg-red-500/10 text-red-400 border border-red-500/20
Title: text-xs font-bold
Timestamp: text-[10px] text-muted-foreground
```

---

### 8. Login Screen (`screens/LoginScreen.tsx`)

**Current:** Centred card with logo + form.

**Target:**
```
Background: bg-[#0A0A0B] with subtle radial gradient from-primary/5
Card: glass-card rounded-2xl p-6 w-full max-w-xs mx-auto border-white/10
Logo: 48px, centred, with primary/10 glow ring
Heading: text-sm font-bold text-white
Sub: text-xs text-muted-foreground
Input: bg-white/5 border-white/10 rounded-xl h-9 text-xs
Button: bg-primary rounded-xl h-10 font-bold text-xs glow-orange (add box-shadow: 0 0 20px hsl(var(--primary)/0.3))
```

---

### 9. Charts (`components/charts/`)

**Current:** Recharts with mixed colors.

**Target — align with website dashboard chart style:**
```
Background: transparent (sits inside glass-card)
Grid lines: stroke="hsl(var(--border))" strokeOpacity={0.3}
Axis text: fill="hsl(var(--muted-foreground))" fontSize={10}
Tooltip: bg-[#1a1a1b] border border-white/10 rounded-xl text-xs shadow-xl
Bar fill: use category color map (see Tool Cards section)
Line stroke: 2px, use category color
Area fill: gradient from category-color/20 to transparent
```

---

### 10. Onboarding Screen (`components/onboarding/`)

**Current:** Unknown state — check existing components.

**Target:** Match WelcomeModal design from the website:
- Dark glass card
- Step progress pills (thin bars, orange = active, green = done, white/10 = pending)
- Icon + numbered step header
- CTA button in orange

---

## Side Padding Standard

The website dashboard uses:
- Mobile: `p-4` (16px all sides)
- Desktop: `p-4 lg:p-6` (24px all sides on large screens)

The side panel is always a fixed-width panel (~400px wide). Use:
```
Outer container: px-4 py-4
Section gaps: gap-3 (12px) between major sections
Inner card padding: p-4 (for content cards) or p-3 (for compact list items)
```

**Do NOT use `px-6` or larger in the side panel** — the panel is too narrow and it will feel cramped.

---

## Implementation Order

### Phase 1 — Foundations (do first, unlocks everything else)
1. Update CSS tokens in `style.css` (5 min)
2. Add `glass-card` utility class to `style.css` (2 min)
3. Verify dark mode is forced in sidepanel `App.tsx` (add `dark` class to root if not present)

### Phase 2 — Shell
4. Update `Navbar.tsx` — height, padding, icon buttons, remove orange backgrounds
5. Update outer container padding in `App.tsx` and screen wrappers

### Phase 3 — Core Screens
6. `ToolsHome.tsx` — card style, category color map, typography
7. `ProcessingView.tsx` — glass-card wrapper, step indicators
8. `LoginScreen.tsx` — glass card, input styles, glow button
9. `JobRow.tsx` — row style, status badges

### Phase 4 — Data Components
10. Data table — header/row border/typography
11. Settings sheets — input/label styles
12. Charts — grid, axis, tooltip, fill colors

### Phase 5 — Polish
13. Onboarding screen alignment
14. Empty state designs for screens with no data
15. Loading skeleton alignment (`bg-white/5` pulses)
16. Audit for any remaining `rounded-lg` → `rounded-2xl` upgrades

---

## Files to Change (Summary)

| File | Changes |
|---|---|
| `entrypoints/sidepanel/style.css` | CSS tokens, glass-card utility, dark mode |
| `entrypoints/sidepanel/App.tsx` | Force dark class on root element |
| `entrypoints/sidepanel/screens/ToolsHome.tsx` | Card style, category colors, typography |
| `entrypoints/sidepanel/screens/LoginScreen.tsx` | Glass card, input styles, glow button |
| `entrypoints/sidepanel/components/Navbar.tsx` | Height, padding, icon buttons |
| `entrypoints/sidepanel/components/ProcessingView.tsx` | Glass wrapper, step indicators |
| `entrypoints/sidepanel/components/JobRow.tsx` | Row style, status badge |
| `entrypoints/sidepanel/components/SettingsSheet.tsx` | Input/label typography |
| `entrypoints/sidepanel/components/CategoryExportSettingsSheet.tsx` | Same as SettingsSheet |
| `entrypoints/sidepanel/components/GenericExportSettingsSheet.tsx` | Same as SettingsSheet |
| `entrypoints/sidepanel/components/SQPExportSettingsSheet.tsx` | Same as SettingsSheet |
| `entrypoints/sidepanel/components/SalesTrafficExportSettingsSheet.tsx` | Same as SettingsSheet |
| `components/data-table/` | Table header/row borders, typography |
| `components/charts/` | Grid, axis, tooltip, fill colors |
| `components/onboarding/` | Step progress, glass card |
