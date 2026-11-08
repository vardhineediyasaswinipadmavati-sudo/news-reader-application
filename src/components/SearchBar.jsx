import React, { useState, useEffect, useRef, useId } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, ArrowUpRight } from 'lucide-react';
import { getSearchAutocomplete } from '../utils/searchRelevance';

export default function SearchBar({
  placeholder = 'Search headlines, topics, or sources...',
  autoFocus = false,
  className = '',
  onSearchSubmit,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
    }
  }, [searchParams]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const executeSearch = (targetQuery) => {
    const trimmed = targetQuery.trim();
    if (!trimmed) return;

    setIsOpen(false);
    setActiveIndex(-1);

    if (onSearchSubmit) {
      onSearchSubmit(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      executeSearch(suggestions[activeIndex]);
    } else {
      executeSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIndex(-1);

    if (val.trim().length >= 2) {
      const results = getSearchAutocomplete(val.trim());
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length >= 2) {
      const results = getSearchAutocomplete(query.trim());
      setSuggestions(results);
      if (results.length > 0) {
        setIsOpen(true);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && query.trim().length >= 2) {
        const results = getSearchAutocomplete(query.trim());
        if (results.length > 0) {
          e.preventDefault();
          setSuggestions(results);
          setIsOpen(true);
          setActiveIndex(0);
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        executeSearch(suggestions[activeIndex]);
      }
    }
  };

  const handleSuggestionClick = (item) => {
    setQuery(item);
    executeSearch(item);
  };

  return (
    <form
      ref={containerRef}
      onSubmit={handleSubmit}
      className={`search-bar-form ${className}`}
      role="search"
    >
      <div className="search-input-wrapper">
        <Search className="search-icon" size={17} />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          aria-label="Search articles"
          aria-autocomplete="list"
          aria-expanded={Boolean(isOpen && suggestions.length > 0)}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
          }
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

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="search-autocomplete-dropdown"
          aria-label="Search suggestions"
        >
          {suggestions.map((item, index) => {
            const isSelected = index === activeIndex;
            return (
              <li
                key={item}
                id={`${listboxId}-item-${index}`}
                role="option"
                aria-selected={isSelected}
                className={`search-autocomplete-item ${isSelected ? 'active' : ''}`}
                onMouseDown={(e) => {
                  // Prevent input blur before click registers
                  e.preventDefault();
                }}
                onClick={() => handleSuggestionClick(item)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <Search size={14} className="search-autocomplete-icon" />
                <span className="search-autocomplete-text">{item}</span>
                <ArrowUpRight size={13} className="search-autocomplete-arrow" />
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
