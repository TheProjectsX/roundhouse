# Roundhouse (server)

NestJS TypeScript API for Roundhouse.

## What this server does

- Provides REST endpoints for core system management (API keys, providers, models, selections).
- Implements the model-selection + retry loop described in `md/ROUNDHOUSE.md`.
- Supports admin-scoped provider/model management under the `iv1` API namespace.

## Setup

### 1) Environment variables

1. Copy `.env.example` to `.env`.
2. Configure the database URL (e.g. `DATABASE_URL`) and any provider/model credentials your deployment requires.

### 2) Install & generate Prisma client

```bash
npm install
npm run prisma:generate
npm run prisma:push
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm run start:prod
```

## Common scripts

- `npm run dev` — start with live reload
- `npm run build` — compile to `dist/`
- `npm start` — run compiled server
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:push` — apply Prisma schema
- `npm run prisma:studio` — open Prisma Studio

## API docs (Swagger)

- Swagger spec is available at `swagger-spec.json`.
- Backend Swagger UI is generated from the NestJS Swagger decorators.

## Where to look in the codebase

- `src/main.ts` — bootstrap
- `src/modules/iv1/` — versioned API modules
- `src/modules/openai/` and `src/core/` — model/provider execution
- `src/core/services/roundhouse/` — core retry + selection logic
- `md/` — architecture notes and endpoint instructions

