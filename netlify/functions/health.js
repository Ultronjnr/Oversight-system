const { getUserFromAuthHeader } = require('./_supabase');

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const result = await getUserFromAuthHeader(event.headers.authorization);
        const isAuthed = !result?.error;
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ok: true,
                env: {
                    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
                    hasAnon: Boolean(process.env.SUPABASE_ANON_KEY),
                    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
                },
                auth: isAuthed ? { userId: result.user.id, email: result.user.email } : null,
                message: isAuthed ? 'Authenticated' : 'Anonymous',
            }),
        };
    } catch (e) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ ok: false, error: 'Health check failed' }),
        };
    }
};








