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
  ChevronRight,
} from 'lucide-react';
import { formatFullDateTime, formatRelativeTime } from '../utils/dateFormatter';
import { estimateReadingTime } from '../utils/textHelpers';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from '../components/Toast';
import ShareButton from '../components/ShareButton';
import NewsCard from '../components/NewsCard';
import { getTopHeadlines } from '../services/newsApi';
import { CATEGORIES } from '../services/apiConfig';

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
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Sync article when articleId or route state changes
  useEffect(() => {
    const matched = location.state?.article || bookmarks.find((b) => String(b.id) === String(articleId));
    if (matched) {
      setArticle(matched);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [articleId, location.state]);

  // Reset image error state when article changes
  useEffect(() => {
    setImageError(false);
  }, [article?.id, article?.imageUrl]);

  // If article not found in state or bookmarks, attempt fallback from headlines
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

  // Set document title
  useEffect(() => {
    if (article) {
      document.title = `${article.title} — NEWSLY`;
    } else {
      document.title = 'Article Details — NEWSLY';
    }
  }, [article]);

  // Fetch related articles from the same category
  useEffect(() => {
    if (!article) return;
    let isMounted = true;
    setLoadingRelated(true);

    const categoryId = article.category || 'general';
    getTopHeadlines({ category: categoryId, pageSize: 8 })
      .then((res) => {
        if (!isMounted) return;
        const related = (res.articles || [])
          .filter((a) => String(a.id) !== String(article.id) && a.title !== article.title)
          .slice(0, 3);
        setRelatedArticles(related);
      })
      .catch(() => {
        if (isMounted) setRelatedArticles([]);
      })
      .finally(() => {
        if (isMounted) setLoadingRelated(false);
      });

    return () => {
      isMounted = false;
    };
  }, [article?.id, article?.category]);

  const bookmarked = article ? isBookmarked(article.id) : false;

  if (!article) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem', textAlign: 'center' }}>
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
      added ? 'Story saved to bookmarks' : 'Story removed from bookmarks',
      'info'
    );
  };

  const readingTime = estimateReadingTime(article.content || article.description || article.title);

  // Clean text and strip API truncation markers like [+1234 chars]
  const cleanBody = (article.content || '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\s*\[\+\d+\s*chars\]\s*$/i, '')
    .replace(/\s*\[\.\.\.\]\s*$/i, '')
    .trim();

  const cleanDesc = (article.description || '')
    .replace(/<[^>]*>?/gm, '')
    .trim();

  // Check if content body provides distinct text beyond the lead description
  const isBodyDistinct = cleanBody && cleanBody.length > cleanDesc.length && !cleanDesc.includes(cleanBody);

  // Check for valid real author (not the publisher name, generic 'unknown', or a URL)
  const hasValidAuthor =
    article.author &&
    article.author.trim() !== '' &&
    article.author.toLowerCase() !== 'unknown' &&
    article.author.toLowerCase() !== (article.source?.name || '').toLowerCase() &&
    !article.author.startsWith('http');

  const categoryMeta = CATEGORIES.find(
    (c) => c.id === article.category?.toLowerCase() || c.label.toLowerCase() === article.category?.toLowerCase()
  );
  const categoryLabel = categoryMeta ? categoryMeta.label : (article.category ? (article.category.charAt(0).toUpperCase() + article.category.slice(1)) : 'General');
  const categoryRoute = categoryMeta ? `/category/${categoryMeta.id}` : `/category/${(article.category || 'general').toLowerCase()}`;

  return (
    <div className="article-page-wrapper">
      <article className="article-detail-container animate-fade-in">
        {/* Navigation Bar / Breadcrumbs */}
        <header className="article-nav-bar">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-outline article-back-btn"
            aria-label="Return to previous page"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <nav className="article-breadcrumbs" aria-label="Breadcrumb navigation">
            <Link to="/" className="breadcrumb-item">Newsroom</Link>
            <ChevronRight size={12} className="breadcrumb-separator" />
            <Link to={categoryRoute} className="breadcrumb-item">
              {categoryLabel}
            </Link>
            <ChevronRight size={12} className="breadcrumb-separator" />
            <span className="breadcrumb-current" aria-current="page">Dispatch</span>
          </nav>
        </header>

        {/* Editorial Header */}
        <header className="article-header-section">
          <div className="article-category-badge">
            <Link to={categoryRoute} className="category-tag">
              {categoryLabel}
            </Link>
          </div>

          <h1 className="article-detail-title">{article.title}</h1>

          {cleanDesc && (
            <p className="article-lead-paragraph">
              {cleanDesc}
            </p>
          )}

          {/* Metadata Bar */}
          <div className="article-detail-meta-bar">
            <div className="article-meta-left">
              <span className="article-meta-item">
                <Building size={14} className="meta-icon accent-icon" />
                <strong>{article.source?.name || 'Verified Source'}</strong>
              </span>

              {hasValidAuthor && (
                <span className="article-meta-item">
                  <User size={14} className="meta-icon" />
                  <span className="article-author-byline">{article.author}</span>
                </span>
              )}

              <span className="article-meta-item">
                <Calendar size={14} className="meta-icon" />
                <span>{formatFullDateTime(article.publishedAt)}</span>
              </span>

              <span className="article-meta-item">
                <Clock size={14} className="meta-icon" />
                <span>{formatRelativeTime(article.publishedAt)}</span>
              </span>

              <span className="article-meta-item">
                <BookOpen size={14} className="meta-icon" />
                <span>{readingTime}</span>
              </span>
            </div>

            <div className="article-actions-group">
              <ShareButton article={article} variant="button" />

              <button
                type="button"
                onClick={handleBookmark}
                className={`btn ${bookmarked ? 'btn-accent' : 'btn-outline'} article-save-btn`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                <span>{bookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Feature Photography */}
        {article.imageUrl && !imageError && (
          <figure className="article-main-image-container">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="article-main-image"
              onError={() => setImageError(true)}
            />
            <figcaption className="article-image-caption">
              Photograph and reporting via verified feed from {article.source?.name || 'Publisher'}.
            </figcaption>
          </figure>
        )}

        {/* Clean Article Body Content */}
        <section className="article-body-content">
          {isBodyDistinct ? (
            <div className="article-paragraphs">
              {cleanBody.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <div className="article-excerpt-notice">
              <p>
                This story was transmitted as an editorial wire summary. The full investigative report, interactive graphics, and author commentary are published at the official publication.
              </p>
            </div>
          )}
        </section>

        {/* Authentic Publisher Attribution Card */}
        <section className="article-publisher-card">
          <div className="publisher-card-header">
            <Building size={20} className="publisher-card-icon" />
            <div>
              <h3 className="publisher-card-title">
                Coverage by {article.source?.name || 'Original Publisher'}
              </h3>
              <p className="publisher-card-subtitle">
                Official Digital Publication
              </p>
            </div>
          </div>

          <p className="publisher-card-text">
            NEWSLY surfaces genuine real-time news dispatches and excerpts. To read the complete uninterrupted coverage, updates, and analysis, visit the original reporting publisher.
          </p>

          {article.url && article.url !== '#' && (
            <div className="publisher-card-action">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary publisher-read-btn"
              >
                <span>Read Full Story at {article.source?.name || 'Publisher'}</span>
                <ExternalLink size={15} />
              </a>
            </div>
          )}
        </section>

        {/* Related Stories Section */}
        {relatedArticles.length > 0 && (
          <section className="article-related-section">
            <div className="section-header">
              <h2 className="section-title">
                Related Stories in {categoryLabel}
              </h2>
              <Link to={categoryRoute} className="view-desk-link">
                Explore Desk &rarr;
              </Link>
            </div>

            <div className="related-articles-grid">
              {relatedArticles.map((rel) => (
                <NewsCard key={rel.id} article={rel} variant="standard" />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
