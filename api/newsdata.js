/**
 * NEWSLY - Vercel Serverless Function for NewsData.io API
 * Proxies requests to https://newsdata.io/api/1
 */

export function resolveNewsDataApiKey(req) {
  if (req.query && req.query.apikey) {
    return String(req.query.apikey).trim();
  }
  if (req.headers && req.headers['x-api-key']) {
    return String(req.headers['x-api-key']).trim();
  }
  if (process.env.NEWSDATA_API_KEY && process.env.NEWSDATA_API_KEY.trim()) {
    return process.env.NEWSDATA_API_KEY.trim();
  }
  return '';
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const apiKey = resolveNewsDataApiKey(req);
  if (!apiKey) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(401).json({
      code: 'MISSING_KEY',
      message: 'No NewsData.io API key configured. Please enter your API key in Settings.',
    });
  }

  let subPath = 'news';
  if (req.query && req.query.path) {
    subPath = String(req.query.path).replace(/^\/+/, '');
  } else if (req.url) {
    const cleanUrl = req.url.split('?')[0].replace(/^\/api\/newsdata\/?/, '');
    if (cleanUrl) subPath = cleanUrl;
  }

  const targetParams = new URLSearchParams();
  targetParams.set('apikey', apiKey);

  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (
        key !== 'path' &&
        key !== 'apikey' &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        targetParams.set(key, String(value).trim());
      }
    }
  }

  const targetUrl = `https://newsdata.io/api/1/${subPath}?${targetParams.toString()}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NEWSLY-News-Reader/1.0',
      },
    });

    const data = await upstreamRes.json().catch(() => null);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json(
        data || { message: `NewsData.io API returned status ${upstreamRes.status}` }
      );
    }

    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(502).json({ message: `Unable to reach NewsData.io: ${err.message}` });
  }
}
