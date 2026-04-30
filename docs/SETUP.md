# Setup Guide

## Prerequisites

- Node.js (LTS recommended)
- npm (bundled with Node) or Bun

## Clone and install

```bash
git clone <your-repo-url>
cd tammal
npm install
```

If you prefer Bun:

```bash
bun install
```

## Environment variables

Create a local `.env` from `.env.example` and fill values:

```bash
cp .env.example .env
```

Required keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN` (optional empty string is acceptable locally)

These are read from `import.meta.env` by the Supabase/Sentry setup.

## Run in development

```bash
npm run dev
```

Default Vite dev server runs on `http://localhost:8080`.

## Run checks/tests

```bash
npm run lint
npm run typecheck
npm run test
```

Extra test helpers:

```bash
npm run test:watch
npm run test:coverage
```

## Build for production

```bash
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```
