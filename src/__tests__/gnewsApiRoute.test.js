import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import handler, { resolveEndpoint, resolveApiKey } from '../../api/gnews';

function createMockReqRes({
  method = 'GET',
  query = {},
  headers = {},
  url = '/api/gnews',
} = {}) {
  const req = {
    method,
    query,
    headers,
    url,
  };

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    end() {
      return this;
    },
  };

  return { req, res };
}

describe('Vercel Serverless Function: /api/gnews', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GNEWS_API_KEY;
    delete process.env.VITE_NEWS_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('handles OPTIONS preflight with 204 and CORS headers', async () => {
    const { req, res } = createMockReqRes({ method: 'OPTIONS' });
    await handler(req, res);

    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('GET');
  });

  it('rejects unsupported HTTP methods with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes({ method: 'POST' });
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body.message).toMatch(/only accept GET/i);
  });

  it('returns 401 MISSING_KEY when neither client key nor server environment key is configured', async () => {
    const { req, res } = createMockReqRes({ method: 'GET', query: { category: 'general' } });
    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('MISSING_KEY');
    expect(res.body.message).toMatch(/Set GNEWS_API_KEY in your Vercel project environment variables/i);
  });

  it('uses server-side process.env.GNEWS_API_KEY when client key is not provided', async () => {
    process.env.GNEWS_API_KEY = 'server-secret-key-12345';

    let requestedUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 1, articles: [{ title: 'Headline' }] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', category: 'technology' },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(requestedUrl).toContain('https://gnews.io/api/v4/top-headlines');
    expect(requestedUrl).toContain('apikey=server-secret-key-12345');
    expect(requestedUrl).toContain('category=technology');
    expect(res.body.totalArticles).toBe(1);
    expect(res.headers['cache-control']).toBeDefined();
  });

  it('uses client-provided apikey when user supplies custom key', async () => {
    process.env.GNEWS_API_KEY = 'server-default-key';

    let requestedUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 1, articles: [] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'user-custom-key-999' },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(requestedUrl).toContain('apikey=user-custom-key-999');
  });

  it('correctly resolves search endpoint and validates required "q" query parameter', async () => {
    process.env.GNEWS_API_KEY = 'valid-key';

    // 1. Missing "q"
    const { req: reqNoQ, res: resNoQ } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'search' },
    });
    await handler(reqNoQ, resNoQ);
    expect(resNoQ.statusCode).toBe(400);
    expect(resNoQ.body.message).toMatch(/"q" query parameter is required/i);

    // 2. Valid "q"
    let requestedUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 10, articles: [] }),
      };
    });

    const { req: reqWithQ, res: resWithQ } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'search', q: 'Artificial Intelligence' },
    });
    await handler(reqWithQ, resWithQ);
    expect(resWithQ.statusCode).toBe(200);
    expect(requestedUrl).toContain('https://gnews.io/api/v4/search');
    expect(requestedUrl).toContain('q=Artificial+Intelligence');
  });

  it('forwards upstream HTTP error status (such as 429 rate limit or 401 invalid key)', async () => {
    process.env.GNEWS_API_KEY = 'exhausted-key';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ errors: ['Daily quota reached'] }),
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines' },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toBe('Daily quota reached');
  });

  it('returns 502 Bad Gateway when upstream fetch fails due to network disconnection', async () => {
    process.env.GNEWS_API_KEY = 'valid-key';

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection reset'));

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines' },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(502);
    expect(res.body.message).toMatch(/Unable to reach GNews service/i);
  });

  it('resolveEndpoint helper detects endpoints from query or url pathname', () => {
    expect(resolveEndpoint({ query: { endpoint: 'search' } })).toBe('search');
    expect(resolveEndpoint({ query: { endpoint: 'top-headlines' } })).toBe('top-headlines');
    expect(resolveEndpoint({ query: {}, url: '/api/gnews/search?q=test' })).toBe('search');
    expect(resolveEndpoint({ query: {}, url: '/api/gnews/top-headlines?category=world' })).toBe('top-headlines');
    expect(resolveEndpoint({ query: {}, url: '/api/gnews' })).toBe('top-headlines');
  });

  it('resolveApiKey helper prioritizes client keys over server environment variables', () => {
    process.env.GNEWS_API_KEY = 'server-key';

    expect(resolveApiKey({ query: { apikey: 'client-key' } })).toBe('client-key');
    expect(resolveApiKey({ headers: { 'x-api-key': 'header-key' } })).toBe('header-key');
    expect(resolveApiKey({ headers: { authorization: 'Bearer token-123' } })).toBe('token-123');
    expect(resolveApiKey({ query: {}, headers: {} })).toBe('server-key');
  });

  it('retries with server-side GNEWS_API_KEY when client key receives 401 Unauthorized', async () => {
    process.env.GNEWS_API_KEY = 'valid-server-key';

    const fetchCalls = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      fetchCalls.push(url);
      if (url.includes('apikey=unrelated-client-key')) {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ errors: ['Your API key is invalid'] }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 5, articles: [{ title: 'Recovered Story' }] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'unrelated-client-key' },
    });
    await handler(req, res);

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]).toContain('apikey=unrelated-client-key');
    expect(fetchCalls[1]).toContain('apikey=valid-server-key');
    expect(res.statusCode).toBe(200);
    expect(res.body.totalArticles).toBe(5);
  });

  it('prevents infinite retry loops and does not retry if server key is identical to failing client key', async () => {
    process.env.GNEWS_API_KEY = 'same-bad-key';

    const fetchCalls = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      fetchCalls.push(url);
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ errors: ['Invalid key'] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'same-bad-key' },
    });
    await handler(req, res);

    // Strictly 1 attempt, no redundant retry
    expect(fetchCalls).toHaveLength(1);
    expect(res.statusCode).toBe(401);
  });

  it('never exposes server-side GNEWS_API_KEY in error responses or headers', async () => {
    process.env.GNEWS_API_KEY = 'super-secret-production-token-999';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Error',
        json: async () => ({
          errors: ['Failed upstream call for super-secret-production-token-999'],
        }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines' },
    });
    await handler(req, res);

    const stringified = JSON.stringify(res.body);
    expect(stringified).not.toContain('super-secret-production-token-999');
    expect(stringified).toContain('[REDACTED]');
  });

  it('ignores placeholder client key "test" and uses server-side GNEWS_API_KEY directly', async () => {
    process.env.GNEWS_API_KEY = 'server-prod-key-123';

    let requestedUrl = '';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 1, articles: [{ title: 'Direct Key Success' }] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'test' },
    });
    await handler(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(requestedUrl).toContain('apikey=server-prod-key-123');
    expect(requestedUrl).not.toContain('apikey=test');
    expect(res.statusCode).toBe(200);
  });

  it('clamps requested max article count to at most 10 articles (GNews free tier limit)', async () => {
    process.env.GNEWS_API_KEY = 'valid-key';

    let requestedUrl = '';
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 0, articles: [] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', max: '25' },
    });
    await handler(req, res);

    expect(requestedUrl).toContain('max=10');
    expect(requestedUrl).not.toContain('max=25');
    expect(res.statusCode).toBe(200);
  });

  it('retries with server-side GNEWS_API_KEY when client key receives 400 Bad Request from upstream', async () => {
    process.env.GNEWS_API_KEY = 'fallback-server-key';

    const fetchCalls = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      fetchCalls.push(url);
      if (url.includes('apikey=malformed-client-key')) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ errors: ['Invalid API key format'] }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 2, articles: [{ title: 'Recovered via 400 Fallback' }] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'malformed-client-key' },
    });
    await handler(req, res);

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]).toContain('apikey=malformed-client-key');
    expect(fetchCalls[1]).toContain('apikey=fallback-server-key');
    expect(res.statusCode).toBe(200);
    expect(res.body.totalArticles).toBe(2);
  });

  it('rejects foreign hyphenated keys (such as Guardian developer UUIDs) and uses server key directly', async () => {
    process.env.GNEWS_API_KEY = 'configured-server-key';

    let requestedUrl = '';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ totalArticles: 1, articles: [] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: '0fbd0f14-fc45-429e-846e-602791ee0bd9' },
    });
    await handler(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(requestedUrl).toContain('apikey=configured-server-key');
    expect(requestedUrl).not.toContain('0fbd0f14');
    expect(res.statusCode).toBe(200);
  });

  it('reports server-side 401 when client key receives 400 and server fallback receives 401', async () => {
    process.env.GNEWS_API_KEY = 'invalid-server-key';

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (url.includes('apikey=client-malformed')) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({ errors: ['The API key is malformed'] }),
        };
      }
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ errors: ["The API key doesn't match any account"] }),
      };
    });

    const { req, res } = createMockReqRes({
      method: 'GET',
      query: { endpoint: 'top-headlines', apikey: 'client-malformed' },
    });
    await handler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/doesn't match any account/i);
  });
});
