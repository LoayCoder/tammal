

## Plan: Create Shared `StatusBadge` Component

### Problem
The codebase has **8+ separate status badge implementations** scattered across modules — each with its own color mapping, variant logic, and icon handling. This violates DRY and makes styling inconsistent.

**Duplicated patterns found in:**
- `TenantStatusBadge` — custom className color map
- `AccountStatusBadge` — icon + variant map + i18n key map
- `EmployeeStatusBadge` — variant-only map
- `CycleStatusBadge` — variant map
- `PrayerStatusBadge` — fully custom span (not even using `Badge`)
- `RiskBadge` — color string map
- `ScheduleManagement` — inline switch statement
- `EmployeeStatusTable` — inline switch statement
- `FirstAiderDashboard` — inline `statusColors` map

### Solution

Create `src/shared/status-badge/StatusBadge.tsx` — a single configurable component that covers all patterns above.

### Component API

```tsx
interface StatusBadgeProps {
  status: string;
  config: StatusBadgeConfig;         // color/icon/label presets
  translationPrefix?: string;        // e.g. 'employees.status' → auto t(`employees.status.${status}`)
  label?: string;                    // manual override label
  showIcon?: boolean;                // default false
  size?: 'sm' | 'default';          // 'sm' for inline/table use
}

type StatusBadgeConfig = Record<string, {
  variant?: BadgeVariant;
  className?: string;                // custom color overrides
  icon?: LucideIcon;
  labelKey?: string;                 // full i18n key override
}>;
```

### Preset Configs (exported constants)

Create `src/shared/status-badge/presets.ts` with ready-made configs:

- `TENANT_STATUS_CONFIG` — active/trial/suspended/inactive with colors
- `ACCOUNT_STATUS_CONFIG` — not_invited/invited/active/suspended/inactive with icons
- `EMPLOYEE_STATUS_CONFIG` — active/resigned/terminated
- `CYCLE_STATUS_CONFIG` — configuring/nominating/voting/calculating/announced/archived
- `RISK_LEVEL_CONFIG` — low/medium/high
- `GENERIC_STATUS_CONFIG` — active/paused/draft/completed/in_progress/not_started (covers schedules + survey monitor)

### Files

| File | Action |
|---|---|
| `src/shared/status-badge/StatusBadge.tsx` | New — shared component |
| `src/shared/status-badge/presets.ts` | New — preset config objects |
| `src/shared/status-badge/index.ts` | New — barrel export |

### Migration (refactor existing consumers)

Replace all 8+ implementations to use `<StatusBadge>` with the appropriate preset:

| Consumer file | Replace with |
|---|---|
| `src/components/tenants/TenantStatusBadge.tsx` | Re-export thin wrapper using `TENANT_STATUS_CONFIG` |
| `src/components/employees/AccountStatusBadge.tsx` | Use `ACCOUNT_STATUS_CONFIG` with `showIcon` |
| `src/components/employees/EmployeeStatusBadge.tsx` | Use `EMPLOYEE_STATUS_CONFIG` |
| `src/components/recognition/CycleStatusBadge.tsx` | Use `CYCLE_STATUS_CONFIG` |
| `src/features/ai-governance/components/RiskBadge.tsx` | Use `RISK_LEVEL_CONFIG` |
| `src/pages/admin/ScheduleManagement.tsx` | Replace inline `getStatusBadge` |
| `src/components/survey-monitor/EmployeeStatusTable.tsx` | Replace inline `statusBadge` |

Existing domain-specific badge files will become thin wrappers (2-3 lines) that import `StatusBadge` + their preset config, preserving the public API so no import changes are needed across the app.

### RTL Compliance
- Uses `ms-`/`me-` for icon gap spacing
- No directional classes

