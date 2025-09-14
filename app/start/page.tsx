'use client'

import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'

function ThemeButton() {
  const { themeName, setTheme } = useTheme()

  const handleToggle = () => {
    setTheme(themeName === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={handleToggle}
      className="w-10 h-10 rounded-full border-2 transition-all hover:scale-105 flex items-center justify-center"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      title={`Switch to ${themeName === 'dark' ? 'light' : 'dark'} mode`}
    >
      {themeName === 'dark' ? (
        // Sun icon for light mode
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-text-primary)' }}>
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        // Moon icon for dark mode
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-text-primary)' }}>
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  )
}

export default function StartPage() {
  const router = useRouter()

  const handleStartClick = () => {
    router.push('/settings')
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Theme button positioned at top right of screen */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeButton />
        </div>
        
        <div className="text-center space-y-8">
          <h1 
            className="text-6xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tuneshift
          </h1>
          
          <p 
            className="text-xl font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            browse it. feel it. hear it.
          </p>
          
          <button
            onClick={handleStartClick}
            className="px-8 py-4 rounded-lg font-medium transition-colors text-lg text-white hover:opacity-90"
            style={{ 
              backgroundColor: 'var(--color-primary)',
            }}
          >
            Start Screen Capture
          </button>
        </div>
      </div>
    </ThemeProvider>
  )
}
