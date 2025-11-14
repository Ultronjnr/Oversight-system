-- Oversight Procurement Management System Database Schema
-- This schema will be used to set up the Supabase database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Employee', 'HOD', 'Finance', 'Admin', 'SuperUser')),
  department VARCHAR(255),
  permissions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Requisitions table
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'PURCHASE_REQUISITION',
  request_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  department VARCHAR(255) NOT NULL,
  budget_code VARCHAR(255),
  project_code VARCHAR(255),
  supplier_preference VARCHAR(255),
  delivery_location TEXT,
  special_instructions TEXT,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_by_name VARCHAR(255) NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  requested_by_department VARCHAR(255) NOT NULL,
  hod_status VARCHAR(20) DEFAULT 'Pending' CHECK (hod_status IN ('Pending', 'Approved', 'Declined')),
  finance_status VARCHAR(20) DEFAULT 'Pending' CHECK (finance_status IN ('Pending', 'Approved', 'Declined')),
  status VARCHAR(50) DEFAULT 'Draft',
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  source_document TEXT,
  document_url TEXT,
  document_type VARCHAR(100),
  document_name VARCHAR(255),
  is_split BOOLEAN DEFAULT FALSE,
  original_transaction_id VARCHAR(255),
  split_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Requisition Items table
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  vat_classification VARCHAR(20) NOT NULL CHECK (vat_classification IN ('VAT_APPLICABLE', 'NO_VAT')),
  technical_specs TEXT,
  business_justification TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- History table for tracking changes
CREATE TABLE IF NOT EXISTS history_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id UUID REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  by_user UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  comments TEXT,
  risk_assessment TEXT,
  compliance_notes TEXT,
  alternative_options TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table for file management
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pr_id UUID REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

CREATE INDEX IF NOT EXISTS idx_pr_transaction_id ON purchase_requisitions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pr_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_pr_hod_status ON purchase_requisitions(hod_status);
CREATE INDEX IF NOT EXISTS idx_pr_finance_status ON purchase_requisitions(finance_status);
CREATE INDEX IF NOT EXISTS idx_pr_department ON purchase_requisitions(department);
CREATE INDEX IF NOT EXISTS idx_pr_created_at ON purchase_requisitions(created_at);

CREATE INDEX IF NOT EXISTS idx_pr_items_pr_id ON purchase_requisition_items(pr_id);

CREATE INDEX IF NOT EXISTS idx_history_pr_id ON history_entries(pr_id);
CREATE INDEX IF NOT EXISTS idx_history_by_user ON history_entries(by_user);
CREATE INDEX IF NOT EXISTS idx_history_date ON history_entries(date);

CREATE INDEX IF NOT EXISTS idx_documents_pr_id ON documents(pr_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin and test users (passwords are bcrypt-hashed)
INSERT INTO users (email, password_hash, name, role, department, permissions) VALUES
('admin@company.com',
 '$2b$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
 'System Administrator',
 'Admin',
 'Administration',
 ARRAY['manage_users', 'send_emails', 'view_all_data', 'manage_roles']::text[]),

('superuser@company.com',
 '$2b$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
 'Super Administrator',
 'SuperUser',
 'System',
 ARRAY['all_permissions', 'system_admin', 'manage_users', 'send_emails', 'view_all_data', 'manage_roles', 'manage_system']::text[]),

('employee@company.com',
 '$2b$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
 'John Mokoena',
 'Employee',
 'IT',
 ARRAY[]::text[]),

('hod@company.com',
 '$2b$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
 'Sarah Williams',
 'HOD',
 'IT',
 ARRAY['approve_pr']::text[]),

('finance@company.com',
 '$2b$10$rQZ8K9LmN2pO3qR4sT5uVeWxYzA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q',
 'Michael Chen',
 'Finance',
 'Finance',
 ARRAY['approve_payment']::text[])
ON CONFLICT (email) DO NOTHING;
