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
});
