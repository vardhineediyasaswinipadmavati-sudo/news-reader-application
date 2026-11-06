import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import { BookmarksProvider } from '../context/BookmarksContext';
import { ToastProvider } from '../components/Toast';

const testArticle = {
  id: 'art-101',
  title: 'Next Generation Renewable Energy Breakthrough',
  description: 'Solar efficiency reaches record highs using perovskite tandem cells.',
  category: 'Science',
  url: 'https://example.com/solar',
  imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276',
  source: { name: 'Clean Energy Wire' },
  publishedAt: new Date().toISOString(),
};

describe('NewsCard Component', () => {
  it('renders article headline, description, category, and source', () => {
    render(
      <BrowserRouter>
        <BookmarksProvider>
          <ToastProvider>
            <NewsCard article={testArticle} />
          </ToastProvider>
        </BookmarksProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Next Generation Renewable Energy Breakthrough')).toBeInTheDocument();
    expect(screen.getByText(/Solar efficiency reaches record highs/)).toBeInTheDocument();
    expect(screen.getByText('Clean Energy Wire')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });
});
