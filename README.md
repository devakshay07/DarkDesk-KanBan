# DarkDesk Kanban

A polished, local-first personal Kanban workspace built with Next.js 15 and TypeScript. The interface uses layered surfaces, soft shadows, and subtle elevation for a tactile 3D feel without sacrificing readability.

## What works today

- Board and column creation; card create/edit/complete
- Native drag-and-drop cards between columns
- Instant search and priority filtering
- Local persistence, undo, JSON backup export/import
- Responsive desktop and mobile board UI
- Keyboard-friendly controls, clear focusable controls, semantic elements

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Verify with `npm run typecheck`, `npm run test`, and `npm run build`.

## Supabase production setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Populate the two public environment variables.
3. Run [`database/schema.sql`](database/schema.sql) in the Supabase SQL Editor. It includes ownership-based RLS policies.
4. Add Supabase Auth and replace the local adapter in `lib/storage.ts` with authenticated queries/subscriptions. The app intentionally remains usable offline until credentials and auth UX are configured.

## Architecture

`app/` provides Next routes and global styling; `features/kanban/` owns the interactive workspace; `types/` contains the domain model; `lib/` holds persistence and seed data; `database/` is the deployable schema; `tests/` holds focused tests.

## Deployment

Deploy to Vercel with the repository import flow (the `vercel.json` identifies Next.js), or Netlify with the included `netlify.toml`. Set the same environment variables in the host dashboard. Netlify deployments require adding `@netlify/plugin-nextjs` if the host does not auto-provision it.

## Product notes

The initial experience is deliberately local-first: data is written to browser storage immediately, so it works without a network or account. The supplied schema is version-ready (`cards.version`) for timestamp/version conflict handling when the Supabase adapter is enabled.
