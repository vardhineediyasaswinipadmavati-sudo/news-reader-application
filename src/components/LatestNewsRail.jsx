import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Radio, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateFormatter';
import { getLatestNews } from '../services/newsApi';
import { useApiKey } from '../context/ApiKeyContext';

export default function LatestNewsRail({ initialArticles = [] }) {
  const { apiKey, provider } = useApiKey();
  const [articles, setArticles] = useState(initialArticles);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setArticles(initialArticles.slice(0, 7));
    }
  }, [initialArticles]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const fresh = await getLatestNews({ pageSize: 7 });
      if (fresh && fresh.length > 0) {
        setArticles(fresh);
      }
    } catch {
      // Keep existing articles if refresh fails
    } finally {
      setLoading(false);
    }
  };

  if (!articles || articles.length === 0) return null;

  return (
    <aside className="latest-news-rail" aria-label="Latest News Wire">
      {/* Rail Header */}
      <div className="rail-header">
        <div className="rail-title-wrap">
          <span className="pulse-indicator" />
          <h3 className="rail-title">Latest News Wire</h3>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="btn-icon rail-refresh-btn"
          aria-label="Refresh latest news"
          title="Refresh latest news"
          disabled={loading}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Articles List (Sorted Newest First) */}
      <div className="rail-list">
        {articles.map((art, idx) => {
          const detailPath = `/article/${encodeURIComponent(art.id)}`;
          return (
            <article key={art.id || idx} className="rail-item">
              <div className="rail-item-meta">
                <span className="rail-item-time">
                  <Clock size={11} /> {formatRelativeTime(art.publishedAt)}
                </span>
                <span className="rail-item-source">{art.source?.name}</span>
              </div>
              <h4 className="rail-item-title">
                <Link to={detailPath} state={{ article: art }}>
                  {art.title}
                </Link>
              </h4>
            </article>
          );
        })}
      </div>

      <div className="rail-footer">
        <Link to="/category/world" className="rail-more-link">
          <span>More Wire Dispatches</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </aside>
  );
}
