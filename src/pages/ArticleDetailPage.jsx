import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Bookmark,
  Calendar,
  User,
  Building,
  Clock,
  BookOpen,
  Newspaper,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { formatFullDateTime, formatRelativeTime } from '../utils/dateFormatter';
import { estimateReadingTime } from '../utils/textHelpers';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from '../components/Toast';
import ShareButton from '../components/ShareButton';
import { getTopHeadlines } from '../services/newsApi';

export default function ArticleDetailPage() {
  const { articleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  const { addToast } = useToast();

  const [article, setArticle] = useState(
    location.state?.article || bookmarks.find((b) => String(b.id) === String(articleId)) || null
  );
  const [imageError, setImageError] = useState(false);
  const [fetchingFallback, setFetchingFallback] = useState(false);

  // If article not found in state or bookmarks, attempt to find in top headlines
  useEffect(() => {
    if (!article && articleId) {
      setFetchingFallback(true);
      getTopHeadlines({ category: 'general', pageSize: 20 })
        .then((res) => {
          const match = res.articles?.find((a) => String(a.id) === String(articleId));
          if (match) setArticle(match);
        })
        .catch(() => {})
        .finally(() => setFetchingFallback(false));
    }
  }, [article, articleId]);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — NEWSLY`;
    } else {
      document.title = 'Article Details — NEWSLY';
    }
  }, [article]);

  const bookmarked = article ? isBookmarked(article.id) : false;

  if (!article) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="state-container">
          <div className="state-icon-wrap empty">
            <Newspaper size={32} />
          </div>
          <h2 className="state-title">
            {fetchingFallback ? 'Locating Story in Archive...' : 'Article Not Found'}
          </h2>
          <p className="state-desc">
            {fetchingFallback
              ? 'Querying news dispatch feeds for this story...'
              : 'Direct navigation requires passing article metadata or saving the dispatch to your bookmarks.'}
          </p>
          <div className="state-actions">
            <Link to="/" className="btn btn-primary">
              <ArrowLeft size={15} /> Return to Newsroom
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleBookmark = () => {
    const added = toggleBookmark(article);
    addToast(
      added ? 'Article saved to your bookmarks' : 'Article removed from your bookmarks',
      'info'
    );
  };

  const readingTime = estimateReadingTime(article.content || article.description || article.title);

  return (
    <article className="article-detail-container animate-fade-in">
      {/* Back Navigation Bar */}
      <nav className="article-back-nav" aria-label="Breadcrumb navigation">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn btn-outline"
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </nav>

      {/* Editorial Header */}
      <header className="article-header-section">
        <div className="article-category-badge">
          <span className="category-tag">{article.category || 'Special Report'}</span>
        </div>

        <h1 className="article-detail-title">{article.title}</h1>

        {article.description && (
          <p className="article-lead-paragraph">
            {article.description}
          </p>
        )}

        {/* Metadata Bar */}
        <div className="article-detail-meta-bar">
          <div className="article-meta-left">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={14} color="var(--accent)" />
              <strong style={{ color: 'var(--text-primary)' }}>{article.source?.name || 'Accredited Publisher'}</strong>
            </span>

            {article.author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <User size={14} />
                <span className="article-author-byline">{article.author}</span>
              </span>
            )}

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} />
              <span>{formatFullDateTime(article.publishedAt)}</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} />
              <span>{formatRelativeTime(article.publishedAt)}</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BookOpen size={14} />
              <span>{readingTime}</span>
            </span>
          </div>

          <div className="article-actions-group">
            <ShareButton article={article} variant="button" />

            <button
              type="button"
              onClick={handleBookmark}
              className={`btn ${bookmarked ? 'btn-accent' : 'btn-outline'}`}
              style={{ fontSize: '0.8125rem' }}
              aria-label={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
            >
              <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Feature Photography */}
      <figure className="article-main-image-container">
        {article.imageUrl && !imageError ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="article-main-image"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="image-placeholder" style={{ minHeight: '320px' }}>
            <Newspaper size={56} className="image-placeholder-icon" />
            <span className="image-placeholder-text">Original Editorial Coverage</span>
          </div>
        )}
        <figcaption className="article-image-caption">
          Photograph and reporting provided via genuine feed from {article.source?.name || 'Publisher'}.
        </figcaption>
      </figure>

      {/* Genuine Content Section */}
      <section className="article-body-content">
        {article.content ? (
          <div>
            <p>{article.content}</p>
          </div>
        ) : article.description ? (
          <div>
            <p>{article.description}</p>
          </div>
        ) : (
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            This story was transmitted as a headline dispatch. Continue reading the complete story at the original publisher.
          </p>
        )}
      </section>

      {/* Authentic Publisher Callout - Strict requirement: Never fabricate article content */}
      <aside className="article-publisher-callout">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--accent)" />
          <h2 className="article-publisher-title">
            Genuine Coverage from {article.source?.name || 'Original Publisher'}
          </h2>
        </div>
        <p className="article-publisher-text">
          In adherence to editorial integrity and copyright terms, NEWSLY presents genuine API-supplied excerpts.
          To read the full investigative report, interactive graphics, and author commentary, visit the publisher's official publication.
        </p>

        {article.url && article.url !== '#' && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Read Complete Story at {article.source?.name || 'Publisher'}</span>
            <ExternalLink size={14} />
          </a>
        )}
      </aside>
    </article>
  );
}
