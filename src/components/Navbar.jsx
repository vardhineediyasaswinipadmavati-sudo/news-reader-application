import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Bookmark,
  Menu,
  X,
  Globe2,
  Compass,
  Search,
} from 'lucide-react';
import { getMastheadDate } from '../utils/dateFormatter';
import { useBookmarks } from '../context/BookmarksContext';
import { CATEGORIES } from '../services/apiConfig';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import CategoryNav from './CategoryNav';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookmarkCount } = useBookmarks();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Close mobile drawer and search on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // Lock body scroll and handle Escape key when drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="site-header">
      {/* 1. Top Compact Meta Bar (Desktop & Tablet) */}
      <div className="top-meta-bar">
        <div className="container top-meta-container">
          {/* Left: Single Date & Global Edition Indicator */}
          <div className="top-meta-left">
            <span className="top-meta-date">{getMastheadDate()}</span>
            <span className="top-meta-edition">
              <Globe2 size={12} /> Global Edition
            </span>
          </div>

          {/* Right: Search, Bookmarks, Theme Toggle */}
          <div className="top-meta-right">
            {/* Desktop Integrated Search Bar (Single instance) */}
            <div className="masthead-search-wrap">
              <SearchBar placeholder="Search news..." />
            </div>

            {/* Bookmarks (Single instance) */}
            <Link
              to="/bookmarks"
              className="btn-icon bookmark-btn-badge"
              aria-label={`View bookmarks (${bookmarkCount})`}
              title="Saved Articles"
            >
              <Bookmark size={16} />
              {bookmarkCount > 0 && <span className="badge-count">{bookmarkCount}</span>}
            </Link>

            {/* Theme Toggle (Single instance) */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 2. Main Editorial Masthead (Single instance) */}
      <div className="masthead">
        <div className="container masthead-inner">
          {/* Mobile Menu Button (Visible on mobile only) */}
          <div className="mobile-menu-btn">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              title="Menu"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Centered Brand Title */}
          <div className="masthead-center">
            <Link to="/" className="brand-title">
              NEWS<span>LY</span>
            </Link>
            <div className="brand-subtitle">The Premier Digital Newsroom</div>
          </div>

          {/* Mobile Right Actions (Search & Bookmarks on mobile only) */}
          <div className="mobile-right-actions">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="btn-icon"
              aria-label="Toggle mobile search"
              title="Search"
            >
              <Search size={18} />
            </button>
            <Link
              to="/bookmarks"
              className="btn-icon bookmark-btn-badge"
              aria-label={`Bookmarks (${bookmarkCount})`}
              title="Saved Articles"
            >
              <Bookmark size={18} />
              {bookmarkCount > 0 && <span className="badge-count">{bookmarkCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Expandable Search Dropdown (Mobile only when toggled) */}
      {searchOpen && (
        <div className="mobile-search-dropdown container animate-fade-in">
          <SearchBar
            autoFocus
            placeholder="Search headlines, topics..."
            onSearchSubmit={(q) => {
              setSearchOpen(false);
              navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
          />
        </div>
      )}

      {/* 3. Horizontal Category Navigation Bar */}
      <CategoryNav />

      {/* 4. Mobile Drawer Menu - STRICTLY ONLY MOUNTED ON MOBILE WHEN OPEN */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer open"
          onClick={closeMobileMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div>
                <span className="brand-title" style={{ fontSize: '1.45rem' }}>
                  NEWS<span>LY</span>
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {getMastheadDate()}
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={closeMobileMenu}
                aria-label="Close navigation drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Drawer Search */}
            <div style={{ marginBottom: '1.25rem' }}>
              <SearchBar
                placeholder="Search stories, topics..."
                onSearchSubmit={(query) => {
                  closeMobileMenu();
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                }}
              />
            </div>

            {/* Mobile Category Navigation Links */}
            <div className="mobile-drawer-links">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span>Top Headlines</span>
                <Compass size={15} />
              </NavLink>

              {CATEGORIES.map((cat) => (
                <NavLink
                  key={cat.id}
                  to={`/category/${cat.id}`}
                  className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>{cat.label}</span>
                </NavLink>
              ))}

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0.5rem 0' }} />

              <NavLink
                to="/bookmarks"
                className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bookmark size={15} /> Saved Stories
                </span>
                {bookmarkCount > 0 && <span className="badge-count" style={{ position: 'static' }}>{bookmarkCount}</span>}
              </NavLink>
            </div>

            {/* Drawer Footer Theme Toggle */}
            <div className="mobile-drawer-footer">
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Theme Appearance
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
