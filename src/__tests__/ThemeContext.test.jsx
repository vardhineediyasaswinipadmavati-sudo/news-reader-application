import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function TestComponent() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('provides default theme and toggles between light and dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('current-theme');
    const toggleBtn = screen.getByTestId('toggle-btn');

    expect(themeDisplay.textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    act(() => {
      toggleBtn.click();
    });

    expect(themeDisplay.textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('newsly_theme')).toBe('dark');

    act(() => {
      toggleBtn.click();
    });

    expect(themeDisplay.textContent).toBe('light');
    expect(localStorage.getItem('newsly_theme')).toBe('light');
  });
});
