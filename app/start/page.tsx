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
            Adaptive Sound
          </h1>
          
          <button
            onClick={handleStartClick}
            className="px-12 py-6 rounded-lg font-medium transition-colors text-xl text-white hover:opacity-90"
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
