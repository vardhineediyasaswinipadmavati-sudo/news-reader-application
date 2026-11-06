import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import { formatRelativeTime } from '../utils/dateFormatter';

export default function BreakingTicker({ article }) {
  if (!article || !article.title) return null;

  const detailPath = `/article/${encodeURIComponent(article.id)}`;

  return (
    <div className="breaking-ticker-ribbon" role="region" aria-label="Breaking dispatch">
      <div className="container breaking-ticker-container">
        <div className="ticker-label">
          <span className="pulse-indicator" />
          <span className="ticker-label-text">Breaking Wire</span>
        </div>

        <div className="ticker-headline-wrap">
          <Link to={detailPath} state={{ article }} className="ticker-headline">
            <span className="ticker-headline-title">{article.title}</span>
            <span className="ticker-headline-meta">
              — {article.source?.name} ({formatRelativeTime(article.publishedAt)})
            </span>
          </Link>
        </div>

        <Link to={detailPath} state={{ article }} className="ticker-link" aria-label="Read breaking dispatch">
          <span>Read Story</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
