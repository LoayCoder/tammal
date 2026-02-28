# Production Release Checklist — Tammal SaaS Platform

> **Purpose:** Final gate before external launch. Every item must be confirmed.  
> **Audience:** Engineering lead, QA lead, Product owner  
> **Date:** _______________

---

## 1. Database & Schema

- [ ] All migrations applied successfully to Live environment
- [ ] No `DROP TABLE` / `DROP COLUMN` in this release
- [ ] All new tables have RLS enabled with `tenant_id` isolation
- [ ] `deleted_at` column present on all management tables (soft-delete only)
- [ ] Unique constraints verified: `mood_entries(employee_id, entry_date)`, `points_transactions(user_id, source_type, created_at::date)`
- [ ] No destructive DDL — rollback requires no schema revert
- [ ] Backup snapshot taken before deployment

## 2. Environment & Secrets

- [ ] `VITE_SUPABASE_URL` configured
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configured
- [ ] `LOVABLE_API_KEY` configured (edge functions)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (edge functions)
- [ ] No private API keys in source code
- [ ] No `.env` file committed to version control

## 3. Test Suite

- [ ] `bun run test` — **74/74 passing** (0 failures)
- [ ] Service layer tests: gamification, checkin, invite ✓
- [ ] Hook layer tests: query keys, mutations, invalidation ✓
- [ ] Smoke tests: DailyCheckin, AcceptInvite, CheckinSuccess ✓
- [ ] No `act()` warnings in output
- [ ] No unhandled promise rejections

## 4. Build & Bundle

- [ ] `bun run build` succeeds with 0 TypeScript errors
- [ ] No `any` in new service/hook code
- [ ] Bundle size delta < 50 KB from previous release
- [ ] Lazy-loaded routes confirmed (77 lazy imports)
- [ ] Code-splitting verified for admin vs employee paths

## 5. Observability & Logging

- [ ] All `console.log` calls migrated to `logger.debug` (DEV-only)
- [ ] All `console.error`/`console.warn` use tagged `logger.error`/`logger.warn`
- [ ] No auth tokens, session data, or PII in logs
- [ ] No mental health data (mood scores, crisis messages) in logs
- [ ] No full Supabase response objects logged
- [ ] `reportError()` hook available for external SDK integration
- [ ] Edge function logs use `console.error` only (server-side, acceptable)

## 6. Error Handling

- [ ] Global ErrorBoundary wraps entire App root
- [ ] Dashboard tabs each wrapped in ErrorBoundary
- [ ] OrgDashboard tabs each wrapped in ErrorBoundary
- [ ] Admin pages (Subscriptions, Plans, AI Generator, etc.) wrapped
- [ ] ErrorBoundary logs via `logger.error` — no raw stack in UI
- [ ] User-friendly fallback UI with retry button
- [ ] `onError` callback available for external reporting

## 7. Security

- [ ] RLS enabled on all public tables
- [ ] No `USING (true)` on sensitive tables (mood_entries, points_transactions, crisis data)
- [ ] `tenant_id` isolation enforced via `get_user_tenant_id(auth.uid())`
- [ ] Edge functions validate `Authorization` header
- [ ] Service role key used only in edge functions, never in client
- [ ] Soft-delete filter (`WHERE deleted_at IS NULL`) in all list queries
- [ ] No hardcoded credentials in source

## 8. Async Safety

- [ ] All async functions wrapped in try/catch
- [ ] No unhandled promise rejections
- [ ] No setTimeout leaks (all cleaned in useEffect returns)
- [ ] Duplicate submit prevention: button disabled during `isSubmitting`
- [ ] Idempotency: unique constraint on `mood_entries(employee_id, entry_date)`
- [ ] Points ledger failure non-fatal (mood entry already committed)

## 9. Performance

- [ ] Lazy loading active for 50+ routes
- [ ] React Query staleTime configured for stable data
- [ ] No unnecessary re-renders in critical paths
- [ ] Images lazy-loaded where applicable

## 10. Monitoring & Alerts (Post-Launch)

### Critical (P0) — Immediate response required
| Alert | Threshold | Instrumentation |
|---|---|---|
| Check-in submission failure rate | > 3% over 5 min | `checkinService.submitMoodEntry` |
| AcceptInvite failure rate | > 5% over 10 min | `inviteService.acceptInvite` |
| Edge function error spike | > 10 errors/min | Edge function logs |
| API latency p95 | > 1.5s | Network layer |

### Medium (P1) — Investigate within 1 hour
| Alert | Threshold | Instrumentation |
|---|---|---|
| Streak mismatch anomaly | Points ≠ expected for streak | `gamificationService.calculatePoints` |
| Duplicate check-in detected | 23505 error rate > 1% | `checkinService` idempotency path |
| Elevated React Query retries | > 3 retries per query | QueryClient config |
| Points ledger insert failure | > 1% of check-ins | `checkinService` warn path |

## 11. Rollback Strategy

- **App rollback:** Revert to previous Lovable publish version — instant
- **DB rollback:** Not required — all schema changes are additive
- **Data rollback:** Not needed — no destructive data mutations
- **Feature flags:** Available for high-risk modules if needed
- **Rollback confidence:** HIGH — services are backward-compatible

## 12. Final Sign-Off

| Role | Name | Status | Date |
|---|---|---|---|
| Engineering Lead | _______________ | ☐ Approved | ___ |
| QA Lead | _______________ | ☐ Approved | ___ |
| Product Owner | _______________ | ☐ Approved | ___ |
| DevOps | _______________ | ☐ Approved | ___ |

**GO / NO-GO:** _______________  
**Launch Date:** _______________  
**Signed:** _______________
