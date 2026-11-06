import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowLeft, RefreshCw, ChevronDown } from 'lucide-react';
import { getTopHeadlines } from '../services/newsApi';
import { CATEGORIES } from '../services/apiConfig';
import { useApiKey } from '../context/ApiKeyContext';
import EditorialGrid from '../components/EditorialGrid';
import { FeaturedHeroSkeleton, EditorialGridSkeleton } from '../components/SkeletonLoader';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const CATEGORY_DESCRIPTIONS = {
  world: 'In-depth international reporting, geopolitics, and global developments.',
  india: 'Key national headlines, governance, economy, and society across India.',
  technology: 'Breakthroughs in hardware, software, cybersecurity, and digital infrastructure.',
  ai: 'Frontier developments in generative AI, machine intelligence, and machine learning.',
  business: 'Global financial markets, corporate strategy, venture capital, and economic indicators.',
  sports: 'Championship coverage, match reports, athletic achievements, and sports analysis.',
  entertainment: 'Film, television, music, culture, and creative industry insights.',
  science: 'Discoveries in astronomy, biology, climate, quantum research, and scientific exploration.',
  health: 'Public health, medical innovations, clinical research, and wellness developments.',
};

export default function CategoryPage() {
  const { categoryId } = useParams();
  const { apiKey, provider } = useApiKey();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Match category
  const activeCategory = CATEGORIES.find(
    (c) => c.id.toLowerCase() === (categoryId || '').toLowerCase()
  );

  const categoryName = activeCategory ? activeCategory.label : 'Category News';
  const categoryDesc = CATEGORY_DESCRIPTIONS[categoryId?.toLowerCase()] || 'Latest editorial coverage.';

  const fetchCategoryNews = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      const data = await getTopHeadlines({ category: categoryId, page: 1, pageSize: 10 });
      setArticles(data.articles || []);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, apiKey, provider]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !categoryId) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await getTopHeadlines({ category: categoryId, page: nextPage, pageSize: 10 });
      const newArticles = data.articles || [];

      if (newArticles.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const uniqueNew = newArticles.filter((a) => !existingIds.has(a.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setHasMore(Boolean(data.hasMore && newArticles.length > 0));
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    document.title = `${categoryName} — NEWSLY`;
    fetchCategoryNews();
  }, [fetchCategoryNews, categoryName]);

  return (
    <div className="container" style={{ paddingTop: '1.75rem', paddingBottom: '3.5rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Top Headlines
        </Link>
      </div>

      {/* Category Header */}
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <span className="category-tag" style={{ marginBottom: '0.3rem' }}>Editorial Desk</span>
          <h1 className="section-title" style={{ fontSize: '2.2rem' }}>
            {categoryName}
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {categoryDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCategoryNews}
          className="btn-icon"
          aria-label={`Refresh ${categoryName} feed`}
          title={`Refresh ${categoryName}`}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div>
          <div className="hero-editorial-grid">
            <FeaturedHeroSkeleton />
            <div className="hero-side-stack">
              <EditorialGridSkeleton count={2} />
            </div>
          </div>
          <EditorialGridSkeleton count={6} />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState error={error} onRetry={fetchCategoryNews} />
      )}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && (
        <EmptyState
          title={`No ${categoryName} Articles Available`}
          description={`We could not find active articles in the ${categoryName} section from the configured API feed.`}
          actionText="Explore All News"
          actionLink="/"
        />
      )}

      {/* Articles Grid */}
      {!loading && !error && articles.length > 0 && (
        <>
          <EditorialGrid articles={articles} showHero={articles.length >= 3} columns={3} />

          {/* Provider Pagination: Load More */}
          {hasMore && (
            <div style={{ marginTop: '2.75rem', textAlign: 'center' }}>
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
                    <span>Loading Stories...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>Load More {categoryName} Stories</span>
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
