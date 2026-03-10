

## Fix: Retroactive Notifications and Points for Existing Award Cycle

### Current State
The "Code Crafter" cycle is already **announced** with Abdullah Alshahri ranked **#1**, but:
- **Zero notifications** sent to the nominee (no `nomination_received`, no `award_won`)
- **Zero points** awarded (should be 5,000 for 1st place + 200 nominator bonus for Test User)
- Only one endorsement request notification exists (for someone else)

### Data to Insert

**1. Recognition Notifications** (2 records)
- `nomination_received` → Abdullah (nominee): "Test User nominated you!"
- `award_won` → Abdullah (nominee): "Congratulations! You placed #1"

**2. Points Transactions** (2 records)
- 5,000 points → Abdullah (nominee) with `source_type: 'award_win'`
- 200 points → Test User (nominator) with `source_type: 'nominator_bonus'`

### No Code Changes Needed
All notification types and point source types are already registered in the UI (from previous work). This is purely a data fix for the existing cycle that was processed before those features were added.

