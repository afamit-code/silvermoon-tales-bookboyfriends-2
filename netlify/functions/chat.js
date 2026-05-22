exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { system, messages, max_tokens } = JSON.parse(event.body);

    // ── PRIMARY: Anthropic Claude Haiku ──────────────────────
    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: max_tokens || 60,
          system: system || '',
          messages: messages
        })
      });

      const anthropicData = await anthropicRes.json();

      // If successful response with content, return it
      if (anthropicRes.status === 200 && anthropicData.content && anthropicData.content[0]) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(anthropicData)
        };
      }

      // Log the issue and fall through to OpenAI
      console.log('Anthropic fallback triggered - status:', anthropicRes.status, 'error:', anthropicData?.error?.type);

    } catch (anthropicErr) {
      console.log('Anthropic request failed:', anthropicErr.message);
    }

    // ── FALLBACK: OpenAI GPT-4o-mini ─────────────────────────
    console.log('Using OpenAI fallback...');

    const openaiMessages = [
      { role: 'system', content: system || '' },
      ...messages
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: max_tokens || 60,
        messages: openaiMessages
      })
    });

    const openaiData = await openaiRes.json();
    const openaiText = openaiData?.choices?.[0]?.message?.content || '';

    if (!openaiText) {
      console.error('OpenAI also failed:', JSON.stringify(openaiData));
      // Return a valid Anthropic-shaped response so frontend works
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          content: [{ type: 'text', text: 'The magic is stirring... try again in a moment.' }]
        })
      };
    }

    // Return OpenAI response in Anthropic format so frontend needs no changes
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: openaiText }]
      })
    };

  } catch (error) {
    console.error('Chat function error:', error);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: 'The magic is stirring... try again in a moment.' }]
      })
    };
  }
};
