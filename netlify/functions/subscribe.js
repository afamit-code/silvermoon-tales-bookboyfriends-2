exports.handler = async function(event) {
  console.log('Subscribe function called, method:', event.httpMethod);
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('SUPABASE_URL set:', !!SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY set:', !!SUPABASE_SERVICE_KEY);

  try {
    const body = JSON.parse(event.body);
    const { endpoint, p256dh, auth, user_tier, active_character, patreon_name } = body;
    console.log('Parsed body, endpoint starts with:', endpoint ? endpoint.slice(0,30) : 'MISSING');

    if (!endpoint || !p256dh || !auth) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing subscription data' }) };
    }

    // Check if subscription already exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const existing = await checkRes.json();

    if (existing && existing.length > 0) {
      console.log('Updating existing subscription for endpoint:', endpoint.slice(0,30));
      await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ user_tier, active_character, patreon_name })
        }
      );
    } else {
      console.log('Inserting new subscription, endpoint:', endpoint.slice(0,30));
      const insertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ endpoint, p256dh, auth, user_tier, active_character, patreon_name })
        }
      );
      console.log('Insert response status:', insertRes.status);
      const insertBody = await insertRes.text();
      console.log('Insert response body:', insertBody);
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
