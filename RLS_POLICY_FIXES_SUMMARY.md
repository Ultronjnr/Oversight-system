# RLS Policy Violation Fixes - Complete Summary

## Problem
Error when creating Purchase Requisitions (PRs):
```
❌ Error creating PR: [object Object]
❌ Failed to create PR: new row violates row-level security policy for table "purchase_requisitions"
```

## Root Cause
The RLS policy for `purchase_requisitions` table requires:
1. The authenticated user's ID must match `requested_by` field
2. The PR's `organization_id` must match the user's `organization_id` from the users table

When `organization_id` was missing or null in the PR data, the RLS policy would reject the insert.

## Issues Fixed

### 1. ✅ AuthContext - Missing organizationId in Login
**File:** `src/contexts/AuthContext.tsx`
**Problem:** The login method was not including `organizationId` in the user object, even though it was being loaded from the database.
**Fix:** 
- Added `organizationId: userData.organization_id` to the normalized user object (line 161)
- Added `organizationId: sUser.user_metadata?.organization_id` to the fallback user object (line 194)

### 2. ✅ createPurchaseRequisition Service - Validation Added
**File:** `src/services/purchaseRequisitionService.ts`
**Problem:** The function was silently accepting `organizationId: null`, which violated the RLS policy.
**Fix:** 
- Added validation to throw an error if `organizationId` is missing (line 83-86)
- Changed from `organization_id: pr.organizationId || null` to `organization_id: pr.organizationId`
- Now throws helpful error: "Organization ID is required to create a purchase requisition..."

### 3. ✅ Dashboard - Missing organizationId in PR Creation
**File:** `src/pages/Dashboard.tsx`
**Problem:** When submitting new PRs, the code didn't check if `organizationId` was available.
**Fix:**
- Added validation to check `user?.organizationId` before creating PR (lines 89-95)
- Shows error message if organization is not configured
- Added validation in `handleSplitPR` to check organization before splitting (lines 240-244)

### 4. ✅ EmployeePortal - Missing organizationId in PR Creation
**File:** `src/pages/EmployeePortal.tsx`
**Problem:** The portal was NOT passing `organizationId` when creating PRs.
**Fix:**
- Added `organizationId: user?.organizationId` to routedPR (line 61)
- Added validation check before PR creation (lines 49-55)
- Added error handling to show organization_id in logs (line 69)

### 5. ✅ FinancePortal - Enhanced Error Handling
**File:** `src/pages/FinancePortal.tsx`
**Problem:** No validation of organization_id availability.
**Fix:**
- Added validation check for `user?.organizationId` (lines 79-84)
- Improved error message to show actual error from service (line 103)

### 6. ✅ HODPortal - Enhanced Error Handling
**File:** `src/pages/HODPortal.tsx`
**Problem:** No validation of organization_id availability.
**Fix:**
- Added validation check for `user?.organizationId` (lines 79-84)
- Improved error message to show actual error from service (line 103)

### 7. ✅ Dashboard - Fixed Split Feature
**File:** `src/pages/Dashboard.tsx`
**Problem:** `handleSplitPR` was manually calling `createPurchaseRequisition` directly instead of using the proper `splitRequisition` service, which handles organization_id correctly.
**Fix:**
- Changed to use `prService.splitRequisition()` (lines 255-258)
- Proper role context handling (split role is 'Employee' in Dashboard)
- Added validation and error handling for organization_id

## How the Split Feature Works Now
1. User clicks Split on a PR
2. SimpleItemSplitModal opens with item selection
3. User selects items and clicks Split
4. `handleSplitPR` is called
5. For HOD/Finance portals: Uses `prService.splitRequisition()` with proper role (HOD/Finance)
6. For Dashboard: Uses `prService.splitRequisition()` with 'Employee' role
7. Service creates new PR rows with:
   - Same `organization_id` as original PR (inherited from original)
   - Proper status and history entries
   - Selected items in the new PR
   - Original PR marked as "Split"

## Testing the Fixes

### Verify Users Have organization_id
All users should have an organization assigned. Check in Supabase:
```sql
SELECT id, email, name, role, organization_id FROM public.users;
```

Expected: All users should have a non-null `organization_id` UUID.

### Test PR Creation
1. Login as any user (Employee, HOD, or Finance)
2. Create a new PR with items
3. Submit the PR
4. Verify:
   - No RLS policy error
   - PR appears in appropriate queue (HOD/Finance)
   - PR has correct organization_id

### Test Split Feature
1. Login as HOD or Finance
2. Go to approval queue
3. Select a PR with 2+ items
4. Click Split button
5. Select items to split
6. Click "Split X Items"
7. Verify:
   - New PRs created successfully
   - Original PR status = "Split"
   - Both original (remaining items) and new (split items) PRs appear in queue
   - All PRs have correct organization_id

### Test Cross-Organization Isolation
1. All PRs should be isolated by organization_id
2. Users should only see PRs from their organization
3. If a user belongs to Organization A, they:
   - Can only create PRs in Organization A
   - Can only see/approve PRs in Organization A
   - Cannot access Organization B's PRs

## Data Validation Checklist
- ✅ User has `organization_id` in users table
- ✅ AuthContext loads `organizationId` from user profile
- ✅ Dashboard passes `organizationId` when creating PR
- ✅ EmployeePortal passes `organizationId` when creating PR
- ✅ HODPortal passes `organizationId` when creating PR
- ✅ FinancePortal passes `organizationId` when creating PR
- ✅ createPurchaseRequisition validates `organizationId` is present
- ✅ splitRequisition inherits `organization_id` from original PR
- ✅ All portals check `user?.organizationId` before operations

## Error Messages Users Will See

### If organizationId is missing:
```
"Your user profile is not properly configured with an organization. Please contact your administrator."
```

### If createPurchaseRequisition fails to create:
```
"Organization ID is required to create a purchase requisition. Please ensure your user profile is properly configured."
```

These errors indicate a configuration issue that needs admin attention.

## Database RLS Policy
The policy enforces:
```sql
WITH CHECK (
  auth.uid() = requested_by 
  AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
)
```

This ensures:
1. Users can only create PRs as themselves (auth.uid() = requested_by)
2. The organization_id must match their profile organization
3. No organization cross-contamination is possible
