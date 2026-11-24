---
name: Roundhouse
description: High-contrast, minimalist Operate-mode developer console for multi-provider AI routing, failover orchestration, and encrypted key vault management.
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: Roundhouse

## Overview

**Creative North Star: "The Hairline Developer Console"**

Roundhouse is an **Operate**-mode AI routing control plane built around a high-contrast, minimalist developer console aesthetic (`digital-design-canon-dark-first-developer-console`). Its visual grammar replaces the previous cyan/indigo gradients, glassmorphic blur, and soft rounded SaaS cards with crisp matte surfaces divided by `1px` hairline seams, compact technical typography, and strict color restraint. Every element earns its pixels by exposing routing state, vault security, and failover readiness with zero decorative noise.

The console treats dark mode as its native register while maintaining full high-contrast parity in light mode via the existing theme switcher (`light`, `dark`, `system`). Navigation, form controls, and data tables strictly follow standard, immediately scannable web affordances so engineers can configure API keys, inspect provider pools, and manage secrets without fighting unfamiliar metaphors. Motion is confined to fast, single-axis state transitions (`150–200ms`) that confirm state changes rather than choreograph page entrances.

**Key Characteristics:**
- **Hairline-Seam Architecture:** Panels, KPI strips, and table rows separate via `1px` structural borders and a single tonal step rather than drop shadows or glowing cards.
- **High-Contrast Polarity (Dark & Light):** Stark foreground-to-ground contrast across both dark graphite and light chalk themes, preserving the Roundhouse mark (`client-side/public/logo.png`).
- **Syntax-Derived State Discipline:** Accent and status hues appear only on active selections, primary actions, and semantic health/exclusion states—never as ambient decoration.
- **Isolated Destructive Zones:** Dangerous operations (key deletion, vault revocation, pool resets) are separated by deliberate empty space and remain outline-styled until focused or confirmed.
- **Compact Sans + Tabular Mono:** Crisp UI sans-serif paired with tabular monospaced figures for API keys, `efficiencyScore` values, `maxIterations` caps, and request counts.

## Colors

Roundhouse uses a **Restrained** palette strategy: high-contrast neutral grounds and hairline borders carry 90%+ of every screen, while color is reserved exclusively for primary action polarity and semantic operational states.

### Primary
- **Console Primary Action** (`[to be resolved during implementation]`): High-contrast ink-on-ground inversion (or single crisp console accent) reserved strictly for the primary CTA per view and active selection markers.

### Neutral
- **Console Ground (Dark / Light)** (`[to be resolved during implementation]`): Deep matte graphite in dark mode and stark technical chalk/white in light mode; forms the base canvas.
- **Panel Surface** (`[to be resolved during implementation]`): One subtle tonal step above the console ground for tiled panels, sidebars, and headers.
- **Hairline Seam** (`[to be resolved during implementation]`): Crisp `1px` structural border separating adjacent panels, header bars, and table rows without shadow.
- **Primary Text** (`[to be resolved during implementation]`): High-contrast neutral ink meeting WCAG AA/AAA readability against both ground and panel surfaces.
- **Secondary & Muted Text** (`[to be resolved during implementation]`): Subdued neutral slate for metadata, descriptions, and inactive labels (`[to be resolved during implementation]`).

### Semantic State Accents
- **Healthy / Active** (`[to be resolved during implementation]`): Emerald/green signal for connected providers, active API keys, and verified vault readiness.
- **Degraded / Excluded / Warning** (`[to be resolved during implementation]`): Amber signal for excluded model selections, recovering pools, and incomplete setup gates.
- **Error / Destructive** (`[to be resolved during implementation]`): Crimson/rose signal reserved for failed requests, banned/revoked states, and focused destructive confirmations.
- **Testing / Info** (`[to be resolved during implementation]`): Cool blue/slate signal for `TESTING` model states and informational callouts.

### Named Rules
**The State-Only Color Rule.** Saturated hues never decorate static cards, backgrounds, or inactive navigation items; color exists solely to communicate action priority or operational state.
**The No-Gradient Chrome Rule.** Never apply radial ambient glows, multi-stop card gradients, or frosted-glass backdrops to console panels.

## Typography

**Display & UI Font:** Compact geometric or grotesque UI sans-serif (`[to be resolved during implementation]`, replacing the legacy `Ubuntu` / `Inter` pairing)
**Mono Font:** Crisp technical monospace (`[to be resolved during implementation]`) with `tabular-nums` enabled for all numeric columns, key masks, HTTP paths, and timestamps.

**Character:** Engineered for rapid vertical scanning across dense routing tables and nested configuration panels. Headings stay compact on a tight fixed `rem` scale (`1.125–1.2` step ratio) rather than fluid `clamp()` display sizing.

### Hierarchy
- **Display / Page Title** (`[to be resolved during implementation]`): Compact, tight-tracked page titles at the top of console views (`Overview`, `Key Vault`, `Providers`).
- **Panel Header (Small Caps / Micro Label)** (`[to be resolved during implementation]`): Uppercase tracked small-caps labels anchoring every hairline panel header.
- **Title / Section** (`[to be resolved during implementation]`): Card and subsection headings.
- **Body** (`[to be resolved during implementation]`): Default UI copy and configuration descriptions (`65–75ch` max measure for prose).
- **Mono / Data** (`[to be resolved during implementation]`): API key tokens (`rh_live_...`), efficiency scores, iteration caps, and KPI figures with aligned tabular widths.

### Named Rules
**The Tabular Numerals Rule.** Every counter, score, timestamp, and identifier in tables or stat strips uses monospace or `font-variant-numeric: tabular-nums` so live updates never shift column alignment.

## Layout

Roundhouse organizes workspaces into a persistent, modular console shell: a fixed-width navigation rail on desktop (collapsing cleanly on narrow viewports), a slim top utility bar carrying workspace context, theme toggle, and session controls, and a tiled main work area divided by `1px` hairline rules.

Panels follow priority-based responsive collapse into a single vertical stack on mobile/tablet breakpoints while preserving dense multi-column readouts on desktop (`1280px+`). Spacing adheres to a consistent `4px` base grid (`[to be resolved during implementation]`), favoring tight internal alignment inside tables and readouts paired with generous deliberate breathing room around destructive controls.

## Elevation & Depth

Roundhouse is **flat by default with zero drop shadows** at rest. Hierarchy and containment are communicated strictly through `1px` hairline borders and a single tonal step between the base console canvas and elevated panel surfaces (`[to be resolved during implementation]`).

Floating overlays (confirmation modals, dropdown menus, command palettes) escape ancestor clipping via portals (`createPortal` / `<dialog>` / `position: fixed`) and establish separation through crisp `1px` high-contrast borders and a dim backdrop scrim rather than glowing shadows.

### Named Rules
**The Hairline Seam Rule.** Adjacent regions divide along shared `1px` lines or single-step tonal shifts; never stack multiple nested drop-shadowed cards.
**The Destructive Isolation Rule.** Every destructive action (deleting an API key, revoking a vault entry, resetting exclusion state) sits separated from adjacent primary/edit controls by deliberate empty space and remains outline-only until focused or hovered.

## Shapes

Form language is crisp, rectilinear, and restrained (`[to be resolved during implementation]` tight corner radii—target `4px–6px` for buttons, inputs, badges, and panels, eliminating legacy `16px–32px` rounded card shells).

Operational states reinforce color with structural geometry: active items carry solid borders/indicators, excluded or recovering models use dashed borders or muted badges, and interactive focus states render crisp, high-contrast `2px` focus rings without blurred glow.

## Do's and Don'ts

### Do:
- **Do** use `1px` hairline seams and a single tonal step between ground and panel surfaces across both dark and light themes.
- **Do** isolate destructive actions with deliberate empty space and keep them outline-only until deliberately focused or hovered.
- **Do** enforce `tabular-nums` monospace formatting for all key prefixes, model efficiency scores, iteration caps, and KPI metrics.
- **Do** preserve the Roundhouse brand mark (`client-side/public/logo.png`) and the `light` / `dark` / `system` theme toggle in the console shell.
- **Do** ensure every interactive state (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`) meets high-contrast legibility.

### Don't:
- **Don't** retain legacy cyan/indigo radial gradients, glassmorphic backdrop blurs, or drop-shadowed pill badges from the prior aesthetic.
- **Don't** apply saturated accent colors to inactive navigation items, static containers, or decorative icon tiles.
- **Don't** crowd delete/revoke actions next to primary save or copy buttons where misclicks can occur.
- **Don't** invent bespoke terminal/CLI cosplay controls (fake command prompts, ASCII boxes) in place of standard accessible web buttons, tabs, inputs, and tables.
