-- Add organization_id column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_organization_id 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add organization_id column to purchase_requisitions table
ALTER TABLE public.purchase_requisitions ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Add foreign key constraint
ALTER TABLE public.purchase_requisitions 
ADD CONSTRAINT fk_purchase_requisitions_organization_id 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index on organization_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_organization_id ON public.purchase_requisitions(organization_id);

-- Update RLS policies to include organization isolation

-- Drop old policies that don't check organization
DROP POLICY IF EXISTS "Users can view their own PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "HOD can view department PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Finance can view all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Admin can view all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Users can insert their own PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "HOD can update department PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Finance can update all PRs" ON public.purchase_requisitions;
DROP POLICY IF EXISTS "Admin can update all PRs" ON public.purchase_requisitions;

-- Create new policies with organization isolation

-- Users can view their own PRs within their organization
CREATE POLICY "Users can view their own PRs" ON public.purchase_requisitions
  FOR SELECT USING (
    auth.uid() = requested_by 
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- HOD can view PRs from their department within their organization
CREATE POLICY "HOD can view department PRs" ON public.purchase_requisitions
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'HOD' 
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid())
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Finance can view all PRs in their organization
CREATE POLICY "Finance can view all PRs" ON public.purchase_requisitions
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Finance'
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Admin can view all PRs in their organization
CREATE POLICY "Admin can view all PRs" ON public.purchase_requisitions
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Users can insert their own PRs
CREATE POLICY "Users can insert their own PRs" ON public.purchase_requisitions
  FOR INSERT WITH CHECK (
    auth.uid() = requested_by 
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- HOD can update PRs in their department within their organization
CREATE POLICY "HOD can update department PRs" ON public.purchase_requisitions
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'HOD'
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid())
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Finance can update all PRs in their organization
CREATE POLICY "Finance can update all PRs" ON public.purchase_requisitions
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Finance'
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- Admin can update all PRs in their organization
CREATE POLICY "Admin can update all PRs" ON public.purchase_requisitions
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin'
    AND organization_id = (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );
