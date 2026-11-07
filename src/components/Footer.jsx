import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: Brand & Editorial Statement */}
          <div>
            <div className="footer-brand-title">
              NEWS<span>LY</span>
            </div>
            <p className="footer-brand-desc">
              NEWSLY is an independent digital newsroom committed to delivering genuine,
              unbiased journalism, insightful analysis, and breaking world reports.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
              <ShieldCheck size={16} color="var(--accent)" />
              <span>Accredited Global News Dispatches</span>
            </div>
          </div>

          {/* Column 2: Quick Sections */}
          <div>
            <h4 className="footer-heading">Top Desks</h4>
            <ul className="footer-links">
              <li><Link to="/category/world">World Affairs</Link></li>
              <li><Link to="/category/india">India Coverage</Link></li>
              <li><Link to="/category/andhra-pradesh">Andhra Pradesh</Link></li>
              <li><Link to="/category/technology">Technology</Link></li>
              <li><Link to="/category/ai">Artificial Intelligence</Link></li>
              <li><Link to="/category/business">Business & Finance</Link></li>
            </ul>
          </div>

          {/* Column 3: More Categories */}
          <div>
            <h4 className="footer-heading">Features</h4>
            <ul className="footer-links">
              <li><Link to="/category/science">Science & Space</Link></li>
              <li><Link to="/category/health">Health & Society</Link></li>
              <li><Link to="/category/sports">Sports</Link></li>
              <li><Link to="/category/entertainment">Entertainment</Link></li>
              <li><Link to="/bookmarks">Reading List</Link></li>
            </ul>
          </div>

          {/* Column 4: Editorial Standards */}
          <div>
            <h4 className="footer-heading">Editorial Integrity</h4>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '1rem' }}>
              NEWSLY adheres to strict factual verification and ethical reporting. All dispatches, images, and headlines represent authentic journalistic coverage curated for global readers.
            </p>
            <Link
              to="/search"
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', borderColor: '#334155', color: '#f8fafc' }}
            >
              Search Newsroom Archive
            </Link>
          </div>
        </div>

        {/* Bottom Rule & Copyright */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} NEWSLY Media. All rights reserved. Built with precision for digital readers.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/">Front Page</Link>
            <span>•</span>
            <Link to="/search">Search</Link>
            <span>•</span>
            <Link to="/bookmarks">Saved Stories</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
