import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SearchPage from '../pages/SearchPage';
import { ApiKeyProvider } from '../context/ApiKeyContext';
import { BookmarksProvider } from '../context/BookmarksContext';
import { ToastProvider } from '../components/Toast';
import * as newsApi from '../services/newsApi';

function renderSearchPage(initialEntries = ['/search?q=AP%20elections']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ApiKeyProvider>
        <BookmarksProvider>
          <ToastProvider>
            <Routes>
              <Route path="/search" element={<SearchPage />} />
            </Routes>
          </ToastProvider>
        </BookmarksProvider>
      </ApiKeyProvider>
    </MemoryRouter>
  );
}

describe('SearchPage Strict Relevance & Filtering Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('newsly_api_key', 'test-key');
    vi.restoreAllMocks();
  });

  it('renders strictly relevant articles and filters out unrelated wire reports', async () => {
    vi.spyOn(newsApi, 'searchNewsArticles').mockResolvedValueOnce({
      articles: [
        {
          id: 'ap-1',
          title: 'Andhra Pradesh Assembly Elections: Polling underway across 175 constituencies',
          description: 'High voter turnout reported in Amaravati as TDP and YSRCP contest.',
          publishedAt: '2026-11-04T10:00:00Z',
          source: { name: 'The Hindu' },
          url: 'https://thehindu.com/ap-elections',
        },
      ],
      totalResults: 1,
      originalCount: 2,
      filteredCount: 1,
      query: 'AP elections',
      entityType: 'AP_ELECTIONS',
      hasMore: false,
    });

    renderSearchPage(['/search?q=AP%20elections']);

    // Check query title is shown
    expect(screen.getByText(/Search Results for/i)).toBeInTheDocument();

    // Verify the Andhra Pradesh story appears
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Andhra Pradesh Assembly Elections: Polling/i })).toBeInTheDocument();
    });

    // Verify filter badge shows that 1 unrelated article was excluded
    expect(screen.getByText(/Strict relevance filter active/i)).toBeInTheDocument();
    expect(screen.getByText(/excluded 1 unrelated or incidental mentions/i)).toBeInTheDocument();
  });

  it('renders honest empty state when zero articles pass strict relevance', async () => {
    vi.spyOn(newsApi, 'searchNewsArticles').mockResolvedValueOnce({
      articles: [],
      totalResults: 0,
      originalCount: 3,
      filteredCount: 3,
      query: 'Tesla',
      entityType: 'TESLA',
      hasMore: false,
    });

    renderSearchPage(['/search?q=Tesla']);

    await waitFor(() => {
      expect(screen.getByText(/No Relevant Stories Found for "Tesla"/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/No articles were found where Tesla is the primary subject/i)).toBeInTheDocument();
    expect(screen.getByText(/Suggested Alternative Searches:/i)).toBeInTheDocument();
  });

  it('supports Load More pagination when more verified articles exist', async () => {
    const firstPageMock = {
      articles: [
        {
          id: 'ai-1',
          title: 'Frontier AI models demonstrate breakthrough reasoning in scientific benchmarks',
          description: 'Researchers evaluate new neural network architectures across mathematics.',
          publishedAt: '2026-11-04T10:00:00Z',
          source: { name: 'MIT Tech Review' },
        },
      ],
      totalResults: 1,
      originalCount: 1,
      filteredCount: 0,
      query: 'Artificial Intelligence',
      entityType: 'ARTIFICIAL_INTELLIGENCE',
      hasMore: true,
      page: 1,
    };

    const secondPageMock = {
      articles: [
        {
          id: 'ai-2',
          title: 'OpenAI announces next-generation multimodal safety research initiative',
          description: 'The foundation expands benchmark evaluations.',
          publishedAt: '2026-11-04T08:00:00Z',
          source: { name: 'VentureBeat' },
        },
      ],
      totalResults: 1,
      originalCount: 1,
      filteredCount: 0,
      query: 'Artificial Intelligence',
      entityType: 'ARTIFICIAL_INTELLIGENCE',
      hasMore: false,
      page: 2,
    };

    const searchSpy = vi.spyOn(newsApi, 'searchNewsArticles')
      .mockResolvedValueOnce(firstPageMock)
      .mockResolvedValueOnce(secondPageMock);

    renderSearchPage(['/search?q=Artificial%20Intelligence']);

    await waitFor(() => {
      expect(screen.getByText(/Frontier AI models/i)).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /Load More Relevant Stories/i });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText(/OpenAI announces next-generation/i)).toBeInTheDocument();
    });

    expect(searchSpy).toHaveBeenCalledTimes(2);
  });

  it('displays Related Searches section with suggestions and handles click to re-search', async () => {
    vi.spyOn(newsApi, 'searchNewsArticles').mockResolvedValue({
      articles: [
        {
          id: 'ai-1',
          title: 'Frontier AI models demonstrate breakthrough reasoning in scientific benchmarks',
          description: 'Researchers evaluate new neural network architectures across mathematics.',
          publishedAt: '2026-11-04T10:00:00Z',
          source: { name: 'MIT Tech Review' },
        },
      ],
      totalResults: 1,
      originalCount: 1,
      filteredCount: 0,
      query: 'Artificial Intelligence',
      entityType: 'ARTIFICIAL_INTELLIGENCE',
      hasMore: false,
    });

    renderSearchPage(['/search?q=Artificial%20Intelligence']);

    await waitFor(() => {
      expect(screen.getByText(/Frontier AI models/i)).toBeInTheDocument();
    });

    // Check Related Searches section is rendered
    const relatedSection = screen.getByRole('region', { name: /Related Searches/i });
    expect(relatedSection).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Related Searches/i })).toBeInTheDocument();

    // Verify suggestions are rendered as clickable buttons
    const genAiBtn = screen.getByRole('button', { name: /Generative AI Models/i });
    expect(genAiBtn).toBeInTheDocument();

    // Click on suggestion
    fireEvent.click(genAiBtn);

    // Should re-trigger search with the clicked topic
    await waitFor(() => {
      expect(newsApi.searchNewsArticles).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Generative AI Models' })
      );
    });
  });

  it('hides Related Searches section when query is unrecognized or gibberish', async () => {
    vi.spyOn(newsApi, 'searchNewsArticles').mockResolvedValueOnce({
      articles: [],
      totalResults: 0,
      originalCount: 0,
      filteredCount: 0,
      query: 'xyzqwe123gibberish',
      entityType: 'GENERIC',
      hasMore: false,
    });

    renderSearchPage(['/search?q=xyzqwe123gibberish']);

    await waitFor(() => {
      expect(screen.getByText(/No Relevant Stories Found/i)).toBeInTheDocument();
    });

    // Related searches section should be completely absent
    expect(screen.queryByRole('region', { name: /Related Searches/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Related Searches/i })).not.toBeInTheDocument();
  });
});
