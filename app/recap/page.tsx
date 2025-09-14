'use client'

import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'

function ThemeButton() {
  const { themeName, setTheme, availableThemes } = useTheme()

  const getNextTheme = () => {
    const currentIndex = availableThemes.indexOf(themeName)
    const nextIndex = (currentIndex + 1) % availableThemes.length
    return availableThemes[nextIndex]
  }

  const handleToggle = () => {
    setTheme(getNextTheme())
  }

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'blue': return 'rgb(71, 85, 105)'
      case 'green': return 'rgb(132, 148, 132)'
      case 'orange': return 'rgb(180, 130, 90)'
      default: return 'var(--color-primary)'
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="w-10 h-10 rounded-full border-2 transition-all hover:scale-105"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      title={`Switch theme`}
    >
      <div
        className="w-5 h-5 rounded-full mx-auto"
        style={{ backgroundColor: getThemeColor(themeName) }}
      />
    </button>
  )
}

export default function RecapPage() {
  const router = useRouter()

  const handleStartNewSession = () => {
    router.push('/start')
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Theme button positioned at top right of screen */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeButton />
        </div>
        
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center space-y-8">
            <h1 
              className="text-5xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Session Recap
            </h1>
            
            {/* Session Stats */}
            <div 
              className="rounded-lg shadow-sm border p-8"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <h2 
                className="text-2xl font-semibold mb-6 text-center"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Session Statistics
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Time Used */}
                <div 
                  className="text-center p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    24:35
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Time Used
                  </div>
                </div>
                
                {/* Songs Listened */}
                <div 
                  className="text-center p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    7
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Songs Listened
                  </div>
                </div>
                
                {/* Most Frequent Mood */}
                <div 
                  className="text-center p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Focused
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Most Frequent Mood
                  </div>
                </div>
                
                {/* Number of Moods */}
                <div 
                  className="text-center p-6 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    4
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Unique Moods
                  </div>
                </div>
              </div>
            </div>
            
            {/* Start New Session Button */}
            <div className="text-center pt-6">
              <button
                onClick={handleStartNewSession}
                className="px-8 py-4 rounded-lg font-medium transition-colors text-lg text-white hover:opacity-90"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
