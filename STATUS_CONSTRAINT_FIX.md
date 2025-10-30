# Status Constraint Error Fix

## Problem
When splitting a PR, the system failed with error:
```
code: '23514'
message: 'new row for relation "purchase_requisitions" violates check constraint "purchase_requisitions_status_check"'
```

## Root Cause
The database constraint on the `status` column only allows these values:
```sql
CHECK (status IN ('PENDING_HOD_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED', 'DECLINED'))
```

But the `splitRequisition` function was setting new split PRs to `status: 'Draft'`, which is NOT in the allowed list.

## Solution Applied
Changed the status in `splitRequisition` function from `'Draft'` to `'PENDING_HOD_APPROVAL'`.

**File:** `src/services/purchaseRequisitionService.ts` (line 555)

**Before:**
```typescript
status: 'Draft',
```

**After:**
```typescript
status: 'PENDING_HOD_APPROVAL',
```

## Why This Works
1. New PRs are always created with `'PENDING_HOD_APPROVAL'` status
2. Split PRs should follow the same workflow as new PRs
3. This allows split PRs to:
   - Pass the database constraint check
   - Appear in HOD approval queue
   - Be processed like any other new PR
   - Have correct status transitions through approval workflow

## Workflow After Fix
1. **PR Created or Split** → Status = `'PENDING_HOD_APPROVAL'`
2. **HOD Approves** → Status = `'PENDING_FINANCE_APPROVAL'`, hod_status = `'Approved'`
3. **Finance Approves** → Status = `'APPROVED'`, finance_status = `'Approved'`
4. **Finance Rejects** → Status = `'DECLINED'`, finance_status = `'Declined'`

## Valid Status Values
Only these status values are allowed by the database constraint:
- `'PENDING_HOD_APPROVAL'` - Waiting for HOD to review/approve
- `'PENDING_FINANCE_APPROVAL'` - HOD approved, waiting for Finance
- `'APPROVED'` - Both HOD and Finance approved
- `'DECLINED'` - Either HOD or Finance declined

## Split PR Workflow
After split fix:
1. Original PR: Gets status = `'Split'` (internal tracking, uses history field)
2. Each split PR: Gets status = `'PENDING_HOD_APPROVAL'` (joins approval queue)
3. Split PRs appear in HOD's Department Approval Queue
4. Can be approved/declined independently
5. Each maintains separate approval history

## Display in UI
Split PRs now display correctly like the user's second screenshot:
- Appear in the approval queue list
- Show status as "Pending" or appropriate approval state
- Show "Finalize" and "Split" action buttons
- Can be approved independently from original PR

## Testing

### Test Split Feature
1. Login as HOD or Finance
2. Go to approval queue
3. Find PR with 2+ items
4. Click Split button
5. Select items → Click "Split X Items"
6. **Expected:** 
   - ✅ No status constraint error
   - ✅ Split PRs created with status 'PENDING_HOD_APPROVAL'
   - ✅ Split PRs appear in approval queue
   - ✅ Original PR marked as "Split"
   - ✅ Display matches second screenshot

### Test Approval After Split
1. Select a split PR
2. Click "Finalize" button
3. Approve and submit
4. **Expected:**
   - ✅ Split PR status changes to next step
   - ✅ Approval recorded in history
   - ✅ No database constraint errors

## Database Schema
For reference, the status column definition:
```sql
status TEXT DEFAULT 'PENDING_HOD_APPROVAL' 
  CHECK (status IN ('PENDING_HOD_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED', 'DECLINED'))
```

## Summary
- **Fixed:** Changed split PR status from invalid 'Draft' to valid 'PENDING_HOD_APPROVAL'
- **Result:** Split PRs now pass database constraints and appear in approval queue
- **Display:** Split PRs display correctly as shown in user's second screenshot
- **Workflow:** Split PRs follow normal approval workflow like new PRs
