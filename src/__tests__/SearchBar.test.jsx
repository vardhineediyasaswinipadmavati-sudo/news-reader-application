import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  it('updates text input and clears with clear button', () => {
    render(
      <BrowserRouter>
        <SearchBar placeholder="Search test..." />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('Search test...');
    expect(input.value).toBe('');

    fireEvent.change(input, { target: { value: 'Artificial Intelligence' } });
    expect(input.value).toBe('Artificial Intelligence');

    const clearBtn = screen.getByLabelText('Clear search text');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(input.value).toBe('');
  });

  it('triggers onSearchSubmit callback when submitted', () => {
    const handleSearch = vi.fn();
    render(
      <BrowserRouter>
        <SearchBar onSearchSubmit={handleSearch} />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'Global Climate' } });
    fireEvent.submit(input.closest('form'));

    expect(handleSearch).toHaveBeenCalledWith('Global Climate');
  });

  it('displays autocomplete suggestions dynamically as user types', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'artificial int' } });

    // Suggestions listbox should appear
    const listbox = screen.getByRole('listbox', { name: /Search suggestions/i });
    expect(listbox).toBeInTheDocument();

    // Should include 5-6 suggestions including the user-specified items
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence in India')).toBeInTheDocument();
    expect(screen.getByText('Generative AI')).toBeInTheDocument();
    expect(screen.getByText('AI Technology')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('navigates and executes search when a suggestion is clicked', () => {
    const handleSearch = vi.fn();
    render(
      <BrowserRouter>
        <SearchBar onSearchSubmit={handleSearch} />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'goog' } });

    const suggestion = screen.getByText('Google Cloud Computing');
    expect(suggestion).toBeInTheDocument();

    fireEvent.click(suggestion);

    expect(handleSearch).toHaveBeenCalledWith('Google Cloud Computing');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports keyboard navigation with Arrow Down, Arrow Up, and Enter', () => {
    const handleSearch = vi.fn();
    render(
      <BrowserRouter>
        <SearchBar onSearchSubmit={handleSearch} />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'crick' } });

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(5);

    // Press ArrowDown to highlight first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Press ArrowDown to highlight second suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    // Press ArrowUp to return to first suggestion
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Press Enter to select the active suggestion
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSearch).toHaveBeenCalledWith('Cricket World Cup');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes suggestions when Escape key is pressed', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'andr' } });

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes suggestions when clicking outside', () => {
    render(
      <BrowserRouter>
        <div>
          <span data-testid="outside-element">Outside</span>
          <SearchBar />
        </div>
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'tesla' } });

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside-element'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('hides suggestion dropdown when query has no relevant matches', () => {
    render(
      <BrowserRouter>
        <SearchBar />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'xyzqwe123gibberish' } });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('submits raw query if Enter is pressed without an active suggestion selected', () => {
    const handleSearch = vi.fn();
    render(
      <BrowserRouter>
        <SearchBar onSearchSubmit={handleSearch} />
      </BrowserRouter>
    );

    const input = screen.getByLabelText('Search articles');
    fireEvent.change(input, { target: { value: 'quantum computing research' } });

    // Press Enter directly without ArrowDown
    fireEvent.submit(input.closest('form'));

    expect(handleSearch).toHaveBeenCalledWith('quantum computing research');
  });
});
