import { supabase } from '../lib/supabaseClient';

export interface PurchaseRequisition {
  id?: string;
  transactionId: string;
  type: string;
  requestDate: string;
  dueDate: string;
  paymentDueDate: string;
  items: any[];
  urgencyLevel: string;
  department: string;
  budgetCode?: string;
  projectCode?: string;
  supplierPreference?: string;
  deliveryLocation?: string;
  specialInstructions?: string;
  documentName?: string;
  documentType?: string;
  documentUrl?: string;
  status: string;
  hodStatus: string;
  financeStatus: string;
  totalAmount: number;
  currency: string;
  requestedBy: string;
  requestedByName?: string;
  requestedByRole?: string;
  requestedByDepartment?: string;
  history: any[];
  createdAt?: string;
  updatedAt?: string;
  sourceDocument?: File | null;
}

/**
 * Transform Supabase snake_case data to camelCase
 */
function transformPRData(data: any): PurchaseRequisition {
  return {
    id: data.id,
    transactionId: data.transaction_id,
    type: data.type,
    requestDate: data.request_date,
    dueDate: data.due_date,
    paymentDueDate: data.payment_due_date,
    items: data.items || [],
    urgencyLevel: data.urgency_level,
    department: data.department,
    budgetCode: data.budget_code,
    projectCode: data.project_code,
    supplierPreference: data.supplier_preference,
    deliveryLocation: data.delivery_location,
    specialInstructions: data.special_instructions,
    documentName: data.document_name,
    documentType: data.document_type,
    documentUrl: data.document_url,
    status: data.status,
    hodStatus: data.hod_status,
    financeStatus: data.finance_status,
    totalAmount: data.total_amount,
    currency: data.currency,
    requestedBy: data.requested_by,
    requestedByName: data.requested_by_name,
    requestedByRole: data.requested_by_role,
    requestedByDepartment: data.requested_by_department,
    history: data.history || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Create a new Purchase Requisition
 */
export async function createPurchaseRequisition(pr: PurchaseRequisition) {
  try {
    console.log('📝 Creating PR in Supabase:', { transactionId: pr.transactionId });

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .insert({
        transaction_id: pr.transactionId,
        type: pr.type,
        request_date: pr.requestDate,
        due_date: pr.dueDate || null,
        payment_due_date: pr.paymentDueDate || null,
        items: pr.items,
        urgency_level: pr.urgencyLevel,
        department: pr.department,
        budget_code: pr.budgetCode || null,
        project_code: pr.projectCode || null,
        supplier_preference: pr.supplierPreference || null,
        delivery_location: pr.deliveryLocation || null,
        special_instructions: pr.specialInstructions || null,
        document_name: pr.documentName || null,
        document_type: pr.documentType || null,
        document_url: pr.documentUrl || null,
        status: pr.status,
        hod_status: pr.hodStatus,
        finance_status: pr.financeStatus,
        total_amount: pr.totalAmount,
        currency: pr.currency,
        requested_by: pr.requestedBy,
        requested_by_name: pr.requestedByName || null,
        requested_by_role: pr.requestedByRole || null,
        requested_by_department: pr.requestedByDepartment || null,
        history: pr.history
      })
      .select();

    if (error) {
      console.error('❌ Error creating PR:', error);
      throw error;
    }

    console.log('✅ PR created successfully:', data?.[0]?.id);
    return data?.[0] ? transformPRData(data[0]) : null;
  } catch (error: any) {
    console.error('❌ Failed to create PR:', error.message);
    // Fall back to localStorage for offline support
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    const allPRs = savedPRs ? JSON.parse(savedPRs) : [];
    allPRs.push(pr);
    localStorage.setItem('purchaseRequisitions', JSON.stringify(allPRs));
    console.warn('⚠️ PR saved to localStorage (offline mode)');
    return pr;
  }
}

/**
 * Get all Purchase Requisitions for the current user
 */
export async function getUserPurchaseRequisitions(userId: string) {
  try {
    console.log('🔍 Fetching PRs for user:', userId);

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('requested_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching PRs:', error);
      throw error;
    }

    console.log('✅ Fetched PRs:', data?.length || 0);
    return (data || []).map(transformPRData);
  } catch (error: any) {
    console.error('❌ Failed to fetch PRs:', error.message);
    // Fall back to localStorage
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    const allPRs = savedPRs ? JSON.parse(savedPRs) : [];
    return allPRs.filter((pr: any) => pr.requestedBy === userId);
  }
}

/**
 * Get all pending PRs for HOD review
 */
export async function getHODPendingPRs(department: string) {
  try {
    console.log('🔍 Fetching pending PRs for HOD department:', department);

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('requested_by_department', department)
      .eq('hod_status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching HOD PRs:', error);
      throw error;
    }

    console.log('✅ Fetched HOD pending PRs:', data?.length || 0);
    return (data || []).map(transformPRData);
  } catch (error: any) {
    console.error('❌ Failed to fetch HOD PRs:', error.message);
    return [];
  }
}

/**
 * Get all Finance pending PRs
 */
export async function getFinancePendingPRs() {
  try {
    console.log('🔍 Fetching pending PRs for Finance');

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('finance_status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching Finance PRs:', error);
      throw error;
    }

    console.log('✅ Fetched Finance pending PRs:', data?.length || 0);
    return (data || []).map(transformPRData);
  } catch (error: any) {
    console.error('❌ Failed to fetch Finance PRs:', error.message);
    return [];
  }
}

/**
 * Update PR status
 */
export async function updatePRStatus(
  prId: string,
  hodStatus?: string,
  financeStatus?: string,
  updatedData?: any
) {
  try {
    console.log('📝 Updating PR status:', { prId, hodStatus, financeStatus });

    const updateObj: any = {};
    if (hodStatus) updateObj.hod_status = hodStatus;
    if (financeStatus) updateObj.finance_status = financeStatus;
    if (updatedData?.history) updateObj.history = updatedData.history;
    if (updatedData?.status) updateObj.status = updatedData.status;
    if (updatedData?.urgencyLevel) updateObj.urgency_level = updatedData.urgencyLevel;
    if (updatedData?.paymentTerms) updateObj.payment_terms = updatedData.paymentTerms;

    updateObj.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update(updateObj)
      .eq('id', prId)
      .select();

    if (error) {
      console.error('❌ Error updating PR:', error);
      throw error;
    }

    console.log('✅ PR updated successfully');
    return data?.[0] ? transformPRData(data[0]) : null;
  } catch (error: any) {
    console.error('❌ Failed to update PR:', error.message);
    // Fall back to localStorage
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    if (savedPRs) {
      const allPRs = JSON.parse(savedPRs);
      const index = allPRs.findIndex((pr: any) => pr.id === prId);
      if (index !== -1) {
        if (hodStatus) allPRs[index].hodStatus = hodStatus;
        if (financeStatus) allPRs[index].financeStatus = financeStatus;
        if (updatedData) {
          Object.assign(allPRs[index], updatedData);
        }
        localStorage.setItem('purchaseRequisitions', JSON.stringify(allPRs));
      }
    }
    return null;
  }
}

/**
 * Get all PRs (admin view)
 */
export async function getAllPurchaseRequisitions() {
  try {
    console.log('🔍 Fetching all PRs');

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching all PRs:', error);
      throw error;
    }

    console.log('✅ Fetched all PRs:', data?.length || 0);
    return (data || []).map(transformPRData);
  } catch (error: any) {
    console.error('❌ Failed to fetch all PRs:', error.message);
    const savedPRs = localStorage.getItem('purchaseRequisitions');
    return savedPRs ? JSON.parse(savedPRs) : [];
  }
}
