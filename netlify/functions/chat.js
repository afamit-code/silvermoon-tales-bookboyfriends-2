exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const { system, messages, max_tokens } = JSON.parse(event.body);

    // Set a timeout for the API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 60,
        system: system ? system.substring(0, 1500) : '', // Limit system prompt
        messages: messages
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Chat error:', error.name === 'AbortError' ? 'Timeout' : error);
    return {
      statusCode: 200, // Return 200 so frontend gets the error message
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: [{ type: 'text', text: error.name === 'AbortError' ? 'The connection timed out. Try again.' : 'Something went wrong. Try again.' }]
      })
    };
  }
};
