# Release Checklist — Tammal SaaS Platform

> Complete every item before merging to `main` or publishing.

## 1. Database Migrations

- [ ] All pending migrations reviewed and approved
- [ ] No `DROP TABLE` or `DROP COLUMN` without explicit sign-off
- [ ] Unique constraints verified against existing data
- [ ] RLS policies attached to every new table
- [ ] `deleted_at` column present on management tables (soft-delete only)
- [ ] `tenant_id` column present on all tenant-scoped tables
- [ ] Migration is backward-compatible (services still work before code deploys)

## 2. Environment & Secrets

- [ ] `VITE_SUPABASE_URL` set in `.env`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` set in `.env`
- [ ] Edge function secrets configured in Lovable Cloud (e.g. `LOVABLE_API_KEY`)
- [ ] No private API keys committed to source code
- [ ] No `.env` file committed to version control

## 3. Test Suite

- [ ] `bun run test` passes — 0 failures
- [ ] Service layer tests pass (gamification, checkin, invite)
- [ ] Hook layer tests pass (query keys, mutations, invalidation)
- [ ] Smoke / E2E tests pass (DailyCheckin, AcceptInvite, CheckinSuccess)
- [ ] No `act()` warnings in test output
- [ ] No unhandled promise rejections in test output

## 4. Build & Bundle

- [ ] `bun run build` succeeds with 0 errors
- [ ] No TypeScript `any` in new service / hook code
- [ ] Bundle size delta < 50 KB from previous release
- [ ] Largest chunk inspected for tree-shaking opportunities

## 5. Observability

- [ ] All `console.log` calls gated behind `import.meta.env.DEV` or replaced by `logger.debug`
- [ ] `console.error` / `console.warn` use tagged `logger.error` / `logger.warn`
- [ ] No auth tokens, session data, or PII logged
- [ ] No full Supabase response objects logged
- [ ] ErrorBoundary logs via `logger.error` (no raw stack in UI)
- [ ] `reportError` hook available for future external error SDK

## 6. Security Quick-Check

- [ ] RLS enabled on all public tables
- [ ] No `USING (true)` policies on sensitive tables
- [ ] Soft-delete filter (`WHERE deleted_at IS NULL`) present in all list queries
- [ ] Edge functions validate `Authorization` header where required
- [ ] No mental-health data (mood scores, crisis messages) exposed in logs

## 7. Rollback Strategy

- [ ] Current migration is additive (no destructive DDL)
- [ ] Services are backward-compatible with previous schema
- [ ] Revert plan documented: roll back code → no schema revert needed
- [ ] Feature flags available for high-risk modules (if applicable)

## 8. Final Sign-Off

- [ ] QA lead approves smoke test results
- [ ] Product owner approves UX changes (if any)
- [ ] DevOps confirms edge function deployment
- [ ] Publish via Lovable dashboard

---

**Go / No-Go decision recorded:** _______________  
**Date:** _______________  
**Signed:** _______________
