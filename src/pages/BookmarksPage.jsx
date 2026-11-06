import React, { useState } from 'react';
import { Bookmark, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarksContext';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';

export default function BookmarksPage() {
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { addToast } = useToast();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  React.useEffect(() => {
    document.title = `Bookmarks (${bookmarks.length}) — NEWSLY`;
  }, [bookmarks.length]);

  const handleClear = () => {
    clearBookmarks();
    setShowConfirmClear(false);
    addToast('All bookmarks cleared', 'info');
  };

  return (
    <div className="container" style={{ paddingTop: '1.75rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Top Headlines
        </Link>
      </div>

      {/* Header */}
      <div className="section-header">
        <div>
          <span className="category-tag">Personal Archive</span>
          <h1 className="section-title">
            <Bookmark size={22} color="var(--accent)" /> Saved Stories & Reading List
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} preserved in your browser's local archive.
          </p>
        </div>

        {bookmarks.length > 0 && (
          <div>
            {!showConfirmClear ? (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', color: 'var(--accent)', borderColor: 'var(--border-color)' }}
              >
                <Trash2 size={13} /> Clear Reading List
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn btn-accent"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {bookmarks.length === 0 ? (
        <EmptyState
          type="bookmarks"
          title="Your Reading List is Empty"
          description="Click the bookmark icon on any article while exploring NEWSLY to preserve it here for later reading."
          actionText="Browse Today's Headlines"
          actionLink="/"
        />
      ) : (
        <div className="news-cards-grid">
          {bookmarks.map((article) => (
            <NewsCard key={article.id} article={article} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
