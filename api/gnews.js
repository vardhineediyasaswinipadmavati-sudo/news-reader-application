/**
 * NEWSLY - Vercel Serverless Function for GNews API v4
 *
 * Handles server-side GNews requests in production on Vercel:
 * - Secures API credentials via process.env.GNEWS_API_KEY (never exposed to client bundle)
 * - Supports user-configured API key override from client (via query param or header)
 * - Validates and routes to GNews v4 endpoints: /top-headlines and /search
 * - Sanitizes query parameters and enforces required search parameters
 * - Forwards upstream status codes and descriptive error messages
 * - Implements edge and browser caching headers (Cache-Control)
 * - Supports CORS preflight (OPTIONS)
 */

export function resolveEndpoint(req) {
  if (req.query && req.query.endpoint) {
    const ep = String(req.query.endpoint).toLowerCase().trim();
    if (ep === 'search') return 'search';
    return 'top-headlines';
  }
  const rawUrl = req.url || '';
  const pathname = rawUrl.split('?')[0];
  if (pathname.includes('/search')) {
    return 'search';
  }
  return 'top-headlines';
}

// Format check for Guardian UUID developer keys (to prevent cross-provider key confusion)
const UUID_KEY_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function resolveClientApiKey(req) {
  let rawKey = '';

  // 1. Client query parameters
  if (req.query && req.query.apikey && String(req.query.apikey).trim()) {
    rawKey = String(req.query.apikey).trim();
  } else if (req.query && req.query.token && String(req.query.token).trim()) {
    rawKey = String(req.query.token).trim();
  } else if (req.headers) {
    // 2. Client headers
    const xApiKey = req.headers['x-api-key'] || req.headers['x-custom-api-key'];
    if (xApiKey && String(xApiKey).trim()) {
      rawKey = String(xApiKey).trim();
    } else {
      const authHeader = req.headers['authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7).trim();
        if (bearerToken) rawKey = bearerToken;
      }
    }
  }

  // Reject placeholder or invalid client keys (such as 'test', empty strings, or junk)
  if (!rawKey) return '';
  const clean = rawKey.trim();
  const lower = clean.toLowerCase();
  if (
    lower === 'test' ||
    lower === 'undefined' ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'default'
  ) {
    return '';
  }

  // Reject foreign Guardian UUID developer keys
  if (UUID_KEY_REGEX.test(clean)) {
    return '';
  }

  return clean;
}

export function resolveServerApiKey() {
  if (process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY.trim()) {
    const key = process.env.GNEWS_API_KEY.trim();
    const clean = key.toLowerCase();
    if (clean !== 'test' && clean !== 'undefined' && clean !== 'null' && clean !== 'none' && !UUID_KEY_REGEX.test(key)) {
      return key;
    }
  }
  if (process.env.VITE_NEWS_API_KEY && process.env.VITE_NEWS_API_KEY.trim()) {
    const key = process.env.VITE_NEWS_API_KEY.trim();
    const clean = key.toLowerCase();
    if (clean !== 'test' && clean !== 'undefined' && clean !== 'null' && clean !== 'none' && !UUID_KEY_REGEX.test(key)) {
      return key;
    }
  }
  return '';
}

export function resolveApiKey(req) {
  return resolveClientApiKey(req) || resolveServerApiKey();
}

/**
 * Safely redact server-side credentials from any error message or body
 */
function sanitizeErrorMessage(msg, serverKey) {
  if (!msg) return msg;
  let text = typeof msg === 'string' ? msg : JSON.stringify(msg);
  if (serverKey && serverKey.length >= 4) {
    text = text.replaceAll(serverKey, '[REDACTED]');
  }
  return text;
}

/**
 * Execute upstream fetch to GNews API v4
 */
async function fetchGNewsUpstream(endpoint, targetParams, apiKey) {
  const query = new URLSearchParams(targetParams);
  query.set('apikey', apiKey);

  const upstreamUrl = `https://gnews.io/api/v4/${endpoint}?${query.toString()}`;

  const upstreamRes = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'NEWSLY-News-Reader/1.0',
    },
  });

  const data = await upstreamRes.json().catch(() => null);

  return {
    status: upstreamRes.status,
    ok: upstreamRes.ok,
    statusText: upstreamRes.statusText,
    data,
  };
}

export default async function handler(req, res) {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    return res.status(204).end();
  }

  // 2. Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({
      errors: ['Method not allowed. NEWSLY API functions only accept GET requests.'],
      message: 'Method not allowed. NEWSLY API functions only accept GET requests.',
      status: 405,
    });
  }

  // 3. Resolve API credentials with server-side priority and fallback
  const clientKey = resolveClientApiKey(req);
  const serverKey = resolveServerApiKey();

  if (!clientKey && !serverKey) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(401).json({
      errors: ['No GNews API key configured. Set GNEWS_API_KEY in your Vercel project environment variables, or enter your API key in Settings.'],
      code: 'MISSING_KEY',
      message: 'No GNews API key configured. Set GNEWS_API_KEY in your Vercel project environment variables, or enter your API key in Settings.',
      status: 401,
    });
  }

  // 4. Resolve endpoint and build query parameters
  const endpoint = resolveEndpoint(req);
  const targetParams = new URLSearchParams();

  // Allowed GNews v4 parameters
  const allowedParams = [
    'category',
    'lang',
    'country',
    'max',
    'page',
    'q',
    'in',
    'sortby',
    'from',
    'to',
    'nullable',
    'expand',
  ];

  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (
        allowedParams.includes(key) &&
        value !== undefined &&
        value !== null &&
        value !== '' &&
        key !== 'endpoint' &&
        key !== 'apikey' &&
        key !== 'token'
      ) {
        targetParams.set(key, String(value).trim());
      }
    }
  }

  // Default language to English if not explicitly set
  if (!targetParams.has('lang')) {
    targetParams.set('lang', 'en');
  }

  // Enforce GNews API v4 free tier plan limit (maximum 10 articles per request)
  let maxArticles = parseInt(targetParams.get('max'), 10);
  if (isNaN(maxArticles) || maxArticles < 1) maxArticles = 10;
  if (maxArticles > 10) maxArticles = 10;
  targetParams.set('max', String(maxArticles));

  // Enforce search query parameter requirement
  if (endpoint === 'search' && (!targetParams.get('q') || !targetParams.get('q').trim())) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({
      errors: ['The "q" query parameter is required for article searches.'],
      message: 'The "q" query parameter is required for article searches.',
      status: 400,
    });
  }

  // 5. Fetch from upstream GNews service with server-key fallback protection
  try {
    // Prefer server-side GNEWS_API_KEY when configured; only use client key if explicitly supplied and non-placeholder
    const initialKey = clientKey || serverKey;
    let attemptResult = await fetchGNewsUpstream(endpoint, targetParams, initialKey);

    // If client-supplied key received an authentication/malformed-key error (401 or 400),
    // and server-side key is available and distinct:
    // Retry ONCE with the server-side key to ensure live news is served seamlessly
    const isAuthOrBadKey =
      !attemptResult.ok &&
      (attemptResult.status === 401 || attemptResult.status === 400) &&
      clientKey &&
      serverKey &&
      clientKey !== serverKey;

    if (isAuthOrBadKey) {
      const fallbackResult = await fetchGNewsUpstream(endpoint, targetParams, serverKey);
      if (fallbackResult.ok || (fallbackResult.status !== 401 && fallbackResult.status !== 400)) {
        attemptResult = fallbackResult;
      } else if (attemptResult.status === 400 && fallbackResult.status === 401) {
        attemptResult = fallbackResult;
      }
    }

    // Always append CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

    // Handle non-OK upstream responses
    if (!attemptResult.ok) {
      const rawErrorMsg =
        (attemptResult.data && Array.isArray(attemptResult.data.errors) && attemptResult.data.errors[0]) ||
        (attemptResult.data && attemptResult.data.message) ||
        `GNews service returned status ${attemptResult.status}: ${attemptResult.statusText || 'Error'}`;

      const sanitizedMsg = sanitizeErrorMessage(rawErrorMsg, serverKey);

      return res.status(attemptResult.status).json({
        errors: [sanitizedMsg],
        message: sanitizedMsg,
        status: attemptResult.status,
      });
    }

    // Set Cache-Control header for CDN & client caching
    res.setHeader(
      'Cache-Control',
      'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
    );
    return res.status(200).json(attemptResult.data);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const sanitizedErrMsg = sanitizeErrorMessage(err.message, serverKey);
    return res.status(502).json({
      errors: [`Unable to reach GNews service: ${sanitizedErrMsg}`],
      message: `Unable to reach GNews service: ${sanitizedErrMsg}`,
      status: 502,
    });
  }
}
