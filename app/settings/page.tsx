'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'
import ToggleSwitch from '../components/ToggleSwitch'

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

export default function SettingsPage() {
  const router = useRouter()
  const [autoplay, setAutoplay] = useState(true)
  const [fade, setFade] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(false)

  // Debug state changes
  const handleAutoplayChange = (enabled: boolean) => {
    console.log('Settings: Autoplay state changing to:', enabled)
    setAutoplay(enabled)
  }

  const handleFadeChange = (enabled: boolean) => {
    console.log('Settings: Fade state changing to:', enabled)
    setFade(enabled)
  }

  const handleAutoSwitchChange = (enabled: boolean) => {
    console.log('Settings: Auto-switch state changing to:', enabled)
    setAutoSwitch(enabled)
  }



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
                  onChange={handleAutoplayChange}
                />
                
                <ToggleSwitch
                  label="Fade"
                  enabled={fade}
                  onChange={handleFadeChange}
                />
                
                <ToggleSwitch
                  label="Auto-switch"
                  enabled={autoSwitch}
                  onChange={handleAutoSwitchChange}
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
