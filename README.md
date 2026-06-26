# Roundhouse

Roundhouse is a full-stack TypeScript application with:

- **Client**: Next.js (React + Tailwind)
- **Server**: NestJS (TypeScript + Prisma)

This repo is organized as:

- `client-side/` — web app UI
- `server-side/` — API + business logic

## Prerequisites

- Node.js (LTS recommended)
- npm (or compatible package manager)
- A database configured for the server (see server env docs)

## Quickstart (local)

### 1) Server

```bash
cd server-side
npm install
npm run dev
```

### 2) Client

In a new terminal:

```bash
cd client-side
npm install
npm run dev
```

## Useful docs

- Server docs: `server-side/README.md` and `server-side/md/`
- Frontend docs: `client-side/md/`

### Major architecture notes

- Roundhouse core (model selection + retry loop): `server-side/md/ROUNDHOUSE.md`
- API wrapper / compatibility instructions: `server-side/md/API_INSTRUCTIONS.md`
- Dashboard / UI planning notes: `client-side/md/FRONTEND_PLANNING.md` (if present) or the `client-side/md/` folder


## Project highlights

- Model selection & retry behavior is implemented server-side (see `server-side/md/ROUNDHOUSE.md`).
- Admin provider management endpoints exist under the `iv1` API namespace.

## API / Swagger

- Swagger spec is generated/served by the backend (see `server-side/swagger-spec.json`).

