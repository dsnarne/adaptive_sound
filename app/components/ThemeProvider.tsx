'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ColorScheme, colorSchemes } from '../themes/colorSchemes';

interface ThemeContextType {
  currentTheme: ColorScheme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState('green');
  const currentTheme = colorSchemes[themeName];
  const availableThemes = Object.keys(colorSchemes);

  const setTheme = (newThemeName: string) => {
    if (colorSchemes[newThemeName]) {
      setThemeName(newThemeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, themeName, setTheme, availableThemes }}>
      <div
        style={{
          '--color-primary': currentTheme.primary,
          '--color-secondary': currentTheme.secondary,
          '--color-accent': currentTheme.accent,
          '--color-background': currentTheme.background,
          '--color-surface': currentTheme.surface,
          '--color-text-primary': currentTheme.text.primary,
          '--color-text-secondary': currentTheme.text.secondary,
          '--color-text-muted': currentTheme.text.muted,
          '--color-border': currentTheme.border,
          '--color-hover': currentTheme.hover,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
