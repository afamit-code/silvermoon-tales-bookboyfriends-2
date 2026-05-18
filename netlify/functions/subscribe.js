exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  try {
    const body = JSON.parse(event.body);
    const { endpoint, p256dh, auth, user_tier, active_character, patreon_name } = body;

    if (!endpoint || !p256dh || !auth) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing subscription data' }) };
    }

    // Check if subscription already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      // Update existing subscription
      await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_tier, active_character, patreon_name })
        }
      );
    } else {
      // Insert new subscription
      await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ endpoint, p256dh, auth, user_tier, active_character, patreon_name })
        }
      );
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch(err) {
    console.error('Subscribe error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Subscription failed' }) };
  }
};
