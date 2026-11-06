import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, BookOpen, Newspaper, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateFormatter';
import { estimateReadingTime } from '../utils/textHelpers';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from './Toast';
import ShareButton from './ShareButton';

export default function FeaturedCard({ article, className = '' }) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);

  if (!article) return null;

  const bookmarked = isBookmarked(article.id);
  const readingTime = estimateReadingTime(article.content || article.description || article.title);
  const articleDetailPath = `/article/${encodeURIComponent(article.id)}`;

  const handleBookmarkToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleBookmark(article);
    addToast(
      added ? 'Lead story saved to bookmarks' : 'Story removed from bookmarks',
      'info'
    );
  };

  return (
    <article className={`featured-hero-card animate-fade-in ${className}`}>
      <div className="featured-hero-image-wrap">
        <Link to={articleDetailPath} state={{ article }} tabIndex={-1} aria-hidden="true">
          {article.imageUrl && !imageError ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="featured-hero-image"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="image-placeholder" style={{ minHeight: '260px' }}>
              <Newspaper size={48} className="image-placeholder-icon" />
              <span className="image-placeholder-text">Lead Editorial Coverage</span>
            </div>
          )}
        </Link>
      </div>

      <div className="featured-hero-content">
        <div className="card-meta-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="edition-badge">
              <span className="pulse-indicator" /> Lead Story
            </span>
            <span className="category-tag">{article.category || 'Special Report'}</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Clock size={12} /> {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        <h2 className="featured-hero-title">
          <Link to={articleDetailPath} state={{ article }}>
            {article.title}
          </Link>
        </h2>

        {article.description && (
          <p className="featured-hero-desc">{article.description}</p>
        )}

        <div className="card-footer">
          <div className="card-source-info">
            <span className="card-source-name">{article.source?.name}</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <BookOpen size={12} /> {readingTime}
            </span>
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
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
            >
              Read Story <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
