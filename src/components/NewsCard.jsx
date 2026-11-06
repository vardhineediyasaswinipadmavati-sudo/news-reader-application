import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, Newspaper, ArrowUpRight } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateFormatter';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from './Toast';
import ShareButton from './ShareButton';

export default function NewsCard({
  article,
  variant = 'standard', // 'standard' | 'compact'
  className = '',
}) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);

  if (!article) return null;

  const bookmarked = isBookmarked(article.id);

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark(article);
    addToast(
      added ? 'Story saved to bookmarks' : 'Story removed from bookmarks',
      'info'
    );
  };

  const articleDetailPath = `/article/${encodeURIComponent(article.id)}`;

  if (variant === 'compact') {
    return (
      <article className={`news-card-compact ${className}`}>
        <div className="news-card-compact-image-wrap">
          {article.imageUrl && !imageError ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="news-card-compact-image"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="image-placeholder">
              <Newspaper size={18} className="image-placeholder-icon" />
            </div>
          )}
        </div>

        <div className="news-card-compact-content">
          <span className="category-tag" style={{ fontSize: '0.625rem', marginBottom: '0.2rem' }}>
            {article.category || 'News'}
          </span>
          <h4 className="news-card-compact-title">
            <Link to={articleDetailPath} state={{ article }}>
              {article.title}
            </Link>
          </h4>
          <div className="card-footer" style={{ padding: 0, border: 'none' }}>
            <span style={{ fontSize: '0.6875rem' }}>{article.source?.name}</span>
            <span style={{ fontSize: '0.6875rem' }}>{formatRelativeTime(article.publishedAt)}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`news-card-standard animate-fade-in ${className}`}>
      <div className="news-card-image-wrap">
        <Link to={articleDetailPath} state={{ article }} tabIndex={-1} aria-hidden="true">
          {article.imageUrl && !imageError ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="news-card-image"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="image-placeholder">
              <Newspaper size={28} className="image-placeholder-icon" />
              <span className="image-placeholder-text">{article.category || 'Editorial'}</span>
            </div>
          )}
        </Link>
      </div>

      <div className="news-card-content">
        <div className="card-meta-top">
          <span className="category-tag">{article.category || 'General'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} /> {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        <h3 className="news-card-title">
          <Link to={articleDetailPath} state={{ article }}>
            {article.title}
          </Link>
        </h3>

        {article.description && (
          <p className="news-card-desc">{article.description}</p>
        )}

        <div className="card-footer">
          <div className="card-source-info">
            <span className="card-source-name">{article.source?.name}</span>
          </div>

          <div className="card-actions-row">
            <ShareButton article={article} />
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`action-btn-mini ${bookmarked ? 'active' : ''}`}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark story'}
            >
              <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
            <Link
              to={articleDetailPath}
              state={{ article }}
              className="action-btn-mini"
              aria-label="Read full article"
              title="Read full article"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
