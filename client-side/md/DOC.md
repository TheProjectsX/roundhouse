# Replace Placeholder Docs with Professional Multi-Page Documentation

## Background

The current [docs page](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/page.tsx) is a placeholder with only 4 static cards summarizing Authentication, Routing Methods, OpenAI Compatibility, and Failover Semantics. This needs to be replaced with a comprehensive, professional, multi-page documentation site covering everything developers need to integrate with the Roundhouse platform.

## Proposed Changes

### Documentation Content Architecture

The docs will be organized as static content rendered inline (no MDX/markdown runtime dependency needed — we'll build the content directly as TSX pages). The navigation will use a sidebar layout specific to the docs section.

**Documentation Pages:**

| Route | Title | Content |
|---|---|---|
| `/docs` | Introduction | Overview, what is Roundhouse, key concepts, architecture diagram |
| `/docs/quickstart` | Quick Start | 5-minute guide: register → create API key → add vault key → select provider → make first call |
| `/docs/authentication` | Authentication | Registration, login, JWT tokens, Bearer auth, session management |
| `/docs/api-keys` | API Keys | Creating, configuring, roundhouse methods (RANDOM/EFFICIENCY/PRIORITY), maxIterations, lifecycle |
| `/docs/providers` | Providers | Global vs custom providers, provider types (OpenAI/Anthropic/Gemini/Custom), creating custom providers, adding models |
| `/docs/key-vault` | Key Vault | Storing provider API keys, unlock flow, security model, masked keys |
| `/docs/models` | Models | Model selection, priority ordering, efficiency scores, per-model stats, failover behavior |
| `/docs/api-reference` | API Reference | Complete endpoint reference with request/response shapes for all `/api/iv1/` routes |
| `/docs/openai-compatibility` | OpenAI Compatibility | Using `/v1/chat/completions`, `/v1/responses`, `/v1/models` — drop-in replacement guide |
| `/docs/roundhouse-algorithm` | Roundhouse Algorithm | Deep dive into RANDOM, EFFICIENCY, PRIORITY methods, failover/retry logic, model exclusion |
| `/docs/error-handling` | Error Handling | Error codes, response envelope, troubleshooting guide |
| `/docs/admin` | Admin Guide | Admin dashboard, provider management, user management, analytics |

---

### Docs Layout & Components

#### [NEW] [layout.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/layout.tsx)
- Docs-specific layout with sidebar navigation + content area
- Sidebar shows all doc pages with active state highlighting
- Mobile: collapsible hamburger menu for sidebar
- Breadcrumb navigation at the top of content

#### [NEW] [docs-sidebar.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/_components/docs-sidebar.tsx)
- Left sidebar navigation listing all doc pages grouped by category
- Categories: Getting Started, Core Concepts, Integration, Reference
- Active link highlighting using `usePathname()`
- Responsive: hidden on mobile with toggle button

#### [NEW] [docs-content.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/_components/docs-content.tsx)
- Wrapper component for doc page content with consistent typography styling
- Includes "On this page" (table of contents) sidebar on wide screens
- Previous/Next page navigation at bottom

#### [NEW] [code-block.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/_components/code-block.tsx)
- Styled code block component with copy-to-clipboard, language label
- Uses the project's monospace font and card styling

#### [NEW] [endpoint-block.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/_components/endpoint-block.tsx)
- API endpoint display component: method badge (GET/POST/PATCH/DELETE) + path + description
- Expandable request/response body details

---

### Documentation Pages

#### [MODIFY] [page.tsx](file:///d:/Modasser_Workspace/Tests/roundhouse/client-side/src/app/docs/page.tsx)
- Replace the placeholder 4-card layout with the Introduction page content

#### [NEW] All subpages under `/docs/`
- `quickstart/page.tsx`
- `authentication/page.tsx`
- `api-keys/page.tsx`
- `providers/page.tsx`
- `key-vault/page.tsx`
- `models/page.tsx`
- `api-reference/page.tsx`
- `openai-compatibility/page.tsx`
- `roundhouse-algorithm/page.tsx`
- `error-handling/page.tsx`
- `admin/page.tsx`

Each page contains comprehensive, production-ready documentation content derived from the actual codebase: Prisma schema, Swagger spec, controller logic, planning documents, and CHANGES.md.

---

## Design System

- Uses the existing project CSS variables (`--color-*`, `--radius-*`, `--font-*`)
- Card, Badge components from `@/shared/components/ui/`
- PageHeader from `@/shared/components/layout/`
- Phosphor Icons for doc navigation icons
- No new dependencies needed — everything built with existing stack

## Open Questions

> [!IMPORTANT]
> **API Base URL**: The docs will reference `http://localhost:5000` as the default server URL (from `.env`). Should this be a placeholder like `https://api.roundhouse.dev` instead for the documentation?

> [!IMPORTANT]
> **Public vs Authenticated**: The current docs page at `/docs` is outside the dashboard layout (no sidebar/topbar). Should the docs remain publicly accessible (no auth required), or should they be behind the dashboard auth wall?

## Verification Plan

### Automated Tests
- `npm run build` in client-side to verify all pages compile without errors
- `npm run typecheck` to verify TypeScript

### Manual Verification
- Navigate through all 12 docs pages to verify content renders correctly
- Verify sidebar navigation and active states
- Verify responsive layout (mobile sidebar collapse)
- Verify dark/light theme compatibility
