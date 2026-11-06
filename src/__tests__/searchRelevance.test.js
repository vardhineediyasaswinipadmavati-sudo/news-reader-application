import { describe, it, expect } from 'vitest';
import {
  processSearchQuery,
  scoreArticleRelevance,
  filterAndRankSearchResults,
  deduplicateArticles,
  diversifyPublishers,
} from '../utils/searchRelevance';

describe('Search Relevance & Query Processing Engine', () => {
  describe('processSearchQuery', () => {
    it('normalizes query and extracts tokens', () => {
      const result = processSearchQuery('  Global   Markets 2026!  ');
      expect(result.rawQuery).toBe('Global Markets 2026!');
      expect(result.tokens).toContain('global');
      expect(result.tokens).toContain('markets');
      expect(result.tokens).toContain('2026');
      expect(result.entityType).toBe('GENERIC');
    });

    it('detects AP Elections entity type and prepares effective query', () => {
      const res1 = processSearchQuery('AP elections');
      expect(res1.entityType).toBe('AP_ELECTIONS');
      expect(res1.effectiveProviderQuery).toContain('Andhra Pradesh');

      const res2 = processSearchQuery('ap election results');
      expect(res2.entityType).toBe('AP_ELECTIONS');

      const res3 = processSearchQuery('andhra pradesh assembly polls');
      expect(res3.entityType).toBe('AP_ELECTIONS');
    });

    it('detects Tesla entity type', () => {
      const res = processSearchQuery('Tesla Q3 earnings');
      expect(res.entityType).toBe('TESLA');
    });

    it('detects Artificial Intelligence entity type', () => {
      const res1 = processSearchQuery('Artificial Intelligence');
      expect(res1.entityType).toBe('ARTIFICIAL_INTELLIGENCE');

      const res2 = processSearchQuery('generative AI in healthcare');
      expect(res2.entityType).toBe('ARTIFICIAL_INTELLIGENCE');
    });
  });

  describe('scoreArticleRelevance — Acceptance Tests', () => {
    // -------------------------------------------------------------
    // PRIORITY 1: ACCEPTANCE TEST 1: "AP ELECTIONS"
    // -------------------------------------------------------------
    describe('Acceptance Test: "AP elections"', () => {
      const apQuery = processSearchQuery('AP elections');

      it('accepts genuine Andhra Pradesh election stories with high score', () => {
        const genuineArticle = {
          title: 'Andhra Pradesh Assembly Elections: Polling underway across 175 constituencies',
          description: 'High voter turnout reported in Amaravati, Vijayawada and Visakhapatnam as TDP and YSRCP contest.',
          content: 'Voters across Andhra queued early in the morning.',
          source: { name: 'The Hindu' },
        };

        const score = scoreArticleRelevance(genuineArticle, apQuery);
        expect(score.isRelevant).toBe(true);
        expect(score.score).toBeGreaterThanOrEqual(75);
      });

      it('rejects US election stories where AP is merely the Associated Press wire', () => {
        const wireArticle = {
          title: 'Harris and Trump make final election appeals to battleground voters',
          description: 'WASHINGTON (AP) — The presidential candidates campaigned across Pennsylvania and Michigan on Monday.',
          content: 'By The Associated Press. Election day voting opens tomorrow across fifty states.',
          source: { name: 'Associated Press' },
        };

        const score = scoreArticleRelevance(wireArticle, apQuery);
        expect(score.isRelevant).toBe(false);
        expect(score.score).toBe(0);
        expect(score.reason).toContain('Associated Press');
      });

      it('rejects general international stories with (AP) tag and election mention', () => {
        const frenchElection = {
          title: 'French parliamentary elections: Macron alliance faces coalition talks (AP)',
          description: 'PARIS (AP) — French voters cast ballots in second round of parliamentary voting.',
          content: 'France faces a hung parliament according to exit polls released Sunday.',
          source: { name: 'The Guardian' },
        };

        const score = scoreArticleRelevance(frenchElection, apQuery);
        expect(score.isRelevant).toBe(false);
        expect(score.score).toBe(0);
      });
    });

    // -------------------------------------------------------------
    // PRIORITY 1: ACCEPTANCE TEST 2: "Tesla"
    // -------------------------------------------------------------
    describe('Acceptance Test: "Tesla"', () => {
      const teslaQuery = processSearchQuery('Tesla');

      it('accepts articles where Tesla is the primary subject in headline', () => {
        const genuineArticle = {
          title: 'Tesla expands Gigafactory production with new robotaxi platform',
          description: 'Automaker accelerates delivery of next-generation electric vehicles.',
          source: { name: 'Reuters' },
        };

        const score = scoreArticleRelevance(genuineArticle, teslaQuery);
        expect(score.isRelevant).toBe(true);
        expect(score.score).toBeGreaterThanOrEqual(90);
      });

      it('rejects articles where Tesla is only an incidental secondary mention in general politics', () => {
        const incidentalArticle = {
          title: 'Biden touts green manufacturing and union jobs during Detroit campaign stop',
          description: 'The president delivered remarks at an auto plant, praising investments in domestic battery production and mentioning subsidies for EV makers including GM, Ford, and Tesla.',
          content: 'Speech focused on federal infrastructure legislation and congressional priorities.',
          source: { name: 'The Washington Post' },
        };

        const score = scoreArticleRelevance(incidentalArticle, teslaQuery);
        expect(score.isRelevant).toBe(false);
        expect(score.score).toBeLessThan(30);
        expect(score.isIncidental).toBe(true);
      });

      it('rejects unrelated environmental article mentioning Tesla once in passing', () => {
        const climateArticle = {
          title: 'Global climate summit targets carbon emissions in transport sector',
          description: 'Delegates discussed public transit, high-speed rail, and commercial fleets, noting growth in electric car firms like Tesla.',
          source: { name: 'Financial Times' },
        };

        const score = scoreArticleRelevance(climateArticle, teslaQuery);
        expect(score.isRelevant).toBe(false);
      });
    });

    // -------------------------------------------------------------
    // PRIORITY 1: ACCEPTANCE TEST 3: "Artificial Intelligence"
    // -------------------------------------------------------------
    describe('Acceptance Test: "Artificial Intelligence"', () => {
      const aiQuery = processSearchQuery('Artificial Intelligence');

      it('accepts articles focused on AI research, models, and industry', () => {
        const genuineAiArticle = {
          title: 'Frontier AI models demonstrate breakthrough reasoning in scientific benchmarks',
          description: 'Researchers evaluate new neural network architectures across mathematics and biology.',
          source: { name: 'MIT Technology Review' },
        };

        const score = scoreArticleRelevance(genuineAiArticle, aiQuery);
        expect(score.isRelevant).toBe(true);
        expect(score.score).toBeGreaterThanOrEqual(80);
      });

      it('rejects hardware smartphone reviews mentioning AI camera once in passing', () => {
        const smartphoneArticle = {
          title: 'Samsung Galaxy smartphone unveiled with brighter OLED display and titanium frame',
          description: 'The handset features upgraded battery capacity, faster wireless charging, and an AI-enhanced camera sensor for night photography.',
          source: { name: 'The Verge' },
        };

        const score = scoreArticleRelevance(smartphoneArticle, aiQuery);
        expect(score.isRelevant).toBe(false);
        expect(score.score).toBeLessThan(30);
      });
    });
  });

  describe('filterAndRankSearchResults', () => {
    it('filters out non-relevant articles and orders by relevance score', () => {
      const articles = [
        {
          id: '1',
          title: 'Biden speaks in Detroit (AP) — election coverage',
          description: 'Mentions auto industry and electric cars like Tesla.',
          publishedAt: '2026-11-01T10:00:00Z',
        },
        {
          id: '2',
          title: 'Tesla Model Y becomes world bestselling passenger vehicle',
          description: 'Tesla quarterly delivery figures exceed Wall Street consensus expectations.',
          publishedAt: '2026-11-02T10:00:00Z',
        },
        {
          id: '3',
          title: 'Oil prices rise as OPEC holds output steady',
          description: 'Energy markets respond to Middle East shipping updates.',
          publishedAt: '2026-11-03T10:00:00Z',
        },
      ];

      const res = filterAndRankSearchResults(articles, 'Tesla');
      expect(res.relevantCount).toBe(1);
      expect(res.filteredCount).toBe(2);
      expect(res.articles[0].id).toBe('2');
      expect(res.articles[0].title).toContain('Tesla Model Y');
    });

    it('returns empty array when no genuine articles match (honest empty state)', () => {
      const articles = [
        {
          title: 'Stock markets fluctuate ahead of Federal Reserve interest rate decision',
          description: 'Bond yields inched lower on Tuesday.',
        },
      ];

      const res = filterAndRankSearchResults(articles, 'AP elections');
      expect(res.articles).toHaveLength(0);
      expect(res.relevantCount).toBe(0);
      expect(res.filteredCount).toBe(1);
    });
  });

  describe('deduplicateArticles', () => {
    it('removes duplicate articles with same URL', () => {
      const list = [
        { id: '1', url: 'https://example.com/story-1', title: 'Major scientific discovery announced' },
        { id: '2', url: 'https://example.com/story-1?ref=rss', title: 'Major scientific discovery announced' },
      ];

      const deduped = deduplicateArticles(list);
      expect(deduped).toHaveLength(1);
    });

    it('removes duplicate articles with near-identical headlines from syndication', () => {
      const list = [
        { id: '1', url: 'https://sitea.com/news/1', title: 'Federal Reserve cuts benchmark interest rate by 25 basis points' },
        { id: '2', url: 'https://siteb.com/news/2', title: 'Federal Reserve cuts benchmark interest rates by 25 basis points' },
      ];

      const deduped = deduplicateArticles(list);
      expect(deduped).toHaveLength(1);
    });
  });

  describe('diversifyPublishers', () => {
    it('prevents more than 2 consecutive articles from the same publisher', () => {
      const list = [
        { id: '1', source: { name: 'Guardian' } },
        { id: '2', source: { name: 'Guardian' } },
        { id: '3', source: { name: 'Guardian' } },
        { id: '4', source: { name: 'Reuters' } },
        { id: '5', source: { name: 'BBC' } },
      ];

      const diversified = diversifyPublishers(list, 2);
      expect(diversified).toHaveLength(5);
      // The 3rd item should not be Guardian because Reuters should be inserted
      expect(diversified[2].source.name).toBe('Reuters');
    });
  });
});
