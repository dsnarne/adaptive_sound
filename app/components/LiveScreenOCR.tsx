'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type TesseractWorker = any

interface LiveScreenOCRProps {
  onMusicUpdate?: (data: {
    topics?: string
    tags?: string
    audioUrl?: string
    recognizedText?: string
  }) => void
}

export default function LiveScreenOCR({ onMusicUpdate }: LiveScreenOCRProps) {
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
      setStatus('Loading OCR...')
      await ensureScriptLoaded()
      await initWorker(language)
      setStatus('Requesting screen capture...')
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setRunning(true)
      setStatus('Capturing...')

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
                onMusicUpdate?.({ recognizedText: queued })
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
        onMusicUpdate?.({ recognizedText: trimmed })
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
      setStatus('Permission denied or capture failed.')
      await stop()
    }
  }, [ensureScriptLoaded, initWorker, language, intervalMs, endpoint, useGrabFrame])

  const triggerMusicGeneration = useCallback(async (text: string) => {
    if (text.length < 50) return // Skip very short text
    
    try {
      setMusicGeneration(prev => ({
        status: 'analyzing',
        topics: prev.topics,
        tags: prev.tags,
        clipId: prev.clipId,
        audioUrl: prev.audioUrl
      }))
      
      // Step 1: Analyze with Cerebrus
      const cerebrusResponse = await fetch('/api/cerebrus-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      const cerebrusResult = await cerebrusResponse.json()
      if (!cerebrusResult.ok) {
        setMusicGeneration(prev => ({
          status: 'error',
          error: `Analysis failed: ${cerebrusResult.error}`,
          topics: prev.topics,
          tags: prev.tags,
          clipId: prev.clipId,
          audioUrl: prev.audioUrl
        }))
        return
      }
      
      const { topics, tags } = cerebrusResult.data
      setMusicGeneration(prev => ({ status: 'generating', topics, tags, audioUrl: prev.audioUrl, clipId: prev.clipId }))
      
      // Step 2: Generate music with Suno
      const sunoResponse = await fetch('/api/suno-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, tags })
      })
      
      const sunoResult = await sunoResponse.json()
      if (!sunoResult.ok) {
        setMusicGeneration(prev => ({
          status: 'error',
          error: `Music generation failed: ${sunoResult.error}`,
          topics: prev.topics,
          tags: prev.tags,
          clipId: prev.clipId,
          audioUrl: prev.audioUrl
        }))
        return
      }
      
      const clipId = sunoResult.clip_id
      setMusicGeneration(prev => ({ status: 'generating', topics, tags, clipId, audioUrl: prev.audioUrl }))
      
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
            setMusicGeneration(prev => ({
              status: 'error',
              error: `Status check failed: ${statusResult.error}`,
              topics: prev.topics,
              tags: prev.tags,
              clipId: prev.clipId,
              audioUrl: prev.audioUrl
            }))
            return
          }
          
          if (statusResult.status === 'complete' || statusResult.status === 'streaming') {
            setMusicGeneration({ 
              status: 'ready', 
              topics, 
              tags, 
              clipId, 
              audioUrl: statusResult.audio_url 
            })
          } else if (statusResult.status === 'error') {
            setMusicGeneration(prev => ({
              status: 'error',
              error: 'Generation failed on Suno side',
              topics: prev.topics,
              tags: prev.tags,
              clipId: prev.clipId,
              audioUrl: prev.audioUrl
            }))
          } else {
            // Still generating, check again in 5 seconds
            setTimeout(pollForCompletion, 5000)
          }
        } catch (e) {
          setMusicGeneration(prev => ({
            status: 'error',
            error: 'Polling failed',
            topics: prev.topics,
            tags: prev.tags,
            clipId: prev.clipId,
            audioUrl: prev.audioUrl
          }))
        }
      }
      
      setTimeout(pollForCompletion, 5000)
      
    } catch (e) {
      setMusicGeneration(prev => ({
        status: 'error',
        error: 'Pipeline failed',
        topics: prev.topics,
        tags: prev.tags,
        clipId: prev.clipId,
        audioUrl: prev.audioUrl
      }))
    }
  }, [])

  const stop = useCallback(async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (workerRef.current) { await workerRef.current.terminate(); workerRef.current = null }
    setRunning(false)
    setStatus('Stopped.')
  }, [])

  useEffect(() => {
    return () => { void stop() }
  }, [stop])

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={start}
          disabled={running}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          Start Capture
        </button>
        <button
          onClick={() => void stop()}
          disabled={!running}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          Stop
        </button>
        <button
          onClick={async () => {
            if (!running) return
            // Trigger a one-off sample by toggling timer briefly
            // Reuse the periodic loop's immediate run by clearing and restarting
            if (timerRef.current) {
              clearInterval(timerRef.current)
              timerRef.current = null
            }
            // Small immediate run by calling start again will re-run sample once at the end
            // but we avoid restarting the stream. Instead, emulate by temporarily setting interval
            const prev = intervalMs
            setIntervalMs(400)
            setTimeout(() => setIntervalMs(prev), 10)
          }}
          disabled={!running}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          Capture Once
        </button>

        <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Lang
          <select value={language} onChange={e => setLanguage(e.target.value)} className="ml-2 px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>
            <option value="eng">eng</option>
            <option value="eng+spa">eng+spa</option>
          </select>
        </label>

        <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Interval (ms)
          <input type="number" value={intervalMs} onChange={e => setIntervalMs(parseInt(e.target.value || '1200', 10))} className="ml-2 px-2 py-1 rounded border w-24" style={{ borderColor: 'var(--color-border)' }} />
        </label>

        <label className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>
          Endpoint
          <input type="text" placeholder="/api/ocr-ingest or https://your-endpoint" value={endpoint} onChange={e => setEndpoint(e.target.value)} className="ml-2 px-2 py-1 rounded border w-full" style={{ borderColor: 'var(--color-border)' }} />
        </label>

        <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Screenshot method
          <select value={useGrabFrame ? 'grab' : 'video'} onChange={e => setUseGrabFrame(e.target.value === 'grab')} className="ml-2 px-2 py-1 rounded border" style={{ borderColor: 'var(--color-border)' }}>
            <option value="grab">ImageCapture.grabFrame()</option>
            <option value="video">Draw from video</option>
          </select>
        </label>
      </div>

      <video ref={videoRef} autoPlay muted playsInline className="w-full rounded border" style={{ borderColor: 'var(--color-border)' }} />
      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{status} Tip: pick "Window" in Chrome's picker if you want the capture to follow you as you switch tabs inside that window.</div>

      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Recognized text</h3>
      <pre className="rounded border p-3" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>{recognizedText}</pre>
      
      <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Music Generation</h3>
      <div className="rounded border p-3 space-y-2" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            musicGeneration.status === 'ready' ? 'bg-green-100 text-green-800' :
            musicGeneration.status === 'error' ? 'bg-red-100 text-red-800' :
            musicGeneration.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
            musicGeneration.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {musicGeneration.status === 'idle' ? 'Waiting for text' :
             musicGeneration.status === 'analyzing' ? 'Analyzing vibe...' :
             musicGeneration.status === 'generating' ? 'Generating music...' :
             musicGeneration.status === 'ready' ? 'Ready to play' :
             musicGeneration.status === 'error' ? 'Error' : 'Unknown'}
          </span>
        </div>
        
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
        
        {musicGeneration.audioUrl && (
          <div className="pt-2">
            <audio ref={audioRef} controls autoPlay className="w-full">
              <source src={musicGeneration.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}


