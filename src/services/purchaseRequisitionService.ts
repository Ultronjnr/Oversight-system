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
  organizationId?: string;
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
    organizationId: data.organization_id,
    history: data.history || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Create a new Purchase Requisition
 */
export async function createPurchaseRequisition(pr: PurchaseRequisition) {
  const startTime = performance.now();
  try {
    console.log('📝 Creating PR in Supabase:', { transactionId: pr.transactionId, timestamp: new Date().toISOString() });

    const timestamp = new Date().toISOString();
    const initialHistory = [
      {
        action: 'Submitted',
        by: pr.requestedByName || 'Unknown User',
        role: pr.requestedByRole || 'Employee',
        timestamp: timestamp,
        comments: 'Purchase requisition submitted for approval'
      }
    ];

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
        organization_id: pr.organizationId || null,
        history: pr.history && pr.history.length > 0 ? pr.history : initialHistory
      })
      .select();

    if (error) {
      console.error('❌ Error creating PR:', error);
      throw error;
    }

    const duration = performance.now() - startTime;
    console.log('✅ PR created successfully:', data?.[0]?.id, `(took ${duration.toFixed(2)}ms)`);
    return data?.[0] ? transformPRData(data[0]) : null;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    console.error('❌ Failed to create PR:', error.message, `(after ${duration.toFixed(2)}ms)`);
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
export async function getHODPendingPRs(department: string, organizationId?: string) {
  try {
    console.log('🔍 Fetching pending PRs for HOD department:', department, 'organizationId:', organizationId);

    let query = supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('requested_by_department', department)
      .eq('hod_status', 'Pending');

    // Add organization filter if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
 * Get all Finance pending PRs - shows all PRs awaiting Finance review/approval
 * Includes: PRs pending HOD + PRs approved by HOD but pending Finance
 */
export async function getFinancePendingPRs(organizationId?: string) {
  try {
    console.log('🔍 Fetching pending PRs for Finance', 'organizationId:', organizationId);

    // Finance should see all PRs with finance_status = 'Pending'
    // This includes both PRs pending HOD AND PRs approved by HOD but pending Finance
    let query = supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('finance_status', 'Pending')
      .neq('status', 'Rejected');

    // Add organization filter if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query
      .order('hod_status', { ascending: false })
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

/**
 * Approve a PR (by HOD or Finance)
 */
export async function approveRequisition(
  prId: string,
  approverRole: 'HOD' | 'Finance',
  approverName: string,
  comments?: string
) {
  try {
    console.log('✅ Approving PR:', { prId, approverRole, approverName });

    const updateData: any = {};
    const timestamp = new Date().toISOString();

    if (approverRole === 'HOD') {
      updateData.hod_status = 'Approved';
      updateData.hod_approved_at = timestamp;
      updateData.hod_approved_by = approverName;
    } else if (approverRole === 'Finance') {
      updateData.finance_status = 'Approved';
      updateData.finance_approved_at = timestamp;
      updateData.finance_approved_by = approverName;
    }

    // Add to history
    const { data: prData, error: fetchError } = await supabase
      .from('purchase_requisitions')
      .select('history')
      .eq('id', prId)
      .maybeSingle();

    if (!fetchError && prData) {
      const history = prData.history || [];
      history.push({
        action: 'Approved',
        by: approverName,
        role: approverRole,
        timestamp,
        comments
      });
      updateData.history = history;
    }

    // Update status to fully approved if both HOD and Finance approved
    if (approverRole === 'HOD') {
      const { data: checkData } = await supabase
        .from('purchase_requisitions')
        .select('finance_status')
        .eq('id', prId)
        .maybeSingle();

      if (checkData?.finance_status === 'Approved') {
        updateData.status = 'Approved';
      }
    } else if (approverRole === 'Finance') {
      const { data: checkData } = await supabase
        .from('purchase_requisitions')
        .select('hod_status')
        .eq('id', prId)
        .maybeSingle();

      if (checkData?.hod_status === 'Approved') {
        updateData.status = 'Approved';
      }
    }

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update(updateData)
      .eq('id', prId)
      .select();

    if (error) {
      console.error('❌ Error approving PR:', error);
      throw error;
    }

    console.log('✅ PR approved successfully');
    return data?.[0] ? transformPRData(data[0]) : null;
  } catch (error: any) {
    console.error('❌ Failed to approve PR:', error.message);
    throw error;
  }
}

/**
 * Reject a PR (by HOD or Finance)
 */
export async function rejectRequisition(
  prId: string,
  rejectorRole: 'HOD' | 'Finance',
  rejectorName: string,
  reason: string
) {
  try {
    console.log('❌ Rejecting PR:', { prId, rejectorRole, rejectorName });

    const updateData: any = {};
    const timestamp = new Date().toISOString();

    if (rejectorRole === 'HOD') {
      updateData.hod_status = 'Rejected';
      updateData.hod_rejected_at = timestamp;
      updateData.hod_rejected_by = rejectorName;
    } else if (rejectorRole === 'Finance') {
      updateData.finance_status = 'Rejected';
      updateData.finance_rejected_at = timestamp;
      updateData.finance_rejected_by = rejectorName;
    }

    updateData.status = 'Rejected';

    // Add to history
    const { data: prData, error: fetchError } = await supabase
      .from('purchase_requisitions')
      .select('history')
      .eq('id', prId)
      .maybeSingle();

    if (!fetchError && prData) {
      const history = prData.history || [];
      history.push({
        action: 'Rejected',
        by: rejectorName,
        role: rejectorRole,
        timestamp,
        reason
      });
      updateData.history = history;
    }

    const { data, error } = await supabase
      .from('purchase_requisitions')
      .update(updateData)
      .eq('id', prId)
      .select();

    if (error) {
      console.error('❌ Error rejecting PR:', error);
      throw error;
    }

    console.log('✅ PR rejected successfully');
    return data?.[0] ? transformPRData(data[0]) : null;
  } catch (error: any) {
    console.error('❌ Failed to reject PR:', error.message);
    throw error;
  }
}

/**
 * Split a PR into multiple requisitions
 */
export async function splitRequisition(
  prId: string,
  splits: Array<{
    items: any[];
    totalAmount: number;
    notes?: string;
  }>,
  splitterName: string,
  splitterRole: 'HOD' | 'Finance' = 'Finance'
) {
  try {
    console.log('📊 Splitting PR:', { prId, numberOfSplits: splits.length, splitterRole });

    // Get original PR
    const { data: originalPR, error: fetchError } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .eq('id', prId)
      .maybeSingle();

    if (fetchError || !originalPR) {
      throw new Error('Could not fetch original PR');
    }

    // Create new PRs for each split
    const splitIds: string[] = [];
    const timestamp = new Date().toISOString();

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const newTransactionId = `${originalPR.transaction_id}-SPLIT-${i + 1}`;

      const { data: newPR, error: insertError } = await supabase
        .from('purchase_requisitions')
        .insert({
          transaction_id: newTransactionId,
          type: originalPR.type,
          request_date: originalPR.request_date,
          due_date: originalPR.due_date,
          payment_due_date: originalPR.payment_due_date,
          items: split.items,
          urgency_level: originalPR.urgency_level,
          department: originalPR.department,
          budget_code: originalPR.budget_code,
          project_code: originalPR.project_code,
          supplier_preference: originalPR.supplier_preference,
          delivery_location: originalPR.delivery_location,
          special_instructions: originalPR.special_instructions,
          document_name: originalPR.document_name,
          document_type: originalPR.document_type,
          document_url: originalPR.document_url,
          status: 'Draft',
          hod_status: 'Pending',
          finance_status: 'Pending',
          total_amount: split.totalAmount,
          currency: originalPR.currency,
          requested_by: originalPR.requested_by,
          requested_by_name: originalPR.requested_by_name,
          requested_by_role: originalPR.requested_by_role,
          requested_by_department: originalPR.requested_by_department,
          organization_id: originalPR.organization_id,
          history: [
            ...originalPR.history,
            {
              action: 'Split Processed',
              by: splitterName,
              role: splitterRole,
              timestamp,
              parentId: prId,
              notes: split.notes
            }
          ]
        })
        .select();

      if (insertError) {
        console.error('❌ Error creating split PR:', insertError);
        throw insertError;
      }

      if (newPR?.[0]?.id) {
        splitIds.push(newPR[0].id);
      }
    }

    // Update original PR to mark as split
    const { error: updateError } = await supabase
      .from('purchase_requisitions')
      .update({
        status: 'Split',
        history: [
          ...originalPR.history,
          {
            action: 'Split Processed',
            by: splitterName,
            role: splitterRole,
            timestamp,
            splitInto: splitIds
          }
        ]
      })
      .eq('id', prId);

    if (updateError) {
      console.error('❌ Error updating original PR:', updateError);
      throw updateError;
    }

    console.log('✅ PR split successfully into', splitIds.length, 'new PRs');
    return splitIds;
  } catch (error: any) {
    console.error('❌ Failed to split PR:', error.message);
    throw error;
  }
}
