'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  const applyThemeToDOM = useCallback((t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (body) {
        body.classList.add('dark');
        body.classList.remove('light');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      if (body) {
        body.classList.remove('dark');
        body.classList.add('light');
      }
    }
  }, []);

  // Initialize theme from localStorage or document class on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('rentbd_theme') as Theme | null;
      let initialTheme: Theme = 'dark';
      if (stored === 'light' || stored === 'dark') {
        initialTheme = stored;
      } else if (document.documentElement.classList.contains('light')) {
        initialTheme = 'light';
      }
      setThemeState(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch {
      applyThemeToDOM('dark');
    }
  }, [applyThemeToDOM]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem('rentbd_theme', newTheme);
      } catch {}
      applyThemeToDOM(newTheme);
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const nextTheme: Theme = prevTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('rentbd_theme', nextTheme);
      } catch {}
      applyThemeToDOM(nextTheme);
      return nextTheme;
    });
  }, [applyThemeToDOM]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
