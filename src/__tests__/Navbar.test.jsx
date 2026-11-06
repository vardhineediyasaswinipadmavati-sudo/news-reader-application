import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ApiKeyProvider } from '../context/ApiKeyContext';
import { BookmarksProvider } from '../context/BookmarksContext';
import { ThemeProvider } from '../context/ThemeContext';

function renderNavbar() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <ApiKeyProvider>
          <BookmarksProvider>
            <Navbar />
          </BookmarksProvider>
        </ApiKeyProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Navbar Layout & Single Control Enforcement', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders exactly one brand masthead title on normal load', () => {
    renderNavbar();
    const brandTitles = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'a' && element.classList.contains('brand-title');
    });
    expect(brandTitles).toHaveLength(1);
  });

  it('renders exactly one theme toggle button on normal load', () => {
    renderNavbar();
    const themeButtons = screen.getAllByRole('button', { name: /switch to (light|dark) mode/i });
    expect(themeButtons).toHaveLength(1);
  });

  it('renders exactly one desktop search input on normal load', () => {
    renderNavbar();
    const searchInputs = screen.getAllByRole('textbox', { name: /search articles/i });
    expect(searchInputs).toHaveLength(1);
  });

  it('renders horizontal category navigation with All News and categories', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /all news/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /world/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /technology/i })).toBeInTheDocument();
  });

  it('does NOT render mobile drawer in normal desktop state', () => {
    renderNavbar();
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();
  });

  it('opens and closes mobile drawer on user interaction', async () => {
    renderNavbar();

    // 1. Initially drawer is not in DOM
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    // 2. Click mobile menu button
    const menuBtn = screen.getByRole('button', { name: /open mobile navigation menu/i });
    fireEvent.click(menuBtn);

    // 3. Drawer is now open
    const drawer = screen.getByRole('dialog', { name: /navigation drawer/i });
    expect(drawer).toBeInTheDocument();

    // 4. Click Close button in drawer
    const closeBtn = screen.getByRole('button', { name: /close navigation drawer/i });
    fireEvent.click(closeBtn);

    // 5. Drawer is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();
    });
  });

  it('closes mobile drawer when a category link inside it is clicked', async () => {
    renderNavbar();

    // Open drawer
    const menuBtn = screen.getByRole('button', { name: /open mobile navigation menu/i });
    fireEvent.click(menuBtn);

    const drawer = screen.getByRole('dialog', { name: /navigation drawer/i });
    expect(drawer).toBeInTheDocument();

    // Click Top Headlines link inside drawer
    const topHeadlinesLink = screen.getByRole('link', { name: /top headlines/i });
    fireEvent.click(topHeadlinesLink);

    // Drawer closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();
    });
  });
});
