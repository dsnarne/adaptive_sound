'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'
import LiveScreenOCR from '../components/LiveScreenOCR'

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

export default function MainPage() {
  const router = useRouter()
  
  // Music state
  const [currentSong, setCurrentSong] = useState('')
  const [mood, setMood] = useState('')
  const [readingContent, setReadingContent] = useState('')
  const [isCapturing, setIsCapturing] = useState(false) // Will be set to true when OCR starts
  const [hasInitialized, setHasInitialized] = useState(false) // Track if we've initialized
  const [musicGeneration, setMusicGeneration] = useState<{
    status: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'
    topics?: string
    tags?: string
    clipId?: string
    audioUrl?: string
    error?: string
  }>({ status: 'idle' })
  const [captureStatus, setCaptureStatus] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showStopButton, setShowStopButton] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Handle music generation updates from OCR component
  const handleMusicUpdate = (data: {
    topics?: string
    tags?: string
    audioUrl?: string
    recognizedText?: string
    musicGeneration?: any
    status?: string
  }) => {
    console.log('handleMusicUpdate called with:', data)
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
    console.log('handleCaptureStateChange called with:', capturing, 'hasInitialized:', hasInitialized)
    // Only allow the OCR component to change state after we've initialized
    if (hasInitialized) {
      setIsCapturing(capturing)
    } else {
      console.log('Ignoring capture state change during initialization')
    }
  }

  const toggleCapture = () => {
    setIsCapturing(!isCapturing)
  }


  // Audio control functions
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value)
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStop = () => {
    // Stop audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
    
    // Stop screen capture
    setIsCapturing(false)
    
    // Reset music generation state
    setMusicGeneration({ status: 'idle' })
    setCurrentSong('')
    setMood('')
    setReadingContent('')
    setCaptureStatus('')
    
    // Hide the stop button after clicking
    setShowStopButton(false)
    
    // Redirect to recap page after a short delay
    setTimeout(() => {
      router.push('/recap')
    }, 500)
  }

  // Auto-start OCR when page loads
  useEffect(() => {
    console.log('Main page loaded, setting up OCR...')
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      console.log('Setting isCapturing to true and marking as initialized')
      setIsCapturing(true)
      setHasInitialized(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Debug capture state changes
  useEffect(() => {
    console.log('isCapturing changed to:', isCapturing)
  }, [isCapturing])

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('play', () => setIsPlaying(true))
      audio.addEventListener('pause', () => setIsPlaying(false))
      audio.addEventListener('ended', () => setIsPlaying(false))

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('play', () => setIsPlaying(true))
        audio.removeEventListener('pause', () => setIsPlaying(false))
        audio.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [musicGeneration?.audioUrl])

  return (
    <ThemeProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Theme button positioned at top right of screen */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeButton />
        </div>
        
        {/* OCR component that runs in background */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <LiveScreenOCR 
            onMusicUpdate={handleMusicUpdate} 
            onCaptureStateChange={handleCaptureStateChange}
            shouldStart={isCapturing}
          />
        </div>
        
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Adaptive Sound
            </h1>
            
            {showStopButton && (
              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-lg font-medium transition-colors text-white hover:opacity-90"
                style={{ 
                  backgroundColor: '#ef4444', // red-500
                }}
              >
                Stop All
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {/* Song Description and Mood */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <div className="space-y-4">
                <div>
                  <h2 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Song Description:
                  </h2>
                  <p 
                    className="text-xl font-medium capitalize"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {musicGeneration?.topics || mood || (isCapturing ? 'Analyzing vibes...' : 'Waiting for page content analysis')}
                  </p>
                </div>
                
                <div>
                  <h2 
                    className="text-lg font-semibold mb-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Mood:
                  </h2>
                  <p 
                    className="text-xl font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {musicGeneration?.tags || currentSong || (isCapturing ? 'Generating music...' : 'Start screen capture to generate adaptive music...')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Screen Capture Status */}
            {isCapturing && (
              <div 
                className="rounded-lg shadow-sm border p-4"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-primary)',
                  borderWidth: '2px'
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Screen capture active
                  </span>
                  {captureStatus && (
                    <span className="text-xs text-gray-500 ml-2">
                      {captureStatus}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Music Player */}
            {musicGeneration && musicGeneration.status === 'ready' && musicGeneration.audioUrl && (
              <div 
                className="rounded-lg shadow-sm border p-6"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <h2 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Now Playing
                </h2>
                
                <div className="space-y-4">
                  {musicGeneration.title && (
                    <div className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {musicGeneration.title}
                    </div>
                  )}
                  
                  {/* Custom Music Player Bar */}
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${(currentTime / duration) * 100}%, var(--color-border) ${(currentTime / duration) * 100}%, var(--color-border) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={togglePlayPause}
                        className="w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                        style={{ 
                          backgroundColor: 'var(--color-primary)',
                          color: 'white'
                        }}
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Hidden audio element */}
                  <audio 
                    ref={audioRef}
                    preload="metadata"
                    style={{ display: 'none' }}
                  >
                    <source src={musicGeneration.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  
                  {musicGeneration.topics && (
                    <div className="text-sm">
                      <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Topics:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}> {musicGeneration.topics}</span>
                    </div>
                  )}
                  
                  {musicGeneration.tags && (
                    <div className="text-sm">
                      <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tags:</span>
                      <span style={{ color: 'var(--color-text-primary)' }}> {musicGeneration.tags}</span>
                    </div>
                  )}
                  
                  {musicGeneration.error && (
                    <div className="text-sm text-red-600">{musicGeneration.error}</div>
                  )}
                </div>
              </div>
            )}

            {/* Recognized Text */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <h2 
                className="text-lg font-semibold mb-4"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Recognized Text:
              </h2>
              <div 
                className="text-sm leading-relaxed font-mono bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto"
                style={{ 
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)' 
                }}
              >
                {readingContent || 'Click "Start Screen Capture" to begin analyzing webpage content and generating adaptive background music in real-time.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
