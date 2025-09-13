'use client'

import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { themeName, setTheme, availableThemes } = useTheme();

  const getNextTheme = () => {
    const currentIndex = availableThemes.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    return availableThemes[nextIndex];
  };

  const handleToggle = () => {
    setTheme(getNextTheme());
  };

  const getThemeDisplayName = (theme: string) => {
    switch (theme) {
      case 'blue': return 'Grey Blue';
      case 'green': return 'Sage Green';
      case 'orange': return 'Muted Orange';
      default: return theme;
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'blue': return 'rgb(71, 85, 105)';
      case 'green': return 'rgb(132, 148, 132)';
      case 'orange': return 'rgb(180, 130, 90)';
      default: return 'var(--color-primary)';
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)'
        }}
        title={`Switch to ${getThemeDisplayName(getNextTheme())}`}
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: getThemeColor(themeName) }}
        />
        {!compact && (
          <span className="text-sm font-medium">
            {getThemeDisplayName(themeName)}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <h4 
        className="text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Theme
      </h4>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors border"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)'
        }}
      >
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getThemeColor(themeName) }}
          />
          <span className="text-sm">
            {getThemeDisplayName(themeName)}
          </span>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>
    </div>
  );
}
