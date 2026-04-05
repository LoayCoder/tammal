

## Generate Workload Intelligence SRS Document (PDF)

### What
Create a comprehensive Software Requirements Specification (SRS) PDF for the **Workload Intelligence Platform** — covering all 7 subsystems: Strategic Hierarchy, Task Governance, Analytics Engine, AI Predictive Layer, Dashboards, Representative Distribution, and System Health Monitoring.

### Document Structure (IEEE 830 based)
1. **Cover Page** — TAMMAL Workload Intelligence SRS, version, date
2. **Table of Contents**
3. **Introduction** — Purpose, scope, definitions, acronyms
4. **Overall Description** — Product perspective, 4-tier hierarchy (Objective → Initiative → Action → Sub-Action), user classes (Employee, Manager, Representative, Admin, Executive)
5. **System Architecture** — Edge functions map (workload-intelligence, workload-analytics, workload-ai, escalation-check, sla-monitor, task-ai-engine), data flow diagram (ASCII)
6. **Functional Requirements**
   - FR-1: Strategic Hierarchy Management (OKR → Initiative → Action → Sub-Action, bilingual EN/AR, progress rollup)
   - FR-2: Task Governance & Locking (is_locked enforcement, SLA tracking at 80%/100%, 3-tier escalation at 3/7/14 days, verification via evidence upload, mandatory justifications)
   - FR-3: Workload Metrics Engine (utilization calculation, burnout risk scoring with 40/35/25 weights, alignment score, priority score formula)
   - FR-4: Analytics Pipeline (execution velocity, heatmap snapshots, initiative risk scoring, alignment snapshots, TAMMAL Index computation)
   - FR-5: AI Predictive Layer (burnout prediction via Gemini-3-Flash, completion forecasting, smart redistribution with reasoning)
   - FR-6: Representative Task Distribution (scoped assignments, bulk CSV import, template management, locked task distribution)
   - FR-7: Dashboard Suite (Workload Dashboard 5 KPIs + 3 tabs, Team Command Center accordion, Executive Dashboard with TAMMAL Index gauge, Portfolio Dashboard, My Workload personal hub)
   - FR-8: System Health Monitoring (Queue Sync, Escalation Jobs, SLA Monitor, Tenant Isolation checks)
7. **Data Model** — Key tables: strategic_objectives, initiatives, objective_actions, sub_actions, workload_metrics, employee_capacity, escalation_events, burnout_predictions, execution_velocity_metrics, workload_heatmap_metrics, initiative_risk_metrics, strategic_alignment_metrics, org_intelligence_scores, off_hours_sessions, task_notifications, redistribution_recommendations
8. **Business Rules** — Utilization thresholds (60/90/110%), burnout flags (480min/3 overdue/120min off-hours), TAMMAL Index formula (Alignment 25% + Velocity 25% + Capacity 25% + Burnout Health 25%), priority score weights
9. **Non-Functional Requirements** — Multi-tenant RLS, soft-delete, audit logging, RTL/i18n, 10K+ tenant scalability, pg_cron automation (SLA every 30min, escalation hourly, AI daily at 2AM)
10. **API Reference** — Edge function endpoints, actions, request/response schemas
11. **Security** — JWT auth, service-role key for cron, RBAC (admin-only for escalation/SLA triggers), tenant isolation via server-side profile lookup
12. **Appendices** — Configuration constants from `src/config/workload.ts`, glossary

### Technical Approach
- Python script using `reportlab` for PDF generation
- TAMMAL brand colors from codebase
- Output to `/mnt/documents/Workload_Intelligence_SRS.pdf`
- Visual QA via `pdftoppm` inspection of all pages

### Content Sources (from codebase analysis)
- 6 Edge Functions: workload-intelligence, workload-analytics, workload-ai, escalation-check, sla-monitor, task-ai-engine
- 1 Client Service: workload-intelligence.service.ts
- 1 Config File: src/config/workload.ts
- 24 React Hooks in src/features/workload/hooks/
- 10 Executive Dashboard cards
- 7 Team components, 9 Representative components
- 5 Dashboard pages + My Workload personal hub

