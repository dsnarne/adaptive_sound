'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type TesseractWorker = any

interface LiveScreenOCRProps {
  onMusicUpdate?: (data: {
    topics?: string
    tags?: string
    audioUrl?: string
    recognizedText?: string
    musicGeneration?: any
  }) => void
  onCaptureStateChange?: (capturing: boolean) => void
  shouldStart?: boolean
}

export default function LiveScreenOCR({ onMusicUpdate, onCaptureStateChange, shouldStart }: LiveScreenOCRProps) {
  console.log('LiveScreenOCR component mounted with shouldStart:', shouldStart)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const workerRef = useRef<TesseractWorker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const commitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [running, setRunning] = useState(false)
  const [recognizedText, setRecognizedText] = useState<string>('(waiting)')
  const [status, setStatus] = useState<string>('')
  const [intervalMs, setIntervalMs] = useState<number>(1200)
  const [endpoint, setEndpoint] = useState<string>('')
  const [language, setLanguage] = useState<string>('eng')
  const [useGrabFrame, setUseGrabFrame] = useState<boolean>(true)
  const [musicGeneration, setMusicGeneration] = useState<{
    status: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'
    topics?: string
    tags?: string
    clipId?: string
    audioUrl?: string
    error?: string
  }>({ status: 'idle' })

  // Freeze window to avoid constant regenerations
  const freezeWindowMs = 25000
  const lastCommitTsRef = useRef<number>(0)
  const pendingTextRef = useRef<string | null>(null)
  const pendingHashRef = useRef<string | null>(null)

  const ensureScriptLoaded = useCallback(async () => {
    if ((window as any).Tesseract) return
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load Tesseract.js'))
      document.head.appendChild(s)
    })
  }, [])

  const initWorker = useCallback(async (lang: string) => {
    if (workerRef.current) {
      await workerRef.current.terminate()
      workerRef.current = null
    }
    const Tesseract = (window as any).Tesseract
    workerRef.current = await Tesseract.createWorker(lang)
  }, [])

  const hashString = (input: string) => {
    let h = 0
    for (let i = 0; i < input.length; i++) {
      h = ((h << 5) - h) + input.charCodeAt(i)
      h |= 0
    }
    return h.toString()
  }

  const start = useCallback(async () => {
    try {
      console.log('Starting screen capture...')
      setStatus('Loading OCR...')
      await ensureScriptLoaded()
      await initWorker(language)
      setStatus('Requesting screen capture...')
      console.log('Requesting display media...')
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false })
      console.log('Stream obtained:', stream)
      streamRef.current = stream
      
      // Add stream end listener
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('Stream ended by user')
        void stop()
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setRunning(true)
      setStatus('Capturing...')
      console.log('Capture started successfully')

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas')
      }

      let lastHash = ''
      const sample = async () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        const worker = workerRef.current
        if (!video || !canvas || !worker) return
        if (!video.videoWidth || !video.videoHeight) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        if (useGrabFrame && streamRef.current) {
          try {
            const track = streamRef.current.getVideoTracks()[0]
            const imageCapture = new (window as any).ImageCapture(track)
            const bitmap: ImageBitmap = await imageCapture.grabFrame()
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
          } catch {
            // Fallback to drawing from video element
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }

        const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve as BlobCallback, 'image/png'))
        if (!blob) return
        const result = await worker.recognize(blob)
        const trimmed: string = (result?.data?.text || '').trim()
        const h = hashString(trimmed)
        if (!trimmed || h === lastHash) return

        // Within freeze window, queue latest text
        const now = Date.now()
        const elapsed = now - lastCommitTsRef.current
        if (elapsed < freezeWindowMs) {
          pendingTextRef.current = trimmed
          pendingHashRef.current = h
          const secs = Math.max(0, Math.ceil((freezeWindowMs - elapsed) / 1000))
          setStatus(`Capturing... next update in ~${secs}s`)
          // Ensure a commit is scheduled when window elapses
          if (!commitTimerRef.current) {
            commitTimerRef.current = setTimeout(() => {
              commitTimerRef.current = null
              // Commit pending text if exists
              const queued = pendingTextRef.current
              const queuedHash = pendingHashRef.current
              if (queued && queuedHash) {
                lastHash = queuedHash
                lastCommitTsRef.current = Date.now()
                setRecognizedText(queued)
                onMusicUpdate?.({ recognizedText: queued, musicGeneration })
                void triggerMusicGeneration(queued)
                const url = endpoint.trim()
                if (url) {
                  fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ts: Date.now(), text: queued })
                  }).catch(() => {})
                }
                pendingTextRef.current = null
                pendingHashRef.current = null
              }
            }, freezeWindowMs - elapsed)
          }
          return
        }

        // Outside freeze window: commit immediately
        lastHash = h
        lastCommitTsRef.current = now
        setRecognizedText(trimmed)
        onMusicUpdate?.({ recognizedText: trimmed, musicGeneration })
        void triggerMusicGeneration(trimmed)
        const url = endpoint.trim()
        if (url) {
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ts: Date.now(), text: trimmed })
          }).catch(() => {})
        }
      }
      timerRef.current = setInterval(sample, Math.max(300, intervalMs))
      // Run one immediately for fast feedback
      void sample()
    } catch (e) {
      console.error('Screen capture failed:', e)
      setStatus('Permission denied or capture failed.')
      onCaptureStateChange?.(false)
      await stop()
    }
  }, [ensureScriptLoaded, initWorker, language, intervalMs, endpoint, useGrabFrame])

  const triggerMusicGeneration = useCallback(async (text: string) => {
    if (text.length < 50) return // Skip very short text
    
    try {
      const newMusicGeneration = {
        status: 'analyzing' as const,
        topics: musicGeneration.topics,
        tags: musicGeneration.tags,
        clipId: musicGeneration.clipId,
        audioUrl: musicGeneration.audioUrl
      }
      setMusicGeneration(newMusicGeneration)
      onMusicUpdate?.({ musicGeneration: newMusicGeneration })
      
      // Step 1: Analyze with Cerebrus
      const cerebrusResponse = await fetch('/api/cerebrus-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      const cerebrusResult = await cerebrusResponse.json()
      if (!cerebrusResult.ok) {
        const errorGeneration = {
          status: 'error' as const,
          error: `Analysis failed: ${cerebrusResult.error}`,
          topics: musicGeneration.topics,
          tags: musicGeneration.tags,
          clipId: musicGeneration.clipId,
          audioUrl: musicGeneration.audioUrl
        }
        setMusicGeneration(errorGeneration)
        onMusicUpdate?.({ musicGeneration: errorGeneration })
        return
      }
      
      const { topics, tags } = cerebrusResult.data
      const generatingState = { status: 'generating' as const, topics, tags, audioUrl: musicGeneration.audioUrl, clipId: musicGeneration.clipId }
      setMusicGeneration(generatingState)
      onMusicUpdate?.({ musicGeneration: generatingState })
      
      // Step 2: Generate music with Suno
      const sunoResponse = await fetch('/api/suno-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, tags })
      })
      
      const sunoResult = await sunoResponse.json()
      if (!sunoResult.ok) {
        const errorGeneration = {
          status: 'error' as const,
          error: `Music generation failed: ${sunoResult.error}`,
          topics: musicGeneration.topics,
          tags: musicGeneration.tags,
          clipId: musicGeneration.clipId,
          audioUrl: musicGeneration.audioUrl
        }
        setMusicGeneration(errorGeneration)
        onMusicUpdate?.({ musicGeneration: errorGeneration })
        return
      }
      
      const clipId = sunoResult.clip_id
      const generatingWithClip = { status: 'generating' as const, topics, tags, clipId, audioUrl: musicGeneration.audioUrl }
      setMusicGeneration(generatingWithClip)
      onMusicUpdate?.({ musicGeneration: generatingWithClip })
      
      // Step 3: Poll for completion
      const pollForCompletion = async () => {
        try {
          const statusResponse = await fetch('/api/suno-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clip_id: clipId })
          })
          
          const statusResult = await statusResponse.json()
          if (!statusResult.ok) {
            const errorGeneration = {
              status: 'error' as const,
              error: `Status check failed: ${statusResult.error}`,
              topics: musicGeneration.topics,
              tags: musicGeneration.tags,
              clipId: musicGeneration.clipId,
              audioUrl: musicGeneration.audioUrl
            }
            setMusicGeneration(errorGeneration)
            onMusicUpdate?.({ musicGeneration: errorGeneration })
            return
          }
          
          if (statusResult.status === 'complete' || statusResult.status === 'streaming') {
            const readyGeneration = { 
              status: 'ready' as const, 
              topics, 
              tags, 
              clipId, 
              audioUrl: statusResult.audio_url,
              title: statusResult.title,
              imageUrl: statusResult.image_url
            }
            setMusicGeneration(readyGeneration)
            onMusicUpdate?.({ musicGeneration: readyGeneration })
          } else if (statusResult.status === 'error') {
            const errorGeneration = {
              status: 'error' as const,
              error: 'Generation failed on Suno side',
              topics: musicGeneration.topics,
              tags: musicGeneration.tags,
              clipId: musicGeneration.clipId,
              audioUrl: musicGeneration.audioUrl
            }
            setMusicGeneration(errorGeneration)
            onMusicUpdate?.({ musicGeneration: errorGeneration })
          } else {
            // Still generating, check again in 5 seconds
            setTimeout(pollForCompletion, 5000)
          }
        } catch (e) {
          const errorGeneration = {
            status: 'error' as const,
            error: 'Polling failed',
            topics: musicGeneration.topics,
            tags: musicGeneration.tags,
            clipId: musicGeneration.clipId,
            audioUrl: musicGeneration.audioUrl
          }
          setMusicGeneration(errorGeneration)
          onMusicUpdate?.({ musicGeneration: errorGeneration })
        }
      }
      
      setTimeout(pollForCompletion, 5000)
      
    } catch (e) {
      const errorGeneration = {
        status: 'error' as const,
        error: 'Pipeline failed',
        topics: musicGeneration.topics,
        tags: musicGeneration.tags,
        clipId: musicGeneration.clipId,
        audioUrl: musicGeneration.audioUrl
      }
      setMusicGeneration(errorGeneration)
      onMusicUpdate?.({ musicGeneration: errorGeneration })
    }
  }, [musicGeneration, onMusicUpdate])

  const stop = useCallback(async () => {
    console.log('Stop called, running:', running)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (workerRef.current) { await workerRef.current.terminate(); workerRef.current = null }
    
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    
    // Reset states
    setRunning(false)
    setStatus('Stopped.')
    setRecognizedText('(waiting)')
    setMusicGeneration({ status: 'idle' })
    
    // Notify parent to reset music generation state
    onMusicUpdate?.({ 
      recognizedText: '', 
      musicGeneration: { status: 'idle' },
      topics: '',
      tags: '',
      audioUrl: ''
    })
  }, [onMusicUpdate])

  // Handle external start/stop control
  useEffect(() => {
    console.log('shouldStart changed to:', shouldStart, 'running:', running)
    if (shouldStart && !running) {
      console.log('Starting capture from external trigger')
      void start()
    } else if (!shouldStart && running) {
      console.log('Stopping capture from external trigger')
      void stop()
    }
  }, [shouldStart, running, start, stop])

  useEffect(() => {
    return () => { void stop() }
  }, [])

  // Auto-play when a new audio URL becomes available
  useEffect(() => {
    const el = audioRef.current
    if (el && musicGeneration.audioUrl) {
      try {
        el.load()
        // Some browsers require a user gesture; Start Capture counts as one.
        void el.play().catch(() => {})
      } catch {}
    }
  }, [musicGeneration.audioUrl])

  return (
    <div className="hidden">
      {/* Hidden video element for screen capture */}
      <video ref={videoRef} autoPlay muted playsInline />
      {/* Hidden audio element for music playback */}
      <audio ref={audioRef} controls autoPlay>
        {musicGeneration.audioUrl && <source src={musicGeneration.audioUrl} type="audio/mpeg" />}
      </audio>
    </div>
  )
}


