'use client'

import { useTheme } from './ThemeProvider';

export default function BottomThemeToggle() {
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
      case 'blue': return 'Dark Blue';
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

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={handleToggle}
        className="flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border transition-all hover:shadow-xl"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)'
        }}
        title={`Switch to ${getThemeDisplayName(getNextTheme())}`}
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: getThemeColor(themeName) }}
        />
        <div className="text-left">
          <div className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Theme
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {getThemeDisplayName(themeName)}
          </div>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>
    </div>
  );
}
