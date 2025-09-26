-- Enable Row Level Security on all relevant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('Admin','SuperUser')
));

-- PURCHASE REQUISITIONS
DROP POLICY IF EXISTS "Employees can view own PRs" ON purchase_requisitions;
CREATE POLICY "Employees can view own PRs"
ON purchase_requisitions FOR SELECT
USING (requested_by = auth.uid());

DROP POLICY IF EXISTS "Employees can create PRs" ON purchase_requisitions;
CREATE POLICY "Employees can create PRs"
ON purchase_requisitions FOR INSERT
WITH CHECK (requested_by = auth.uid());

DROP POLICY IF EXISTS "HOD view department PRs" ON purchase_requisitions;
CREATE POLICY "HOD view department PRs"
ON purchase_requisitions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid()
    AND u.role = 'HOD'
    AND u.department = purchase_requisitions.department
));

DROP POLICY IF EXISTS "Finance view all PRs" ON purchase_requisitions;
CREATE POLICY "Finance view all PRs"
ON purchase_requisitions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid()
    AND u.role = 'Finance'
));

DROP POLICY IF EXISTS "Admins view all PRs" ON purchase_requisitions;
CREATE POLICY "Admins view all PRs"
ON purchase_requisitions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = auth.uid()
    AND u.role IN ('Admin','SuperUser')
));

-- PURCHASE REQUISITION ITEMS
DROP POLICY IF EXISTS "Users view their PR items" ON purchase_requisition_items;
CREATE POLICY "Users view their PR items"
ON purchase_requisition_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM purchase_requisitions pr
  WHERE pr.id = purchase_requisition_items.pr_id
    AND (
      pr.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND (
            (u.role = 'HOD' AND u.department = pr.department)
            OR u.role IN ('Finance','Admin','SuperUser')
          )
      )
    )
));

DROP POLICY IF EXISTS "Users add items to own PRs" ON purchase_requisition_items;
CREATE POLICY "Users add items to own PRs"
ON purchase_requisition_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM purchase_requisitions pr
  WHERE pr.id = purchase_requisition_items.pr_id
    AND pr.requested_by = auth.uid()
));

-- HISTORY ENTRIES
DROP POLICY IF EXISTS "Users view PR history they are allowed to see" ON history_entries;
CREATE POLICY "Users view PR history they are allowed to see"
ON history_entries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM purchase_requisitions pr
  WHERE pr.id = history_entries.pr_id
    AND (
      pr.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND (
            (u.role = 'HOD' AND u.department = pr.department)
            OR u.role IN ('Finance','Admin','SuperUser')
          )
      )
    )
));

-- DOCUMENTS
DROP POLICY IF EXISTS "Users view PR documents they are allowed to see" ON documents;
CREATE POLICY "Users view PR documents they are allowed to see"
ON documents FOR SELECT
USING (EXISTS (
  SELECT 1 FROM purchase_requisitions pr
  WHERE pr.id = documents.pr_id
    AND (
      pr.requested_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
          AND (
            (u.role = 'HOD' AND u.department = pr.department)
            OR u.role IN ('Finance','Admin','SuperUser')
          )
      )
    )
));

DROP POLICY IF EXISTS "Users add documents to own PRs" ON documents;
CREATE POLICY "Users add documents to own PRs"
ON documents FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM purchase_requisitions pr
  WHERE pr.id = documents.pr_id
    AND pr.requested_by = auth.uid()
));










