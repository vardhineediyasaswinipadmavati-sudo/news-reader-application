import { getStoredApiKey, getStoredProvider, CATEGORIES } from './apiConfig';
import { generateArticleId } from '../utils/textHelpers';
import {
  processSearchQuery,
  filterAndRankSearchResults,
  deduplicateArticles,
  diversifyPublishers,
  isArticleRelevantToCategory,
} from '../utils/searchRelevance';

// In-memory request cache to avoid duplicate API calls
const requestCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class ApiError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Get the appropriate base URL for a provider.
 * Uses Vite development/preview proxy routes (/api/...) in the browser to prevent CORS issues,
 * and falls back to full external endpoints in SSR/test environments.
 */
function getProviderBaseUrl(provider) {
  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST);
  const isBrowser =
    !isTest &&
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin &&
    window.location.protocol.startsWith('http') &&
    !window.location.origin.includes('localhost:0');

  if (isBrowser) {
    if (provider === 'guardian') return '/api/guardian';
    if (provider === 'gnews') return '/api/gnews';
    if (provider === 'newsdata') return '/api/newsdata';
  }

  if (provider === 'guardian') return 'https://content.guardianapis.com';
  if (provider === 'gnews') return 'https://gnews.io/api/v4';
  if (provider === 'newsdata') return 'https://newsdata.io/api/1';
  return '';
}

/**
 * Format and normalize articles from GNews API
 */
function normalizeGNewsArticle(raw, fallbackCategory = 'General') {
  if (!raw) return null;
  const id = generateArticleId(raw);
  return {
    id,
    title: raw.title ? raw.title.replace(/\s+-\s+[^-]+$/, '').trim() : 'Untitled Story',
    description: raw.description || '',
    content: raw.content || '',
    url: raw.url || '#',
    imageUrl: raw.image || null,
    publishedAt: raw.publishedAt || new Date().toISOString(),
    source: {
      name: (raw.source && raw.source.name) ? raw.source.name : 'News Source',
      url: (raw.source && raw.source.url) ? raw.source.url : raw.url || '#',
    },
    author: null,
    category: fallbackCategory,
  };
}

/**
 * Format and normalize articles from The Guardian API
 */
function normalizeGuardianArticle(raw, fallbackCategory = 'General') {
  if (!raw) return null;
  const fields = raw.fields || {};
  const id = generateArticleId({ url: raw.webUrl, title: raw.webTitle });
  return {
    id,
    title: raw.webTitle || 'Untitled Story',
    description: fields.trailText ? fields.trailText.replace(/<[^>]*>?/gm, '').trim() : '',
    content: fields.bodyText ? fields.bodyText.replace(/<[^>]*>?/gm, '').trim() : '',
    url: raw.webUrl || '#',
    imageUrl: fields.thumbnail || null,
    publishedAt: raw.webPublicationDate || new Date().toISOString(),
    source: {
      name: fields.publication || 'The Guardian',
      url: 'https://www.theguardian.com',
    },
    author: fields.byline || null,
    category: raw.sectionName || fallbackCategory,
  };
}

/**
 * Format and normalize articles from NewsData.io
 */
function normalizeNewsDataArticle(raw, fallbackCategory = 'General') {
  if (!raw) return null;
  const id = generateArticleId({ url: raw.link, title: raw.title });
  return {
    id,
    title: raw.title || 'Untitled Story',
    description: raw.description ? raw.description.replace(/<[^>]*>?/gm, '').trim() : '',
    content: raw.content ? raw.content.replace(/<[^>]*>?/gm, '').trim() : '',
    url: raw.link || '#',
    imageUrl: raw.image_url || null,
    publishedAt: raw.pubDate || new Date().toISOString(),
    source: {
      name: raw.source_id ? raw.source_id.toUpperCase() : 'News Source',
      url: raw.link || '#',
    },
    author: Array.isArray(raw.creator) ? raw.creator.join(', ') : raw.creator || null,
    category: fallbackCategory,
  };
}

/**
 * Sort articles by publishedAt descending (newest first)
 */
export function sortByDateDescending(articles) {
  return [...articles].sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}

/**
 * Execute cached fetch with retry and accurate error differentiation
 */
async function fetchWithRetry(url, provider, apiKey, options = {}, retries = 1) {
  const cacheKey = url;
  const cached = requestCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle 401 / 403 Unauthorized errors specifically
      if (response.status === 401 || response.status === 403) {
        let msg = `API authentication failed (${response.status} Unauthorized). Please check your API key.`;
        let code = 'INVALID_KEY';
        try {
          const errData = await response.json();
          if (errData) {
            if (errData.code === 'MISSING_KEY') {
              code = 'MISSING_KEY';
            }
            if (errData.message) {
              msg = errData.message;
            } else if (Array.isArray(errData.errors) && errData.errors[0]) {
              msg = errData.errors[0];
            }
          }
        } catch {
          // ignore json parse error
        }

        if (provider === 'guardian') {
          msg = `The Guardian Content API rejected this key (401 Unauthorized). Please register your free developer key at open-platform.theguardian.com/access/`;
        }

        throw new ApiError(
          msg,
          code,
          { status: response.status }
        );
      }

      // Handle 429 Rate limit errors specifically
      if (response.status === 429) {
        throw new ApiError(
          `API rate limit reached for ${provider.toUpperCase()}. Please wait a moment or update your plan/key.`,
          'RATE_LIMITED',
          { status: 429 }
        );
      }

      if (!response.ok) {
        let msg = `News service returned status ${response.status}: ${response.statusText}`;
        let details = { status: response.status };
        try {
          const errData = await response.json();
          if (errData) {
            if (errData.message) {
              msg = errData.message;
            } else if (Array.isArray(errData.errors) && errData.errors[0]) {
              msg = errData.errors[0];
            }
            details = { ...details, ...errData };
          }
        } catch {
          const errorBody = await response.text().catch(() => '');
          details.body = errorBody;
        }

        throw new ApiError(msg, 'HTTP_ERROR', details);
      }

      const data = await response.json();
      requestCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      lastError = err;
      if (
        err instanceof ApiError &&
        (err.code === 'INVALID_KEY' || err.code === 'RATE_LIMITED' || err.details?.status === 400)
      ) {
        throw err;
      }
      // Differentiate browser CORS or network drop from general error
      if (err.name === 'TypeError' && /failed to fetch|networkerror/i.test(err.message)) {
        throw new ApiError(
          `Unable to reach ${provider.toUpperCase()} news service. This is commonly caused by an unauthorized key blocked by browser CORS, or a network disconnection.`,
          'NETWORK_ERROR',
          { original: err.message }
        );
      }
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, 600 * (attempt + 1)));
      }
    }
  }

  throw lastError || new ApiError('Failed to fetch from news API', 'NETWORK_ERROR');
}

/**
 * Helper to check whether a custom key is legitimate and should be sent over wire
 */
function isValidCustomApiKey(key, provider = 'gnews') {
  if (!key || typeof key !== 'string') return false;
  const clean = key.trim().toLowerCase();
  if (clean === '' || clean === 'test' || clean === 'undefined' || clean === 'null' || clean === 'none' || clean === 'default') {
    return false;
  }
  // GNews API v4 keys do not use UUID format (rejecting Guardian UUIDs)
  if (provider === 'gnews' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key.trim())) {
    return false;
  }
  return true;
}

/**
 * Fetch top headlines for home or category with pagination, deduplication, and diversity
 */
export async function getTopHeadlines({ category = 'general', page = 1, pageSize = 10 } = {}) {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST);
  if (!apiKey && (isTest || provider !== 'gnews')) {
    throw new ApiError(
      'No API key configured. Please configure an API key to view live news.',
      'MISSING_KEY'
    );
  }

  // Find category config
  const catConfig = CATEGORIES.find((c) => c.id === category.toLowerCase());
  const categoryLabel = catConfig ? catConfig.label : (category === 'general' ? 'Top Stories' : category);

  const baseUrl = getProviderBaseUrl(provider);
  let url;
  let normalizer;

  const effectiveLimit = provider === 'gnews' ? Math.min(pageSize, 10) : pageSize;

  if (provider === 'guardian') {
    const section = catConfig && catConfig.guardianSection ? catConfig.guardianSection : '';
    const qParam = catConfig && catConfig.query ? `&q=${encodeURIComponent(catConfig.query)}` : '';
    const sectionParam = section ? `&section=${encodeURIComponent(section)}` : '';
    url = `${baseUrl}/search?order-by=newest&page=${page}&page-size=${pageSize}${sectionParam}${qParam}&show-fields=thumbnail,trailText,byline,bodyText,publication&api-key=${encodeURIComponent(apiKey)}`;
    normalizer = (item) => normalizeGuardianArticle(item, categoryLabel);
  } else if (provider === 'newsdata') {
    const pageParam = page > 1 ? `&page=${page}` : '';
    if (category.toLowerCase() === 'india') {
      url = `${baseUrl}/news?apikey=${encodeURIComponent(apiKey)}&country=in&language=en${pageParam}`;
    } else {
      const qParam = catConfig && catConfig.query ? `&q=${encodeURIComponent(catConfig.query)}` : '';
      const catParam = catConfig && catConfig.gnewsCategory ? `&category=${catConfig.gnewsCategory}` : '';
      url = `${baseUrl}/news?apikey=${encodeURIComponent(apiKey)}&language=en${catParam}${qParam}${pageParam}`;
    }
    normalizer = (item) => normalizeNewsDataArticle(item, categoryLabel);
  } else {
    // Default GNews provider: clamp to maximum 10 articles per request (free-tier limit)
    const pageParam = page > 1 ? `&page=${page}` : '';
    // Never append placeholder 'test' or cross-provider hyphenated keys to API requests
    const keyParam = isValidCustomApiKey(apiKey, provider) ? `&apikey=${encodeURIComponent(apiKey.trim())}` : '';
    if (category.toLowerCase() === 'india') {
      url = `${baseUrl}/top-headlines?country=in&lang=en&max=${effectiveLimit}${keyParam}${pageParam}`;
    } else if (catConfig && catConfig.query) {
      url = `${baseUrl}/search?q=${encodeURIComponent(catConfig.query)}&lang=en&max=${effectiveLimit}${keyParam}${pageParam}`;
    } else {
      const gCategory = catConfig ? catConfig.gnewsCategory : (category === 'general' ? 'general' : category);
      url = `${baseUrl}/top-headlines?category=${encodeURIComponent(gCategory)}&lang=en&max=${effectiveLimit}${keyParam}${pageParam}`;
    }
    normalizer = (item) => normalizeGNewsArticle(item, categoryLabel);
  }

  const rawData = await fetchWithRetry(url, provider, apiKey);

  let rawArticles = [];
  if (provider === 'guardian') {
    rawArticles = (rawData.response && Array.isArray(rawData.response.results)) ? rawData.response.results : [];
  } else if (provider === 'newsdata') {
    rawArticles = Array.isArray(rawData.results) ? rawData.results : [];
  } else {
    rawArticles = Array.isArray(rawData.articles) ? rawData.articles : [];
  }

  const normalized = rawArticles
    .map(normalizer)
    .filter((a) => a && a.title && a.title.trim() !== '');

  // Deduplicate identical or syndication-copied stories
  const deduped = deduplicateArticles(normalized);

  // Apply strict category isolation if a specific desk is requested
  const isolated = category.toLowerCase() === 'general'
    ? deduped
    : deduped.filter((a) => isArticleRelevantToCategory(a, category));

  // Sort descending by date (newest first)
  const sorted = sortByDateDescending(isolated);

  // Apply publisher diversity so readers see multiple outlets
  const diversified = diversifyPublishers(sorted, 2);

  return {
    articles: diversified,
    totalResults: diversified.length,
    provider,
    category: categoryLabel,
    page,
    pageSize,
    hasMore: rawArticles.length >= effectiveLimit,
  };
}

/**
 * Fetch latest news wire feed (strict newest-first ordering with deduplication)
 */
export async function getLatestNews({ page = 1, pageSize = 8 } = {}) {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST);
  if (!apiKey && (isTest || provider !== 'gnews')) {
    throw new ApiError(
      'No API key configured. Please configure an API key to load the latest newsroom feed.',
      'MISSING_KEY'
    );
  }

  const baseUrl = getProviderBaseUrl(provider);
  let url;
  let normalizer;

  if (provider === 'guardian') {
    url = `${baseUrl}/search?order-by=newest&page=${page}&page-size=${pageSize}&show-fields=thumbnail,trailText,byline,bodyText,publication&api-key=${encodeURIComponent(apiKey)}`;
    normalizer = (item) => normalizeGuardianArticle(item, 'Breaking Wire');
  } else if (provider === 'newsdata') {
    const pageParam = page > 1 ? `&page=${page}` : '';
    url = `${baseUrl}/news?apikey=${encodeURIComponent(apiKey)}&language=en${pageParam}`;
    normalizer = (item) => normalizeNewsDataArticle(item, 'Breaking Wire');
  } else {
    const pageParam = page > 1 ? `&page=${page}` : '';
    const keyParam = isValidCustomApiKey(apiKey, provider) ? `&apikey=${encodeURIComponent(apiKey.trim())}` : '';
    const effectiveLimit = Math.min(pageSize, 10);
    url = `${baseUrl}/top-headlines?category=general&lang=en&max=${effectiveLimit}${keyParam}${pageParam}`;
    normalizer = (item) => normalizeGNewsArticle(item, 'Breaking Wire');
  }

  const rawData = await fetchWithRetry(url, provider, apiKey);

  let rawArticles = [];
  if (provider === 'guardian') {
    rawArticles = (rawData.response && Array.isArray(rawData.response.results)) ? rawData.response.results : [];
  } else if (provider === 'newsdata') {
    rawArticles = Array.isArray(rawData.results) ? rawData.results : [];
  } else {
    rawArticles = Array.isArray(rawData.articles) ? rawData.articles : [];
  }

  const normalized = rawArticles
    .map(normalizer)
    .filter((a) => a && a.title && a.title.trim() !== '');

  const deduped = deduplicateArticles(normalized);
  return sortByDateDescending(deduped);
}

/**
 * Search articles by query keyword with STRICT RELEVANCE SCORING and entity disambiguation.
 * Never returns unrelated or incidental stories.
 */
export async function searchNewsArticles({ query, page = 1, pageSize = 15 } = {}) {
  const provider = getStoredProvider();
  const apiKey = getStoredApiKey(provider);

  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST);
  if (!apiKey && (isTest || provider !== 'gnews')) {
    throw new ApiError(
      'No API key configured. Please set VITE_NEWS_API_KEY in your environment or enter your key in Settings.',
      'MISSING_KEY'
    );
  }

  if (!query || !query.trim()) {
    return { articles: [], totalResults: 0, originalCount: 0, filteredCount: 0, query: '' };
  }

  const processedQuery = processSearchQuery(query);
  const cleanQuery = processedQuery.rawQuery;
  const providerSearchTerm = processedQuery.effectiveProviderQuery || cleanQuery;

  const baseUrl = getProviderBaseUrl(provider);
  let url;
  let normalizer;

  // Request a slightly larger batch from provider so we have room after strict relevance filtering
  const fetchSize = Math.max(pageSize, 20);
  const effectiveLimit = provider === 'gnews' ? Math.min(fetchSize, 10) : fetchSize;

  if (provider === 'guardian') {
    url = `${baseUrl}/search?q=${encodeURIComponent(providerSearchTerm)}&order-by=relevance&page=${page}&page-size=${fetchSize}&show-fields=thumbnail,trailText,byline,bodyText,publication&api-key=${encodeURIComponent(apiKey)}`;
    normalizer = (item) => normalizeGuardianArticle(item, 'Search Result');
  } else if (provider === 'newsdata') {
    const pageParam = page > 1 ? `&page=${page}` : '';
    url = `${baseUrl}/news?apikey=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(providerSearchTerm)}&language=en${pageParam}`;
    normalizer = (item) => normalizeNewsDataArticle(item, 'Search Result');
  } else {
    // Default GNews provider: pass sortby=relevance for search queries so upstream returns best matches
    const pageParam = page > 1 ? `&page=${page}` : '';
    const keyParam = isValidCustomApiKey(apiKey, provider) ? `&apikey=${encodeURIComponent(apiKey.trim())}` : '';
    url = `${baseUrl}/search?q=${encodeURIComponent(providerSearchTerm)}&lang=en&sortby=relevance&max=${effectiveLimit}${keyParam}${pageParam}`;
    normalizer = (item) => normalizeGNewsArticle(item, 'Search Result');
  }

  const rawData = await fetchWithRetry(url, provider, apiKey);

  let rawArticles = [];
  if (provider === 'guardian') {
    rawArticles = (rawData.response && Array.isArray(rawData.response.results)) ? rawData.response.results : [];
  } else if (provider === 'newsdata') {
    rawArticles = Array.isArray(rawData.results) ? rawData.results : [];
  } else {
    rawArticles = Array.isArray(rawData.articles) ? rawData.articles : [];
  }

  let normalized = rawArticles
    .map(normalizer)
    .filter((a) => a && a.title && a.title.trim() !== '');

  // 1. Initial Deduplication & Scoring
  let deduped = deduplicateArticles(normalized);
  let rankedResult = filterAndRankSearchResults(deduped, cleanQuery, {
    minScore: 28,
    maxResults: pageSize,
  });

  // For GNews on initial search: if page 1 returned the maximum 10 items, but strict filtering leaves < 4 articles,
  // proactively fetch page 2 to augment candidate pool so the user receives a solid set of verified results
  if (provider === 'gnews' && page === 1 && rawArticles.length >= 10 && rankedResult.articles.length < 4 && !isTest) {
    try {
      const page2KeyParam = isValidCustomApiKey(apiKey, provider) ? `&apikey=${encodeURIComponent(apiKey.trim())}` : '';
      const page2Url = `${baseUrl}/search?q=${encodeURIComponent(providerSearchTerm)}&lang=en&sortby=relevance&max=${effectiveLimit}${page2KeyParam}&page=2`;
      const page2RawData = await fetchWithRetry(page2Url, provider, apiKey);
      const page2RawArticles = Array.isArray(page2RawData.articles) ? page2RawData.articles : [];

      if (page2RawArticles.length > 0) {
        const page2Normalized = page2RawArticles
          .map(normalizer)
          .filter((a) => a && a.title && a.title.trim() !== '');

        rawArticles = [...rawArticles, ...page2RawArticles];
        normalized = [...normalized, ...page2Normalized];
        deduped = deduplicateArticles(normalized);
        rankedResult = filterAndRankSearchResults(deduped, cleanQuery, {
          minScore: 28,
          maxResults: pageSize,
        });
      }
    } catch {
      // If page 2 fetch fails or is unavailable, proceed gracefully with page 1 results
    }
  }

  const hasMore = provider === 'gnews'
    ? rawArticles.length >= (page === 1 && normalized.length > 10 ? 20 : 10)
    : rawArticles.length >= fetchSize;

  return {
    articles: rankedResult.articles,
    totalResults: rankedResult.relevantCount,
    originalCount: rankedResult.totalFound,
    filteredCount: rankedResult.filteredCount,
    query: cleanQuery,
    entityType: rankedResult.entityType,
    provider,
    page,
    pageSize,
    hasMore,
  };
}

/**
 * Clear cached API requests
 */
export function clearApiCache() {
  requestCache.clear();
}
