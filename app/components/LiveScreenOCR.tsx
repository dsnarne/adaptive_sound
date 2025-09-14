"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TesseractWorker = any;

interface LiveScreenOCRProps {
  onMusicUpdate?: (data: {
    topics?: string;
    tags?: string;
    audioUrl?: string;
    recognizedText?: string;
    musicGeneration?: any;
  }) => void;
  onCaptureStateChange?: (capturing: boolean) => void;
  onRecentPlaysUpdate?: (plays: Array<{
    clip_id: string;
    url: string;
    topics: string;
    tags: string;
    started_at: string;
    source?: string;
  }>) => void;
  onReplaySong?: (replayFn: (play: any) => void) => void;
  onLiveModeControl?: (control: {
    liveModeEnabled: boolean;
    hasClickedRecentPlay: boolean;
    resumeLiveMode: () => void;
  }) => void;
  shouldStart?: boolean;
}

// Generate or retrieve persistent user ID
const getUserId = () => {
  if (typeof window === "undefined") return "user_demo";
  let userId = localStorage.getItem("adaptive_sound_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("adaptive_sound_user_id", userId);
  }
  return userId;
};

export default function LiveScreenOCR({
  onMusicUpdate,
  onCaptureStateChange,
  onRecentPlaysUpdate,
  onReplaySong,
  onLiveModeControl,
  shouldStart,
}: LiveScreenOCRProps) {
  console.log("LiveScreenOCR component mounted with shouldStart:", shouldStart);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<TesseractWorker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const commitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [running, setRunning] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>("(waiting)");
  const [status, setStatus] = useState<string>("");
  const [intervalMs, setIntervalMs] = useState<number>(1200);
  const [endpoint, setEndpoint] = useState<string>("");
  const [language, setLanguage] = useState<string>("eng");
  const [useGrabFrame, setUseGrabFrame] = useState<boolean>(true);
  const [musicGeneration, setMusicGeneration] = useState<{
    status: "idle" | "analyzing" | "generating" | "ready" | "error";
    topics?: string;
    tags?: string;
    clipId?: string;
    audioUrl?: string;
    error?: string;
  }>({ status: "idle" });

  // Recent Plays state management
  const [recentPlays, setRecentPlays] = useState<
    Array<{
      clip_id: string;
      url: string;
      topics: string;
      tags: string;
      started_at: string;
      source?: string;
    }>
  >([]);
  const [userId] = useState(() => getUserId());
  const [replayingClipId, setReplayingClipId] = useState<string | null>(null);
  const [liveModeEnabled, setLiveModeEnabled] = useState<boolean>(true);
  const [hasClickedRecentPlay, setHasClickedRecentPlay] = useState<boolean>(false);

  // Handle switching to live mode with proper audio cleanup
  const resumeLiveMode = useCallback(() => {
    // Kill any current audio playback completely
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ''; // Clear source to fully stop
    }
    
    // Enable live mode
    setLiveModeEnabled(true);
    
    // If there's a current live song ready, play it immediately
    if (musicGeneration.audioUrl && musicGeneration.status === "ready") {
      setTimeout(() => {
        if (audioRef.current && musicGeneration.audioUrl) {
          audioRef.current.src = musicGeneration.audioUrl;
          audioRef.current.load();
          audioRef.current.play().catch((e) => {
            console.log("Auto-play failed:", e);
          });
        }
      }, 200);
    } else {
      // If no ready song, force a new generation cycle with current text
      if (recognizedText && recognizedText !== "(waiting)" && recognizedText.length > 50) {
        // Reset the freeze window to allow immediate generation
        lastCommitTsRef.current = 0;
        // The OCR loop will naturally pick this up and generate new music
        console.log("Live mode resumed - will generate new music from current content");
      }
    }
  }, [musicGeneration.audioUrl, musicGeneration.status, recognizedText]);

  // Handle switching to previous music mode
  const pauseLiveMode = useCallback(() => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Disable live mode
    setLiveModeEnabled(false);
  }, []);

  // Expose live mode control to parent (Recent Plays header button)
  useEffect(() => {
    if (onLiveModeControl) {
      onLiveModeControl({
        liveModeEnabled,
        hasClickedRecentPlay,
        resumeLiveMode,
      });
    }
  }, [onLiveModeControl, liveModeEnabled, hasClickedRecentPlay, resumeLiveMode]);

  // Freeze window to avoid constant regenerations
  const freezeWindowMs = 25000;
  const lastCommitTsRef = useRef<number>(0);
  const pendingTextRef = useRef<string | null>(null);
  const pendingHashRef = useRef<string | null>(null);

  const ensureScriptLoaded = useCallback(async () => {
    if ((window as any).Tesseract) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/tesseract.js@5.0.5/dist/tesseract.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Tesseract.js"));
      document.head.appendChild(s);
    });
  }, []);

  const initWorker = useCallback(async (lang: string) => {
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }
    const Tesseract = (window as any).Tesseract;
    workerRef.current = await Tesseract.createWorker(lang);
  }, []);

  const hashString = (input: string) => {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return h.toString();
  };

  // Recent Plays API helper functions
  const recordPlay = useCallback(
    async (playRecord: any) => {
      try {
        const response = await fetch("/api/plays/record", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, play_record: playRecord }),
        });
        const result = await response.json();
        if (result.ok) {
          console.log("Play recorded successfully");
        }
      } catch (e) {
        console.error("Failed to record play:", e);
      }
    },
    [userId]
  );

  const fetchRecentPlays = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/plays/recent?user_id=${userId}&limit=10`
      );
      const result = await response.json();
      if (result.ok) {
        setRecentPlays(result.data); // Already newest first from server
      }
    } catch (e) {
      console.error("Failed to fetch recent plays:", e);
    }
  }, [userId]);

  // Separate function to notify parent of recent plays updates
  const notifyRecentPlaysUpdate = useCallback((plays: any[]) => {
    onRecentPlaysUpdate?.(plays);
  }, [onRecentPlaysUpdate]);

  const replayPreviousSong = useCallback(
    async (playRecord: any) => {
      if (audioRef.current && playRecord.url) {
        setReplayingClipId(playRecord.clip_id); // Show spinner
        setHasClickedRecentPlay(true); // Enable the toggle functionality
        setLiveModeEnabled(false); // Switch to paused mode

        try {
          // Stop current audio first
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          
          audioRef.current.src = playRecord.url;
          audioRef.current.load();
          await audioRef.current.play();

          // Update current display to show replayed song
          setMusicGeneration((prev) => ({
            ...prev,
            status: "ready",
            topics: playRecord.topics,
            tags: playRecord.tags,
            audioUrl: playRecord.url,
          }));

          // Record replay (with source: "replay" to prevent double-recording)
          const replayRecord = {
            ...playRecord,
            source: "replay",
            started_at: new Date().toISOString(),
            session_id: sessionIdRef.current || "unknown_session",
          };
          recordPlay(replayRecord);
        } catch (error) {
          console.error("Failed to replay song:", error);
        } finally {
          setReplayingClipId(null); // Hide spinner
        }
      }
    },
    [recordPlay]
  );

  const start = useCallback(async () => {
    try {
      console.log("Starting screen capture...");
      setStatus("Loading OCR...");
      await ensureScriptLoaded();
      await initWorker(language);
      setStatus("Requesting screen capture...");
      console.log("Requesting display media...");

      // Initialize a new session ID for recap grouping
      const newSessionId = `session_${Date.now()}`;
      sessionIdRef.current = newSessionId;
      try {
        localStorage.setItem("adaptive_sound_current_session_id", newSessionId);
        localStorage.setItem(
          "adaptive_sound_current_session_started_at",
          new Date().toISOString()
        );
      } catch {}

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: false,
      });
      console.log("Stream obtained:", stream);
      streamRef.current = stream;

      // Add stream end listener
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("Stream ended by user");
        void stop();
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setRunning(true);
      setStatus("Capturing...");
      console.log("Capture started successfully");

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      let lastHash = "";
      const sample = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const worker = workerRef.current;
        if (!video || !canvas || !worker) return;
        if (!video.videoWidth || !video.videoHeight) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (useGrabFrame && streamRef.current) {
          try {
            const track = streamRef.current.getVideoTracks()[0];
            const imageCapture = new (window as any).ImageCapture(track);
            const bitmap: ImageBitmap = await imageCapture.grabFrame();
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          } catch {
            // Fallback to drawing from video element
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve as BlobCallback, "image/png")
        );
        if (!blob) return;
        const result = await worker.recognize(blob);
        const trimmed: string = (result?.data?.text || "").trim();
        const h = hashString(trimmed);
        if (!trimmed || h === lastHash) return;

        // Within freeze window, queue latest text
        const now = Date.now();
        const elapsed = now - lastCommitTsRef.current;
        if (elapsed < freezeWindowMs) {
          pendingTextRef.current = trimmed;
          pendingHashRef.current = h;
          const secs = Math.max(
            0,
            Math.ceil((freezeWindowMs - elapsed) / 1000)
          );
          setStatus(`Capturing... next update in ~${secs}s`);
          // Ensure a commit is scheduled when window elapses
          if (!commitTimerRef.current) {
            commitTimerRef.current = setTimeout(() => {
              commitTimerRef.current = null;
              // Commit pending text if exists
              const queued = pendingTextRef.current;
              const queuedHash = pendingHashRef.current;
              if (queued && queuedHash) {
                lastHash = queuedHash;
                lastCommitTsRef.current = Date.now();
                setRecognizedText(queued);
                onMusicUpdate?.({ recognizedText: queued, musicGeneration });
                
                // Only trigger music generation if live mode is enabled
                if (liveModeEnabled) {
                  void triggerMusicGeneration(queued);
                }
                const url = endpoint.trim();
                if (url) {
                  fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ts: Date.now(), text: queued }),
                  }).catch(() => {});
                }
                pendingTextRef.current = null;
                pendingHashRef.current = null;
              }
            }, freezeWindowMs - elapsed);
          }
          return;
        }

        // Outside freeze window: commit immediately
        lastHash = h;
        lastCommitTsRef.current = now;
        setRecognizedText(trimmed);
        onMusicUpdate?.({ recognizedText: trimmed, musicGeneration });
        
        // Only trigger music generation if live mode is enabled
        if (liveModeEnabled) {
          void triggerMusicGeneration(trimmed);
        }
        const url = endpoint.trim();
        if (url) {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ts: Date.now(), text: trimmed }),
          }).catch(() => {});
        }
      };
      timerRef.current = setInterval(sample, Math.max(300, intervalMs));
      // Run one immediately for fast feedback
      void sample();
    } catch (e) {
      console.error("Screen capture failed:", e);
      setStatus("Permission denied or capture failed.");
      onCaptureStateChange?.(false);
      await stop();
    }
  }, [
    ensureScriptLoaded,
    initWorker,
    language,
    intervalMs,
    endpoint,
    useGrabFrame,
    liveModeEnabled,
  ]);

  const triggerMusicGeneration = useCallback(
    async (text: string) => {
      if (text.length < 50) return; // Skip very short text

      try {
        const newMusicGeneration = {
          status: "analyzing" as const,
          topics: musicGeneration.topics,
          tags: musicGeneration.tags,
          clipId: musicGeneration.clipId,
          audioUrl: musicGeneration.audioUrl,
        };
        setMusicGeneration(newMusicGeneration);
        onMusicUpdate?.({ musicGeneration: newMusicGeneration });

        // Step 1: Analyze with Cerebrus
        const cerebrusResponse = await fetch("/api/cerebrus-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const cerebrusResult = await cerebrusResponse.json();
        if (!cerebrusResult.ok) {
          const errorGeneration = {
            status: "error" as const,
            error: `Analysis failed: ${cerebrusResult.error}`,
            topics: musicGeneration.topics,
            tags: musicGeneration.tags,
            clipId: musicGeneration.clipId,
            audioUrl: musicGeneration.audioUrl,
          };
          setMusicGeneration(errorGeneration);
          onMusicUpdate?.({ musicGeneration: errorGeneration });
          return;
        }

        const { topics, tags } = cerebrusResult.data;
        const generatingState = {
          status: "generating" as const,
          topics,
          tags,
          audioUrl: musicGeneration.audioUrl,
          clipId: musicGeneration.clipId,
        };
        setMusicGeneration(generatingState);
        onMusicUpdate?.({ musicGeneration: generatingState });

        // Step 2: Generate music with Suno
        const sunoResponse = await fetch("/api/suno-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics, tags }),
        });

        const sunoResult = await sunoResponse.json();
        if (!sunoResult.ok) {
          const errorGeneration = {
            status: "error" as const,
            error: `Music generation failed: ${sunoResult.error}`,
            topics: musicGeneration.topics,
            tags: musicGeneration.tags,
            clipId: musicGeneration.clipId,
            audioUrl: musicGeneration.audioUrl,
          };
          setMusicGeneration(errorGeneration);
          onMusicUpdate?.({ musicGeneration: errorGeneration });
          return;
        }

        const clipId = sunoResult.clip_id;
        const generatingWithClip = {
          status: "generating" as const,
          topics,
          tags,
          clipId,
          audioUrl: musicGeneration.audioUrl,
        };
        setMusicGeneration(generatingWithClip);
        onMusicUpdate?.({ musicGeneration: generatingWithClip });

        // Step 3: Poll for completion
        const pollForCompletion = async () => {
          try {
            const statusResponse = await fetch("/api/suno-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clip_id: clipId }),
            });

            const statusResult = await statusResponse.json();
            if (!statusResult.ok) {
              const errorGeneration = {
                status: "error" as const,
                error: `Status check failed: ${statusResult.error}`,
                topics: musicGeneration.topics,
                tags: musicGeneration.tags,
                clipId: musicGeneration.clipId,
                audioUrl: musicGeneration.audioUrl,
              };
              setMusicGeneration(errorGeneration);
              onMusicUpdate?.({ musicGeneration: errorGeneration });
              return;
            }

            if (
              statusResult.status === "complete" ||
              statusResult.status === "streaming"
            ) {
              const readyGeneration = {
                status: "ready" as const,
                topics,
                tags,
                clipId,
                audioUrl: statusResult.audio_url,
                title: statusResult.title,
                imageUrl: statusResult.image_url,
              };
              setMusicGeneration(readyGeneration);
              onMusicUpdate?.({ musicGeneration: readyGeneration });
            } else if (statusResult.status === "error") {
              const errorGeneration = {
                status: "error" as const,
                error: "Generation failed on Suno side",
                topics: musicGeneration.topics,
                tags: musicGeneration.tags,
                clipId: musicGeneration.clipId,
                audioUrl: musicGeneration.audioUrl,
              };
              setMusicGeneration(errorGeneration);
              onMusicUpdate?.({ musicGeneration: errorGeneration });
            } else {
              // Still generating, check again in 5 seconds
              setTimeout(pollForCompletion, 5000);
            }
          } catch (e) {
            const errorGeneration = {
              status: "error" as const,
              error: "Polling failed",
              topics: musicGeneration.topics,
              tags: musicGeneration.tags,
              clipId: musicGeneration.clipId,
              audioUrl: musicGeneration.audioUrl,
            };
            setMusicGeneration(errorGeneration);
            onMusicUpdate?.({ musicGeneration: errorGeneration });
          }
        };

        setTimeout(pollForCompletion, 5000);
      } catch (e) {
        const errorGeneration = {
          status: "error" as const,
          error: "Pipeline failed",
          topics: musicGeneration.topics,
          tags: musicGeneration.tags,
          clipId: musicGeneration.clipId,
          audioUrl: musicGeneration.audioUrl,
        };
        setMusicGeneration(errorGeneration);
        onMusicUpdate?.({ musicGeneration: errorGeneration });
      }
    },
    [musicGeneration, onMusicUpdate]
  );

  const stop = useCallback(async () => {
    console.log("Stop called, running:", running);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (workerRef.current) {
      await workerRef.current.terminate();
      workerRef.current = null;
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Reset states
    setRunning(false);
    setStatus("Stopped.");
    setRecognizedText("(waiting)");
    setMusicGeneration({ status: "idle" });
    setRecentPlays([]); // Clear recent plays

    // Notify parent to reset music generation state
    onMusicUpdate?.({
      recognizedText: "",
      musicGeneration: { status: "idle" },
      topics: "",
      tags: "",
      audioUrl: "",
    });
  }, [onMusicUpdate]);

  // Handle external start/stop control
  useEffect(() => {
    console.log("shouldStart changed to:", shouldStart, "running:", running);
    if (shouldStart && !running) {
      console.log("Starting capture from external trigger");
      void start();
    } else if (!shouldStart && running) {
      console.log("Stopping capture from external trigger");
      void stop();
    }
  }, [shouldStart, running, start, stop]);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  // Auto-play when a new audio URL becomes available
  useEffect(() => {
    const el = audioRef.current;
    if (el && musicGeneration.audioUrl && musicGeneration.status === "ready") {
      try {
        el.load();
        // Some browsers require a user gesture; Start Capture counts as one.
        void el.play().catch(() => {});

        // Record this play to Modal.Dict (with source: "generate")
        const playRecord = {
          clip_id: musicGeneration.clipId || "unknown",
          url: musicGeneration.audioUrl,
          topics: musicGeneration.topics || "",
          tags: musicGeneration.tags || "",
          started_at: new Date().toISOString(),
          source: "generate",
          session_id: sessionIdRef.current || "unknown_session",
        };

        // Async record to Modal.Dict
        recordPlay(playRecord);

        // Persist locally for recap
        try {
          const existingRaw = localStorage.getItem("adaptive_sound_plays") || "[]";
          const existing = JSON.parse(existingRaw);
          existing.push(playRecord);
          localStorage.setItem("adaptive_sound_plays", JSON.stringify(existing.slice(-100)));
        } catch {}

        // Update local state for immediate UI feedback (only if not already present)
        setRecentPlays((prev) => {
          const exists = prev.some((p) => p.clip_id === playRecord.clip_id);
          if (!exists) {
            const newPlays = [...prev, playRecord].slice(-10);
            notifyRecentPlaysUpdate(newPlays); // Notify parent component
            return newPlays;
          }
          return prev;
        });
      } catch {}
    }
  }, [musicGeneration.audioUrl, musicGeneration.status, recordPlay, notifyRecentPlaysUpdate]);

  // Load recent plays on component mount only
  useEffect(() => {
    fetchRecentPlays();
  }, []); // Empty dependency array - only run once on mount

  // Notify parent when recent plays are initially loaded
  useEffect(() => {
    if (recentPlays.length > 0) {
      notifyRecentPlaysUpdate(recentPlays);
    }
  }, [recentPlays.length]); // Only when length changes (initial load)

  // Expose replay function to parent
  useEffect(() => {
    if (onReplaySong) {
      onReplaySong(replayPreviousSong);
    }
  }, [onReplaySong, replayPreviousSong]);

  return (
    <>
      {/* Hidden video element for screen capture */}
      <div className="hidden">
        <video ref={videoRef} autoPlay muted playsInline />
        {/* Hidden audio element for music playback */}
        <audio ref={audioRef} controls autoPlay>
          {musicGeneration.audioUrl && (
            <source src={musicGeneration.audioUrl} type="audio/mpeg" />
          )}
        </audio>
      </div>
    </>
  );
}
