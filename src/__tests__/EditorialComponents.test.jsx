import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import BreakingTicker from '../components/BreakingTicker';
import LatestNewsRail from '../components/LatestNewsRail';
import EditorialGrid from '../components/EditorialGrid';
import ApiConfigHero from '../components/ApiConfigHero';
import { ApiKeyProvider } from '../context/ApiKeyContext';
import { BookmarksProvider } from '../context/BookmarksContext';
import { ToastProvider } from '../components/Toast';

const mockArticle = {
  id: 'ticker-1',
  title: 'Global Climate Accord Reached in Geneva',
  source: { name: 'Reuters' },
  publishedAt: new Date().toISOString(),
};

const mockArticles = [
  mockArticle,
  {
    id: 'rail-2',
    title: 'Semiconductor Fab Begins Commercial Operation',
    source: { name: 'Financial Times' },
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe('Editorial News Components', () => {
  it('renders BreakingTicker with live headline and source', () => {
    render(
      <BrowserRouter>
        <BreakingTicker article={mockArticle} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Breaking Wire/i)).toBeInTheDocument();
    expect(screen.getByText(/Global Climate Accord Reached in Geneva/i)).toBeInTheDocument();
    expect(screen.getByText(/Reuters/i)).toBeInTheDocument();
  });

  it('renders LatestNewsRail with articles list', () => {
    render(
      <BrowserRouter>
        <ApiKeyProvider>
          <LatestNewsRail initialArticles={mockArticles} />
        </ApiKeyProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Latest News Wire/i)).toBeInTheDocument();
    expect(screen.getByText(/Semiconductor Fab Begins Commercial Operation/i)).toBeInTheDocument();
  });

  it('renders ApiConfigHero with supported provider options and instant mode', () => {
    const handleConfigured = vi.fn();
    render(
      <ApiKeyProvider>
        <ToastProvider>
          <ApiConfigHero onConfigured={handleConfigured} />
        </ToastProvider>
      </ApiKeyProvider>
    );

    expect(screen.getByText(/Connect Your Real-Time News Feed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/GNews API/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/The Guardian Open Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/NewsData.io/i)).toBeInTheDocument();

    const registerLink = screen.getByText(/Register Free Key/i);
    expect(registerLink).toBeInTheDocument();
  });

  it('renders a single article in a balanced single-story-wrapper without stretching', () => {
    const { container } = render(
      <BrowserRouter>
        <BookmarksProvider>
          <ToastProvider>
            <EditorialGrid articles={[mockArticle]} />
          </ToastProvider>
        </BookmarksProvider>
      </BrowserRouter>
    );

    const singleWrapper = container.querySelector('.single-story-wrapper');
    expect(singleWrapper).toBeInTheDocument();
    expect(singleWrapper).toHaveStyle({ maxWidth: '680px' });
  });
});
