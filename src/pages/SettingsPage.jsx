import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Key,
  ExternalLink,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useApiKey } from '../context/ApiKeyContext';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarksContext';
import { PROVIDERS } from '../services/apiConfig';
import { clearApiCache } from '../services/newsApi';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { apiKey, provider, setApiKey, setProvider, getApiKeyForProvider } = useApiKey();
  const { theme, toggleTheme } = useTheme();
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { addToast } = useToast();

  const [selectedProvider, setSelectedProvider] = useState(provider || 'gnews');
  const [inputKey, setInputKey] = useState(() => {
    return (getApiKeyForProvider ? getApiKeyForProvider(provider || 'gnews') : apiKey) || '';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    document.title = 'Settings & API Configuration — NEWSLY';
  }, []);

  const handleSaveApi = (e) => {
    e.preventDefault();
    setProvider(selectedProvider);
    setApiKey(inputKey.trim(), selectedProvider);
    setSavedSuccess(true);
    addToast('API configuration updated successfully', 'success');
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearCache = () => {
    clearApiCache();
    addToast('In-memory news cache cleared', 'info');
  };

  const handleClearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear your saved bookmarks and local preferences?')) {
      clearBookmarks();
      addToast('Bookmarks cleared', 'info');
    }
  };

  const activeProvider = PROVIDERS[selectedProvider] || PROVIDERS.gnews;

  return (
    <div className="container" style={{ paddingTop: '1.75rem', maxWidth: '800px' }}>
      <div className="section-header">
        <div>
          <span className="category-tag">Preferences</span>
          <h1 className="section-title">
            <SlidersHorizontal size={22} color="var(--accent)" /> Newsroom Settings
          </h1>
        </div>
      </div>

      {/* 1. API Credentials Card */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <Key size={18} color="var(--accent)" />
          <h2 className="editorial-headline" style={{ fontSize: '1.25rem' }}>REST API Configuration</h2>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          NEWSLY connects to authentic news APIs. You can provide an API key here (persisted in LocalStorage) or configure <code>VITE_NEWS_API_KEY</code> in your local <code>.env</code> file.
        </p>

        <form onSubmit={handleSaveApi}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="settings-provider" className="form-label">
              API Provider
            </label>
            <select
              id="settings-provider"
              className="form-select"
              value={selectedProvider}
              onChange={(e) => {
                const nextP = e.target.value;
                setSelectedProvider(nextP);
                const existingKey = getApiKeyForProvider ? getApiKeyForProvider(nextP) : '';
                setInputKey(existingKey || '');
              }}
            >
              <option value="gnews">GNews.io (Global & Regional Headlines)</option>
              <option value="guardian">The Guardian Open Platform</option>
              <option value="newsdata">NewsData.io</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="settings-key" className="form-label">
              {activeProvider.name} Key
            </label>
            <input
              id="settings-key"
              type="text"
              className="form-input"
              placeholder="Enter your API key..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
            />
          </div>

          <div className="info-box" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Need a key?</strong>
              <a
                href={activeProvider.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontWeight: 600 }}
              >
                Sign up at {activeProvider.name} <ExternalLink size={12} />
              </a>
            </div>
            <p>Free tier allows {activeProvider.freeLimit}. Register at the link above to generate your instant personal API key.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="submit" className="btn btn-accent">
              {savedSuccess ? <><Check size={16} /> Saved</> : 'Update API Credentials'}
            </button>
            <button type="button" onClick={handleClearCache} className="btn btn-outline">
              <RotateCcw size={14} /> Clear Cache
            </button>
          </div>
        </form>
      </div>

      {/* 2. Visual Theme & Reading Experience */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 className="editorial-headline" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Editorial Appearance
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Choose between traditional morning parchment (Light) or midnight ink (Dark).
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
              Current Theme: {theme === 'dark' ? 'Midnight Ink (Dark)' : 'Morning Edition (Light)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Automatically preserved across browser reloads
            </div>
          </div>
          <button type="button" onClick={toggleTheme} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {theme === 'dark' ? <><Sun size={15} /> Switch to Light</> : <><Moon size={15} /> Switch to Dark</>}
          </button>
        </div>
      </div>

      {/* 3. Storage & Privacy */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', marginBottom: '2.5rem' }}>
        <h2 className="editorial-headline" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Data & Local Storage
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          NEWSLY does not require accounts or passwords. All bookmarks and theme selections reside strictly within your client browser.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Saved Bookmarks: </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 700 }}>{bookmarks.length} articles</span>
          </div>

          <button
            type="button"
            onClick={handleClearAllStorage}
            className="btn btn-outline"
            style={{ color: 'var(--accent)', borderColor: 'var(--border-color)', fontSize: '0.75rem' }}
          >
            <Trash2 size={13} /> Reset Bookmarks
          </button>
        </div>
      </div>
    </div>
  );
}
