interface MainContentProps {
  currentSong: string;
  mood: string;
  readingContent?: string;
  isCapturing?: boolean;
  musicGeneration?: {
    status: 'idle' | 'analyzing' | 'generating' | 'ready' | 'error'
    topics?: string
    tags?: string
    clipId?: string
    audioUrl?: string
    title?: string
    imageUrl?: string
    error?: string
  };
  captureStatus?: string;
}

export default function MainContent({ currentSong, mood, readingContent, isCapturing, musicGeneration, captureStatus }: MainContentProps) {
  return (
    <div 
      className="flex-1 p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <div className="max-w-4xl">
        <h1 
          className="text-3xl font-bold mb-8"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Adaptive Sound
        </h1>
        
        <div className="space-y-6">
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
              className="rounded-lg shadow-sm border p-4 bg-blue-50"
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
              <div className="flex items-center gap-4">
                {/* Album Cover */}
                <div className="flex-shrink-0">
                  {musicGeneration.imageUrl ? (
                    <img 
                      src={musicGeneration.imageUrl} 
                      alt="Album Cover"
                      className="w-16 h-16 rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.594-.471-3.076-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Track Info and Controls */}
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-lg font-semibold truncate mb-1"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {musicGeneration.title || 'Generated Track'}
                  </h3>
                  <p 
                    className="text-sm text-gray-500 mb-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {musicGeneration.topics || 'Adaptive Music'}
                  </p>
                  
                  {/* Audio Player */}
                  <audio controls autoPlay className="w-full" key={musicGeneration.audioUrl}>
                    <source src={musicGeneration.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          )}

          {/* Music Generation Status (for non-ready states) */}
          {musicGeneration && musicGeneration.status !== 'idle' && musicGeneration.status !== 'ready' && (
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
                Music Generation
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status:</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    musicGeneration.status === 'error' ? 'bg-red-100 text-red-800' :
                    musicGeneration.status === 'analyzing' ? 'bg-blue-100 text-blue-800' :
                    musicGeneration.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {musicGeneration.status === 'analyzing' ? 'Analyzing vibe...' :
                     musicGeneration.status === 'generating' ? 'Generating music...' :
                     musicGeneration.status === 'error' ? 'Error' : 'Processing...'}
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
              </div>
            </div>
          )}

          {/* What we're reading section */}
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
  );
}

// Helper functions for color manipulation
function cssVarToHex(cssVar: string): string {
  // This is a simplified version - in a real app you'd want more robust color parsing
  return '#3b82f6'; // fallback
}

function hexToRgba(hex: string, alpha: number): string {
  // Simplified - in production you'd want proper hex to rgba conversion
  return `rgba(59, 130, 246, ${alpha})`; // fallback
}
