'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeProvider, useTheme } from '../components/ThemeProvider'
import LiveScreenOCR from '../components/LiveScreenOCR'

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

export default function MainPage() {
  const router = useRouter()
  
  // Music state
  const [currentSong, setCurrentSong] = useState('')
  const [mood, setMood] = useState('')
  const [readingContent, setReadingContent] = useState('')
  const [isCapturing, setIsCapturing] = useState(false) // Will be set to true when OCR starts
  const [hasInitialized, setHasInitialized] = useState(false) // Track if we've initialized
  const [recentPlays, setRecentPlays] = useState<Array<{
    clip_id: string;
    url: string;
    topics: string;
    tags: string;
    started_at: string;
    source?: string;
  }>>([])
  const [replaySongFn, setReplaySongFn] = useState<((play: any) => void) | null>(null)
  const [liveModeControl, setLiveModeControl] = useState<{ liveModeEnabled: boolean; hasClickedRecentPlay: boolean; resumeLiveMode: () => void } | null>(null)
  const [musicGeneration, setMusicGeneration] = useState<{
    status: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'
    topics?: string
    tags?: string
    clipId?: string
    audioUrl?: string
    imageUrl?: string
    title?: string
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

  const handleRecentPlaysUpdate = (plays: Array<{
    clip_id: string;
    url: string;
    topics: string;
    tags: string;
    started_at: string;
    source?: string;
  }>) => {
    setRecentPlays(plays)
  }

  const handleReplaySong = (replayFn: (play: any) => void) => {
    setReplaySongFn(() => replayFn)
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
    
    // Snapshot current session for recap before clearing persistent storage
    try {
      const playsRaw = localStorage.getItem('adaptive_sound_plays') || '[]'
      const sessionId = localStorage.getItem('adaptive_sound_current_session_id') || ''
      const sessionStartAt = localStorage.getItem('adaptive_sound_current_session_started_at') || ''
      const snapshot = {
        plays: JSON.parse(playsRaw),
        sessionId,
        sessionStartAt,
        endedAt: new Date().toISOString()
      }
      sessionStorage.setItem('adaptive_sound_recap_snapshot', JSON.stringify(snapshot))
    } catch {}

    // Clear persisted session data
    try {
      localStorage.removeItem('adaptive_sound_plays')
      localStorage.removeItem('adaptive_sound_current_session_id')
      localStorage.removeItem('adaptive_sound_current_session_started_at')
      localStorage.removeItem('adaptive_sound_user_id')
    } catch {}

    // Reset music generation state
    setMusicGeneration({ status: 'idle' })
    setCurrentSong('')
    setMood('')
    setReadingContent('')
    setCaptureStatus('')
    setRecentPlays([]) // Clear recent plays on session end
    
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
            onRecentPlaysUpdate={handleRecentPlaysUpdate}
            onReplaySong={handleReplaySong}
            onLiveModeControl={setLiveModeControl}
            shouldStart={isCapturing}
          />
        </div>
        
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 
              className="text-3xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Tuneshift
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
          
          <div className="flex gap-8">
            {/* Left Column - Recent Plays (2/5 width) */}
            <div className="w-2/5">
              <div 
                className="rounded-lg shadow-sm border p-6 sticky top-8"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)'
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Recent Plays
                  </h2>
                  {/* Live Mode Toggle inside the Recent Plays header */}
                  {liveModeControl && (
                    <button
                      onClick={
                        liveModeControl.liveModeEnabled || !liveModeControl.hasClickedRecentPlay
                          ? undefined
                          : liveModeControl.resumeLiveMode
                      }
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        liveModeControl.liveModeEnabled
                          ? 'bg-green-500 text-white cursor-default'
                          : liveModeControl.hasClickedRecentPlay
                          ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
                          : 'bg-green-500 text-white cursor-default'
                      }`}
                    >
                      {liveModeControl.liveModeEnabled ? 'Live Mode ON' : 'Continue Live Play'}
                    </button>
                  )}
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentPlays.length > 0 ? (
                    recentPlays.map((play, idx) => (
                      <button
                        key={idx}
                        onClick={() => replaySongFn && replaySongFn(play)}
                        disabled={!replaySongFn}
                        className="w-full text-left p-3 rounded border hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          backgroundColor: 'var(--color-background)',
                          borderColor: 'var(--color-border)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                            🎵 {play.source === "replay" ? "🔄" : "Generated"}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {new Date(play.started_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                          {play.topics || 'Untitled'}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {play.tags || 'No tags'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
                      Recent plays will appear here as you generate music...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column - Main Content (3/5 width) */}
            <div className="w-3/5 space-y-6">
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

            {/* Music Player - Always Visible */}
            <div 
              className="rounded-lg shadow-sm border p-6"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
             
              {/* Show loading state when generating */}
              {musicGeneration.status === 'analyzing' || musicGeneration.status === 'generating' ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--color-primary)' }}>
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Song generating...
                      </span>
                      <div className="text-lg font-medium animate-pulse" style={{ color: 'var(--color-text-primary)' }}>
                        {musicGeneration.status === 'analyzing' ? 'Analyzing content...' : 'Creating music...'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : musicGeneration.status === 'ready' && musicGeneration.audioUrl ? (
                /* Show current song when ready */
                <div className="flex items-center space-x-3">
                  {/* Song Icon - Use Suno image or fallback to music icon */}
                  <div className="flex-shrink-0">
                    {musicGeneration.imageUrl ? (
                      <img 
                        src={musicGeneration.imageUrl} 
                        alt="Song Cover"
                        className="w-8 h-8 rounded-lg object-cover shadow-sm"
                        onError={(e) => {
                          // Fallback to music icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style="color: var(--color-primary)">
                                <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414z" clip-rule="evenodd" />
                              </svg>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-primary)' }}>
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Song Title */}
                  <div>
                    <span className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {musicGeneration.title || 'Generated Song'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Show waiting state when no music is ready */
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--color-text-muted)' }}>
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        Waiting for music...
                      </span>
                      <div className="text-lg font-medium" style={{ color: 'var(--color-text-muted)' }}>
                        {isCapturing ? 'Screen capture active' : 'Start screen capture to begin'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hidden audio element */}
              <audio 
                ref={audioRef}
                preload="metadata"
                style={{ display: 'none' }}
              >
                {musicGeneration.audioUrl && (
                  <source src={musicGeneration.audioUrl} type="audio/mpeg" />
                )}
                Your browser does not support the audio element.
              </audio>
            </div>

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
      </div>
    </ThemeProvider>
  )
}
