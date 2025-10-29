# Complete Workflow Test Guide - Organization Isolation

## Setup Status ✅

**Database Migrations Applied:**
- ✅ Created `organizations` table
- ✅ Added `organization_id` column to users table
- ✅ Added `organization_id` column to purchase_requisitions table
- ✅ Updated RLS policies to enforce organization isolation
- ✅ Created indexes for performance

**Organization Assignment:**
- ✅ Default Organization created: `c36cc60e-f3cc-421d-aa6c-0852629dc844`
- ✅ 7 users assigned to organization
- ✅ 5 existing PRs tagged with organization

**Application:**
- ✅ Dev server restarted
- ✅ Code updated with organizationId support

---

## Test Case 1: Employee Creates PR (Organization Isolation)

### Setup
- Login as Employee user in the system
- Navigate to Dashboard

### Test Steps

1. **Submit a New PR**
   - Click "Create New PR"
   - Fill out form:
     - Type: "PURCHASE_REQUISITION"
     - Department: "IT"
     - Total Amount: "₹5,000"
     - Add an item (e.g., "Laptops")
   - Click Submit
   - **Expected**: Toast shows "Purchase Requisition Submitted"

2. **Verify in Dashboard**
   - PR appears in "My Purchase Requisitions"
   - Status shows "PENDING_HOD_APPROVAL"
   - History shows "Submitted by [Employee Name]"

3. **Verify Database Assignment**
   - Check that PR has `organization_id` set
   - Should match employee's organization

### Success Criteria
- ✅ PR created successfully
- ✅ Appears in employee's dashboard only
- ✅ PR has organization_id in database
- ✅ Organization matches employee's organization

---

## Test Case 2: HOD Reviews PR (Department + Organization)

### Setup
- Login as HOD user in same department
- Navigate to HODPortal

### Test Steps

1. **See Department Pending PRs**
   - Go to "Department Approval Queue"
   - **Expected**: PR from Test Case 1 appears here
   - Only shows PRs from HOD's department AND organization
   - Employee name visible in the list

2. **Approve the PR**
   - Click Finalize on the PR
   - Choose "Approve"
   - Add comment: "Approved for processing"
   - Click Confirm
   - **Expected**: Toast "✅ PR Approved by HOD"

3. **Verify Status Change**
   - PR disappears from "Department Approval Queue"
   - History shows "Approved by HOD"
   - Status updated in database

4. **Verify Organization Still Applied**
   - PR still has same organization_id
   - No cross-organization visibility

### Success Criteria
- ✅ HOD sees only their department PRs
- ✅ Approval works correctly
- ✅ PR moves to Finance queue
- ✅ Organization isolation maintained

---

## Test Case 3: Finance Reviews PR (Organization Only)

### Setup
- Login as Finance user
- Navigate to FinancePortal

### Test Steps

1. **See Finance Pending PRs**
   - Go to "Purchase Requisitions for Final Approval"
   - **Expected**: PR from Test Case 1 (now approved by HOD) appears
   - Shows both:
     - PRs pending from any department (HOD status: Pending)
     - PRs approved by HOD but pending Finance (HOD status: Approved)
   - Only shows PRs from Finance's organization

2. **Approve for Payment**
   - Click Finalize on the PR
   - Choose "Approve"
   - Add comment: "Approved for payment processing"
   - Click Confirm
   - **Expected**: Toast "✅ PR Approved by Finance"

3. **Verify Final Status**
   - PR status is now "Approved"
   - History shows both HOD and Finance approvals
   - Timestamp and names correct for each action

4. **Verify Complete Audit Trail**
   - Open PR History
   - Shows sequence:
     1. Submitted by Employee
     2. Approved by HOD
     3. Approved by Finance

### Success Criteria
- ✅ Finance sees all organization PRs needing approval
- ✅ Both department and organization filtering work
- ✅ Final status correct after both approvals
- ✅ Full audit trail complete
- ✅ No cross-organization visibility

---

## Test Case 4: Organization Isolation (Cross-Organization Prevention)

### Setup Required
For this test, you need TWO organizations:
1. Default Organization (already set up)
2. Create a second test organization

**Create Second Organization (SQL):**
```sql
INSERT INTO public.organizations (name) 
VALUES ('Test Organization 2') 
RETURNING id;
```

Then create a test user in second organization:
```sql
INSERT INTO public.users (id, email, role, name, department, organization_id)
VALUES (gen_random_uuid(), 'testuser@org2.com', 'Employee', 'Test User', 'Sales', 'ORG2_UUID')
ON CONFLICT DO NOTHING;
```

### Test Steps

1. **Create PR in Organization 1**
   - Login as Employee in Org 1
   - Create PR with amount ₹3,000
   - Verify it appears in dashboard

2. **Verify Org 2 Cannot See Org 1 PR**
   - Login as HOD in Org 2
   - Go to Department Approval Queue
   - **Expected**: Organization 1 PR does NOT appear
   - Only shows PRs from Org 2 and their department

3. **Create PR in Organization 2**
   - Employee in Org 2 creates PR with amount ₹7,000
   - Verify it appears in Org 2 HOD's queue

4. **Verify Complete Isolation**
   - Finance Org 1: Only sees Org 1 PRs
   - Finance Org 2: Only sees Org 2 PRs
   - No way to view cross-organization data

### Success Criteria
- ✅ Org 1 users cannot see Org 2 data
- ✅ Org 2 users cannot see Org 1 data
- ✅ Database RLS policies enforce isolation
- ✅ Complete multi-tenant separation

---

## Test Case 5: Rejection Workflow

### Setup
- Use existing PR from previous tests
- Login as HOD

### Test Steps

1. **Reject a PR**
   - Click Finalize on pending PR
   - Choose "Decline"
   - Add reason: "Budget allocation exceeded"
   - Click Confirm
   - **Expected**: Toast "❌ PR Declined by HOD"

2. **Verify Rejection**
   - PR status is now "Rejected"
   - No longer appears in approval queues
   - History shows rejection with reason

3. **Finance Cannot See Rejected PR**
   - Login as Finance
   - Check "Purchase Requisitions for Final Approval"
   - **Expected**: Rejected PR does not appear
   - Query filters out status = 'Rejected'

### Success Criteria
- ✅ Rejection works correctly
- ✅ Rejected PRs hidden from pending queues
- ✅ History recorded properly
- ✅ Organization isolation maintained

---

## Test Case 6: Split PR Workflow (with Organization)

### Setup
- Use an approved or pending PR
- Login as HOD or Finance

### Test Steps

1. **Split the PR**
   - Click Split button on PR
   - Enter split details:
     - Split 1: ₹2,000
     - Split 2: ₹3,000
   - Click Split
   - **Expected**: Toast "Transaction Split Successfully"

2. **Verify Split PRs Created**
   - Original PR shows "Split" status
   - Two new child PRs appear
   - All tagged with same organization

3. **Verify Split PR Approval Flow**
   - Child PRs appear in approval queues
   - Go through normal approval process
   - Organization isolation maintained throughout

### Success Criteria
- ✅ Split PRs created with organization_id
- ✅ Split PRs visible in correct approval queue
- ✅ Organization isolation not broken by split
- ✅ History shows split action with role

---

## Quick Verification Checklist

### Before Testing
- [ ] Dev server running
- [ ] Migrations applied successfully
- [ ] 7 users assigned to organization
- [ ] 5 PRs tagged with organization
- [ ] RLS policies active

### After Each Test
- [ ] PR has organization_id in database
- [ ] RLS policies enforcing access control
- [ ] History entries recording correctly
- [ ] Toast notifications showing
- [ ] No console errors

### Cross-Organization Test (Optional)
- [ ] Create second organization
- [ ] Create user in second org
- [ ] Verify data completely isolated
- [ ] Finance cannot see other org PRs

---

## Expected Behavior Summary

### Authentication & Organization Binding
- ✅ User logs in → organization_id loaded from profile
- ✅ All new PRs inherit user's organization
- ✅ Split PRs inherit parent's organization

### PR Visibility
- ✅ Employee: Own PRs only
- ✅ HOD: Department PRs + same organization
- ✅ Finance: All pending PRs + same organization
- ✅ Admin: All PRs in organization

### RLS Enforcement
- ✅ SELECT: Filtered by organization
- ✅ INSERT: Must be in user's organization
- ✅ UPDATE: Can only update org PRs

### Database Level
- ✅ Every PR has organization_id
- ✅ Foreign key prevents orphaned records
- ✅ Indexes ensure performance

---

## Troubleshooting

### "Cannot see PRs" Issue
```sql
-- Check user's organization
SELECT id, email, organization_id FROM public.users WHERE email = 'user@company.com';

-- Check PR's organization
SELECT id, transaction_id, organization_id FROM public.purchase_requisitions LIMIT 5;
```

### RLS Policy Errors
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'purchase_requisitions';

-- Check policy details
SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'purchase_requisitions';
```

### Organization_id NULL Issue
```sql
-- Find PRs/users without organization
SELECT id, email FROM public.users WHERE organization_id IS NULL;
SELECT id, transaction_id FROM public.purchase_requisitions WHERE organization_id IS NULL;

-- Assign to default org
UPDATE public.users SET organization_id = 'DEFAULT_ORG_UUID' WHERE organization_id IS NULL;
```

---

## Next Steps

After successful testing:

1. **Document Results**: Record any issues or unexpected behavior
2. **Test with Second Org**: If time permits, test complete multi-tenant scenario
3. **Load Testing**: Verify performance with RLS policies
4. **Edge Cases**: Test with rapid approvals, concurrent requests
5. **Deployment**: Plan rollout to production

---

## Test Summary Template

```
Test Date: ___________
Tester: ___________

Test Case 1 (Employee Creates PR): PASS / FAIL / PARTIAL
Notes: ___________

Test Case 2 (HOD Reviews): PASS / FAIL / PARTIAL
Notes: ___________

Test Case 3 (Finance Approves): PASS / FAIL / PARTIAL
Notes: ___________

Test Case 4 (Organization Isolation): PASS / FAIL / PARTIAL
Notes: ___________

Test Case 5 (Rejection): PASS / FAIL / PARTIAL
Notes: ___________

Test Case 6 (Split PR): PASS / FAIL / PARTIAL
Notes: ___________

Overall Status: READY FOR PRODUCTION / NEEDS FIXES / ADDITIONAL TESTING NEEDED

Critical Issues Found: ___________
Recommendations: ___________
```

---

## References

- Migration: `supabase/migrations/20250115000001_add_organization_id.sql`
- Service: `src/services/purchaseRequisitionService.ts`
- Context: `src/contexts/AuthContext.tsx`
- Docs: `MULTITENANT_SETUP.md`
