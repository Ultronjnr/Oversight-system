# PR Approval Workflow - Relationship Chain

## Overview
The PR (Purchase Requisition) workflow follows a clear approval chain that ensures proper segregation of duties and maintains visibility across all roles.

## Workflow Chain

### 1. Employee Submits PR
- **Where**: Dashboard or EmployeePortal
- **Action**: Creates a new PR via `PurchaseRequisitionForm`
- **Initial State**:
  - `hodStatus`: 'Pending'
  - `financeStatus`: 'Pending'  
  - `status`: 'PENDING_HOD_APPROVAL'
  - History entry: "Submitted by [Employee Name]"

### 2. HOD Review & Approval
- **Where**: HODPortal → "Department Approval Queue"
- **Who**: Head of Department
- **Query**: `getHODPendingPRs(department)` - shows all pending PRs from their department
- **Actions Available**:
  - **Approve**: Sets `hodStatus = 'Approved'`, adds history entry "Approved by HOD"
  - **Decline**: Sets `hodStatus = 'Rejected'`, `status = 'Rejected'`, adds history with reason

**Key**: HOD can approve even if Finance role doesn't exist yet. The PR becomes visible to Finance as soon as a Finance user logs in.

### 3. Finance Review & Final Approval
- **Where**: FinancePortal → "Purchase Requisitions for Final Approval"
- **Who**: Finance Manager
- **Query**: `getFinancePendingPRs()` - shows all PRs with `financeStatus = 'Pending'` regardless of HOD status
- **Visibility**: 
  - Can see PRs that are pending Finance approval (including those already approved by HOD)
  - Cannot see rejected PRs
- **Actions Available**:
  - **Approve**: Sets `financeStatus = 'Approved'`, if HOD already approved sets `status = 'Approved'`
  - **Decline**: Sets `financeStatus = 'Rejected'`, `status = 'Rejected'`

**Key**: Finance can approve HOD-approved PRs independently, and both HOD and Finance approvals must occur for final approval.

## Portal Visibility

### Employee Dashboard
- **My Purchase Requisitions**: All PRs they created
- **Status Visible**: Whether waiting for HOD, Finance, or fully approved

### HOD Portal  
- **Department Approval Queue**: All PRs from their department with `hodStatus = 'Pending'`
- **My Purchase Requisitions**: PRs they created
- **Reflects**: 
  - New employee submissions appear automatically
  - After approval, PR moves to Finance (no longer shows in pending queue)

### Finance Portal
- **Purchase Requisitions for Final Approval**: All PRs with `financeStatus = 'Pending'`
- **Includes**:
  - PRs not yet seen by HOD (`hodStatus = 'Pending'`)
  - PRs approved by HOD (`hodStatus = 'Approved'`, `financeStatus = 'Pending'`)
- **My Purchase Requisitions**: PRs they created (if any)
- **Reflects**:
  - All new employee submissions
  - PRs approved by HOD automatically appear

## Handling Missing Roles

### Scenario: No Finance User Yet
1. Employee submits PR → HOD sees in pending queue
2. HOD approves → PR marked with `hodStatus = 'Approved'`
3. When Finance user first logs in → sees all `financeStatus = 'Pending'` PRs including HOD-approved ones
4. Finance can proceed with approval

### Scenario: No HOD (Direct to Finance)
- System requires HOD role for department-level PRs
- This scenario would indicate a configuration issue and should be handled in role assignment

## Real-Time Updates

### Auto-Refresh
- Both HOD and Finance portals auto-refresh every 30 seconds
- Ensures visibility of new submissions without page reload

### Manual Refresh
- "Refresh" button available in both portals
- Immediate update without waiting for auto-refresh

### After Actions
- 500ms delay before reload ensures database transaction completes
- Prevents race conditions

## History Tracking

Every action is recorded in the `history` JSONB field:

```json
{
  "action": "Submitted|Approved|Rejected|Split Processed",
  "by": "User Name",
  "role": "Employee|HOD|Finance",
  "timestamp": "ISO-8601 timestamp",
  "comments": "Optional approval/rejection reason",
  "parentId": "Original PR ID (if split)",
  "splitInto": ["Child PR IDs"] (if splitting)
}
```

## Approval Logic

### Both-Role Approval
- When HOD approves AND Finance has already approved → `status = 'Approved'`
- When Finance approves AND HOD has already approved → `status = 'Approved'`
- Order doesn't matter - system checks current state at approval time

### Rejection
- Either role can reject, immediately sets `status = 'Rejected'`
- Rejection is final - cannot be changed
- Visible to all roles with access to PR

## Database Queries

### For HOD
```typescript
getHODPendingPRs(department)
// Returns: All PRs with:
// - requested_by_department = department
// - hod_status = 'Pending'
```

### For Finance
```typescript
getFinancePendingPRs()
// Returns: All PRs with:
// - finance_status = 'Pending'
// - status != 'Rejected'
// Sorted by: hod_status DESC (Approved first), then creation date
```

### For Employee
```typescript
getUserPurchaseRequisitions(userId)
// Returns: All PRs with:
// - requested_by = userId
// Sorted by: creation date DESC
```

## Summary

The system ensures:
✅ Clear segregation of duties (Employee → HOD → Finance)
✅ Each role sees only their relevant PRs
✅ Approvals from missing roles don't block the process
✅ Full audit trail via history entries
✅ Real-time visibility across portals
✅ Proper status transitions at each stage
