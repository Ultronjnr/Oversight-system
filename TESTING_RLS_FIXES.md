# Testing Guide - RLS Policy Fixes

## What Was Fixed
The "new row violates row-level security policy" errors during PR creation have been fixed by ensuring the `organization_id` is properly passed and validated at every step of PR creation and splitting.

## Prerequisites
- All users must have an `organization_id` set in the users table
- Current test organization: "Default Organization" (c36cc60e-f3cc-421d-aa6c-0852629dc844)

## Test Scenarios

### Test 1: Create PR as Employee
**Objective:** Verify that new PRs can be created without RLS errors

**Steps:**
1. Navigate to the app and login as an Employee account
   - Example: lethabomokhoro@leadtechsoftwaresolutions.co.za
2. Go to Employee Portal or Dashboard
3. Click "Create New PR" button
4. Fill in all required fields:
   - Type: Select a type
   - Request Date: Pick a date
   - Items: Add at least one item with quantity and price
   - Urgency: Select urgency level
   - Department: Enter department
5. Click "Submit" button
6. **Expected Result:**
   - No RLS policy error
   - PR appears in the system with "PENDING_HOD_APPROVAL" status
   - Toast notification shows success: "Purchase Requisition Submitted"
   - PR ID and transaction ID are visible

**Failure Indicators:**
- Error message: "new row violates row-level security policy"
- Error: "Organization ID is required..."
- PR doesn't appear in any queue after submission

### Test 2: Create PR as HOD
**Objective:** Verify HOD can create PRs without RLS errors

**Steps:**
1. Login as HOD account
   - Example: sales@tmmbs.co.za
2. Go to HOD Portal or create new PR
3. Fill in PR form and submit
4. **Expected Result:**
   - PR created successfully
   - Appears in your personal PRs list
   - No RLS policy errors

### Test 3: Create PR as Finance
**Objective:** Verify Finance users can create PRs without RLS errors

**Steps:**
1. Login as Finance account
   - Example: kananelo@tmmbs.co.za
2. Go to Finance Portal or create new PR
3. Fill in PR form and submit
4. **Expected Result:**
   - PR created successfully
   - No RLS policy errors
   - Finance user can see the PR

### Test 4: Split PR (Most Important Test)
**Objective:** Verify the split feature works without organization_id errors

**Steps:**
1. Login as HOD (sales@tmmbs.co.za)
2. Go to Department Approval Queue
3. Find a PR with 2+ items (if none exist, create one first)
4. Click on the PR in the list to view details
5. Click "Split" button in the details panel
6. In the "Split PR by Items" modal:
   - Review the items listed
   - Select 1-2 items to split
   - Click "Split X Items" button
7. **Expected Result:**
   - Modal closes
   - Toast: "Transaction Split Successfully - Created X new PR(s)"
   - New PRs appear in the queue with:
     - Status: "Pending"
     - Transaction ID like: "{original-id}-SPLIT-1"
     - Selected items in the new PR
   - Original PR status changed to "Split"
   - Both original PR (with remaining items) and new PRs visible in queue
   - **No RLS policy errors**

**Failure Indicators:**
- Error: "new row violates row-level security policy"
- Error: "Failed to split the purchase requisition"
- Modal closes but no new PRs appear
- Original PR status not changed to "Split"

### Test 5: Split PR as Finance
**Objective:** Verify Finance user can split PRs

**Steps:**
1. Login as Finance (kananelo@tmmbs.co.za)
2. Go to Finance Approval Queue
3. Find a PR with 2+ items (preferably one already approved by HOD)
4. Click "Split" button
5. Select items and confirm split
6. **Expected Result:**
   - Same as Test 4
   - New split PRs appear in Finance queue
   - No RLS policy errors

### Test 6: Split Verification - Data Integrity
**Objective:** Verify that split PRs have correct data

**Steps:**
1. After splitting a PR, examine the split PRs
2. Check that each split PR has:
   - ✅ Correct `organization_id` (should match original)
   - ✅ Correct items (only selected items)
   - ✅ Correct amount (sum of selected item prices)
   - ✅ Status: "PENDING_HOD_APPROVAL" or "Pending"
   - ✅ Requested by: Same as original PR
   - ✅ Department: Same as original PR
   - ✅ Correct history with "Split Processed" entry
3. Check original PR has:
   - ✅ Status: "Split"
   - ✅ Remaining items (not the split ones)
   - ✅ Updated amount (original - split amount)
   - ✅ History entry: "Split Processed" with role (HOD/Finance)

### Test 7: Approval Workflow After Split
**Objective:** Verify split PRs can be approved independently

**Steps:**
1. After splitting a PR, login as Finance
2. Go to Finance Approval Queue
3. Find one of the new split PRs
4. Click "Finalize" button
5. Choose "Approve" and add comments
6. **Expected Result:**
   - Split PR approved without errors
   - Status changes to "Approved"
   - History updated with approval entry
   - No RLS policy errors

### Test 8: Cross-Organization Isolation
**Objective:** Verify users only see their organization's PRs

**Steps:**
1. Create 2 users if available in different organizations (currently all in same org)
2. User A creates a PR
3. Login as User B
4. **Expected Result:**
   - User B cannot see User A's PR (RLS policy blocks it)
   - User B can only see/create PRs in their organization

---

## Error Messages - What They Mean

### "new row violates row-level security policy for table 'purchase_requisitions'"
- **Cause:** organization_id mismatch or missing
- **Solution:** Check that user has organization_id in users table
- **Action:** Contact administrator to verify user profile setup

### "Organization ID is required to create a purchase requisition..."
- **Cause:** User's profile doesn't have organization_id set
- **Solution:** Admin needs to assign user to an organization
- **Action:** This means user profile is incomplete

### "Your user profile is not properly configured with an organization. Please contact your administrator."
- **Cause:** User logged in successfully but organization_id is missing
- **Solution:** User profile needs to be configured with organization
- **Action:** Contact system administrator

---

## Quick Diagnostics

### Check user organization_id in database:
```sql
SELECT id, email, name, role, organization_id FROM public.users WHERE email = 'user@example.com';
```
Expected: Non-null UUID in organization_id column

### Check that PRs have organization_id:
```sql
SELECT id, transaction_id, organization_id, status FROM public.purchase_requisitions LIMIT 5;
```
Expected: All rows have non-null organization_id UUID

### Check RLS policy is in place:
```sql
SELECT policyname, definition FROM pg_policies WHERE tablename = 'purchase_requisitions' AND policyname LIKE '%insert%';
```
Expected: Policies like "Users can insert their own PRs" with organization_id check

---

## Success Criteria
- ✅ All portal users can create PRs without RLS errors
- ✅ Split feature works for HOD and Finance
- ✅ New split PRs appear in approval queues
- ✅ Split PRs can be approved independently
- ✅ No RLS policy errors at any step
- ✅ Data integrity maintained (correct amounts, items, organization_id)
- ✅ Error messages are helpful and actionable

---

## Troubleshooting

### If you see RLS errors after these fixes:
1. **Clear browser cache** and refresh page
2. **Logout and login again** to reload user profile with organization_id
3. **Check user profile** in database has organization_id
4. **Verify network request** shows organization_id being sent
5. **Check browser console** for specific error details

### If split creates PRs but they don't appear:
1. **Refresh the page** to reload PR list
2. **Check that split PRs have status "PENDING_HOD_APPROVAL"** (filters might be hiding them)
3. **Verify organization_id** matches on split PR and original PR
4. **Check user permissions** - split PRs should appear in appropriate queue

### If split creates error but no split PRs visible:
1. **Check Supabase logs** for actual database error
2. **Verify original PR still exists** with correct data
3. **Check localStorage** - PRs might be saved offline (look for warning: "saved to localStorage")
