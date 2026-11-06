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
 * Get active API key from localStorage or Vite environment variable
 */
export function getStoredApiKey() {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem('newsly_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
  }
  const envKey = import.meta.env.VITE_NEWS_API_KEY;
  if (envKey && envKey.trim()) return envKey.trim();
  return '';
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
