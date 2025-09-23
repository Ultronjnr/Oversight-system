const { getUserFromAuthHeader, getClientForToken } = require('./_supabase');

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

    if (event.httpMethod === 'GET') {
      return await handleGetAnalytics(event, authResult.user, client);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Endpoint not found' }),
      };
    }
  } catch (error) {
    console.error('Analytics error:', error);
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

async function handleGetAnalytics(event, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const queryParams = new URLSearchParams(event.queryStringParameters || {});
    const filters = {
      dateFrom: queryParams.get('dateFrom'),
      dateTo: queryParams.get('dateTo'),
      department: queryParams.get('department'),
    };

    // Build base query
    let query = client.from('purchase_requisitions').select('*');

    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    // Apply role-based filtering
    if (user.role === 'Employee') {
      query = query.eq('requested_by', user.id);
    } else if (user.role === 'HOD') {
      query = query.eq('department', user.department);
    }

    const { data: prs, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate analytics
    const analytics = calculateAnalytics(prs);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: analytics,
      }),
    };
  } catch (error) {
    console.error('Get analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to fetch analytics' }),
    };
  }
}

function calculateAnalytics(prs) {
  const total = prs.length;
  const totalValue = prs.reduce((sum, pr) => sum + (parseFloat(pr.total_amount) || 0), 0);

  // Status breakdown
  const statusBreakdown = prs.reduce((acc, pr) => {
    const status = pr.status || 'Draft';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // HOD Status breakdown
  const hodStatusBreakdown = prs.reduce((acc, pr) => {
    const status = pr.hod_status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Finance Status breakdown
  const financeStatusBreakdown = prs.reduce((acc, pr) => {
    const status = pr.finance_status || 'Pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Department breakdown
  const departmentBreakdown = prs.reduce((acc, pr) => {
    const dept = pr.department || 'Unknown';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  // Urgency breakdown
  const urgencyBreakdown = prs.reduce((acc, pr) => {
    const urgency = pr.urgency_level || 'NORMAL';
    acc[urgency] = (acc[urgency] || 0) + 1;
    return acc;
  }, {});

  // Monthly trends (last 12 months)
  const monthlyTrends = calculateMonthlyTrends(prs);

  // Average processing time
  const avgProcessingTime = calculateAverageProcessingTime(prs);

  return {
    overview: {
      total,
      totalValue,
      averageValue: total > 0 ? totalValue / total : 0,
    },
    statusBreakdown,
    hodStatusBreakdown,
    financeStatusBreakdown,
    departmentBreakdown,
    urgencyBreakdown,
    monthlyTrends,
    avgProcessingTime,
  };
}

function calculateMonthlyTrends(prs) {
  const trends = {};
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
    trends[monthKey] = {
      count: 0,
      value: 0,
    };
  }

  prs.forEach(pr => {
    const prDate = new Date(pr.created_at);
    const monthKey = prDate.toISOString().substring(0, 7);

    if (trends[monthKey]) {
      trends[monthKey].count += 1;
      trends[monthKey].value += parseFloat(pr.total_amount) || 0;
    }
  });

  return Object.entries(trends).map(([month, data]) => ({
    month,
    count: data.count,
    value: data.value,
  }));
}

function calculateAverageProcessingTime(prs) {
  const completedPRs = prs.filter(pr =>
    pr.hod_status === 'Approved' && pr.finance_status === 'Approved'
  );

  if (completedPRs.length === 0) return 0;

  const totalDays = completedPRs.reduce((sum, pr) => {
    const created = new Date(pr.created_at);
    const updated = new Date(pr.updated_at);
    const days = (updated - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / completedPRs.length;
}

