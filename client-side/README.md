# Roundhouse (client)

Next.js + React (TypeScript) frontend for Roundhouse.

## What this client provides

- Admin & dashboard UI
- State management (Redux Toolkit)
- API client wrappers for backend calls
- Existing shared UI components and design primitives

## Setup

```bash
cd client-side
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm run start
```

## Key directories

- `src/app/` — Next.js routes (dashboard/admin/auth/docs)
- `src/features/` — feature-level components (auth, marketing, etc.)
- `src/shared/` — shared UI primitives, constants, and utilities
- `src/shared/lib/api-client.ts` — API client utilities
- `src/shared/store/` — Redux slices and store configuration

## Documentation

- `md/LANDINGPAGE.md` — landing page planning/notes
- Other markdown files live under `md/`

## Notes

This repo expects the backend to be running and reachable for authenticated API calls.

