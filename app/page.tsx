'use client'

import { useState } from 'react'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import BottomThemeToggle from './components/BottomThemeToggle'
import LiveScreenOCR from './components/LiveScreenOCR'
import { ThemeProvider } from './components/ThemeProvider'

export default function Home() {
  // Settings state
  const [autoplay, setAutoplay] = useState(true)
  const [fade, setFade] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(false)
  
  // Music state
  const [currentSong, setCurrentSong] = useState('')
  const [mood, setMood] = useState('')
  const [readingContent, setReadingContent] = useState('')
  const [showOCR, setShowOCR] = useState(false)
  
  // Handle music generation updates from OCR component
  const handleMusicUpdate = (data: {
    topics?: string
    tags?: string
    audioUrl?: string
    recognizedText?: string
  }) => {
    if (data.topics) setCurrentSong(data.topics)
    if (data.tags) setMood(data.tags)
    if (data.recognizedText) setReadingContent(data.recognizedText)
  }

  const handleProfileClick = () => {
    console.log('Profile clicked')
    // TODO: Implement profile/settings modal
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        <MainContent 
          currentSong={currentSong || 'Start screen capture to generate adaptive music...'}
          mood={mood || 'Waiting for page content analysis'}
          readingContent={readingContent || 'Click "Start Live Capture" to begin analyzing webpage content and generating adaptive background music in real-time.'}
        />
        
        <Sidebar
          autoplay={autoplay}
          fade={fade}
          autoSwitch={autoSwitch}
          onAutoplayChange={setAutoplay}
          onFadeChange={setFade}
          onAutoSwitchChange={setAutoSwitch}
          onProfileClick={handleProfileClick}
          showOCR={showOCR}
          onToggleOCR={() => setShowOCR(!showOCR)}
        />
        
        {showOCR && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6" style={{ backgroundColor: 'var(--color-background)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Live Screen Capture & Music Generation</h2>
                <button 
                  onClick={() => setShowOCR(false)}
                  className="text-2xl hover:opacity-70"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  ×
                </button>
              </div>
              <LiveScreenOCR onMusicUpdate={handleMusicUpdate} />
            </div>
          </div>
        )}
        
        <BottomThemeToggle />
      </div>
    </ThemeProvider>
  )
}
