# roundhouse

TypeScript Node.js API starter with Express and CORS.

## Prisma

This project is initialized with Prisma 6 and MongoDB.

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your MongoDB connection string.
2. Run `npm install` to install Prisma packages.
3. Run `npm run prisma:generate` to generate the Prisma client.
4. Run `npm run prisma:push` to apply the schema to MongoDB.

## Scripts

- `npm run dev` starts the server with live reload.
- `npm run build` compiles TypeScript into `dist/`.
- `npm start` runs the compiled server.
- `npm run prisma:generate` generates the Prisma client.
- `npm run prisma:push` syncs the Prisma schema to MongoDB.
- `npm run prisma:studio` opens Prisma Studio.

## Default route

`GET /` returns a simple JSON health response.