import React from 'react';
import { Newspaper, Bookmark, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  type = 'general', // 'general' | 'bookmarks' | 'search'
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) {
  let Icon = Newspaper;
  let defaultTitle = 'No Stories Available';
  let defaultDesc = 'There are no articles to display at this moment. Check back soon for fresh editorial updates.';

  if (type === 'bookmarks') {
    Icon = Bookmark;
    defaultTitle = 'Your Reading List is Empty';
    defaultDesc = 'Save insightful stories while browsing to read them at your leisure. Bookmarks are saved safely in your browser.';
  } else if (type === 'search') {
    Icon = Search;
    defaultTitle = 'No Matching Stories Found';
    defaultDesc = 'We could not find any stories matching your query. Try different keywords or browse our categories.';
  }

  return (
    <div className="state-container animate-fade-in" role="status">
      <div className="state-icon-wrap empty">
        <Icon size={32} />
      </div>
      <h3 className="state-title">{title || defaultTitle}</h3>
      <p className="state-desc">{description || defaultDesc}</p>

      {(actionText && actionLink) && (
        <div className="state-actions">
          <Link to={actionLink} className="btn btn-primary">
            {actionText} <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {(actionText && onAction && !actionLink) && (
        <div className="state-actions">
          <button type="button" onClick={onAction} className="btn btn-primary">
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
}
