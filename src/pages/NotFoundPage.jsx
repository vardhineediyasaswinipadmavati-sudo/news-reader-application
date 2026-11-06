import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — NEWSLY';
  }, []);

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
      <div className="state-container" style={{ maxWidth: '540px' }}>
        <div className="state-icon-wrap empty">
          <Compass size={36} />
        </div>
        <span className="category-tag" style={{ marginBottom: '0.5rem' }}>Error 404</span>
        <h1 className="editorial-headline" style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>
          Section Not Found
        </h1>
        <p className="state-desc">
          The dispatch or news section you are searching for does not exist or has been relocated in our archive.
        </p>

        <div className="state-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={15} /> Return to Front Page
          </Link>
          <Link to="/bookmarks" className="btn btn-outline">
            Reading List
          </Link>
        </div>
      </div>
    </div>
  );
}
