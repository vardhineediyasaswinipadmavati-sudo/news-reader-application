import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, TrendingUp, ArrowRight, RefreshCw, Globe, ChevronDown } from 'lucide-react';
import { getTopHeadlines, getLatestNews } from '../services/newsApi';
import { useApiKey } from '../context/ApiKeyContext';
import FeaturedCard from '../components/FeaturedCard';
import NewsCard from '../components/NewsCard';
import LatestNewsRail from '../components/LatestNewsRail';
import BreakingTicker from '../components/BreakingTicker';
import { FeaturedHeroSkeleton, EditorialGridSkeleton } from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function HomePage() {
  const { apiKey, provider } = useApiKey();
  const [topArticles, setTopArticles] = useState([]);
  const [latestArticles, setLatestArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      // 1. Fetch top headlines page 1
      const topData = await getTopHeadlines({ category: 'general', page: 1, pageSize: 10 });
      const articles = topData.articles || [];
      setTopArticles(articles);
      setHasMore(Boolean(topData.hasMore));

      // 2. Fetch latest wire news (newest first)
      try {
        const wireArticles = await getLatestNews({ page: 1, pageSize: 8 });
        setLatestArticles(wireArticles || articles.slice(1, 8));
      } catch {
        // Fallback to topArticles slice if wire endpoint fails
        setLatestArticles(articles.slice(1, 8));
      }
    } catch (err) {
      setError(err);
      setTopArticles([]);
      setLatestArticles([]);
    } finally {
      setLoading(false);
    }
  }, [apiKey, provider]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const topData = await getTopHeadlines({ category: 'general', page: nextPage, pageSize: 10 });
      const newArticles = topData.articles || [];

      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setTopArticles((prev) => {
          const seenIds = new Set(prev.map((a) => a.id));
          const uniqueNew = newArticles.filter((a) => !seenIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(Boolean(topData.hasMore && newArticles.length > 0));
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    document.title = 'NEWSLY — The Premier Digital Newsroom';
    fetchInitialData();
  }, [fetchInitialData]);

  const leadStory = topArticles[0];
  const secondaryLeadStories = topArticles.slice(1, 3);
  const generalGridStories = topArticles.slice(3);

  return (
    <div className="home-page-container">
      {/* 1. Live Breaking Ticker Ribbon */}
      {!loading && !error && leadStory && (
        <BreakingTicker article={leadStory} />
      )}

      <div className="container" style={{ paddingTop: '1.25rem', paddingBottom: '3.5rem' }}>
        {/* Editorial Section Header */}
        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flexWrap: 'wrap' }}>
            <Flame size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
            <h1 className="section-title">
              Top Stories & World Dispatches
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="section-subtitle" style={{ fontSize: '0.75rem' }}>
              Live Digital Edition
            </span>
            <button
              type="button"
              onClick={fetchInitialData}
              className="btn-icon"
              style={{ width: '1.75rem', height: '1.75rem' }}
              aria-label="Refresh newsroom feed"
              title="Refresh news feed"
              disabled={loading}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Loading Skeleton State */}
        {loading && (
          <div className="hero-editorial-grid">
            <div>
              <FeaturedHeroSkeleton />
              <div style={{ marginTop: '1.5rem' }}>
                <EditorialGridSkeleton count={2} />
              </div>
            </div>
            <div className="hero-side-stack">
              <EditorialGridSkeleton count={3} />
            </div>
          </div>
        )}

        {/* Error / API Setup State */}
        {!loading && error && (
          <ErrorState error={error} onRetry={fetchInitialData} />
        )}

        {/* Empty State */}
        {!loading && !error && topArticles.length === 0 && (
          <EmptyState
            title="No Headlines Available"
            description="We could not retrieve top headlines from the news feed at this time. Try refreshing or check your API key."
            actionText="Refresh Feed"
            onAction={fetchInitialData}
          />
        )}

        {/* Live Stories Grid */}
        {!loading && !error && topArticles.length > 0 && (
          <>
            {/* Lead Story + Latest Wire Rail */}
            <div className="home-hero-layout">
              {/* Main Column: Featured Lead Story + 2 Supporting Stories */}
              <div className="home-main-col">
                {leadStory && <FeaturedCard article={leadStory} />}

                {secondaryLeadStories.length > 0 && (
                  <div className="secondary-leads-grid">
                    {secondaryLeadStories.map((art) => (
                      <NewsCard key={art.id} article={art} variant="standard" />
                    ))}
                  </div>
                )}
              </div>

              {/* Side Column: Dedicated Latest News Wire (Newest First) */}
              <div className="home-rail-col">
                <LatestNewsRail initialArticles={latestArticles} />
              </div>
            </div>

            {/* General Articles Grid */}
            {generalGridStories.length > 0 && (
              <div style={{ marginTop: '2.5rem' }}>
                <div className="section-header" style={{ marginBottom: '1.25rem' }}>
                  <h2 className="section-title" style={{ fontSize: '1.2rem' }}>
                    <Globe size={18} color="var(--accent)" /> Global Coverage & In-Depth Reporting
                  </h2>
                </div>
                <div className="news-cards-grid">
                  {generalGridStories.map((art) => (
                    <NewsCard key={art.id} article={art} variant="standard" />
                  ))}
                </div>

                {/* Provider Pagination: Load More Stories */}
                {hasMore && (
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
                          <span>Loading Dispatches...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          <span>Load More Stories</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Desk Navigation Ribbon */}
            <div className="desks-nav-ribbon" style={{ marginTop: '3rem' }}>
              <div className="section-header" style={{ borderBottom: 'none', marginBottom: '0.75rem' }}>
                <h3 className="section-title" style={{ fontSize: '1.1rem' }}>
                  <TrendingUp size={16} color="var(--accent)" /> Specialized Editorial Desks
                </h3>
              </div>
              <div className="desk-pills-row">
                {[
                  { to: '/category/world', label: 'World Affairs' },
                  { to: '/category/india', label: 'India National' },
                  { to: '/category/technology', label: 'Technology' },
                  { to: '/category/ai', label: 'Artificial Intelligence' },
                  { to: '/category/business', label: 'Global Economy' },
                  { to: '/category/science', label: 'Science & Space' },
                  { to: '/category/health', label: 'Health & Society' },
                  { to: '/category/sports', label: 'Sports Desk' },
                  { to: '/category/entertainment', label: 'Culture & Entertainment' },
                ].map((desk) => (
                  <Link
                    key={desk.to}
                    to={desk.to}
                    className="desk-pill-btn"
                  >
                    <span>{desk.label}</span>
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
