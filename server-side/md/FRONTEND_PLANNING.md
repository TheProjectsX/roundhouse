# Roundhouse Frontend Planning Document

> Production-grade frontend architecture blueprint for the Roundhouse AI Service Platform.
> Stack: Next.js (App Router) / TypeScript / Tailwind CSS / Redux Toolkit

---

## 1. Executive Overview

Roundhouse is an AI service orchestration platform that acts as an intelligent proxy layer between consumers and multiple AI providers (OpenAI, Anthropic, Gemini, Custom). The platform provides deterministic model selection, automatic failover via the "Roundhouse" retry algorithm, multi-provider API key management, and a unified OpenAI-compatible API surface.

The frontend serves two distinct user populations:

- **Platform Users** — developers and teams who configure API keys, attach providers and models, manage their secret keys (ApiKeysManager), monitor usage statistics, and consume AI services through the unified `/v1/` endpoint.
- **Platform Administrators** — operators who manage global providers and models, oversee all users, monitor platform-wide analytics, and control system health.

The frontend must present deeply nested relational data (ApiKey → ProviderSelection → ModelSelection → Model/UserModel) in an intuitive, card-based hierarchy while handling security-sensitive operations like API key reveal workflows with password confirmation.

### Core Product Values

- **Reliability Visualization** — surface the Roundhouse retry/failover system's behavior through clear success/failure metrics per model
- **Security-First Key Management** — masked keys by default, password-gated bulk unlock, time-limited reveal
- **Progressive Configuration** — complex API key settings (provider selection, model selection, priority ordering, roundhouse method) exposed through progressive disclosure
- **Operational Clarity** — real-time stats on token usage, success counts, failure counts, and provider health

---

## 2. Product Vision

Roundhouse's frontend is not a generic CRUD dashboard. It is an **AI operations control plane** that must communicate the following to its users:

- Which models are being called, in what order, and why
- Which provider keys are active, healthy, and performing
- How the Roundhouse algorithm distributes load across models
- What happens when a model fails (exclusion, retry, recovery)

### Target User Experience

The interface must feel like a **mission control dashboard for AI infrastructure** — dense with actionable data, but never overwhelming. Every card, metric, and toggle must map directly to an operational decision the user needs to make.

### Design Positioning

The visual language draws from the precision of **Linear** (information density), the operational clarity of **Vercel** (deployment dashboards), and the security gravitas of **Stripe** (key management). The platform must feel enterprise-ready from day one while remaining approachable for individual developers.

---

## 3. Frontend Tech Stack

### Core Framework

| Package          | Version           | Justification                                                                                                                                             |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**      | 15.x (App Router) | Server Components for data-heavy list pages, Streaming for large provider/model trees, Route Groups for User/Admin separation, Middleware for auth guards |
| **TypeScript**   | 5.x               | Full type safety across API response types, Prisma-inferred shapes, form schemas                                                                          |
| **Tailwind CSS** | 4.x               | Utility-first with CSS variables for theme tokens; `@tailwindcss/postcss` plugin for v4                                                                   |
| **React**        | 19.x              | Server Components, `use()` hook for Suspense integration                                                                                                  |

### State & Data Fetching

| Package                             | Justification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query (React Query) v5** | Chosen over RTK Query. Justification: Roundhouse's data model is deeply relational and cache-invalidation patterns (e.g., unlocking API keys must merge `{id, key}` tuples into existing masked list) map naturally to TanStack Query's granular cache manipulation (`queryClient.setQueryData`). RTK Query's normalized cache would add unnecessary abstraction for a backend that already returns formatted, denormalized responses. TanStack Query's `staleTime`, `gcTime`, background refetch, and optimistic update primitives are a better fit for the operational dashboard pattern. |
| **Zustand**                         | Lightweight client-side state for UI-only concerns: sidebar collapse, modal stack, theme preference, temporary unlock state, unsaved changes tracking. Avoids Redux boilerplate for non-server state.                                                                                                                                                                                                                                                                                                                                                                                       |
| **React Hook Form v7**              | Performant uncontrolled form management for complex API key settings, provider creation, model configuration. Minimal re-renders critical for nested dynamic forms.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Zod**                             | Schema validation shared between form validation and API response parsing. Single source of truth for data shapes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### UI & Interaction

| Package                               | Justification                                                                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Radix UI Primitives**               | Unstyled, accessible dialog/popover/dropdown/toggle primitives. Customized to match Roundhouse's visual system — never used in default state.                     |
| **Framer Motion**                     | Layout animations for card reordering (model priority drag), page transitions, modal enter/exit, staggered list reveals. Spring physics for premium tactile feel. |
| **@phosphor-icons/react**             | Consistent icon set with configurable weight. `strokeWidth: 1.5` standardized globally.                                                                           |
| **Recharts**                          | Composable charting for analytics dashboards. Lighter than D3 for the bar/line/area charts needed for token usage, success rates, and traffic visualization.      |
| **@tanstack/react-table v8**          | Headless table logic for admin user lists and model selection tables. Rendered as custom card grids or data rows, not generic HTML tables.                        |
| **Sonner**                            | Toast notification system with stacking, dismiss, and action support. Visually customized to match dark theme.                                                    |
| **cmdk**                              | Command palette (Cmd+K) for rapid navigation between API keys, providers, and settings.                                                                           |
| **react-hot-toast** or **Sonner**     | Non-blocking notification for background operations (key created, provider selected).                                                                             |
| **next-themes**                       | Theme persistence with system detection, SSR-safe, no flash of unstyled content.                                                                                  |
| **react-markdown + rehype-highlight** | Markdown rendering for `/docs` section with syntax highlighting.                                                                                                  |
| **nuqs**                              | Type-safe URL search params for filter/sort/pagination state in list views.                                                                                       |
| **dnd-kit**                           | Drag-and-drop for model priority reordering within API key configuration. Accessible, performant.                                                                 |

### Dev Experience

| Package                 | Justification                            |
| ----------------------- | ---------------------------------------- |
| **ESLint + Prettier**   | Code consistency                         |
| **Husky + lint-staged** | Pre-commit quality gates                 |
| **next-safe-action**    | Type-safe server actions with validation |

---

## 4. Architecture Decisions

### 4.1 App Router over Pages Router

The App Router enables:

- **Server Components** for provider lists, model catalogs, and user tables — reducing client JS bundle
- **Streaming** with Suspense for progressive loading of deeply nested API key details
- **Route Groups** `(user)` and `(admin)` for isolated layout trees
- **Parallel Routes** for side-panel detail views (e.g., user detail drawer in admin)
- **Middleware** for authentication checks before rendering

### 4.2 TanStack Query over RTK Query

The backend returns pre-formatted, denormalized data (e.g., `fetchSingleApiKey` returns providers nested with models nested with stats). RTK Query's normalized entity cache would require defining entity adapters for every nested shape. TanStack Query treats each endpoint response as an opaque cache entry, which aligns with the backend's response formatting strategy.

Critical use case: The **API key unlock flow** returns `[{id, key}]` tuples that must be merged into existing masked entries. TanStack Query's `setQueryData` allows surgical cache updates without refetching the full list.

### 4.3 Zustand over Redux Toolkit for Client State

Server-state is handled entirely by TanStack Query. The remaining client-only state (theme, sidebar, modals, temporary UI flags) does not benefit from Redux's middleware pipeline or DevTools time-travel. Zustand provides a simpler API with equivalent functionality for these use cases.

### 4.4 Feature-First Organization

The codebase is organized by feature domain (apikeys, providers, admin) rather than by technical layer (components, hooks, services). This ensures each feature is self-contained with its own components, hooks, types, and API definitions.

---

## 5. Folder Structure Planning

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── admin/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── layout.tsx                    # Centered card layout, no sidebar
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Sidebar + topbar + main content
│   │   ├── page.tsx                      # Dashboard home / overview
│   │   ├── apikeys/
│   │   │   ├── page.tsx                  # API key list
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # API key detail + provider/model config
│   │   │       ├── models/
│   │   │       │   └── page.tsx          # Model selections + priority ordering
│   │   │       └── settings/
│   │   │           └── page.tsx          # maxIterations, roundhouseMethod
│   │   ├── providers/
│   │   │   ├── page.tsx                  # Combined global + custom provider list
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Provider detail with nested models
│   │   ├── keys/
│   │   │   └── page.tsx                  # ApiKeysManager (secret key vault)
│   │   ├── settings/
│   │   │   └── page.tsx                  # Profile, password, preferences
│   │   └── docs/
│   │       ├── page.tsx                  # Docs index
│   │       └── [...slug]/
│   │           └── page.tsx              # Dynamic doc pages
│   │
│   ├── (admin)/
│   │   ├── layout.tsx                    # Admin sidebar + topbar
│   │   ├── page.tsx                      # Admin dashboard / analytics
│   │   ├── providers/
│   │   │   ├── page.tsx                  # Global provider management
│   │   │   └── [id]/
│   │   │       └── page.tsx              # Provider detail + model CRUD
│   │   ├── users/
│   │   │   ├── page.tsx                  # User list with stats
│   │   │   └── [id]/
│   │   │       └── page.tsx              # User detail with full data tree
│   │   └── analytics/
│   │       └── page.tsx                  # Platform-wide analytics
│   │
│   ├── (public)/
│   │   ├── layout.tsx                    # Marketing/public layout
│   │   └── docs/
│   │       └── [...slug]/
│   │           └── page.tsx              # Public documentation
│   │
│   ├── layout.tsx                        # Root layout: providers, fonts, theme
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/                   # LoginForm, RegisterForm, AdminLoginForm
│   │   ├── hooks/                        # useAuth, useSession, useLogout
│   │   ├── api/                          # auth query/mutation definitions
│   │   ├── types/                        # AuthResponse, LoginPayload, etc.
│   │   └── stores/                       # auth zustand slice
│   │
│   ├── apikeys/
│   │   ├── components/                   # ApiKeyCard, ApiKeyDetail, ProviderSelector
│   │   ├── hooks/                        # useApiKeys, useApiKeyDetail, useApiKeyModels
│   │   ├── api/                          # apikey queries and mutations
│   │   └── types/
│   │
│   ├── providers/
│   │   ├── components/                   # ProviderCard, ModelCard, ProviderDetail
│   │   ├── hooks/
│   │   ├── api/
│   │   └── types/
│   │
│   ├── keys-manager/
│   │   ├── components/                   # KeyCard, UnlockDialog, MaskedKeyDisplay
│   │   ├── hooks/                        # useKeysManager, useUnlock
│   │   ├── api/
│   │   └── types/
│   │
│   ├── admin/
│   │   ├── providers/
│   │   ├── users/
│   │   └── analytics/
│   │
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   │
│   └── docs/
│       ├── components/
│       └── content/                      # Static markdown files
│
├── shared/
│   ├── components/
│   │   ├── ui/                           # Button, Input, Badge, Card, Skeleton, etc.
│   │   ├── layout/                       # Sidebar, Topbar, PageHeader, Container
│   │   ├── data-display/                 # StatCard, DataTable, EmptyState
│   │   ├── feedback/                     # Toast, ErrorBoundary, LoadingOverlay
│   │   ├── forms/                        # FormField, FormSection, FormActions
│   │   ├── modals/                       # ModalManager, ConfirmDialog, FormModal
│   │   └── navigation/                   # CommandPalette, Breadcrumbs, TabNav
│   │
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   ├── use-clipboard.ts
│   │   ├── use-confirmation.ts
│   │   ├── use-media-query.ts
│   │   ├── use-unsaved-changes.ts
│   │   └── use-keyboard-shortcut.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts                 # Axios/fetch wrapper with interceptors
│   │   ├── query-client.ts               # TanStack Query client configuration
│   │   ├── validators.ts                 # Shared Zod schemas
│   │   └── utils.ts                      # cn(), formatDate(), maskKey(), etc.
│   │
│   ├── types/
│   │   ├── api.ts                        # Generic API response wrapper
│   │   ├── entities.ts                   # User, Provider, Model, ApiKey, etc.
│   │   └── enums.ts                      # UserStatus, ContentStatus, ProviderType, etc.
│   │
│   └── constants/
│       ├── routes.ts                     # Route path constants
│       ├── query-keys.ts                 # TanStack Query key factory
│       └── config.ts                     # Environment variables
│
├── styles/
│   ├── globals.css                       # Tailwind directives + CSS custom properties
│   └── themes/                           # Theme token definitions
│
└── middleware.ts                          # Auth redirect, admin guard, session check
```

---

## 6. Routing Architecture

### 6.1 Route Map

#### Public Routes (No Auth Required)

| Route             | Page                 | Source API                       |
| ----------------- | -------------------- | -------------------------------- |
| `/login`          | User login           | `POST /api/iv1/auth/login`       |
| `/register`       | User registration    | `POST /api/iv1/auth/register`    |
| `/admin/login`    | Admin login          | `POST /api/iv1/admin/auth/login` |
| `/docs`           | Public documentation | Static markdown                  |
| `/docs/[...slug]` | Documentation pages  | Static markdown                  |

#### User Dashboard Routes (Auth Required, Role: USER)

| Route                    | Page                            | Source API                                              |
| ------------------------ | ------------------------------- | ------------------------------------------------------- |
| `/`                      | Dashboard overview              | Aggregated from multiple endpoints                      |
| `/apikeys`               | API key list                    | `GET /api/iv1/apikeys`                                  |
| `/apikeys/[id]`          | API key detail + config         | `GET /api/iv1/apikeys/:id`                              |
| `/apikeys/[id]/models`   | Model selection & priority      | `GET /api/iv1/apikeys/:id/models`                       |
| `/apikeys/[id]/settings` | Roundhouse settings             | `PATCH /api/iv1/apikeys/:id/settings`                   |
| `/providers`             | All providers (global + custom) | `GET /api/iv1/providers`                                |
| `/providers/[id]`        | Provider detail + models        | `GET /api/iv1/providers/:id`                            |
| `/keys`                  | API Keys Manager (vault)        | `GET /api/iv1/me/apikeys`                               |
| `/settings`              | Profile + password              | `GET /api/iv1/me`, `POST /api/iv1/auth/change-password` |

#### Admin Dashboard Routes (Auth Required, Role: ADMIN)

| Route                   | Page                         | Source API                         |
| ----------------------- | ---------------------------- | ---------------------------------- |
| `/admin`                | Admin dashboard + analytics  | `GET /api/iv1/admin/analytics`     |
| `/admin/providers`      | Global provider management   | `GET /api/iv1/admin/providers`     |
| `/admin/providers/[id]` | Provider detail + model CRUD | `GET /api/iv1/admin/providers/:id` |
| `/admin/users`          | User management              | `GET /api/iv1/admin/users`         |
| `/admin/users/[id]`     | User detail view             | `GET /api/iv1/admin/users/:id`     |
| `/admin/analytics`      | Detailed analytics           | `GET /api/iv1/admin/analytics`     |

### 6.2 Route Groups Strategy

- `(auth)` — Centered card layout, no sidebar, gradient background
- `(dashboard)` — Full sidebar + topbar layout, user context
- `(admin)` — Admin-specific sidebar + topbar, admin context
- `(public)` — Marketing/docs layout, optional auth

### 6.3 Dynamic Routing Patterns

- **Catch-all for docs**: `/docs/[...slug]` enables nested documentation paths
- **Nested params**: `/apikeys/[id]/models` for API key model management
- **Admin entity detail**: `/admin/users/[id]` for deep user inspection

### 6.4 Navigation Architecture

**User Sidebar Navigation:**

- Overview (dashboard icon)
- API Keys (key icon)
- Providers (layers icon)
- Key Vault (shield icon)
- Documentation (book icon)
- Settings (gear icon)

**Admin Sidebar Navigation:**

- Dashboard (chart icon)
- Providers (layers icon)
- Users (users icon)
- Analytics (activity icon)

---

## 7. State Management Strategy

### 7.1 State Categories

| Category            | Tool                     | Examples                                                       |
| ------------------- | ------------------------ | -------------------------------------------------------------- |
| **Server State**    | TanStack Query           | Provider lists, API key details, user profiles, analytics data |
| **UI State**        | Zustand                  | Sidebar collapsed, active modal, theme, command palette open   |
| **Form State**      | React Hook Form          | Provider creation form, API key settings, model configuration  |
| **URL State**       | nuqs                     | Search query, sort order, pagination page, active filters      |
| **Auth State**      | Zustand + TanStack Query | Current user, access token, role, session validity             |
| **Temporary State** | Zustand                  | Unlocked API keys (time-limited), unsaved changes flag         |

### 7.2 Zustand Store Architecture

```
stores/
├── auth-store.ts          # { user, token, role, isAuthenticated, login(), logout() }
├── ui-store.ts            # { sidebarCollapsed, commandPaletteOpen, activeTheme }
├── modal-store.ts         # { stack: Modal[], push(), pop(), clear() }
├── unlock-store.ts        # { unlockedKeys: Map<id, key>, unlockTimestamp, clearAfterTimeout() }
└── unsaved-store.ts       # { isDirty, dirtyFields, markDirty(), clearDirty() }
```

### 7.3 TanStack Query Key Factory

```
queryKeys = {
  apikeys: {
    all: ['apikeys'],
    list: (filters) => ['apikeys', 'list', filters],
    detail: (id) => ['apikeys', 'detail', id],
    models: (id) => ['apikeys', 'models', id],
  },
  providers: {
    all: ['providers'],
    list: (filters) => ['providers', 'list', filters],
    detail: (id) => ['providers', 'detail', id],
    models: (id) => ['providers', 'models', id],
  },
  keysManager: {
    all: ['keys-manager'],
    list: (filters) => ['keys-manager', 'list', filters],
    unlocked: ['keys-manager', 'unlocked'],
  },
  admin: {
    analytics: ['admin', 'analytics'],
    providers: { ... },
    users: { ... },
  },
  me: {
    profile: ['me', 'profile'],
    providers: { ... },
  },
}
```

### 7.4 Cache Invalidation Strategy

| Mutation                      | Invalidates                                                |
| ----------------------------- | ---------------------------------------------------------- |
| Create API Key                | `apikeys.list`                                             |
| Update API Key                | `apikeys.detail(id)`, `apikeys.list`                       |
| Delete API Key                | `apikeys.list`                                             |
| Select Provider for API Key   | `apikeys.detail(id)`                                       |
| Select/Deselect Models        | `apikeys.detail(id)`, `apikeys.models(id)`                 |
| Reorder Model Priorities      | `apikeys.models(id)`                                       |
| Update API Key Settings       | `apikeys.detail(id)`                                       |
| Unlock API Keys               | Sets `unlock-store`, does NOT invalidate list (merge only) |
| Create/Update/Delete Provider | `providers.list`, `providers.detail(id)`                   |
| Create/Update/Delete Model    | `providers.detail(id)`, `providers.models(id)`             |

---

## 8. API Integration Strategy

### 8.1 HTTP Client Architecture

A centralized API client wrapping `fetch` (preferred over Axios for Next.js edge compatibility):

**Responsibilities:**

- Base URL configuration from environment variables
- Authorization header injection from auth store
- Response envelope unwrapping (all backend responses follow `{ success, statusCode, message, data?, pagination? }`)
- Error normalization into typed `ApiError` instances
- Request/response logging in development
- Automatic token refresh on 401 (future: refresh token flow)
- Request deduplication via AbortController

### 8.2 Response Envelope

All backend responses follow this structure:

```
{
  success: boolean
  statusCode: number
  message: string
  data?: T
  pagination?: {
    page: number
    limit: number
    total: number
    totalPage: number
  }
}
```

The API client must unwrap this envelope and return `{ data: T, pagination? }` to consumers, throwing on `success: false`.

### 8.3 API Layer per Feature

Each feature defines its own API layer:

```
features/apikeys/api/
├── queries.ts       # useApiKeys(), useApiKeyDetail(id), useApiKeyModels(id)
├── mutations.ts     # useCreateApiKey(), useUpdateApiKey(), useDeleteApiKey(), etc.
└── endpoints.ts     # Raw endpoint path constants
```

**Query functions** return TanStack Query `useQuery` / `useSuspenseQuery` hooks with:

- Typed return data
- Appropriate `staleTime` (30s for lists, 60s for details)
- `gcTime` of 5 minutes
- `refetchOnWindowFocus: true` for operational data

**Mutation functions** return `useMutation` hooks with:

- `onSuccess` cache invalidation
- Optimistic updates where applicable (toggle active/inactive)
- Error toast notifications
- Success toast notifications

### 8.4 API Endpoint Map

#### Auth Endpoints

- `POST /api/iv1/auth/register` — Register user
- `POST /api/iv1/auth/login` — Login user (returns accessToken + refreshToken)
- `POST /api/iv1/auth/change-password` — Change password (requires auth)

#### Profile Endpoints

- `GET /api/iv1/me` — Get current user profile
- `PATCH /api/iv1/me` — Update profile (multipart/form-data for avatar)

#### Providers Endpoints (User-facing, merged global + custom)

- `GET /api/iv1/providers` — List all providers with model counts and connection status
- `GET /api/iv1/providers/:id` — Provider detail with models
- `GET /api/iv1/providers/:id/models` — Provider's active models

#### Custom Provider Endpoints (User's own providers)

- `GET /api/iv1/me/providers` — List user's custom providers
- `POST /api/iv1/me/providers` — Create custom provider
- `PATCH /api/iv1/me/providers/:id` — Update custom provider
- `PATCH /api/iv1/me/providers/:id/status` — Update provider status
- `DELETE /api/iv1/me/providers/:id` — Delete custom provider
- `GET /api/iv1/me/providers/:id/models` — List custom provider models
- `POST /api/iv1/me/providers/:id/models` — Add model to custom provider
- `PATCH /api/iv1/me/providers/models/:modelId` — Update model
- `PATCH /api/iv1/me/providers/models/:modelId/status` — Update model status
- `DELETE /api/iv1/me/providers/models/:modelId` — Delete model

#### API Keys Endpoints

- `GET /api/iv1/apikeys` — List API keys with stats
- `POST /api/iv1/apikeys` — Create API key
- `GET /api/iv1/apikeys/:id` — API key detail (providers, models, stats)
- `PATCH /api/iv1/apikeys/:id` — Update API key (name, active)
- `PATCH /api/iv1/apikeys/:id/settings` — Update settings (maxIterations, roundhouseMethod)
- `PATCH /api/iv1/apikeys/:id/status` — Toggle active
- `DELETE /api/iv1/apikeys/:id` — Delete API key
- `POST /api/iv1/apikeys/:id/providers/:providerId` — Select provider (with apiKeysManagerIds)
- `DELETE /api/iv1/apikeys/:id/selections/:selectionId` — Remove provider selection
- `PATCH /api/iv1/apikeys/:id/providers/:providerId/models` — Select models
- `DELETE /api/iv1/apikeys/:id/providers/:providerId/models` — Deselect models
- `PATCH /api/iv1/apikeys/:id/providers/:providerId/status` — Toggle provider selection active
- `PATCH /api/iv1/apikeys/:id/models/:modelId/status` — Toggle model selection active
- `GET /api/iv1/apikeys/:id/models` — All model selections with priority
- `PATCH /api/iv1/apikeys/:id/models/priority` — Reorder model priorities

#### Keys Manager Endpoints

- `GET /api/iv1/me/apikeys` — List managed API keys (masked)
- `POST /api/iv1/me/apikeys` — Create managed API key
- `PATCH /api/iv1/me/apikeys/:id` — Update managed key (name, active)
- `DELETE /api/iv1/me/apikeys/:id` — Delete managed key
- `POST /api/iv1/me/apikeys/unlock` — Unlock all keys (password required, returns [{id, key}])

#### Admin Endpoints

- `POST /api/iv1/admin/auth/login` — Admin login
- `GET /api/iv1/admin/analytics` — Platform analytics
- `GET /api/iv1/admin/providers` — List providers (with pagination)
- `GET /api/iv1/admin/providers/:id` — Provider detail
- `POST /api/iv1/admin/providers` — Create global provider
- `PATCH /api/iv1/admin/providers/:id` — Update provider
- `PATCH /api/iv1/admin/providers/:id/status` — Update provider status
- `DELETE /api/iv1/admin/providers/:id` — Delete provider
- `GET /api/iv1/admin/providers/:id/models` — List provider models
- `POST /api/iv1/admin/providers/:id/models` — Create model
- `PATCH /api/iv1/admin/providers/models/:modelId` — Update model
- `PATCH /api/iv1/admin/providers/models/:modelId/status` — Update model status
- `DELETE /api/iv1/admin/providers/models/:modelId` — Delete model
- `GET /api/iv1/admin/users` — List users with stats
- `GET /api/iv1/admin/users/:id` — User detail
- `PATCH /api/iv1/admin/users/:id` — Update user
- `PATCH /api/iv1/admin/users/:id/status` — Update user status
- `DELETE /api/iv1/admin/users/:id` — Delete user

---

## 9. Authentication & Authorization Flow

### 9.1 Auth Architecture

- **Token Storage**: Access token stored in Zustand (memory) + `localStorage` for persistence across tabs. Refresh token stored in `localStorage`.
- **Token Injection**: API client reads from auth store and attaches `Authorization: Bearer <token>` to every request.
- **Token Refresh**: On 401 response, attempt refresh using stored refresh token via a queued retry mechanism. If refresh fails, redirect to login.
- **Session Validation**: On app mount, validate stored token by calling `GET /api/iv1/me`. If invalid, clear auth state and redirect.

### 9.2 Login Flows

**User Login:**

1. User submits email + password to `POST /api/iv1/auth/login`
2. Backend returns `{ accessToken, refreshToken }`
3. Store both tokens, fetch profile via `GET /api/iv1/me`
4. Redirect to `/(dashboard)` root
5. If user status is INACTIVE → show blocked state, do not redirect

**Admin Login:**

1. Admin submits email + password to `POST /api/iv1/admin/auth/login`
2. Backend returns token (same JWT structure, role checked server-side)
3. Store token, redirect to `/(admin)` root
4. Admin routes check role from decoded JWT or profile fetch

**Registration:**

1. User submits name, email, password to `POST /api/iv1/auth/register`
2. On success, redirect to login page with success toast
3. Do NOT auto-login after registration (security best practice)

### 9.3 Route Protection

**Next.js Middleware** (`middleware.ts`):

- Check for valid token cookie/header on every request
- Redirect unauthenticated users from `(dashboard)` and `(admin)` routes to `/login`
- Redirect authenticated users from `(auth)` routes to dashboard
- Check admin role for `(admin)` routes — redirect non-admins to user dashboard

**Client-Side Guards:**

- `AuthProvider` component wraps protected layouts
- On mount, validates token and fetches user profile
- Shows full-page loading skeleton during validation
- Redirects on failure

### 9.4 Session Expiration Handling

- **Proactive**: Decode JWT `exp` claim client-side. When token is within 5 minutes of expiry, trigger background refresh.
- **Reactive**: On any 401 response, attempt refresh. If refresh fails, show "Session Expired" modal with login redirect button.
- **Tab Sync**: Use `BroadcastChannel` or `storage` event to sync logout across browser tabs.

### 9.5 Unauthorized Access Behavior

- Accessing a user route without auth → redirect to `/login` with `?redirect=` param
- Accessing an admin route as a user → redirect to user dashboard with "Insufficient permissions" toast
- Accessing a user route as an admin → allowed (admin has superset permissions)
- Deep link preservation: Store intended URL before redirect, navigate there after successful login

---

## 10. Theme System

### 10.1 Theme Architecture

- **Default**: Dark mode
- **Options**: Dark, Light, System
- **Detection**: `prefers-color-scheme` media query via `next-themes`
- **Persistence**: `localStorage` key `roundhouse-theme`
- **SSR Safety**: Theme class applied via `next-themes` `attribute="class"` strategy to prevent flash
- **Toggle**: Accessible in topbar as a segmented control (Sun / Moon / Monitor icons)

### 10.2 Implementation Strategy

CSS custom properties defined on `:root` and `.dark` / `.light` classes in `globals.css`. Tailwind CSS v4 configured to consume these properties. All component styles reference CSS variables, never hardcoded color values.

### 10.3 Theme Token Structure

```
--color-bg-primary          # Page background
--color-bg-secondary        # Elevated surface (sidebar, topbar)
--color-bg-card             # Card/panel background
--color-bg-card-hover       # Card hover state
--color-bg-input            # Form input background
--color-bg-overlay          # Modal/dialog backdrop

--color-text-primary        # Primary body text
--color-text-secondary      # Subdued text (descriptions, metadata)
--color-text-muted          # Very subdued text (placeholders, disabled)
--color-text-inverse        # Text on accent backgrounds

--color-border-primary      # Default borders
--color-border-subtle       # Very subtle separators
--color-border-focused      # Focus ring color

--color-accent-primary      # Primary action color (cyan-based)
--color-accent-secondary    # Secondary accent (indigo-based)
--color-accent-primary-hover
--color-accent-primary-active

--color-status-success      # Green — active, healthy, success
--color-status-warning      # Amber — testing, upcoming, caution
--color-status-error        # Rose — failed, banned, error
--color-status-info         # Blue — informational
--color-status-inactive     # Zinc — inactive, disabled

--color-shadow              # Tinted shadow color (not pure black)

--radius-sm                 # 6px
--radius-md                 # 10px
--radius-lg                 # 16px
--radius-xl                 # 24px
```

---

## 11. Design System

### 11.1 Component Design Principles

- **Elevation Hierarchy**: Use tinted shadows (shadow color matches background hue) sparingly. Most hierarchy is communicated through background color differences and 1px borders.
- **Border Philosophy**: `1px solid` borders using `--color-border-subtle` for card outlines. No thick borders. Border color includes transparency (rgba-based).
- **Corner Radius**: Cards use `--radius-lg` (16px). Buttons use `--radius-md` (10px). Inputs use `--radius-md`. Pills/badges use `--radius-xl` (24px — full-round).
- **Spacing Scale**: 4px base unit. Common values: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- **Glassmorphism**: Applied selectively to floating panels (command palette, dropdowns). Implementation: `backdrop-blur-xl` + `border border-white/10` + `shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]`.
- **Depth**: Maximum 3 visual depth layers: page background → card surface → floating element.

### 11.2 Component Library Structure

**Primitive Components** (shared/components/ui/):

- Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
- Input (with label, helper text, error state)
- Select (custom dropdown via Radix)
- Textarea
- Toggle / Switch
- Checkbox
- Badge (variants: status colors, outline, solid)
- Avatar (image + fallback initials)
- Skeleton (shimmer animation, matches target component dimensions)
- Tooltip (via Radix)
- Dropdown Menu (via Radix)
- Popover (via Radix)
- Separator

**Composite Components** (shared/components/):

- StatCard — KPI display: label + large number + trend indicator + sparkline
- DataCard — Entity display: header + body + actions + status badge
- PageHeader — title + description + breadcrumbs + actions
- EmptyState — icon + heading + description + CTA button
- ErrorState — icon + error message + retry button
- SearchInput — debounced search with clear button and loading indicator
- FilterBar — composable filter chips with dropdowns
- Pagination — page numbers + prev/next + page size selector
- StatusBadge — maps ContentStatus and UserStatus enums to colored badges
- CopyButton — click-to-copy with checkmark confirmation animation
- MaskedValue — shows `****` with reveal toggle icon
- ConfirmDialog — destructive action confirmation with typed confirmation input

---

## 12. Typography System

### 12.1 Font Stack

- **Primary (UI)**: `Geist Sans` — clean, modern, designed for interfaces. Loaded via `next/font/google` with `display: swap`.
- **Monospace (Data)**: `Geist Mono` — for API keys, model codes, provider codes, statistics, and any technical identifiers.
- **Fallback**: `system-ui, -apple-system, sans-serif`

### 12.2 Type Scale

| Token       | Size             | Weight | Line Height | Tracking | Usage                               |
| ----------- | ---------------- | ------ | ----------- | -------- | ----------------------------------- |
| `display`   | 36px / 2.25rem   | 700    | 1.1         | -0.025em | Page titles (Dashboard, Providers)  |
| `heading-1` | 28px / 1.75rem   | 600    | 1.2         | -0.02em  | Section headers                     |
| `heading-2` | 22px / 1.375rem  | 600    | 1.25        | -0.015em | Card titles, modal titles           |
| `heading-3` | 18px / 1.125rem  | 600    | 1.3         | -0.01em  | Subsection headers                  |
| `body-lg`   | 16px / 1rem      | 400    | 1.6         | 0        | Primary body text                   |
| `body`      | 14px / 0.875rem  | 400    | 1.5         | 0        | Default body, descriptions          |
| `body-sm`   | 13px / 0.8125rem | 400    | 1.5         | 0.005em  | Secondary text, metadata            |
| `caption`   | 12px / 0.75rem   | 500    | 1.4         | 0.01em   | Labels, timestamps, badges          |
| `mono`      | 13px / 0.8125rem | 400    | 1.5         | 0.02em   | API keys, codes, stats (Geist Mono) |
| `stat`      | 32px / 2rem      | 700    | 1.0         | -0.02em  | Large KPI numbers                   |

### 12.3 Typography Rules

- Maximum line length for body text: `max-w-[65ch]`
- All headings use `tracking-tight` or tighter
- Monospace font for ALL numeric data in stat cards and analytics
- No serif fonts anywhere in the application
- Font weight progression: 400 (body) → 500 (labels) → 600 (headings) → 700 (display/stats)

---

## 13. Color System

### 13.1 Dark Mode Palette

| Token                  | Value                       | Usage                                           |
| ---------------------- | --------------------------- | ----------------------------------------------- |
| `bg-primary`           | `#080C16`                   | Page background (off-black with blue undertone) |
| `bg-secondary`         | `#111827`                   | Sidebar, topbar, elevated surfaces              |
| `bg-card`              | `#151D2E`                   | Card backgrounds                                |
| `bg-card-hover`        | `#1A2438`                   | Card hover state                                |
| `bg-input`             | `#0F1624`                   | Input backgrounds                               |
| `bg-overlay`           | `rgba(0, 0, 0, 0.6)`        | Modal backdrops                                 |
| `text-primary`         | `#F1F5F9`                   | Primary text (slate-100)                        |
| `text-secondary`       | `#94A3B8`                   | Secondary text (slate-400)                      |
| `text-muted`           | `#64748B`                   | Muted text (slate-500)                          |
| `accent-primary`       | `#22D3EE`                   | Primary actions, links (cyan-400)               |
| `accent-primary-hover` | `#06B6D4`                   | Hover state (cyan-500)                          |
| `accent-secondary`     | `#818CF8`                   | Secondary accent (indigo-400)                   |
| `border-primary`       | `rgba(255, 255, 255, 0.08)` | Default borders                                 |
| `border-subtle`        | `rgba(255, 255, 255, 0.04)` | Subtle separators                               |

### 13.2 Light Mode Palette

| Token              | Value                    | Usage                                       |
| ------------------ | ------------------------ | ------------------------------------------- |
| `bg-primary`       | `#F6F8FC`                | Page background (warm white with blue tint) |
| `bg-secondary`     | `#FFFFFF`                | Sidebar, topbar                             |
| `bg-card`          | `#EEF2FF`                | Card backgrounds (indigo-50 tint)           |
| `bg-card-hover`    | `#E8ECFA`                | Card hover                                  |
| `bg-input`         | `#F1F5F9`                | Input backgrounds                           |
| `text-primary`     | `#0F172A`                | Primary text (slate-900)                    |
| `text-secondary`   | `#475569`                | Secondary text (slate-600)                  |
| `text-muted`       | `#94A3B8`                | Muted text (slate-400)                      |
| `accent-primary`   | `#0891B2`                | Primary actions (cyan-600)                  |
| `accent-secondary` | `#4F46E5`                | Secondary accent (indigo-600)               |
| `border-primary`   | `rgba(15, 23, 42, 0.08)` | Default borders                             |

### 13.3 Semantic Status Colors

| Status                | Dark                    | Light                   | Maps To                                     |
| --------------------- | ----------------------- | ----------------------- | ------------------------------------------- |
| Success / ACTIVE      | `#34D399` (emerald-400) | `#059669` (emerald-600) | ContentStatus.ACTIVE, successful operations |
| Warning / TESTING     | `#FBBF24` (amber-400)   | `#D97706` (amber-600)   | ContentStatus.TESTING, UPCOMING             |
| Error / BANNED        | `#FB7185` (rose-400)    | `#E11D48` (rose-600)    | UserStatus.BANNED, failures, delete         |
| Info                  | `#60A5FA` (blue-400)    | `#2563EB` (blue-600)    | Informational states                        |
| Inactive / DEPRECATED | `#71717A` (zinc-500)    | `#A1A1AA` (zinc-400)    | ContentStatus.INACTIVE, DEPRECATED          |
| Pending               | `#C084FC` (purple-400)  | `#7C3AED` (purple-600)  | UserStatus.PENDING                          |

### 13.4 Provider Type Colors

Each ProviderType gets a distinct accent for visual identification:

- **OPENAI**: Emerald (`#34D399`)
- **ANTHROPIC**: Amber (`#FBBF24`)
- **GEMINI**: Blue (`#60A5FA`)
- **CUSTOM**: Purple (`#C084FC`)

---

## 14. Spacing & Layout System

### 14.1 Spacing Scale

Base unit: 4px. Tailwind spacing utilities used directly.

| Token      | Value | Usage                               |
| ---------- | ----- | ----------------------------------- |
| `space-1`  | 4px   | Inline icon gaps                    |
| `space-2`  | 8px   | Tight padding (badges, chips)       |
| `space-3`  | 12px  | Input padding, compact card padding |
| `space-4`  | 16px  | Default element spacing             |
| `space-5`  | 20px  | Card padding                        |
| `space-6`  | 24px  | Section gaps                        |
| `space-8`  | 32px  | Major section spacing               |
| `space-10` | 40px  | Page-level spacing                  |
| `space-12` | 48px  | Large gaps between major sections   |

### 14.2 Layout Grid

- **Page container**: `max-w-[1400px] mx-auto px-6`
- **Dashboard grid**: CSS Grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- **Sidebar width**: 260px collapsed to 72px on mobile/tablet
- **Topbar height**: 64px
- **Content area**: `min-h-[calc(100dvh-64px)]`
- **Card grid**: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`
- **Form layout**: Single column, `max-w-2xl`, `gap-6` between fields

### 14.3 Breakpoint Strategy

| Breakpoint | Width  | Behavior                                            |
| ---------- | ------ | --------------------------------------------------- |
| `sm`       | 640px  | Mobile — single column, sidebar hidden              |
| `md`       | 768px  | Tablet — 2-col grids, sidebar collapsed (icon-only) |
| `lg`       | 1024px | Desktop — sidebar expanded, 3-col grids             |
| `xl`       | 1280px | Wide — 4-col grids, expanded analytics              |
| `2xl`      | 1536px | Ultra-wide — maximum container, comfortable density |

---

## 15. Animation System

### 15.1 Animation Philosophy

Animations must feel **fast, purposeful, and physically grounded**. Every animation must communicate state change, spatial relationship, or interaction feedback. No decorative motion.

### 15.2 Motion Tokens

| Token             | Value                                                       | Usage                                      |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------ |
| `duration-fast`   | 150ms                                                       | Hover states, toggles, small state changes |
| `duration-normal` | 250ms                                                       | Page transitions, card expand/collapse     |
| `duration-slow`   | 400ms                                                       | Modal enter/exit, complex layout shifts    |
| `easing-default`  | `cubic-bezier(0.16, 1, 0.3, 1)`                             | Standard ease-out for most transitions     |
| `easing-spring`   | Framer Motion `type: "spring", stiffness: 400, damping: 30` | Interactive elements, tactile feedback     |
| `easing-bounce`   | Framer Motion `type: "spring", stiffness: 300, damping: 20` | Entry animations, attention-drawing        |

### 15.3 Animation Catalog

| Element               | Animation                              | Implementation                                  |
| --------------------- | -------------------------------------- | ----------------------------------------------- |
| **Page transition**   | Fade + slight upward slide (8px)       | Framer Motion `AnimatePresence` on route change |
| **Card list load**    | Staggered fade-in (50ms between items) | `staggerChildren: 0.05` on parent motion div    |
| **Modal enter**       | Scale from 0.95 + fade, 250ms          | Radix Dialog + Framer Motion                    |
| **Modal exit**        | Scale to 0.95 + fade, 150ms            | Radix Dialog + Framer Motion                    |
| **Sidebar expand**    | Width transition 72px → 260px, 200ms   | CSS transition on `width`                       |
| **Hover states**      | Background color transition, 150ms     | Tailwind `transition-colors duration-150`       |
| **Button press**      | `scale(0.98)` on `:active`             | CSS `active:scale-[0.98]`                       |
| **Toggle switch**     | Spring physics on knob position        | Framer Motion `layout` prop                     |
| **Skeleton shimmer**  | Linear gradient sweep, 1.5s infinite   | CSS `@keyframes` on pseudo-element              |
| **Toast enter**       | Slide in from right + fade, spring     | Sonner default with custom spring config        |
| **Copy confirmation** | Key icon → checkmark morph, 200ms      | Framer Motion `AnimatePresence` + `layoutId`    |
| **Card expand**       | Height auto-animation via `layout`     | Framer Motion `layout` prop                     |
| **Priority reorder**  | Smooth position swap via `layout`      | dnd-kit + Framer Motion `layoutId`              |
| **Chart data load**   | Draw-in animation on mount             | Recharts `animationDuration={800}`              |
| **Badge pulse**       | Subtle scale pulse for live indicators | CSS `animate-pulse` (custom, subtle)            |

### 15.4 Reduced Motion Support

When `prefers-reduced-motion: reduce` is active:

- All `transition-duration` values set to `0ms`
- Framer Motion animations disabled via `MotionConfig reducedMotion="user"`
- Skeleton shimmer replaced with static placeholder
- Chart animations disabled
- Staggered reveals execute instantly

---

## 16. Shared Component Planning

### 16.1 StatusBadge Component

Maps backend enum values to visual badges:

| Status                   | Color   | Label      |
| ------------------------ | ------- | ---------- |
| `ACTIVE`                 | Emerald | Active     |
| `INACTIVE`               | Zinc    | Inactive   |
| `DEPRECATED`             | Amber   | Deprecated |
| `TESTING`                | Blue    | Testing    |
| `UPCOMING`               | Purple  | Upcoming   |
| `BANNED`                 | Rose    | Banned     |
| `PENDING`                | Amber   | Pending    |
| `true` (active boolean)  | Emerald | Active     |
| `false` (active boolean) | Zinc    | Inactive   |

### 16.2 StatCard Component

Displays a single KPI metric:

- **Label**: Caption-sized text (e.g., "Total Providers")
- **Value**: Large stat number in monospace font
- **Trend**: Optional percentage change with up/down indicator
- **Icon**: Optional contextual icon
- **Sparkline**: Optional mini chart (last 7 data points)

### 16.3 EntityCard Component

Reusable card for any entity (Provider, API Key, User):

- **Header row**: Name/title + status badge + action menu (three-dot dropdown)
- **Body**: Configurable content slots
- **Footer**: Metadata (created date, stats summary)
- **Hover**: Subtle background shift + border highlight
- **Click**: Navigates to detail page

### 16.4 MaskedValue Component

For displaying sensitive data (API keys):

- Default: Shows masked version (`rh_k_****_abcd`)
- Reveal button: Eye icon toggle
- Auto-hide: Reverts to masked after configurable timeout (30s default)
- Copy: Copies actual value (if unlocked) or masked value

### 16.5 ProviderIcon Component

Maps ProviderType to a consistent icon/color:

- OPENAI → Emerald circle with "O"
- ANTHROPIC → Amber circle with "A"
- GEMINI → Blue circle with "G"
- CUSTOM → Purple circle with user's first letter

---

## 17. Shared Hook Planning

### 17.1 Core Hooks

| Hook                                | Purpose                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `useAuth()`                         | Returns `{ user, token, isAuthenticated, isAdmin, login, logout, isLoading }` |
| `useDebounce(value, delay)`         | Debounces value changes (search inputs)                                       |
| `useClipboard()`                    | Returns `{ copy, isCopied }` with auto-reset after 2s                         |
| `useConfirmation()`                 | Returns `{ confirm, ConfirmDialog }` — imperative confirmation flow           |
| `useMediaQuery(query)`              | SSR-safe media query hook                                                     |
| `useUnsavedChanges(isDirty)`        | Prompts before navigation when form has unsaved changes                       |
| `useKeyboardShortcut(key, handler)` | Registers global keyboard shortcuts                                           |
| `usePagination(queryKey)`           | Manages page/limit state synced with URL params                               |
| `useFilters(config)`                | Manages filter state synced with URL params                                   |
| `useSort(defaultSort)`              | Manages sort state synced with URL params                                     |
| `useSearchParams()`                 | Type-safe URL search param management via `nuqs`                              |

### 17.2 Feature-Specific Hooks

| Hook                          | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `useApiKeys(filters?)`        | Fetches paginated API key list                         |
| `useApiKeyDetail(id)`         | Fetches single API key with full provider/model tree   |
| `useApiKeyModels(id)`         | Fetches model selections with priority ordering        |
| `useProviders(filters?)`      | Fetches merged global + custom provider list           |
| `useProviderDetail(id)`       | Fetches provider with models                           |
| `useKeysManager(filters?)`    | Fetches masked API keys manager list                   |
| `useUnlockKeys()`             | Mutation: unlock keys with password, merges into cache |
| `useProfile()`                | Fetches current user profile                           |
| `useAdminAnalytics()`         | Fetches admin dashboard analytics                      |
| `useAdminUsers(filters?)`     | Fetches admin user list                                |
| `useAdminProviders(filters?)` | Fetches admin provider list                            |

---

## 18. Modal System Architecture

### 18.1 Modal Manager

A global modal manager using Zustand stores a stack of active modals:

```
modalStore = {
  stack: [
    { id: 'confirm-delete', component: ConfirmDialog, props: {...} },
    { id: 'create-apikey', component: CreateApiKeyModal, props: {...} },
  ],
  push(modal),
  pop(),
  clear(),
  isOpen(id),
}
```

The `ModalManager` component renders at the root layout level, iterating over the stack and rendering each modal with its backdrop. Only the topmost modal is interactive; lower modals are visually dimmed.

### 18.2 Modal Types

| Type              | Behavior                                                                                  | Examples                                                       |
| ----------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **FormModal**     | Contains a form with Save/Cancel actions. Tracks unsaved changes. Prompts before dismiss. | Create API Key, Create Provider, Create Model, Update Settings |
| **ConfirmDialog** | Binary Yes/No confirmation. Supports typed confirmation for destructive actions.          | Delete API Key, Delete Provider, Delete User                   |
| **SecureModal**   | Requires password input before proceeding. Shows lock icon.                               | Unlock API Keys, Change Password confirmation                  |
| **DetailDrawer**  | Slides in from right (not a centered modal). Shows entity detail without full navigation. | Quick user detail in admin, quick provider detail              |
| **InfoModal**     | Read-only information display. Single dismiss button.                                     | API key creation success (shows key once)                      |

### 18.3 Modal Animation Spec

- **Enter**: Backdrop fades in (200ms) → Modal scales from 0.95 to 1.0 + fades in (250ms, spring)
- **Exit**: Modal scales to 0.97 + fades out (150ms) → Backdrop fades out (150ms)
- **Drawer Enter**: Backdrop fades in (200ms) → Panel slides from right edge (300ms, spring with damping)
- **Drawer Exit**: Panel slides right (200ms) → Backdrop fades out (150ms)

### 18.4 Mobile Modal Behavior

- On viewports below `md` (768px), all modals render as **bottom sheets** sliding up from the bottom
- Bottom sheets support drag-to-dismiss gesture
- Maximum height: `85dvh` with internal scroll
- Drawers become full-screen overlays on mobile

### 18.5 Nested Modal Handling

- Maximum 3 levels of modal nesting (prevent modal hell)
- Each subsequent modal adds a darker backdrop layer
- Closing the top modal reveals the one beneath with a subtle scale-up animation
- Example: API Key Detail → Select Provider Modal → Confirm Selection Dialog

### 18.6 Keyboard Behavior

- `Escape` closes the topmost modal
- `Tab` traps focus within the active modal
- Form modals support `Cmd/Ctrl+Enter` to submit
- Confirm dialogs support `Enter` to confirm (only when confirm button is focused)

---

## 19. Page-Level Component Planning — Auth Pages

### 19.1 Login Page (`/login`)

**Layout**: Centered card on gradient background. No sidebar. Subtle animated grid pattern behind the card.

**Components**:

- App logo + wordmark at top
- `LoginForm`: Email input, Password input (with show/hide toggle), Submit button, Loading state
- "Don't have an account?" link to `/register`
- "Admin?" link to `/admin/login`
- Error display: Inline field errors from Zod + API error banner above form

**Form Schema (Zod)**:

```
loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
})
```

**Behavior**:

- Submit calls `POST /api/iv1/auth/login`
- On success: store tokens → fetch profile → redirect to `/`
- On error: show API error message in alert banner
- Disable submit button during loading, show spinner

### 19.2 Register Page (`/register`)

**Layout**: Same centered card layout as login.

**Components**:

- `RegisterForm`: Name, Email, Password, Confirm Password inputs + Submit
- "Already have an account?" link to `/login`

**Form Schema (Zod)**:

```
registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match", path: ["confirmPassword"]
})
```

**Behavior**:

- Submit calls `POST /api/iv1/auth/register`
- On success: redirect to `/login` with success toast
- Do NOT auto-login

### 19.3 Admin Login Page (`/admin/login`)

**Layout**: Same centered card but with distinct visual treatment — darker card, red/amber accent border to signal elevated access.

**Components**:

- Admin shield icon + "Admin Console" heading
- `AdminLoginForm`: Email, Password, Submit
- "Back to user login" link

**Form Schema**: Same as `loginSchema`.

**Behavior**:

- Submit calls `POST /api/iv1/admin/auth/login`
- On success: store token → redirect to `/admin`
- Must verify role is ADMIN from returned profile

---

## 20. Page-Level Component Planning — Dashboard Overview

### 20.1 User Dashboard Home (`/`)

**Purpose**: At-a-glance operational overview of the user's Roundhouse configuration.

**Layout**: PageHeader + 4-column stat grid + recent activity cards.

**Components**:

**Stat Row** (4 StatCards):

- Total API Keys (count from API keys list)
- Active Providers (count of connected providers)
- Total Models Selected (aggregated from API key model selections)
- Total Successful Requests (sum of successCount across all apiKeysManagers)

**Quick Actions Bar**:

- "Create API Key" button → opens CreateApiKeyModal
- "Add Provider" button → navigates to `/providers`
- "Manage Keys" button → navigates to `/keys`

**Recent API Keys Section**:

- Shows last 3-5 API keys as compact cards
- Each shows: name, active status, provider count, model count, last used
- "View All" link to `/apikeys`

**Getting Started Checklist** (shown only when account is new):

- [ ] Create your first API Key
- [ ] Add a provider API key to the vault
- [ ] Select a provider for your API key
- [ ] Make your first API call

**Data Sources**:

- `GET /api/iv1/apikeys?limit=5&sort=newest`
- `GET /api/iv1/providers` (for provider count)
- `GET /api/iv1/me/apikeys` (for key vault count)

---

## 21. Page-Level Component Planning — API Keys Feature

### 21.1 API Keys List Page (`/apikeys`)

**Purpose**: Primary management hub for all Roundhouse API keys.

**Layout**: PageHeader with "Create API Key" CTA + SearchInput + FilterBar + Card Grid + Pagination

**PageHeader**:

- Title: "API Keys"
- Description: "Manage your Roundhouse API keys and their provider configurations"
- Action: Primary button "Create API Key"

**Filters**:

- Search: by name (debounced, query param `search`)
- Status: Active / Inactive toggle (query param `active`)
- Sort: Newest / Oldest / Name A-Z (query param `sort`)

**API Key Card** (`ApiKeyCard`):
Each card displays:

- **Header**: Key name + StatusBadge (active/inactive) + three-dot action menu
- **Key display**: Masked key value (`rh_k_****`) in monospace + CopyButton
- **Settings pills**: `roundhouseMethod` badge (RANDOM/EFFICIENCY/PRIORITY) + `maxIterations` badge
- **Stats row** (4 mini stats): Providers, Models, API Keys Linked, Successful Requests
- **Footer**: Created date + "Configure" link
- **Actions menu**: Edit Name, Toggle Active, Copy Key, Delete (with confirm)

**Empty State**: Illustration + "Create your first API Key" CTA

**Data Source**: `GET /api/iv1/apikeys` with query params for search, filter, sort, pagination

**Mutations**:

- `POST /api/iv1/apikeys` — Create (via modal)
- `PATCH /api/iv1/apikeys/:id` — Update name
- `PATCH /api/iv1/apikeys/:id/status` — Toggle active
- `DELETE /api/iv1/apikeys/:id` — Delete (with ConfirmDialog)

### 21.2 API Key Detail Page (`/apikeys/[id]`)

**Purpose**: Complete configuration interface for a single API key — the most complex page in the application.

**Layout**: PageHeader with breadcrumbs + Tab navigation (Overview / Providers / Models / Settings)

**PageHeader**:

- Breadcrumb: API Keys > [Key Name]
- Title: Key name (editable inline)
- Status: Active/Inactive toggle
- Actions: Copy Key, Delete, Regenerate (future)

#### Tab: Overview

Displays the key's full configuration tree:

**Key Info Card**:

- Masked key value with copy
- Roundhouse method badge
- Max iterations display
- Created/Updated dates

**Stats Grid** (4 StatCards):

- Connected Providers count
- Selected Models count
- Linked API Keys (apiKeysManagers) count
- Total Successful Requests

**Provider Tree**:
A visual hierarchy showing all connected providers and their models:

```
[Provider Card: OpenAI]
  ├── Status: Active ✓
  ├── API Keys: 2 linked (masked)
  ├── Models:
  │   ├── gpt-4o (active, efficiency: 0.95, priority: 1)
  │   ├── gpt-4o-mini (active, efficiency: 0.8, priority: 2)
  │   └── gpt-3.5-turbo (inactive)
  └── Actions: Toggle, Remove
```

Each provider in the tree is a collapsible `ProviderSelectionCard` with:

- Provider name + type icon + status badge + active toggle
- Linked API keys (masked) with success counts
- Model list with individual active toggles, priority badges, stats (tokenUsage, successCount, failureCount, lastUsedAt)
- Action menu: toggle status, remove provider selection

#### Tab: Providers

Interface for adding/removing provider selections.

**Available Providers Panel**:

- Lists all providers from `GET /api/iv1/providers` that are NOT already selected
- Each provider shows: name, type, model count, "Select" button
- Selecting opens a modal:
    1. Choose which ApiKeysManager keys to link (multi-select from user's key vault)
    2. Confirm selection
    3. Calls `POST /api/iv1/apikeys/:id/providers/:providerId` with `{ apiKeysManagerIds: [...] }`

**Selected Providers Panel**:

- Lists currently selected providers
- Each shows linked API keys, model count
- "Remove" action calls `DELETE /api/iv1/apikeys/:id/selections/:selectionId`

#### Tab: Models

Model selection and priority management interface.

**Data Source**: `GET /api/iv1/apikeys/:id/models`

**Model Priority Table** (drag-and-drop reorderable):
| Priority | Model | Provider | Efficiency | Status | Token Usage | Success | Failure | Last Used | Actions |
|---|---|---|---|---|---|---|---|---|---|
| 1 | gpt-4o | OpenAI | 0.95 | Active ✓ | 12,450 | 234 | 12 | 2m ago | Toggle, Remove |
| 2 | claude-3.5 | Anthropic | 0.92 | Active ✓ | 8,230 | 156 | 3 | 5m ago | Toggle, Remove |

- Drag handles on the left for reordering
- Save button appears when order changes
- Save calls `PATCH /api/iv1/apikeys/:id/models/priority` with `{ items: [{modelSelectionId, priority}] }`
- Individual model status toggle calls `PATCH /api/iv1/apikeys/:id/models/:modelId/status`

**Add Models**: Button to select additional models for existing providers

- Opens modal showing available (unselected) models grouped by provider
- Multi-select checkboxes
- Calls `PATCH /api/iv1/apikeys/:id/providers/:providerId/models` with `{ modelIds: [...] }`

**Remove Models**:

- Calls `DELETE /api/iv1/apikeys/:id/providers/:providerId/models` with `{ modelIds: [...] }`

#### Tab: Settings

API key behavioral settings.

**Settings Form**:

- **Roundhouse Method**: Segmented control with 3 options:
    - `RANDOM` — Random model selection
    - `EFFICIENCY` — Score-based selection (default)
    - `PRIORITY` — User-defined priority order
    - Each option shows description tooltip
- **Max Iterations**: Number input (min: 1, max: 10, default: 3)
    - Description: "Maximum retry attempts before returning an error"
- Save button — calls `PATCH /api/iv1/apikeys/:id/settings`

### 21.3 Create API Key Modal

**Trigger**: "Create API Key" button on list page

**Form Fields**:

- Name (required, string)
- Roundhouse Method (optional, defaults to EFFICIENCY)
- Max Iterations (optional, defaults to 3)

**Behavior**:

- Submit calls `POST /api/iv1/apikeys`
- On success: show InfoModal with the generated key value (display ONCE with copy button and warning)
- Invalidate `apikeys.list` query

---

## 22. Page-Level Component Planning — Providers Feature

### 22.1 Providers List Page (`/providers`)

**Purpose**: Browse and manage all available providers (global + user's custom).

**Layout**: PageHeader + FilterBar + Provider card grid

**PageHeader**:

- Title: "Providers"
- Description: "Browse AI providers and manage your custom providers"
- Actions: "Add Custom Provider" button

**Filters**:

- Search: by name, description, code
- Type: OPENAI / ANTHROPIC / GEMINI / CUSTOM (multi-select chips)
- Status: Active / Testing / Upcoming
- Source: Global / Custom toggle
- Free: Free tier toggle
- Sort: Newest / Name A-Z

**Provider Card** (`ProviderCard`):

- **Header**: Provider name + ProviderIcon (type-colored) + StatusBadge
- **Labels row**: Type badge + "Free" badge (if applicable) + "Custom" badge (if isCustom)
- **Description**: Truncated to 2 lines
- **Stats row**: Models count, Active models count, Connected status
- **Connection indicator**: Green dot if `connected: true`
- **Footer**: Created date + "View Details" link
- **Actions**: View, Connect to API Key (quick action), Edit (custom only), Delete (custom only)

**Data Source**: `GET /api/iv1/providers`

### 22.2 Provider Detail Page (`/providers/[id]`)

**Layout**: PageHeader with breadcrumbs + Info section + Models grid

**Provider Info Section**:

- Name, code (monospace), description, base API URL
- Type badge + status badge + free badge
- Custom indicator (if user-owned)
- Connection status — which API keys use this provider

**Models Grid**:
Each model shown as a compact card:

- Model name + code (monospace)
- Efficiency score (progress bar, 0-1 scale, color-coded)
- Max tokens (formatted number)
- Token reset interval
- "Best For" tags (pill badges)
- "Thinking" capability badge
- Status badge
- Quick actions: Select for API Key (if not already), View details

**Data Source**: `GET /api/iv1/providers/:id` (includes models in response)

### 22.3 Custom Provider Management

Uses the `/me/providers` endpoints. UI integrated into the Providers list page with a "Custom" filter.

**Create Custom Provider Modal**:

- Fields: Name (required), Code, Description, Base API URL (required), Type (default: CUSTOM), Free toggle
- Schema: `CreateProviderDto`
- Submit: `POST /api/iv1/me/providers`

**Add Model to Custom Provider Modal**:

- Fields: Name (required), Code (required), Max Tokens, Token Reset Interval, Efficiency Score (0-1 slider), Best For (tag input), Thinking toggle
- Schema: `CreateProviderModelDto`
- Submit: `POST /api/iv1/me/providers/:id/models`

**Edit/Delete**: Available via action menus on custom provider cards and models.

---

## 23. Page-Level Component Planning — Keys Manager (Vault)

### 23.1 Keys Manager Page (`/keys`)

**Purpose**: Secure vault for managing third-party provider API keys. This is where users store their actual OpenAI/Anthropic/etc API keys.

**Layout**: PageHeader + SecurityNotice banner + SearchBar + Key list + UnlockSection

**PageHeader**:

- Title: "Key Vault"
- Description: "Securely manage your provider API keys"
- Action: "Add API Key" button
- Icon: Shield/Lock icon

**Security Notice Banner** (always visible):

- Yellow/amber alert: "API keys are encrypted and masked by default. To view full key values, you must verify your password."

**Key List**:
Each key shown as a row card:

- **Name**: User-defined label (e.g., "OpenAI Production")
- **Provider tag**: Optional provider association
- **Key value**: ALWAYS masked (`sk-p****_abcd`) — even after fetch
- **Status**: Active/Inactive toggle
- **Success count**: Displayed if linked to any ProviderSelection
- **Actions**: Edit name, Toggle active, Delete (with confirm)
- **Created/Updated dates**

**Unlock Flow** (Critical UX):

1. User clicks "Unlock All Keys" button (lock icon)
2. `SecureModal` opens requesting current password
3. Submit calls `POST /api/iv1/me/apikeys/unlock` with `{ password }`
4. Backend validates password and returns `[{id, key}]` tuples
5. Store unlocked keys in `unlock-store` (Zustand) with timestamp
6. Merge revealed keys into the displayed list — replace masked values with real values
7. Show green "Unlocked" badge on each revealed key
8. Auto-lock after 60 seconds (configurable) — clear `unlock-store`
9. Show countdown timer in the unlock banner: "Keys visible for 45s"
10. User can manually re-lock by clicking "Lock Keys" button

**Data Source**: `GET /api/iv1/me/apikeys` (masked), `POST /api/iv1/me/apikeys/unlock` (reveal)

**Mutations**:

- `POST /api/iv1/me/apikeys` — Create new key entry
- `PATCH /api/iv1/me/apikeys/:id` — Update (name, active)
- `DELETE /api/iv1/me/apikeys/:id` — Delete

### 23.2 Create API Key Manager Modal

**Fields**:

- Name (required): Label for this key
- Provider (optional): Associate with a specific provider code
- Key (required): The actual API key value (password-type input with show/hide)

**Important UX Note**: After creation, the key is NEVER shown again in plain text (only masked). The user must use the Unlock flow to reveal it. Display a warning during creation.

---

## 24. Page-Level Component Planning — Settings

### 24.1 Settings Page (`/settings`)

**Layout**: PageHeader + Tabbed sections (Profile / Security / Preferences)

#### Profile Tab

- Avatar upload (drag-and-drop zone or click to select)
- Name field (editable)
- Email field (read-only, displayed for reference)
- Save button → `PATCH /api/iv1/me`

#### Security Tab

- Change Password form:
    - Old Password (required)
    - New Password (required, min 8 chars)
    - Confirm New Password
    - Submit → `POST /api/iv1/auth/change-password`

#### Preferences Tab

- Theme selector (Dark / Light / System) — via `next-themes`
- Default items per page (10 / 25 / 50) — persisted in localStorage
- Notification preferences (future)

---

## 25. Page-Level Component Planning — Admin Dashboard

### 25.1 Admin Overview Page (`/admin`)

**Layout**: PageHeader + Stats grid + Quick links

**Stats Grid** (8 StatCards from `GET /api/iv1/admin/analytics`):

- Total Users
- Total API Keys
- Global Providers
- Custom Providers (UserProviders)
- Global Models
- Custom Models (UserModels)
- Provider Selections
- Provider Selection API Key Managers

**Quick Links**: Navigate to Providers, Users, Analytics sections

### 25.2 Admin Providers Page (`/admin/providers`)

**Purpose**: Full CRUD management of global providers and their models.

**Layout**: PageHeader + SearchBar + FilterBar + Provider table/grid + Pagination

**Provider Management**:

- List view with search, filter (status, type, free), sort, pagination
- Create provider button → FormModal with `CreateProviderDto` fields
- Each provider row: Name, Code, Type, Status, Models count, Created date, Actions (Edit, Status toggle, Delete)
- Click row → detail page

**Detail Page** (`/admin/providers/[id]`):

- Provider info (editable)
- Model list with full CRUD:
    - Create model → `POST /api/iv1/admin/providers/:id/models`
    - Edit model → `PATCH /api/iv1/admin/providers/models/:modelId`
    - Toggle status → `PATCH /api/iv1/admin/providers/models/:modelId/status`
    - Delete model → `DELETE /api/iv1/admin/providers/models/:modelId`
- Each model card: Name, Code, Max Tokens, Efficiency Score (editable), Best For tags, Thinking toggle, Status

### 25.3 Admin Users Page (`/admin/users`)

**Purpose**: User management with detailed activity inspection.

**Layout**: PageHeader + SearchBar + FilterBar + User table + Pagination

**User Table**:
| Avatar | Name | Email | Status | API Keys | Providers | Models | Requests | Created | Actions |
|---|---|---|---|---|---|---|---|---|---|
| [img] | John Doe | john@... | Active ✓ | 3 (2 active) | 5 custom | 12 | 1,234 | Jan 2024 | View, Edit, Ban, Delete |

**Filters**: Search (name, email), Status (ACTIVE/INACTIVE/BANNED/PENDING), Sort

**Data Source**: `GET /api/iv1/admin/users` with query params

**Detail Page** (`/admin/users/[id]`):

- User profile info (editable by admin)
- Status management: ACTIVE / INACTIVE / BANNED / PENDING dropdown
- Stats overview: aggregated from response
- API Keys list with per-key stats (provider count, model count, success count)
- Custom providers list with model counts
- Danger zone: Delete user (with typed confirmation "DELETE [user email]")

**Mutations**:

- `PATCH /api/iv1/admin/users/:id` — Update user info
- `PATCH /api/iv1/admin/users/:id/status` — Change status
- `DELETE /api/iv1/admin/users/:id` — Delete user

### 25.4 Admin Analytics Page (`/admin/analytics`)

**Purpose**: Detailed platform-wide analytics visualization.

**Charts** (using Recharts):

- Entity distribution pie chart (users, API keys, providers, models)
- Growth trends over time (if timestamp data available, otherwise static counts)
- Provider type distribution bar chart
- Top users by activity table

**Data Source**: `GET /api/iv1/admin/analytics`

---

## 26. TypeScript Type Definitions

### 26.1 Enum Types (from Prisma)

```typescript
enum UserRole {
    USER = "USER",
    ADMIN = "ADMIN",
}
enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BANNED = "BANNED",
    PENDING = "PENDING",
}
enum ContentStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DEPRECATED = "DEPRECATED",
    TESTING = "TESTING",
    UPCOMING = "UPCOMING",
}
enum ProviderType {
    OPENAI = "OPENAI",
    ANTHROPIC = "ANTHROPIC",
    GEMINI = "GEMINI",
    CUSTOM = "CUSTOM",
}
enum RoundhouseMethod {
    RANDOM = "RANDOM",
    EFFICIENCY = "EFFICIENCY",
    PRIORITY = "PRIORITY",
}
```

### 26.2 API Response Wrapper

```typescript
interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
    pagination?: PaginationMeta;
}

interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
}
```

### 26.3 Entity Types (matching backend response shapes)

```typescript
// User Profile (from GET /api/iv1/me)
interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    status: UserStatus;
}

// API Key List Item (from GET /api/iv1/apikeys)
interface ApiKeyListItem {
    id: string;
    name: string;
    active: boolean;
    key: string;
    maxIterations: number;
    roundhouseMethod: RoundhouseMethod;
    createdAt: string;
    updatedAt: string;
    stats: {
        providerCount: number;
        apiKeysManagerCount: number;
        modelCount: number;
        successfulRequests: number;
    };
}

// API Key Detail (from GET /api/iv1/apikeys/:id)
interface ApiKeyDetail {
    id: string;
    name: string;
    active: boolean;
    key: string;
    maxIterations: number;
    roundhouseMethod: RoundhouseMethod;
    createdAt: string;
    updatedAt: string;
    providers: ProviderSelectionDetail[];
}

interface ProviderSelectionDetail {
    id: string;
    providerId: string;
    code: string;
    name: string;
    description: string | null;
    baseApi: string;
    free: boolean;
    type: ProviderType;
    status: ContentStatus;
    active: boolean;
    isCustom: boolean;
    apiKeysManagers: ApiKeysManagerEntry[];
    models: ModelSelectionEntry[];
    createdAt: string;
    updatedAt: string;
}

interface ApiKeysManagerEntry {
    id: string;
    maskedKey: string;
    active: boolean;
    successCount: number;
    createdAt: string;
    updatedAt: string;
}

interface ModelSelectionEntry {
    id: string;
    modelSelectionId: string;
    name: string;
    code: string;
    maxTokens: number | null;
    tokenResetInterval: number | null;
    efficiencyScore: number | null;
    bestFor: string[];
    thinking: boolean;
    status: ContentStatus;
    active: boolean;
    priority: number;
    isCustom: boolean;
    stats: {
        tokenUsage: number;
        successCount: number;
        failureCount: number;
        lastUsedAt: string | null;
    };
}

// Provider List Item (from GET /api/iv1/providers)
interface ProviderListItem {
    id: string;
    code: string;
    name: string;
    description: string | null;
    free: boolean;
    type: ProviderType;
    status: ContentStatus;
    modelsCount: number;
    activeModelsCount: number;
    connected: boolean;
    active: boolean;
    isCustom: boolean;
    createdAt: string;
    updatedAt: string;
}

// Keys Manager (from GET /api/iv1/me/apikeys)
interface ApiKeysManagerItem {
    id: string;
    name: string;
    provider: string | null;
    key: string; // masked
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// Unlocked Key (from POST /api/iv1/me/apikeys/unlock)
interface UnlockedKey {
    id: string;
    key: string; // full value
}

// Admin Analytics (from GET /api/iv1/admin/analytics)
interface AdminAnalytics {
    users: number;
    apiKeys: number;
    globalProviders: number;
    customProviders: number;
    models: number;
    userModels: number;
    providerSelections: number;
    providerSelectionApiKeysManagers: number;
}

// Admin User List Item
interface AdminUserListItem {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    status: UserStatus;
    stats: {
        apiKeyCount: number;
        activeApiKeyCount: number;
        customProviderCount: number;
        activeCustomProviderCount: number;
        providerSelectionCount: number;
        apiKeysManagerCount: number;
        selectedModelCount: number;
    };
    createdAt: string;
    updatedAt: string;
}
```

---

## 27. SSR & Data Fetching Strategy

### 27.1 Server Component Strategy

| Page            | Rendering                           | Justification                                         |
| --------------- | ----------------------------------- | ----------------------------------------------------- |
| Auth pages      | Static (client-only forms)          | No server data needed                                 |
| Dashboard home  | Client-side (TanStack Query)        | Multiple aggregated queries, user-specific            |
| API Keys list   | Client-side with SSR prefetch       | Paginated, filterable, frequently mutated             |
| API Key detail  | Client-side with SSR prefetch       | Deeply nested, frequently mutated                     |
| Providers list  | Server Component + client hydration | Relatively stable data, benefits from SSR             |
| Provider detail | Server Component + client hydration | Stable data with models                               |
| Keys Manager    | Client-side only                    | Security-sensitive, no SSR for key data               |
| Admin pages     | Client-side with SSR prefetch       | Admin data should not be server-rendered for security |
| Settings        | Client-side only                    | User-specific, form-heavy                             |

### 27.2 Prefetching Strategy

For pages that benefit from SSR prefetch, use TanStack Query's `prefetchQuery` in Server Components:

```
// In server component (page.tsx):
const queryClient = getQueryClient()
await queryClient.prefetchQuery({
  queryKey: providerKeys.list(filters),
  queryFn: () => fetchProviders(filters),
})
return <HydrationBoundary state={dehydrate(queryClient)}><ClientComponent /></HydrationBoundary>
```

### 27.3 Streaming & Suspense

- API Key detail page uses `Suspense` boundaries around each tab's content
- Provider model grids wrapped in `Suspense` with `Skeleton` fallbacks
- Admin user detail page streams provider/model data progressively
- Each `Suspense` boundary has a purpose-built skeleton matching the target component's layout

---

## 28. Error Handling Strategy

### 28.1 Error Boundary Hierarchy

```
RootErrorBoundary (app/error.tsx)
  └── LayoutErrorBoundary (per route group)
      └── PageErrorBoundary (per page)
          └── ComponentErrorBoundary (per critical widget)
```

### 28.2 Error Types & Handling

| Error Type           | Status | UI Treatment                                                   |
| -------------------- | ------ | -------------------------------------------------------------- |
| **Network Error**    | N/A    | Full-page retry banner with "Check your connection" message    |
| **401 Unauthorized** | 401    | Redirect to login (after refresh attempt)                      |
| **403 Forbidden**    | 403    | "Insufficient permissions" page with redirect to home          |
| **404 Not Found**    | 404    | "Entity not found" page with back navigation                   |
| **409 Conflict**     | 409    | Inline error: "Provider already selected" (contextual)         |
| **422 Validation**   | 422    | Map field errors to form inputs via React Hook Form `setError` |
| **429 Rate Limit**   | 429    | Toast: "Too many requests. Please wait." with retry countdown  |
| **500 Server Error** | 500    | Full-page error with "Something went wrong" + retry button     |

### 28.3 Optimistic Update Rollback

For toggle operations (active/inactive):

1. Immediately update UI state (optimistic)
2. Send mutation request
3. On failure: rollback to previous state + show error toast
4. On success: confirm state (no visible change needed)

### 28.4 Form Error Display

- Field-level errors shown below each input in red text
- Form-level errors (API errors) shown in a dismissible alert banner above the form
- Validation runs on blur for individual fields, on submit for the full form
- After API error, the specific field (if identifiable) receives focus

---

## 29. Performance Optimization

### 29.1 Bundle Optimization

- **Dynamic imports** for heavy components: Recharts, dnd-kit, react-markdown
- **Route-based code splitting**: Automatic via Next.js App Router
- **Tree shaking**: Import specific icons (`import { KeyIcon } from "@phosphor-icons/react"`)
- **Image optimization**: `next/image` for avatars, provider logos

### 29.2 Rendering Optimization

- **React.memo** on list item components (ApiKeyCard, ProviderCard, ModelCard)
- **useMemo** for expensive transformations (filtering, sorting large lists)
- **useCallback** for event handlers passed to memoized children
- **Virtual scrolling** via `@tanstack/react-virtual` for lists > 50 items (admin user list)

### 29.3 Data Fetching Optimization

- **Stale-while-revalidate**: Show cached data immediately, refetch in background
- **Dependent queries**: API key models query depends on API key detail being loaded
- **Parallel queries**: Dashboard stats fetched in parallel via `useQueries`
- **Prefetching**: Hover-triggered prefetch for card links (prefetch provider detail on card hover)
- **Pagination**: Server-side pagination for all list endpoints, never fetch all records

### 29.4 Skeleton Strategy

Every data-dependent component has a matching skeleton:

- `ApiKeyCardSkeleton`: Matches card dimensions with shimmer blocks
- `ProviderCardSkeleton`: Matches provider card layout
- `StatCardSkeleton`: Matches stat card dimensions
- `TableRowSkeleton`: Matches table row height with shimmer columns
- `DetailPageSkeleton`: Full-page skeleton for detail views
- Skeletons use the same spacing and border-radius as real components

---

## 30. Accessibility (a11y)

### 30.1 WCAG 2.1 AA Compliance

- All interactive elements have visible focus indicators (`focus-visible:ring-2`)
- Color contrast ratios meet AA standards (4.5:1 for body text, 3:1 for large text)
- All images have `alt` text, decorative images use `alt=""`
- Form inputs have associated `<label>` elements
- Error messages are announced via `aria-live="polite"` regions

### 30.2 Keyboard Navigation

- Full keyboard navigation through all features
- `Tab` order follows visual layout
- `Escape` closes modals, dropdowns, popovers
- `Enter`/`Space` activate buttons, toggles, checkboxes
- Arrow keys navigate within menus, tabs, table rows
- `Cmd+K` opens command palette from anywhere

### 30.3 Screen Reader Support

- Semantic HTML5 elements (`<nav>`, `<main>`, `<aside>`, `<section>`)
- ARIA landmarks for major page regions
- ARIA labels on icon-only buttons
- Live regions for toast notifications and dynamic status updates
- `role="status"` on loading indicators

### 30.4 Responsive Accessibility

- Touch targets minimum 44x44px on mobile
- Swipe gestures have button alternatives
- No information conveyed by color alone (always paired with text/icon)

---

## 31. Testing Strategy

### 31.1 Unit Tests

- **Vitest** for utility functions, Zod schemas, data transformations
- Test all query key factories
- Test API client error handling
- Test mask/unmask utility functions

### 31.2 Component Tests

- **React Testing Library** for interactive component behavior
- Test form validation flows
- Test modal open/close lifecycle
- Test optimistic update rollback

### 31.3 E2E Tests

- **Playwright** for critical user flows:
    - Login → Create API Key → Select Provider → Select Models → Verify Configuration
    - Unlock Keys → Verify Reveal → Verify Auto-Lock
    - Admin Login → View Users → Change Status → Verify

---

## 32. Implementation Roadmap

### Phase 1: Foundation

- [ ] Next.js project scaffold with App Router
- [ ] Tailwind CSS v4 configuration with theme tokens
- [ ] Design system primitives (Button, Input, Badge, Card, Skeleton)
- [ ] Layout components (Sidebar, Topbar, PageHeader)
- [ ] API client with interceptors
- [ ] TanStack Query setup with query client
- [ ] Zustand stores (auth, ui, modal, unlock)
- [ ] Auth pages (Login, Register, Admin Login)
- [ ] Middleware for route protection

### Phase 2: Core Features

- [ ] Dashboard overview page
- [ ] API Keys list page with CRUD
- [ ] API Key detail page with tabs
- [ ] Provider selection flow
- [ ] Model selection and priority ordering
- [ ] API Key settings configuration
- [ ] Providers list page
- [ ] Provider detail page
- [ ] Custom provider CRUD

### Phase 3: Security & Management

- [ ] Keys Manager (Vault) page
- [ ] Unlock flow with password verification
- [ ] Auto-lock timer
- [ ] Settings page (Profile, Security, Preferences)
- [ ] Command palette (Cmd+K)

### Phase 4: Admin Dashboard

- [ ] Admin layout and navigation
- [ ] Admin analytics dashboard
- [ ] Admin provider management with model CRUD
- [ ] Admin user management with status controls
- [ ] Admin user detail page

### Phase 5: Polish & Optimization

- [ ] Animation system implementation
- [ ] Skeleton loaders for all pages
- [ ] Error boundaries and error states
- [ ] Empty states with illustrations
- [ ] Accessibility audit and fixes
- [ ] Performance optimization (memoization, virtual scrolling)
- [ ] Responsive design testing
- [ ] Dark/Light theme polish
- [ ] E2E test suite

---

## 33. Environment Variables (Use if Needed)

```env
# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Roundhouse
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
NEXT_PUBLIC_TOKEN_STORAGE_KEY=rh_access_token
NEXT_PUBLIC_REFRESH_TOKEN_KEY=rh_refresh_token

# Feature Flags
NEXT_PUBLIC_ENABLE_DOCS=true
NEXT_PUBLIC_ENABLE_COMMAND_PALETTE=true

# Theme
NEXT_PUBLIC_DEFAULT_THEME=dark

# Keys
NEXT_PUBLIC_KEY_UNLOCK_TIMEOUT=60 # seconds
NEXT_PUBLIC_KEY_REVEAL_TIMEOUT=30 # seconds
```

---

_End of Frontend Planning Document_
_Generated from analysis of NestJS backend, Prisma schema, Swagger spec, and platform documentation._
_Target: AI Agent implementation with full context for autonomous development._
