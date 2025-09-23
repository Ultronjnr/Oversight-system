const bcrypt = require('bcryptjs');
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
    const { httpMethod, path } = event;
    const pathSegments = path.split('/').filter(Boolean);
    const id = pathSegments[pathSegments.length - 1];

    // Verify authentication
    const authResult = await verifyAuth(event);
    if (!authResult.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify(authResult),
      };
    }

    // Check if user has admin permissions
    if (!['Admin', 'SuperUser'].includes(authResult.user.role)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ success: false, message: 'Access denied' }),
      };
    }

    const client = getClientForToken(authResult.token);

    if (httpMethod === 'GET' && !id) {
      return await handleGetUsers(event, authResult.user, client);
    } else if (httpMethod === 'GET' && id) {
      return await handleGetUser(event, id, authResult.user, client);
    } else if (httpMethod === 'POST' && !id) {
      return await handleCreateUser(event, authResult.user, client);
    } else if (httpMethod === 'PUT' && id) {
      return await handleUpdateUser(event, id, authResult.user, client);
    } else if (httpMethod === 'DELETE' && id) {
      return await handleDeleteUser(event, id, authResult.user, client);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'Endpoint not found' }),
      };
    }
  } catch (error) {
    console.error('Users error:', error);
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

async function handleGetUsers(event, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { data, error } = await client
      .from('users')
      .select('id, email, name, role, department, permissions, created_at, updated_at')
      .order('created_at', { ascending: false });

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
    console.error('Get users error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to fetch users' }),
    };
  }
}

async function handleGetUser(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { data, error } = await client
      .from('users')
      .select('id, email, name, role, department, permissions, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, message: 'User not found' }),
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
    console.error('Get user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to fetch user' }),
    };
  }
}

async function handleCreateUser(event, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const { email, password, name, role, department, permissions } = JSON.parse(event.body);

    if (!email || !password || !name || !role) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Missing required fields' }),
      };
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'User with this email already exists' }),
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await client
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        department,
        permissions: permissions || [],
      })
      .select('id, email, name, role, department, permissions, created_at, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to create user' }),
    };
  }
}

async function handleUpdateUser(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    const updateData = JSON.parse(event.body);

    // Don't allow updating password through this endpoint
    delete updateData.password;
    delete updateData.password_hash;

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, department, permissions, created_at, updated_at')
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
    console.error('Update user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to update user' }),
    };
  }
}

async function handleDeleteUser(event, id, user, client) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  try {
    // Don't allow deleting yourself
    if (id === user.id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Cannot delete your own account' }),
      };
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Failed to delete user' }),
    };
  }
}

