import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTopHeadlines, searchNewsArticles, clearApiCache, ApiError } from '../services/newsApi';

describe('News API Service', () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
    vi.restoreAllMocks();
  });

  it('throws MISSING_KEY error when no API key is provided', async () => {
    await expect(getTopHeadlines({ category: 'technology' })).rejects.toThrowError(
      /No API key configured/i
    );

    try {
      await getTopHeadlines({ category: 'technology' });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('MISSING_KEY');
    }
  });

  it('returns empty result cleanly when search query is empty string', async () => {
    localStorage.setItem('newsly_api_key', 'valid-key');
    const result = await searchNewsArticles({ query: '   ' });
    expect(result.articles).toEqual([]);
    expect(result.totalResults).toBe(0);
  });

  it('correctly handles and surfaces 401 Unauthorized as INVALID_KEY error', async () => {
    localStorage.setItem('newsly_api_key', 'invalid-user-key');
    localStorage.setItem('newsly_api_provider', 'guardian');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 401,
      ok: false,
      json: async () => ({ message: 'Unauthorized' }),
    });

    try {
      await getTopHeadlines({ category: 'world' });
      expect.unreachable('Should have thrown an ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('INVALID_KEY');
      expect(err.message).toMatch(/Guardian/i);
    }
  });

  it('rejects stale "test" key from legacy storage and throws MISSING_KEY', async () => {
    localStorage.setItem('newsly_api_key', 'test');
    localStorage.setItem('newsly_api_provider', 'guardian');

    try {
      await getTopHeadlines({ category: 'world' });
      expect.unreachable('Should have thrown an ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('MISSING_KEY');
      expect(localStorage.getItem('newsly_api_key')).toBeNull();
    }
  });

  it('correctly handles and surfaces 429 Rate Limit as RATE_LIMITED error', async () => {
    localStorage.setItem('newsly_api_key', 'my-key');
    localStorage.setItem('newsly_api_provider', 'guardian');

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 429,
      ok: false,
      json: async () => ({ message: 'Rate limit exceeded' }),
    });

    try {
      await getTopHeadlines({ category: 'world' });
      expect.unreachable('Should have thrown an ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('RATE_LIMITED');
    }
  });

  it('differentiates browser CORS or network failures into NETWORK_ERROR', async () => {
    localStorage.setItem('newsly_api_key', 'valid-key');
    localStorage.setItem('newsly_api_provider', 'guardian');

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    try {
      await getTopHeadlines({ category: 'world' });
      expect.unreachable('Should have thrown an ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.code).toBe('NETWORK_ERROR');
      expect(err.message).toMatch(/Unable to reach GUARDIAN/i);
    }
  });

  it('correctly parses and normalizes genuine Guardian API article fields', async () => {
    localStorage.setItem('newsly_api_key', 'real-key');
    localStorage.setItem('newsly_api_provider', 'guardian');

    const mockGuardianResponse = {
      response: {
        status: 'ok',
        userTier: 'developer',
        total: 1,
        results: [
          {
            id: 'technology/2026/nov/04/quantum-supercomputer-milestone',
            type: 'article',
            sectionId: 'technology',
            sectionName: 'Technology',
            webPublicationDate: '2026-11-04T09:30:00Z',
            webTitle: 'Quantum Supercomputer Reaches Quantum Supremacy Milestone',
            webUrl: 'https://www.theguardian.com/technology/2026/nov/04/quantum-supercomputer-milestone',
            fields: {
              headline: 'Quantum Supercomputer Reaches Quantum Supremacy Milestone',
              standfirst: 'Researchers demonstrate 1,000 logical qubit coherence.',
              trailText: 'Researchers demonstrate 1,000 logical qubit coherence in benchmark test.',
              byline: 'Sarah Jenkins in London',
              thumbnail: 'https://media.guim.co.uk/sample-thumbnail.jpg',
              publication: 'The Guardian',
              bodyText: 'A team of physicists has announced a major breakthrough...',
            },
          },
        ],
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => mockGuardianResponse,
    });

    const result = await getTopHeadlines({ category: 'technology' });
    expect(result.articles).toHaveLength(1);
    const article = result.articles[0];

    expect(article.title).toBe('Quantum Supercomputer Reaches Quantum Supremacy Milestone');
    expect(article.description).toBe('Researchers demonstrate 1,000 logical qubit coherence in benchmark test.');
    expect(article.imageUrl).toBe('https://media.guim.co.uk/sample-thumbnail.jpg');
    expect(article.author).toBe('Sarah Jenkins in London');
    expect(article.source.name).toBe('The Guardian');
    expect(article.url).toBe('https://www.theguardian.com/technology/2026/nov/04/quantum-supercomputer-milestone');
    expect(article.publishedAt).toBe('2026-11-04T09:30:00Z');
  });
});
