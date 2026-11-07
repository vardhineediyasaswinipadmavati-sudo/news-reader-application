import React from 'react';
import {
  Sun,
  Moon,
  Trash2,
  Shield,
  Palette,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarksContext';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { bookmarks, clearBookmarks } = useBookmarks();
  const { addToast } = useToast();

  React.useEffect(() => {
    document.title = 'Reading Preferences — NEWSLY';
  }, []);

  const handleClearAllStorage = () => {
    if (window.confirm('Are you sure you want to clear your saved reading list?')) {
      clearBookmarks();
      addToast('Reading list cleared', 'info');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '760px', paddingBottom: '4rem' }}>
      <div className="section-header" style={{ marginBottom: '2rem' }}>
        <div>
          <span className="category-tag">Preferences</span>
          <h1 className="section-title">
            <Palette size={20} color="var(--accent)" /> Reading Preferences
          </h1>
        </div>
      </div>

      {/* 1. Theme Selection */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 className="editorial-headline" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Editorial Appearance
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Choose between traditional morning parchment (Light) or midnight ink (Dark) for optimal reading comfort.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              Current Theme: {theme === 'dark' ? 'Midnight Ink (Dark Edition)' : 'Morning Parchment (Light Edition)'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Your preference is automatically remembered on this device
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} /> Switch to Light
              </>
            ) : (
              <>
                <Moon size={15} /> Switch to Dark
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Reading List Management */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 className="editorial-headline" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Reading List & Saved Stories
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Manage articles saved to your personal reading list.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Saved Articles: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{bookmarks.length}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Articles remain available across your browser sessions
            </div>
          </div>

          {bookmarks.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllStorage}
              className="btn btn-outline"
              style={{ color: 'var(--accent)', borderColor: 'var(--border-color)', fontSize: '0.8125rem' }}
            >
              <Trash2 size={14} /> Clear Reading List
            </button>
          )}
        </div>
      </div>

      {/* 3. Reader Privacy & Storage */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={18} color="var(--accent)" />
          <h2 className="editorial-headline" style={{ fontSize: '1.25rem' }}>
            Reader Privacy
          </h2>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          NEWSLY does not require accounts, passwords, or personal tracking. Your reading list, theme selection, and dispatches are stored strictly inside your browser's private local storage.
        </p>
      </div>
    </div>
  );
}
