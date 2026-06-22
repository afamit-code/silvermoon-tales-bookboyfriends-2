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

  // Try Google Books first (fast, great covers)
  if (GOOGLE_BOOKS_KEY) {
    try {
      const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
      const keyParam = '&key=' + GOOGLE_BOOKS_KEY;
      const [broadRes, authorRes] = await Promise.all([
        fetch(baseUrl + '?q=' + encodeURIComponent(clean) + '&maxResults=10&langRestrict=en&orderBy=relevance&printType=books' + keyParam),
        fetch(baseUrl + '?q=inauthor:' + encodeURIComponent(clean) + '&maxResults=8&langRestrict=en&orderBy=relevance&printType=books' + keyParam)
      ]);
      const [broadData, authorData] = await Promise.all([broadRes.json(), authorRes.json()]);
      const googleItems = [...(broadData.items||[]), ...(authorData.items||[])];
      if (googleItems.length > 0) {
        console.log('Google Books: found', googleItems.length, 'items');
        const seen = new Set();
        const results = googleItems
          .filter(item => { if (seen.has(item.id)) return false; seen.add(item.id); return item.volumeInfo && item.volumeInfo.title; })
          .map(item => {
            const info = item.volumeInfo || {};
            let cover = (info.imageLinks && (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail)) || '';
            if (cover) cover = cover.replace('http://', 'https://');
            return { title: info.title || 'Unknown Title', author: (info.authors||[])[0]||'', cover, year: (info.publishedDate||'').slice(0,4) };
          }).slice(0, 15);
        return { statusCode: 200, headers, body: JSON.stringify({ items: results }) };
      }
    } catch(e) {
      console.log('Google Books failed, falling back to Open Library:', e.message);
    }
  }

  // Fallback: Open Library (no key needed, always works)
  try {
    console.log('Using Open Library for:', clean);
    const olRes = await fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(clean) + '&limit=15&fields=title,author_name,cover_i,first_publish_year,isbn');
    const olData = await olRes.json();
    const docs = olData.docs || [];
    console.log('Open Library: found', docs.length, 'items');
    const results = docs
      .filter(doc => doc.title)
      .map(doc => {
        const coverId = doc.cover_i;
        const cover = coverId ? 'https://covers.openlibrary.org/b/id/' + coverId + '-M.jpg' : '';
        return {
          title: doc.title || 'Unknown Title',
          author: (doc.author_name && doc.author_name[0]) || '',
          cover: cover,
          year: doc.first_publish_year ? String(doc.first_publish_year) : ''
        };
      }).slice(0, 15);
    return { statusCode: 200, headers, body: JSON.stringify({ items: results }) };
  } catch(e) {
    console.error('Open Library also failed:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Search unavailable', items: [] }) };
  }
};
