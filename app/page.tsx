'use client'

import { useState } from 'react'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import FloatingThemeButton from './components/FloatingThemeButton'
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
  const [isCapturing, setIsCapturing] = useState(false)
  const [musicGeneration, setMusicGeneration] = useState<{
    status: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'
    topics?: string
    tags?: string
    clipId?: string
    audioUrl?: string
    error?: string
  }>({ status: 'idle' })
  const [captureStatus, setCaptureStatus] = useState<string>('')
  
  // Handle music generation updates from OCR component
  const handleMusicUpdate = (data: {
    topics?: string
    tags?: string
    audioUrl?: string
    recognizedText?: string
    musicGeneration?: any
    status?: string
  }) => {
    if (data.topics !== undefined) setCurrentSong(data.topics)
    if (data.tags !== undefined) setMood(data.tags)
    if (data.recognizedText !== undefined) setReadingContent(data.recognizedText)
    if (data.musicGeneration) {
      setMusicGeneration(data.musicGeneration)
      // Update current song and mood from music generation data
      if (data.musicGeneration.topics) setMood(data.musicGeneration.topics)
      if (data.musicGeneration.tags) setCurrentSong(data.musicGeneration.tags)
    }
    if (data.status) setCaptureStatus(data.status)
  }

  const handleCaptureStateChange = (capturing: boolean) => {
    console.log('handleCaptureStateChange called with:', capturing)
    setIsCapturing(capturing)
  }

  const toggleCapture = () => {
    console.log('toggleCapture called, current isCapturing:', isCapturing)
    setIsCapturing(!isCapturing)
  }

  const handleProfileClick = () => {
    console.log('Profile clicked')
    // TODO: Implement profile/settings modal
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        <MainContent 
          currentSong={currentSong}
          mood={mood}
          readingContent={readingContent || 'Click "Start Screen Capture" to begin analyzing webpage content and generating adaptive background music in real-time.'}
          isCapturing={isCapturing}
          musicGeneration={musicGeneration}
          captureStatus={captureStatus}
        />
        
        <Sidebar
          autoplay={autoplay}
          fade={fade}
          autoSwitch={autoSwitch}
          onAutoplayChange={setAutoplay}
          onFadeChange={setFade}
          onAutoSwitchChange={setAutoSwitch}
          onProfileClick={handleProfileClick}
          isCapturing={isCapturing}
          onCaptureStateChange={toggleCapture}
        />
        
        {/* Hidden OCR component that runs in background */}
        <div className="hidden">
          <LiveScreenOCR 
            onMusicUpdate={handleMusicUpdate} 
            onCaptureStateChange={handleCaptureStateChange}
            shouldStart={isCapturing}
          />
        </div>
        
        <FloatingThemeButton />
      </div>
    </ThemeProvider>
  )
}
