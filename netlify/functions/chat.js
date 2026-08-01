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
          messages: messages,
          // ── PROMPT CACHING ──────────────────────────────────
          // Automatic caching: Anthropic caches everything up to the
          // last cacheable block (system prompt + conversation so far)
          // and moves the cache breakpoint forward as the chat grows.
          // Cache reads cost 10% of normal input price instead of 100%.
          // Note: Haiku 4.5 needs a 4,096-token minimum prefix before
          // caching activates, so very short/early exchanges in a
          // conversation won't cache yet — but as chat history grows
          // past that point (which happens quickly for repeat daily
          // users), everything before the newest message gets read
          // from cache instead of reprocessed at full price.
          cache_control: { type: 'ephemeral' }
        })
      });

      const anthropicData = await anthropicRes.json();

      // If successful response with content, return it
      if (anthropicRes.status === 200 && anthropicData.content && anthropicData.content[0]) {
        // Log cache performance so you can confirm caching is actually
        // kicking in (check Netlify function logs). If cache_read and
        // cache_creation are both 0 for an established conversation,
        // something upstream changed the prompt prefix (e.g. system
        // prompt text differs between calls) and is breaking the cache.
        if (anthropicData.usage) {
          console.log('Cache stats -> read:', anthropicData.usage.cache_read_input_tokens || 0,
            'created:', anthropicData.usage.cache_creation_input_tokens || 0,
            'uncached input:', anthropicData.usage.input_tokens || 0);
        }

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
    // Note: OpenAI applies prompt caching automatically for prompts
    // over 1024 tokens with no code changes required on our end.
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
