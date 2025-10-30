# Multi-Tenant Organization Setup

## Overview
The system now supports multiple organizations (businesses) with complete data isolation. Each user belongs to one organization, and PRs are automatically scoped to that organization.

## Database Changes

### Migration Applied
File: `supabase/migrations/20250115000001_add_organization_id.sql`

### Schema Changes

#### 1. Users Table
```sql
ALTER TABLE public.users ADD COLUMN organization_id UUID;
```
- Links each user to an organization
- Enables filtering PRs by user's organization

#### 2. Purchase Requisitions Table
```sql
ALTER TABLE public.purchase_requisitions ADD COLUMN organization_id UUID;
```
- Every PR is tagged with the creating user's organization
- Prevents cross-organization PR visibility

#### 3. RLS Policies Updated
All Row-Level Security policies now include organization_id checks:

**SELECT Policies:**
- Employee: `requested_by = auth.uid() AND organization_id matches`
- HOD: `department matches AND organization_id matches`
- Finance: `organization_id matches`

**INSERT Policies:**
- Users can only create PRs in their organization

**UPDATE Policies:**
- Users can only update PRs in their organization

## Code Changes

### AuthContext.tsx
Added `organizationId` field to User interface:
```typescript
interface User {
  id: string;
  email: string;
  role: 'Employee' | 'HOD' | 'Finance' | 'Admin' | 'SuperUser';
  name: string;
  department?: string;
  organizationId?: string;  // NEW
  permissions?: string[];
}
```

User organization is fetched on login from the users table.

### Service Layer (purchaseRequisitionService.ts)
- `PurchaseRequisition` interface now includes `organizationId`
- All PR insert/update operations include `organization_id`
- Data transformation includes organizationId mapping

### Portal Pages (Dashboard, HODPortal, FinancePortal)
When creating PRs, `organizationId` is automatically included:
```typescript
const routedPR = {
  ...newPR,
  organizationId: user?.organizationId,  // NEW
  // ... other fields
};
```

## How It Works

### Scenario: Multiple Organizations Using the App

**Organization A - Acme Corp**
- Employee1 creates PR-001 → tagged with OrgA_id
- HOD-A reviews → sees only OrgA PRs
- Finance-A approves → sees only OrgA PRs

**Organization B - Beta Ltd**
- Employee2 creates PR-101 → tagged with OrgB_id
- HOD-B reviews → sees only OrgB PRs
- Finance-B approves → sees only OrgB PRs

**Database Isolation**
- PR-001 has `organization_id = OrgA_id`
- PR-101 has `organization_id = OrgB_id`
- RLS policies ensure:
  - Acme employees/HOD/Finance CANNOT see Beta's PRs
  - Beta employees/HOD/Finance CANNOT see Acme's PRs

### Role-Based Visibility Within Organization

| Role | Sees | Filter |
|------|------|--------|
| Employee | Own PRs only | `requested_by = user.id AND organization_id = user.org_id` |
| HOD | Department PRs | `department = user.dept AND hod_status = 'Pending' AND organization_id = user.org_id` |
| Finance | All pending PRs | `finance_status = 'Pending' AND organization_id = user.org_id` |
| Admin | All PRs in org | `organization_id = user.org_id` |
| SuperUser | All PRs (no org filter) | - |

## Setup Instructions

### For New Organizations

1. **Create Organization Record**
   ```sql
   INSERT INTO public.organizations (name, created_at)
   VALUES ('Your Company Name', NOW());
   ```
   Note the returned UUID (your organization_id)

2. **Assign Users to Organization**
   When creating user invitations, include organization_id:
   ```sql
   UPDATE public.users 
   SET organization_id = 'YOUR_ORG_UUID'
   WHERE email = 'user@company.com';
   ```

3. **Verify Setup**
   - User logs in
   - Dashboard loads only their organization's PRs
   - HOD sees only their department's PRs
   - Finance sees all pending PRs in their organization

### For Existing Single-Organization Setup

If migrating from single-tenant to multi-tenant:

1. **Create Organizations Table** (if not exists)
   ```sql
   CREATE TABLE IF NOT EXISTS public.organizations (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL UNIQUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Create Default Organization**
   ```sql
   INSERT INTO public.organizations (name)
   VALUES ('Default Organization')
   RETURNING id;
   ```

3. **Assign All Users to Organization**
   ```sql
   UPDATE public.users 
   SET organization_id = 'DEFAULT_ORG_UUID'
   WHERE organization_id IS NULL;
   ```

4. **Assign All PRs to Organization**
   ```sql
   UPDATE public.purchase_requisitions
   SET organization_id = (
     SELECT organization_id FROM public.users 
     WHERE id = purchase_requisitions.requested_by
   )
   WHERE organization_id IS NULL;
   ```

## Security

### Data Isolation
- ✅ RLS policies enforce organization boundaries
- ✅ Database layer prevents cross-org access
- ✅ No way to query another organization's data

### Role-Based Access
- ✅ Employees see only their own PRs
- ✅ HOD sees only their department PRs
- ✅ Finance sees only their organization PRs
- ✅ Admin/SuperUser managed separately

### Audit Trail
- All PRs include `created_by` user ID
- Organization ID immutable once set
- Full history tracking per PR

## Verification

### Check User Organization
```sql
SELECT id, email, role, organization_id FROM public.users;
```

### Check PR Organization
```sql
SELECT id, transaction_id, organization_id, requested_by_name 
FROM public.purchase_requisitions;
```

### Test Cross-Org Prevention
1. Log in as User from Org A
2. Try to manually query Org B PRs via console
3. RLS policy blocks access - PR data not returned

## Troubleshooting

### "Cannot see PRs" Issue
- **Check**: User's `organization_id` is set
- **Fix**: `UPDATE public.users SET organization_id = 'ORG_UUID' WHERE id = 'USER_ID'`

### "Seeing PRs from other orgs"
- **Check**: RLS policies applied (run migration)
- **Verify**: `SELECT * FROM pg_policies WHERE tablename = 'purchase_requisitions'`

### PR Creation Fails
- **Check**: User's organization_id is not null
- **Check**: Organization exists in organizations table

## Future Enhancements

- Organization admin portal for managing users
- Organization billing and subscription tracking
- Cross-organization features (with explicit approval)
- Audit logs at organization level
