/**
 * NEWSLY API Configuration & Provider Metadata
 */

export const CATEGORIES = [
  { id: 'world', label: 'World', gnewsCategory: 'world', guardianSection: 'world' },
  { id: 'india', label: 'India', gnewsCategory: 'nation', query: 'India', guardianSection: 'world' },
  { id: 'technology', label: 'Technology', gnewsCategory: 'technology', guardianSection: 'technology' },
  { id: 'ai', label: 'Artificial Intelligence', query: 'Artificial Intelligence OR AI', gnewsCategory: 'technology', guardianSection: 'technology' },
  { id: 'business', label: 'Business', gnewsCategory: 'business', guardianSection: 'business' },
  { id: 'sports', label: 'Sports', gnewsCategory: 'sports', guardianSection: 'sport' },
  { id: 'entertainment', label: 'Entertainment', gnewsCategory: 'entertainment', guardianSection: 'culture' },
  { id: 'science', label: 'Science', gnewsCategory: 'science', guardianSection: 'science' },
  { id: 'health', label: 'Health', gnewsCategory: 'health', guardianSection: 'society' },
];

export const PROVIDERS = {
  gnews: {
    name: 'GNews API',
    website: 'https://gnews.io/',
    docsUrl: 'https://gnews.io/docs/v4',
    baseUrl: 'https://gnews.io/api/v4',
    freeLimit: '100 requests/day',
    defaultKey: '',
    description: 'Global breaking headlines and rich category coverage with direct CORS support.',
  },
  guardian: {
    name: 'The Guardian Open Platform',
    website: 'https://open-platform.theguardian.com/',
    docsUrl: 'https://open-platform.theguardian.com/documentation/',
    baseUrl: 'https://content.guardianapis.com',
    freeLimit: '500 requests/day with free developer key',
    defaultKey: '',
    description: 'Renowned independent journalism with comprehensive global & cultural reporting.',
  },
  newsdata: {
    name: 'NewsData.io',
    website: 'https://newsdata.io/',
    docsUrl: 'https://newsdata.io/documentation',
    baseUrl: 'https://newsdata.io/api/1',
    freeLimit: '200 requests/day',
    defaultKey: '',
    description: 'Worldwide news aggregation across 80+ countries and categories.',
  },
};

/**
 * Check whether an API key value is a placeholder or invalid test value
 */
export function isPlaceholderApiKey(key) {
  if (!key || typeof key !== 'string') return true;
  const clean = key.trim().toLowerCase();
  return clean === '' || clean === 'test' || clean === 'undefined' || clean === 'null' || clean === 'none';
}

/**
 * Get active API key from localStorage or Vite environment variable (scoped by provider)
 */
export function getStoredApiKey(targetProvider) {
  const provider = targetProvider || getStoredProvider();
  const providerStorageKey = `newsly_api_key_${provider}`;

  if (typeof window !== 'undefined') {
    // 1. Check provider-scoped key
    const scopedKey = localStorage.getItem(providerStorageKey);
    if (scopedKey && scopedKey.trim()) {
      const cleanKey = scopedKey.trim();
      if (isPlaceholderApiKey(cleanKey)) {
        // Discard placeholder keys
        localStorage.removeItem(providerStorageKey);
      } else {
        return cleanKey;
      }
    }

    // 2. Safe legacy key migration: reject 'test' and only migrate valid keys if legacy provider matches
    const legacyKey = localStorage.getItem('newsly_api_key');
    const legacyProvider = localStorage.getItem('newsly_api_provider') || 'gnews';
    if (legacyKey && legacyKey.trim()) {
      const cleanLegacy = legacyKey.trim();
      if (isPlaceholderApiKey(cleanLegacy)) {
        // Delete invalid placeholder legacy key immediately
        localStorage.removeItem('newsly_api_key');
      } else if (legacyProvider === provider) {
        // Migrate legitimate key and purge legacy key
        localStorage.setItem(providerStorageKey, cleanLegacy);
        localStorage.removeItem('newsly_api_key');
        return cleanLegacy;
      }
    }
  }

  // 3. Environment variable fallback (only if matching the configured provider and non-placeholder)
  const envProvider = import.meta.env.VITE_NEWS_API_PROVIDER || 'gnews';
  if (envProvider === provider) {
    const envKey = import.meta.env.VITE_NEWS_API_KEY;
    if (envKey && envKey.trim() && !isPlaceholderApiKey(envKey.trim())) {
      const clean = envKey.trim();
      // Never use a Guardian developer UUID for GNews
      if (provider === 'gnews' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
        return '';
      }
      return clean;
    }
  }

  return '';
}

/**
 * Store API key for a specific provider in localStorage
 */
export function setStoredApiKey(key, targetProvider) {
  const provider = targetProvider || getStoredProvider();
  const providerStorageKey = `newsly_api_key_${provider}`;
  if (typeof window !== 'undefined') {
    const trimmed = (key || '').trim();
    if (trimmed && !isPlaceholderApiKey(trimmed)) {
      localStorage.setItem(providerStorageKey, trimmed);
    } else {
      localStorage.removeItem(providerStorageKey);
    }
    // Clean up legacy key to prevent ambiguity
    localStorage.removeItem('newsly_api_key');
  }
}

/**
 * Get active API provider
 */
export function getStoredProvider() {
  if (typeof window !== 'undefined') {
    const customProvider = localStorage.getItem('newsly_api_provider');
    if (customProvider && PROVIDERS[customProvider]) return customProvider;
  }
  const envProvider = import.meta.env.VITE_NEWS_API_PROVIDER;
  if (envProvider && PROVIDERS[envProvider]) return envProvider;
  return 'gnews';
}
