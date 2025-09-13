'use client'

import { useTheme } from './ThemeProvider';

export default function ColorTester() {
  const { currentTheme, themeName, setTheme, availableThemes } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-lg border p-4 min-w-[200px]"
        style={{ 
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        <h3 className="font-semibold mb-3 text-sm">Color Theme Tester</h3>
        
        <div className="space-y-2">
          {availableThemes.map((theme) => (
            <button
              key={theme}
              onClick={() => setTheme(theme)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                themeName === theme 
                  ? 'font-medium' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: themeName === theme 
                  ? 'var(--color-primary)' 
                  : 'transparent',
                color: themeName === theme 
                  ? 'white' 
                  : 'var(--color-text-secondary)'
              }}
            >
              {theme === 'default' ? 'Default Blue' :
               theme === 'mutedGreen' ? 'Muted Green & Teal' :
               theme === 'warmOrange' ? 'Warm Orange & Brown' :
               theme === 'deepBlue' ? 'Deep Blue & Purple' :
               theme === 'softYellow' ? 'Soft Yellow & Cream' : theme}
            </button>
          ))}
        </div>
        
        {/* Color Palette Preview */}
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Current Palette:
          </p>
          <div className="flex space-x-1">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--color-primary)' }}
              title="Primary"
            />
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--color-secondary)' }}
              title="Secondary"
            />
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: 'var(--color-accent)' }}
              title="Accent"
            />
            <div 
              className="w-4 h-4 rounded border"
              style={{ 
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)'
              }}
              title="Background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
