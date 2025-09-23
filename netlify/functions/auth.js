const { getUserFromAuthHeader } = require('./_supabase');

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

    if (httpMethod === 'GET' && action === 'me') {
      return await handleGetCurrentUser(event);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Endpoint not found' }),
      };
    }
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Internal server error' }),
    };
  }
};

async function handleGetCurrentUser(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { user, error } = await getUserFromAuthHeader(event.headers.authorization);
    if (error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: error }),
      };
    }
    const userWithoutSensitive = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'Employee',
      name: user.user_metadata?.name || user.email,
      department: user.user_metadata?.department || null,
      permissions: user.user_metadata?.permissions || [],
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: userWithoutSensitive,
      }),
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ success: false, message: 'Invalid token' }),
    };
  }
}

