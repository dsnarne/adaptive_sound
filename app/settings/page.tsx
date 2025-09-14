'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'
import ToggleSwitch from '../components/ToggleSwitch'

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

export default function SettingsPage() {
  const router = useRouter()
  const [autoplay, setAutoplay] = useState(true)
  const [fade, setFade] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(false)


  const handleScreenShare = async () => {
    // Navigate to main page - the OCR component will handle screen capture
    router.push('/main')
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Theme button positioned at top right of screen */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeButton />
        </div>
        
        <div className="max-w-2xl mx-auto p-8">
          <h1 
            className="text-4xl font-bold mb-8 text-center"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Settings
          </h1>
          
          <div className="space-y-6">
            {/* Settings Section */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Audio Settings
              </h2>
              
              <div className="space-y-4">
                <ToggleSwitch
                  label="Autoplay"
                  enabled={autoplay}
                  onChange={setAutoplay}
                />
                
                <ToggleSwitch
                  label="Fade"
                  enabled={fade}
                  disabled={!autoplay}
                  onChange={setFade}
                />
                
                <ToggleSwitch
                  label="Auto-switch"
                  enabled={autoSwitch}
                  onChange={setAutoSwitch}
                />
              </div>
            </div>
            
            {/* Screen Share Section */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <h2 
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Screen Capture
              </h2>
              
              <p 
                className="text-sm mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Choose which tab or window to capture for music generation
              </p>
              
              <button
                onClick={handleScreenShare}
                className="w-full py-4 px-6 rounded-lg font-medium transition-colors text-lg text-white hover:opacity-90"
                style={{ 
                  backgroundColor: 'var(--color-primary)',
                }}
              >
                Choose Screen/Tab to Capture
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
