import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { ThemeProvider } from '../context/ThemeContext';
import { BookmarksProvider } from '../context/BookmarksContext';
import { ApiKeyProvider } from '../context/ApiKeyContext';
import { ToastProvider } from '../components/Toast';

async function renderAppWithRoute(initialRoute = '/') {
  let result;
  await act(async () => {
    result = render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ThemeProvider>
          <ApiKeyProvider>
            <BookmarksProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </BookmarksProvider>
          </ApiKeyProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  });
  return result;
}

describe('Full Route Verification', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders HomePage on / with brand title and masthead', async () => {
    await renderAppWithRoute('/');
    expect(screen.getAllByText(/NEWS/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Connect Your Real-Time News Feed/i)).toBeInTheDocument();
  });

  it('renders CategoryPage on /category/technology', async () => {
    await renderAppWithRoute('/category/technology');
    expect(screen.getByRole('heading', { name: 'Technology' })).toBeInTheDocument();
    expect(screen.getByText(/Breakthroughs in hardware, software/i)).toBeInTheDocument();
  });

  it('renders CategoryPage on /category/ai', async () => {
    await renderAppWithRoute('/category/ai');
    expect(screen.getByRole('heading', { name: 'Artificial Intelligence' })).toBeInTheDocument();
  });

  it('renders CategoryPage on /category/india', async () => {
    await renderAppWithRoute('/category/india');
    expect(screen.getByRole('heading', { name: 'India' })).toBeInTheDocument();
  });

  it('renders SearchPage on /search', async () => {
    await renderAppWithRoute('/search');
    expect(screen.getByText(/Newsroom Archive & Live Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Your Search/i)).toBeInTheDocument();
  });

  it('renders BookmarksPage on /bookmarks with empty state initially', async () => {
    await renderAppWithRoute('/bookmarks');
    expect(screen.getByText(/Saved Stories & Reading List/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Reading List is Empty/i)).toBeInTheDocument();
  });

  it('renders SettingsPage on /settings with API configuration options', async () => {
    await renderAppWithRoute('/settings');
    expect(screen.getByText(/Newsroom Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/REST API Configuration/i)).toBeInTheDocument();
  });

  it('renders NotFoundPage on unknown route /unknown-route-test', async () => {
    await renderAppWithRoute('/unknown-route-test');
    expect(screen.getByText(/Section Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Error 404/i)).toBeInTheDocument();
  });
});

