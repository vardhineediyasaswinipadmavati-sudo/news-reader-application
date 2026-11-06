import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BookmarksContext = createContext(null);
const STORAGE_KEY = 'newsly_bookmarks';

export function BookmarksProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch {
      // ignore storage quota errors
    }
  }, [bookmarks]);

  const isBookmarked = useCallback(
    (articleId) => {
      if (!articleId) return false;
      return bookmarks.some((item) => String(item.id) === String(articleId));
    },
    [bookmarks]
  );

  const addBookmark = useCallback((article) => {
    if (!article || !article.id) return;
    setBookmarks((prev) => {
      if (prev.some((item) => String(item.id) === String(article.id))) {
        return prev;
      }
      return [{ ...article, bookmarkedAt: new Date().toISOString() }, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((articleId) => {
    if (!articleId) return;
    setBookmarks((prev) => prev.filter((item) => String(item.id) !== String(articleId)));
  }, []);

  const toggleBookmark = useCallback(
    (article) => {
      if (!article || !article.id) return false;
      if (isBookmarked(article.id)) {
        removeBookmark(article.id);
        return false;
      } else {
        addBookmark(article);
        return true;
      }
    },
    [isBookmarked, addBookmark, removeBookmark]
  );

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        bookmarkCount: bookmarks.length,
        isBookmarked,
        addBookmark,
        removeBookmark,
        toggleBookmark,
        clearBookmarks,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (!context) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
