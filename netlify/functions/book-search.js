exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  console.log('Book search query:', q);

  if (!q || q.trim().length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Query too short' }) };
  }

  const GOOGLE_BOOKS_KEY = process.env.GOOGLE_BOOKS_KEY || '';
  const clean = q.trim();
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  const keyParam = GOOGLE_BOOKS_KEY ? '&key=' + GOOGLE_BOOKS_KEY : '';

  console.log('Has API key:', !!GOOGLE_BOOKS_KEY);

  let allItems = [];

  try {
    const broadUrl = baseUrl + '?q=' + encodeURIComponent(clean) + '&maxResults=10&langRestrict=en&orderBy=relevance&printType=books' + keyParam;
    const authorUrl = baseUrl + '?q=inauthor:' + encodeURIComponent(clean) + '&maxResults=8&langRestrict=en&orderBy=relevance&printType=books' + keyParam;

    console.log('Fetching broad:', broadUrl);

    const [broadRes, authorRes] = await Promise.all([
      fetch(broadUrl),
      fetch(authorUrl)
    ]);

    console.log('Broad status:', broadRes.status, '| Author status:', authorRes.status);

    const [broadData, authorData] = await Promise.all([
      broadRes.json(),
      authorRes.json()
    ]);

    console.log('Broad items:', (broadData.items||[]).length, '| Author items:', (authorData.items||[]).length);
    if (broadData.error) console.log('Broad API error:', JSON.stringify(broadData.error));
    if (authorData.error) console.log('Author API error:', JSON.stringify(authorData.error));

    const seen = new Set();
    for (const item of [...(broadData.items||[]), ...(authorData.items||[])]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        allItems.push(item);
      }
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Search failed', detail: err.message }) };
  }

  console.log('Total merged items:', allItems.length);

  if (!allItems.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };
  }

  const results = allItems
    .filter(function(item) { return item.volumeInfo && item.volumeInfo.title; })
    .map(function(item) {
      const info = item.volumeInfo || {};
      const imageLinks = info.imageLinks || {};
      let cover = imageLinks.thumbnail || imageLinks.smallThumbnail || '';
      if (cover) cover = cover.replace('http://', 'https://');
      return {
        title: info.title || 'Unknown Title',
        author: (info.authors || [])[0] || '',
        cover: cover,
        year: info.publishedDate ? info.publishedDate.slice(0, 4) : '',
        description: info.description ? info.description.slice(0, 200) : ''
      };
    })
    .slice(0, 15);

  console.log('Returning', results.length, 'results');

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ items: results })
  };
};
