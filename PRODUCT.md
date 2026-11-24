# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Platform Users (Developers & Teams):** Engineers and AI application teams who configure Roundhouse API keys, store upstream provider credentials in the encrypted Key Vault, connect global or custom providers, rank or score models, test requests in the Playground, and route production traffic through the OpenAI-compatible `/v1` API.
- **Platform Administrators (Operators):** Internal SaaS operators who manage the global provider and model catalog, inspect custom providers, oversee user accounts and statuses, and monitor platform-wide operational analytics via the separate Admin Console.

## Product Purpose

Roundhouse is a multi-tenant hosted SaaS AI service orchestration control plane and proxy layer. It sits between client applications and upstream model providers (OpenAI, Anthropic, Gemini, and user-defined custom endpoints) to provide deterministic model selection, automatic failover via the bounded Roundhouse retry loop, encrypted credential management, and operational visibility without requiring application code rewrites.

## Positioning

Unlike single-user local proxies or opaque model routers, Roundhouse exposes API-key-scoped routing policies (`EFFICIENCY`, `PRIORITY`, and `RANDOM`), explicit provider and model selections, bounded `maxIterations` retry execution with per-key failure isolation and exhaustion recovery, and a password-gated Key Vault inside one unified multi-tenant control plane.

## Operating Context

- **API Integration:** Applications send standard OpenAI-compatible requests (`/v1/chat/completions`, `/v1/responses`, `/v1/models`) using a Roundhouse bearer token (`ApiKey`).
- **Configuration Ritual:** Operators store upstream secrets in Key Vault (`ApiKeysManager`), attach global or custom providers (`ProviderSelection`), activate and prioritize models (`ModelSelection`), and tune `roundhouseMethod` and `maxIterations` per API key.
- **Security Posture:** Provider vault keys remain masked by default; revealing secrets requires password confirmation (`POST /api/iv1/me/apikeys/unlock`) and unlocked values stay in memory only.
- **Dual Workspace Separation:** Authenticated users work in `/dashboard/*`; administrators operate in `/admin/*` with shared operational vocabulary and cross-workspace navigation for admin users.

## Capabilities and Constraints

- **Shipped Architecture:** Next.js App Router + React 19 + Tailwind CSS v4 + Redux Toolkit frontend (`client-side/`) paired with a NestJS + TypeScript + Prisma/MongoDB backend (`server-side/`) exposing `/api/iv1/*` management routes and `/v1/*` OpenAI-compatible inference routes.
- **Routing & Failover Semantics:** Single DB load per request, in-memory candidate filtering, deterministic `EFFICIENCY` (`efficiencyScore DESC`), user-ranked `PRIORITY`, or `RANDOM` selection, failure exclusion (`LastError`), pool exhaustion reset, and hard termination at `maxIterations` (default `5`).
- **Unshipped Roadmap Boundaries:** Items analyzed in `docs/freellmapi-analysis.md` (such as tiered TTL cooldowns, Anthropic `/v1/messages` surface, live bandit scoring, and Redis rate-limit ledgers) are planned roadmap items, not currently shipped capabilities.
- **Data Model Hierarchy:** `User` -> `ApiKey` -> `ProviderSelection` -> `ModelSelection` -> `Model` / `UserModel`, backed by `ApiKeysManager` vault entries.

## Brand Commitments

- **Product Name:** Roundhouse
- **Visual Assets:** Preserve the existing brand mark at `client-side/public/logo.png` (and `client-side/public/logo_extra.png`).
- **Theme Support:** Preserve dual light and dark mode switching (`next-themes` with `light`, `dark`, and `system` options).
- **Design Direction Constraint (User-Confirmed):** Replace the previous cyan/indigo visual identity with a high-contrast, minimalist developer console aesthetic tuned for **Operate** mode.

## Evidence on Hand

- `README.md` — Repository structure and quickstart for `client-side/` and `server-side/`.
- `server-side/md/ROUNDHOUSE.md` — Specification of the deterministic Roundhouse selection and retry algorithm.
- `client-side/md/FRONTEND_PLANNING.md` — Frontend architecture, route map, user/admin separation, and theme/security flows.
- `docs/freellmapi-analysis.md` — Comparative analysis separating current Roundhouse capabilities from future roadmap items.
- `client-side/public/logo.png` — Existing brand logo asset.
- **Absences (Do Not Fabricate):** No verified customer logos, testimonials, SLA guarantees, or production traffic benchmarks exist in the repository.

## Product Principles

1. **Expose the Mechanism, Not Magic:** Every routing method, priority rank, active provider, and retry boundary must be inspectable and configurable by the operator.
2. **Fail Safe and Bounded:** Configuration and live state must clearly communicate active vs. excluded vs. exhausted states without hiding failure behavior.
3. **Security by Default:** Secrets stay masked until explicitly unlocked with password verification; destructive actions require explicit confirmation.
4. **Shared Operator Vocabulary:** User Dashboard and Admin Console use consistent terminology, status semantics, and navigation patterns so diagnosing issues across layers is seamless.

## Accessibility & Inclusion

- High-contrast legibility in both light and dark console themes with clear focus states, keyboard-accessible controls, and semantic status indicators that do not rely solely on hue.
