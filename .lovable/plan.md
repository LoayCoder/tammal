

## Translation Key Audit — Workload Intelligence

### Problem
Multiple components created during the 8-gap fix use translation keys that don't exist in `en.json` / `ar.json`. These render as raw key strings in the UI (e.g., `governance.sla.overdue`, `executive.narrative.title`).

### Missing Keys by Component

**1. `SlaCountdownBadge.tsx`** — 2 missing keys
- `governance.sla.overdue` → "overdue" / "متأخر"
- `governance.sla.left` → "left" / "متبقي"

**2. `UnlockRequestDialog.tsx`** — 4 missing keys
- `governance.unlock.title` → "Request Unlock" / "طلب فتح القفل"
- `governance.unlock.description` → "Provide justification to unlock task: {{title}}" / "قدم مبررًا لفتح قفل المهمة: {{title}}"
- `governance.unlock.placeholder` → "Why does this task need to be unlocked?" / "لماذا تحتاج هذه المهمة إلى فتح القفل؟"
- `governance.unlock.confirm` → "Unlock Task" / "فتح قفل المهمة"

**3. `RejectWithReasonDialog.tsx`** — 4 missing keys
- `tasks.rejectTask` → "Reject Task" / "رفض المهمة"
- `tasks.rejectTaskDesc` → "Provide a reason for rejecting: {{title}}" / "قدم سببًا لرفض: {{title}}"
- `tasks.rejectionReason` → "Rejection Reason" / "سبب الرفض"
- `tasks.rejectionReasonPlaceholder` → "Explain why this task is being rejected..." / "اشرح سبب رفض هذه المهمة..."
- `tasks.reject` → "Reject" / "رفض"

**4. `ExecutiveNarrativeCard.tsx`** — 5 missing keys
- `executive.narrative.title` → "AI Executive Insight" / "رؤية تنفيذية بالذكاء الاصطناعي"
- `executive.narrative.noData` → "Insufficient data for executive narrative" / "بيانات غير كافية للتحليل التنفيذي"
- `executive.narrative.healthy` → "Organization health is strong at {{score}}%. {{strongest}} leads at {{strongestVal}}%." / "صحة المنظمة قوية عند {{score}}%. يتصدر {{strongest}} بنسبة {{strongestVal}}%."
- `executive.narrative.attention` → "Score {{score}}% requires attention. {{weakest}} is lowest at {{weakestVal}}%. {{burnoutCount}} employees at burnout risk." / "النتيجة {{score}}% تتطلب اهتمامًا. {{weakest}} هو الأدنى بنسبة {{weakestVal}}%. {{burnoutCount}} موظفين معرضين للإرهاق."
- `executive.narrative.critical` → "Critical: score {{score}}%. {{weakest}} is at {{weakestVal}}%. {{burnoutCount}} employees at burnout risk require immediate action." / "حرج: النتيجة {{score}}%. {{weakest}} عند {{weakestVal}}%. {{burnoutCount}} موظفين معرضين للإرهاق يحتاجون إلى تدخل فوري."

**5. `ExecutiveNarrativeCard.tsx` + `TammalWeightsSettings.tsx`** — TAMMAL component labels, 4 missing keys
- `executive.tammal.alignment` → "Alignment" / "المواءمة"
- `executive.tammal.velocity` → "Velocity" / "السرعة"
- `executive.tammal.capacity_balance` → "Capacity Balance" / "توازن السعة"
- `executive.tammal.burnout_health` → "Burnout Health" / "صحة الإرهاق"
- `executive.tammal.capacity` → "Capacity" / "السعة"
- `executive.tammal.burnout` → "Burnout" / "الإرهاق"

**6. `TammalWeightsSettings.tsx`** — 4 missing keys
- `executive.tammalWeights.title` → "TAMMAL Index Weights" / "أوزان مؤشر تمّل"
- `executive.tammalWeights.customize` → "Customize Weights" / "تخصيص الأوزان"
- `executive.tammalWeights.sum` → "Total" / "المجموع"
- `executive.tammalWeights.mustEqual100` → "must equal 100" / "يجب أن يساوي 100"
- `executive.tammalWeights.saved` → "Weights saved successfully" / "تم حفظ الأوزان بنجاح"

**7. `CapacityPlannerView.tsx` + `CapacityPlanner.tsx`** — 13 missing keys
- `capacityPlanner.pageTitle` → "Capacity Planner" / "مخطط القدرات"
- `capacityPlanner.pageDesc` → "Visual workload balancing — drag tasks between team members" / "موازنة أعباء العمل بصريًا — اسحب المهام بين أعضاء الفريق"
- `capacityPlanner.searchEmployees` → "Search employees..." / "بحث عن موظفين..."
- `capacityPlanner.totalMembers` → "team members" / "أعضاء الفريق"
- `capacityPlanner.overloaded` → "overloaded" / "محملون بشكل زائد"
- `capacityPlanner.underutilized` → "underutilized" / "غير مستغلين"
- `capacityPlanner.loaded` → "loaded" / "محمّل"
- `capacityPlanner.capacity` → "capacity" / "السعة"
- `capacityPlanner.noTasks` → "No active tasks" / "لا توجد مهام نشطة"
- `capacityPlanner.reassignTask` → "Reassign Task" / "إعادة تعيين المهمة"
- `capacityPlanner.reassignDesc` → "Move this task to another team member" / "نقل هذه المهمة إلى عضو فريق آخر"
- `capacityPlanner.from` → "From" / "من"
- `capacityPlanner.estimated` → "Estimated" / "التقدير"
- `capacityPlanner.assignTo` → "Assign to" / "تعيين إلى"
- `capacityPlanner.selectEmployee` → "Select employee..." / "اختر موظفًا..."
- `capacityPlanner.confirm` → "Reassign" / "إعادة تعيين"

---

### Fix Plan

**1 file pair edited**: `src/locales/en.json` and `src/locales/ar.json`

Add all ~37 missing keys to the correct nested locations:
- `governance.sla.overdue`, `governance.sla.left`
- `governance.unlock.*` (4 keys)
- `tasks.rejectTask`, `tasks.rejectTaskDesc`, `tasks.rejectionReason`, `tasks.rejectionReasonPlaceholder`, `tasks.reject`
- `executive.narrative.*` (5 keys)
- `executive.tammal.*` (6 keys)
- `executive.tammalWeights.*` (5 keys)
- `capacityPlanner.*` (16 keys)

No component code changes needed — all keys are already referenced correctly in the components.

