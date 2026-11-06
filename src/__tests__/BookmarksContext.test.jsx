import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { BookmarksProvider, useBookmarks } from '../context/BookmarksContext';

const mockArticle = {
  id: 'test-article-1',
  title: 'Quantum Computing Breakthrough',
  description: 'Scientists achieve major milestone in coherence time.',
  url: 'https://example.com/quantum',
  source: { name: 'Tech Journal' },
  publishedAt: '2026-11-04T08:00:00Z',
};

function TestBookmarkComponent() {
  const { bookmarks, bookmarkCount, isBookmarked, toggleBookmark, clearBookmarks } = useBookmarks();
  return (
    <div>
      <span data-testid="count">{bookmarkCount}</span>
      <span data-testid="is-bookmarked">{isBookmarked('test-article-1') ? 'yes' : 'no'}</span>
      <button data-testid="toggle-btn" onClick={() => toggleBookmark(mockArticle)}>
        Toggle Bookmark
      </button>
      <button data-testid="clear-btn" onClick={clearBookmarks}>
        Clear
      </button>
      <ul data-testid="list">
        {bookmarks.map((b) => (
          <li key={b.id}>{b.title}</li>
        ))}
      </ul>
    </div>
  );
}

describe('BookmarksContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds and removes articles from bookmarks and syncs with localStorage', () => {
    render(
      <BookmarksProvider>
        <TestBookmarkComponent />
      </BookmarksProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('is-bookmarked').textContent).toBe('no');

    // Add bookmark
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('is-bookmarked').textContent).toBe('yes');
    expect(screen.getByText('Quantum Computing Breakthrough')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('newsly_bookmarks') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('test-article-1');

    // Remove bookmark
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('is-bookmarked').textContent).toBe('no');

    // Clear bookmarks test
    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('1');

    act(() => {
      screen.getByTestId('clear-btn').click();
    });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
