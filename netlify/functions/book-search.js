exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const q = (event.queryStringParameters && event.queryStringParameters.q) || '';
  if (!q || q.trim().length < 2) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Query too short' }) };
  }

  const GOOGLE_BOOKS_KEY = process.env.GOOGLE_BOOKS_KEY || '';
  const clean = q.trim();

  // Build smart query — try broad first, then with subject hint
  const queries = [
    clean,
    'intitle:' + clean,
    'inauthor:' + clean,
    clean + '+subject:fiction'
  ];

  // Try the broad query first, fall back to title/author specific
  const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
  const keyParam = GOOGLE_BOOKS_KEY ? '&key=' + GOOGLE_BOOKS_KEY : '';

  let allItems = [];

  try {
    // Run broad + author query in parallel for best coverage
    const [broadRes, authorRes] = await Promise.all([
      fetch(baseUrl + '?q=' + encodeURIComponent(clean) + '&maxResults=10&langRestrict=en&orderBy=relevance&printType=books' + keyParam),
      fetch(baseUrl + '?q=inauthor:' + encodeURIComponent(clean) + '&maxResults=8&langRestrict=en&orderBy=relevance&printType=books' + keyParam)
    ]);

    const [broadData, authorData] = await Promise.all([
      broadRes.json(),
      authorRes.json()
    ]);

    const broadItems = (broadData.items || []);
    const authorItems = (authorData.items || []);

    // Merge, deduplicate by id
    const seen = new Set();
    for (const item of [...broadItems, ...authorItems]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        allItems.push(item);
      }
    }
  } catch (err) {
    console.error('Google Books API error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Search failed' }) };
  }

  if (!allItems.length) {
    return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };
  }

  // Shape the response — only what the frontend needs
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

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ items: results })
  };
};
