# Coding Conventions

## File/folder naming

- Components/pages: `PascalCase` filenames (ex: `UserProfile.tsx`, `TenantManagement.tsx`).
- Hooks: `camelCase` starting with `use` (ex: `useProfile.ts`, `useApprovals.ts`).
- Services/utilities: `camelCase` filenames (ex: `scheduleService.ts`).
- Tests: colocated or feature-level with `*.test.ts(x)` / `*.spec.ts(x)`.
- Keep feature-specific code in `src/features/<feature>/...`; shared primitives in `src/components`, `src/hooks`, `src/lib`.

## Component structure

- Prefer function components with explicit props interfaces/types.
- Keep route-level screens in `src/pages`; move reusable UI to `src/components`.
- Keep side effects and data fetching out of presentational pieces where practical.
- Use Error Boundaries and route guards already provided in `src/App.tsx` for new protected routes.

## Hook patterns

- Use TanStack Query for async/server state (`useQuery`, `useMutation`).
- Use stable query keys and invalidate relevant keys after mutations.
- Prefer wrapping Supabase calls in reusable hooks/services rather than in deeply nested UI handlers.
- Keep hook return shape clear (`data`, `isPending`, `error`, actions).

## State management approach

- Server state: TanStack Query cache as source of truth.
- Local UI state: `useState`/`useReducer` inside components/hooks.
- Cross-cutting auth/session state: provider pattern (`src/providers/AuthProvider`).
- Avoid introducing global client-state libraries unless a clear shared-state need appears.

## Validation and forms

- Use Zod schemas with `zodResolver` for forms and mutation inputs.
- Keep schemas near related form/component or feature module.
- Favor typed schema inference for form value types.

## Testing patterns

- Framework: Vitest + Testing Library (`jsdom`).
- Mock Supabase client at module boundary for service/hook tests.
- For hook tests using Query, wrap with `QueryClientProvider`.
- Prefer behavior-driven assertions over implementation details.

## Imports and aliases

- Use alias imports with `@/` (mapped to `src/`) for internal modules.
- Group imports: external packages first, then internal aliases.
- Avoid deep relative chains (`../../../`) when alias path is available.

## Lint/format expectations

- Keep ESLint clean (warnings allowed only when justified).
- Prefix intentionally unused args/vars with `_` to satisfy unused-vars rule.
- Run `npm run lint`, `npm run typecheck`, and relevant tests before merging.
