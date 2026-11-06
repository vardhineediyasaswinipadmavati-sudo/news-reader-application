/**
 * NEWSLY - Vercel Serverless Function for The Guardian Content API
 * Proxies requests to https://content.guardianapis.com
 */

export function resolveGuardianApiKey(req) {
  if (req.query && (req.query['api-key'] || req.query.apikey)) {
    return String(req.query['api-key'] || req.query.apikey).trim();
  }
  if (req.headers && req.headers['x-api-key']) {
    return String(req.headers['x-api-key']).trim();
  }
  if (process.env.GUARDIAN_API_KEY && process.env.GUARDIAN_API_KEY.trim()) {
    return process.env.GUARDIAN_API_KEY.trim();
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

  const apiKey = resolveGuardianApiKey(req);
  if (!apiKey) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(401).json({
      code: 'MISSING_KEY',
      message: 'No Guardian API key configured. Please enter your Guardian developer key in Settings.',
    });
  }

  let subPath = 'search';
  if (req.query && req.query.path) {
    subPath = String(req.query.path).replace(/^\/+/, '');
  } else if (req.url) {
    const cleanUrl = req.url.split('?')[0].replace(/^\/api\/guardian\/?/, '');
    if (cleanUrl) subPath = cleanUrl;
  }

  const targetParams = new URLSearchParams();
  targetParams.set('api-key', apiKey);

  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (
        key !== 'path' &&
        key !== 'api-key' &&
        key !== 'apikey' &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        targetParams.set(key, String(value).trim());
      }
    }
  }

  const targetUrl = `https://content.guardianapis.com/${subPath}?${targetParams.toString()}`;

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
        data || { message: `The Guardian API returned status ${upstreamRes.status}` }
      );
    }

    res.setHeader('Cache-Control', 'public, max-age=120, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(data);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(502).json({ message: `Unable to reach The Guardian API: ${err.message}` });
  }
}
