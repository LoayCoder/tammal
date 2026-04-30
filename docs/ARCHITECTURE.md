# Tammal Architecture

## Tech stack

- React 18 + TypeScript
- Vite 5 (build/dev server)
- React Router v6
- TanStack Query v5 (server-state fetching/caching)
- Supabase (Auth, Postgres, Storage, Edge Functions)
- Zod + React Hook Form resolver for form/input validation
- Tailwind CSS + shadcn/ui component primitives
- Vitest + Testing Library for unit/integration tests

## High-level structure

- `src/main.tsx`: app bootstrap, Sentry init, service-worker/cache reset guard, app mount.
- `src/App.tsx`: global providers + routing tree.
  - Creates a shared `QueryClient` and wraps app in `QueryClientProvider`.
  - Uses `React.lazy` + `Suspense` for route-level code splitting.
  - Wraps app/routes with error boundaries and auth/role guards.
- `src/pages`: route screens (many lazy-loaded).
- `src/components`: reusable UI and feature-facing building blocks.
- `src/features`: domain feature modules (components/hooks/pages/types per feature).
- `src/hooks`: shared/custom hooks (many use `useQuery`/`useMutation`).
- `src/services`: Supabase data-access/service logic.
- `src/integrations/supabase`: generated DB types + typed client.
- `src/lib`: platform helpers (i18n, sentry, utils, analytics).
- `src/providers`: context providers (ex: auth provider).
- `supabase/migrations`: database schema + RLS policy SQL history.

## Key patterns in this repo

## 1) Lazy loading and route splitting

`src/App.tsx` lazy-loads most pages (`lazy(() => import(...))`) and uses a Suspense fallback, which keeps the initial bundle smaller and improves first load.

## 2) Data access via TanStack Query + Supabase

- Hooks and services call Supabase (`from`, `rpc`, `functions.invoke`, `auth`).
- Query hooks use stable keys and invalidate/refetch after mutations.
- `QueryClient` defaults in `App.tsx`:
  - queries: `staleTime: 30_000`, `retry: 1`
  - mutations: `retry: 0`

## 3) Validation with Zod

Zod is used in multiple forms/components through `zodResolver(...)` for runtime validation and typed form inputs. Validation coverage is partial but present across key dialogs/forms.

## 4) Authorization and tenant isolation

- Frontend route protection through `ProtectedRoute`, `AdminRoute`, and `ManagerOrAdminRoute`.
- Data isolation enforced in database via Supabase RLS policies (tracked under `supabase/migrations` and release checklists).

## 5) Import aliases

Vite + TS use `@/* -> src/*`, so imports follow `@/components/...`, `@/hooks/...`.

## Data flow (request lifecycle)

1. User action in a page/component.
2. A feature/shared hook triggers a query/mutation (`useQuery`, `useMutation`) or calls a service.
3. Service/hook uses typed Supabase client from `src/integrations/supabase/client.ts`.
4. Supabase enforces auth + RLS and returns data/errors.
5. Hook updates cache/state (including invalidations) and UI re-renders from query cache.

## Operational notes

- Sentry is initialized at startup (`src/main.tsx`) and app-level error boundaries capture runtime failures.
- PWA support is configured in production via `vite-plugin-pwa` in `vite.config.ts`.