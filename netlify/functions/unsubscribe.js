exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const body = JSON.parse(event.body);
    const { endpoint } = body;

    if (!endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing endpoint' }) };
    }

    await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch(err) {
    console.error('Unsubscribe error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unsubscribe failed' }) };
  }
};
