-- Create purchase_requisitions table
CREATE TABLE IF NOT EXISTS public.purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'PURCHASE_REQUISITION',
  request_date DATE NOT NULL,
  due_date DATE,
  payment_due_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  urgency_level TEXT DEFAULT 'NORMAL' CHECK (urgency_level IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  department TEXT,
  budget_code TEXT,
  project_code TEXT,
  supplier_preference TEXT,
  delivery_location TEXT,
  special_instructions TEXT,
  document_name TEXT,
  document_type TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'PENDING_HOD_APPROVAL' CHECK (status IN ('PENDING_HOD_APPROVAL', 'PENDING_FINANCE_APPROVAL', 'APPROVED', 'DECLINED')),
  hod_status TEXT DEFAULT 'Pending' CHECK (hod_status IN ('Pending', 'Approved', 'Declined')),
  finance_status TEXT DEFAULT 'Pending' CHECK (finance_status IN ('Pending', 'Approved', 'Declined')),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_by_name TEXT,
  requested_by_role TEXT,
  requested_by_department TEXT,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by ON public.purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status ON public.purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_hod_status ON public.purchase_requisitions(hod_status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_finance_status ON public.purchase_requisitions(finance_status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_created_at ON public.purchase_requisitions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own PRs
CREATE POLICY "Users can view their own PRs" ON public.purchase_requisitions
  FOR SELECT USING (auth.uid() = requested_by);

-- HOD can view PRs from their department
CREATE POLICY "HOD can view department PRs" ON public.purchase_requisitions
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'HOD' 
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid())
  );

-- Finance can view all PRs
CREATE POLICY "Finance can view all PRs" ON public.purchase_requisitions
  FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Finance');

-- Admin can view all PRs
CREATE POLICY "Admin can view all PRs" ON public.purchase_requisitions
  FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin');

-- Users can insert their own PRs
CREATE POLICY "Users can insert their own PRs" ON public.purchase_requisitions
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- HOD can update PRs in their department
CREATE POLICY "HOD can update department PRs" ON public.purchase_requisitions
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'HOD'
    AND requested_by_department = (SELECT department FROM public.users WHERE id = auth.uid())
  );

-- Finance can update all PRs
CREATE POLICY "Finance can update all PRs" ON public.purchase_requisitions
  FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Finance');

-- Admin can update all PRs
CREATE POLICY "Admin can update all PRs" ON public.purchase_requisitions
  FOR UPDATE USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin');
