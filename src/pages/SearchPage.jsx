import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Sparkles, Filter, ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { searchNewsArticles } from '../services/newsApi';
import { useApiKey } from '../context/ApiKeyContext';
import NewsCard from '../components/NewsCard';
import { EditorialGridSkeleton } from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';

const POPULAR_TOPICS = [
  'AP Politics',
  'Andhra Pradesh',
  'India News',
  'Artificial Intelligence',
  'Clean Energy',
  'Global Markets',
  'Semiconductors',
  'Cybersecurity',
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const { apiKey, provider } = useApiKey();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({
    totalResults: 0,
    originalCount: 0,
    filteredCount: 0,
    entityType: 'GENERIC',
    page: 1,
    hasMore: false,
  });

  const performSearch = useCallback(async (isInitial = true) => {
    if (!query.trim()) {
      setArticles([]);
      setLoading(false);
      setMeta({
        totalResults: 0,
        originalCount: 0,
        filteredCount: 0,
        entityType: 'GENERIC',
        page: 1,
        hasMore: false,
      });
      return;
    }

    if (isInitial) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageToFetch = isInitial ? 1 : meta.page + 1;
      const data = await searchNewsArticles({
        query: query.trim(),
        page: pageToFetch,
        pageSize: 15,
      });

      if (isInitial) {
        setArticles(data.articles || []);
      } else {
        setArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newUnique = (data.articles || []).filter((a) => !existingIds.has(a.id));
          return [...prev, ...newUnique];
        });
      }

      setMeta({
        totalResults: isInitial ? (data.totalResults || 0) : meta.totalResults + (data.totalResults || 0),
        originalCount: data.originalCount || 0,
        filteredCount: isInitial ? (data.filteredCount || 0) : meta.filteredCount + (data.filteredCount || 0),
        entityType: data.entityType || 'GENERIC',
        page: pageToFetch,
        hasMore: Boolean(data.hasMore && (data.articles?.length || 0) > 0),
      });
    } catch (err) {
      setError(err);
      if (isInitial) {
        setArticles([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, apiKey, provider, meta.page, meta.filteredCount, meta.totalResults]);

  useEffect(() => {
    if (query) {
      document.title = `Search: "${query}" — NEWSLY`;
      performSearch(true);
    } else {
      document.title = 'Search News — NEWSLY';
    }
  }, [query, apiKey, provider]);

  const handleTopicClick = (topic) => {
    navigate(`/search?q=${encodeURIComponent(topic)}`);
  };

  const handleLoadMore = () => {
    if (!loadingMore && meta.hasMore) {
      performSearch(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Top Headlines
        </Link>
      </div>

      {/* Search Header Banner */}
      <div className="search-page-header">
        <h1 className="editorial-headline" style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>
          Newsroom Archive & Live Search
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Query real-time journalism across international events, technical frontiers, and markets.
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto 1.25rem' }}>
          <SearchBar autoFocus={!query} placeholder="Search stories, companies, topics..." />
        </div>

        {/* Suggestion Chips */}
        <div className="search-topics-row">
          <span className="search-topics-label">
            <Sparkles size={12} color="var(--accent)" /> Trending Topics:
          </span>
          {POPULAR_TOPICS.map((topic) => (
            <button
              type="button"
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={`search-topic-pill ${query.toLowerCase() === topic.toLowerCase() ? 'active' : ''}`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Query status header */}
      {query && (
        <div className="section-header" style={{ marginTop: '1.75rem', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Search size={18} color="var(--accent)" />
              <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Search Results for <strong style={{ color: 'var(--accent)' }}>"{query}"</strong>
              </span>
            </div>

            {!loading && !error && meta.filteredCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Strict relevance filter active: excluded {meta.filteredCount} unrelated or incidental mentions.</span>
              </div>
            )}
          </div>

          {!loading && !error && (
            <span className="section-subtitle">
              {articles.length} {articles.length === 1 ? 'article' : 'articles'} verified
            </span>
          )}
        </div>
      )}

      {/* Empty Query Prompt */}
      {!query && (
        <EmptyState
          type="search"
          title="Start Your Search"
          description="Type a keyword into the search bar or click any trending topic above to query live dispatches."
        />
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ marginTop: '1.5rem' }}>
          <EditorialGridSkeleton count={6} />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState error={error} onRetry={() => performSearch(true)} />
      )}

      {/* Empty Search Results with Honest Explanations */}
      {!loading && !error && query && articles.length === 0 && (
        <div className="empty-search-container animate-fade-in" style={{ marginTop: '2rem' }}>
          <EmptyState
            type="search"
            title={`No Relevant Stories Found for "${query}"`}
            description={
              meta.entityType === 'AP_ELECTIONS'
                ? "We verified all returned articles against strict relevance criteria. Note: Western news providers often mistake 'AP' for Associated Press wire reports; we excluded these unrelated wires to maintain strict accuracy."
                : meta.entityType === 'TESLA'
                ? "No articles were found where Tesla is the primary subject. Unrelated political speeches or articles with incidental mentions were filtered out to maintain search integrity."
                : meta.filteredCount > 0
                ? `The news provider returned ${meta.originalCount} items, but our strict relevance filter excluded them because "${query}" was only mentioned as an incidental passing reference rather than the core story subject.`
                : `No active dispatches matched your search query from the news provider at this time.`
            }
            actionText="Browse Top Headlines"
            actionLink="/"
          />

          {/* Quick Alternative Suggestions */}
          <div style={{ maxWidth: '500px', margin: '1.5rem auto 0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
              Suggested Alternative Searches:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {meta.entityType === 'AP_ELECTIONS' ? (
                ['Andhra Pradesh', 'India National', 'Assembly Elections'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTopicClick(t)}
                    className="search-topic-pill"
                  >
                    {t}
                  </button>
                ))
              ) : meta.entityType === 'TESLA' ? (
                ['Electric Vehicles', 'Elon Musk', 'Technology Desk'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTopicClick(t)}
                    className="search-topic-pill"
                  >
                    {t}
                  </button>
                ))
              ) : (
                ['World News', 'Technology', 'Global Markets', 'Artificial Intelligence'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTopicClick(t)}
                    className="search-topic-pill"
                  >
                    {t}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {!loading && !error && articles.length > 0 && (
        <>
          {articles.length === 1 ? (
            <div className="single-story-wrapper" style={{ maxWidth: '680px', margin: '1.5rem auto' }}>
              <NewsCard article={articles[0]} variant="standard" />
            </div>
          ) : (
            <div className="news-cards-grid" style={{ marginTop: '1.5rem' }}>
              {articles.map((art) => (
                <NewsCard key={art.id} article={art} variant="standard" />
              ))}
            </div>
          )}

          {/* Pagination: Load More Button */}
          {meta.hasMore && (
            <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn btn-secondary"
                disabled={loadingMore}
                style={{ minWidth: '180px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loadingMore ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Loading More Stories...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>Load More Relevant Stories</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
