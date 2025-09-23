const { supabase, getUserFromAuthHeader, getClientForToken } = require('./_supabase');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { httpMethod, path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];
    const id = pathSegments[pathSegments.length - 2];

    // Verify authentication
    const authResult = await verifyAuth(event);
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify(authResult),
      };
    }

    const client = getClientForToken(authResult.token);

    if (httpMethod === 'GET' && !id) {
      return await handleGetPurchaseRequisitions(event, authResult.user, client);
    } else if (httpMethod === 'GET' && id) {
      return await handleGetPurchaseRequisition(event, id, authResult.user, client);
    } else if (httpMethod === 'POST' && !id) {
      return await handleCreatePurchaseRequisition(event, authResult.user, client);
    } else if (httpMethod === 'PUT' && id) {
      return await handleUpdatePurchaseRequisition(event, id, authResult.user, client);
    } else if (httpMethod === 'POST' && action === 'approve') {
      return await handleApprovePurchaseRequisition(event, id, authResult.user, client);
    } else if (httpMethod === 'POST' && action === 'split') {
      return await handleSplitPurchaseRequisition(event, id, authResult.user, client);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Endpoint not found' }),
      };
    }
  } catch (error) {
    console.error('Purchase requisitions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};

async function verifyAuth(event) {
  const { user, token, error } = await getUserFromAuthHeader(event.headers.authorization);
  if (error) return { success: false, message: error };
  const normalizedUser = {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'Employee',
    name: user.user_metadata?.name || user.email,
    department: user.user_metadata?.department || null,
    permissions: user.user_metadata?.permissions || [],
  };
  return { success: true, user: normalizedUser, token };
}

async function handleGetPurchaseRequisitions(event, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    const filters = {
      status: queryParams.get('status'),
      department: queryParams.get('department'),
      requestedBy: queryParams.get('requestedBy'),
      dateFrom: queryParams.get('dateFrom'),
      dateTo: queryParams.get('dateTo'),
    };

    let query = client
      .from('purchase_requisitions')
      .select(`
        *,
        purchase_requisition_items(*),
        history_entries(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters based on user role
    if (user.role === 'Employee') {
      query = query.eq('requested_by', user.id);
    } else if (user.role === 'HOD') {
      query = query.eq('department', user.department);
    }
    // Finance, Admin, and SuperUser can see all

    // Apply additional filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.requestedBy) {
      query = query.eq('requested_by', filters.requestedBy);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data || [],
      }),
    };
  } catch (error) {
    console.error('Get purchase requisitions error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to fetch purchase requisitions' }),
    };
  }
}

async function handleGetPurchaseRequisition(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { data, error } = await client
      .from('purchase_requisitions')
      .select(`
        *,
        purchase_requisition_items(*),
        history_entries(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Purchase requisition not found' }),
      };
    }

    // Check permissions
    if (user.role === 'Employee' && data.requested_by !== user.id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, message: 'Access denied' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error('Get purchase requisition error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to fetch purchase requisition' }),
    };
  }
}

async function handleCreatePurchaseRequisition(event, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const prData = JSON.parse(event.body);

    // Generate transaction ID
    const transactionId = `PR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const prRecord = {
      transaction_id: transactionId,
      type: 'PURCHASE_REQUISITION',
      request_date: prData.requestDate,
      due_date: prData.dueDate,
      payment_due_date: prData.paymentDueDate,
      urgency_level: prData.urgencyLevel,
      department: prData.department,
      budget_code: prData.budgetCode,
      project_code: prData.projectCode,
      supplier_preference: prData.supplierPreference,
      delivery_location: prData.deliveryLocation,
      special_instructions: prData.specialInstructions,
      requested_by: user.id,
      requested_by_name: user.name,
      requested_by_role: user.role,
      requested_by_department: user.department,
      total_amount: prData.totalAmount,
      currency: prData.currency || 'ZAR',
      status: 'Draft',
    };

    const { data: pr, error: prError } = await client
      .from('purchase_requisitions')
      .insert(prRecord)
      .select()
      .single();

    if (prError) {
      throw prError;
    }

    // Insert items
    if (prData.items && prData.items.length > 0) {
      const items = prData.items.map(item => ({
        pr_id: pr.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        vat_classification: item.vatClassification,
        technical_specs: item.technicalSpecs,
        business_justification: item.businessJustification,
      }));

      const { error: itemsError } = await client
        .from('purchase_requisition_items')
        .insert(items);

      if (itemsError) {
        throw itemsError;
      }
    }

    // Add history entry
    await client
      .from('history_entries')
      .insert({
        pr_id: pr.id,
        transaction_id: transactionId,
        status: 'Created',
        by_user: user.id,
        action: 'Purchase requisition created',
        comments: 'Initial creation',
      });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: pr,
      }),
    };
  } catch (error) {
    console.error('Create purchase requisition error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to create purchase requisition' }),
    };
  }
}

async function handleUpdatePurchaseRequisition(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const updateData = JSON.parse(event.body);

    const { data, error } = await client
      .from('purchase_requisitions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error('Update purchase requisition error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to update purchase requisition' }),
    };
  }
}

async function handleApprovePurchaseRequisition(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { decision, comments, actionRole } = JSON.parse(event.body);

    if (!['HOD', 'Finance'].includes(actionRole)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Invalid action role' }),
      };
    }

    const statusField = actionRole === 'HOD' ? 'hod_status' : 'finance_status';
    const newStatus = decision === 'approve' ? 'Approved' : 'Declined';

    const { data, error } = await client
      .from('purchase_requisitions')
      .update({ [statusField]: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add history entry
    await client
      .from('history_entries')
      .insert({
        pr_id: id,
        transaction_id: data.transaction_id,
        status: `${actionRole} ${newStatus}`,
        by_user: user.id,
        action: `${actionRole} ${decision}`,
        comments,
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error('Approve purchase requisition error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to approve purchase requisition' }),
    };
  }
}

async function handleSplitPurchaseRequisition(event, id, user) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { splitItems, splitReason, originalUpdate } = JSON.parse(event.body);

    // This is a complex operation that would need to be implemented
    // For now, return a placeholder response
    return {
      statusCode: 501,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'Split functionality not yet implemented'
      }),
    };
  } catch (error) {
    console.error('Split purchase requisition error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to split purchase requisition' }),
    };
  }
}

