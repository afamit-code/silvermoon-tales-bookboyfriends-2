exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { system, messages, max_tokens } = JSON.parse(event.body);

    // ── PRIMARY: OpenAI GPT-4o-mini ──────────────────────────
    // ~6-7x cheaper per token than Claude Haiku, and OpenAI applies
    // prompt caching automatically (no code needed) once a prompt
    // passes 1,024 tokens - a much lower bar than Haiku's 4,096,
    // so it activates on more of your traffic, more of the time.
    // Trade-off: generally less nuanced/voice-consistent creative
    // writing than Claude. Test this against your current output
    // before deciding which model stays primary long-term.
    try {
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

      if (openaiRes.status === 200 && openaiText) {
        if (openaiData.usage) {
          console.log('OpenAI cache stats -> cached:', openaiData.usage.prompt_tokens_details?.cached_tokens || 0,
            'total prompt:', openaiData.usage.prompt_tokens || 0);
        }
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            content: [{ type: 'text', text: openaiText }]
          })
        };
      }

      console.log('OpenAI fallback triggered - status:', openaiRes.status, 'error:', openaiData?.error?.type);

    } catch (openaiErr) {
      console.log('OpenAI request failed:', openaiErr.message);
    }

    // ── FALLBACK: Anthropic Claude Haiku ─────────────────────
    console.log('Using Anthropic fallback...');

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
        messages: messages,
        cache_control: { type: 'ephemeral' }
      })
    });

    const anthropicData = await anthropicRes.json();

    if (anthropicRes.status === 200 && anthropicData.content && anthropicData.content[0]) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(anthropicData)
      };
    }

    console.error('Both providers failed:', JSON.stringify(anthropicData));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        content: [{ type: 'text', text: 'The magic is stirring... try again in a moment.' }]
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
