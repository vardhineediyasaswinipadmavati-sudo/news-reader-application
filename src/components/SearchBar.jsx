import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  placeholder = 'Search headlines, topics, or sources...',
  autoFocus = false,
  className = '',
  onSearchSubmit,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={`search-bar-form ${className}`} role="search">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={17} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autoFocus}
          aria-label="Search articles"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-btn"
            aria-label="Clear search text"
            title="Clear"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </form>
  );
}
