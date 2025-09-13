interface MainContentProps {
  currentSong: string;
  mood: string;
  readingContent?: string;
}

export default function MainContent({ currentSong, mood, readingContent }: MainContentProps) {
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
                  Current Song:
                </h2>
                <p 
                  className="text-xl font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {currentSong || 'No song playing'}
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
                  className="text-xl font-medium capitalize"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {mood || 'Detecting mood...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Music Player Visualization */}
          <div 
            className="rounded-lg p-6 border"
            style={{ 
              background: `linear-gradient(to right, ${hexToRgba(cssVarToHex('var(--color-primary)'), 0.1)}, ${hexToRgba(cssVarToHex('var(--color-secondary)'), 0.1)})`,
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(to bottom right, var(--color-primary), var(--color-secondary))`
                }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M13.828 7.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 4.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <div 
                  className="h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--color-border)' }}
                >
                  <div 
                    className="h-full rounded-full w-1/3 animate-pulse"
                    style={{ 
                      background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`
                    }}
                  ></div>
                </div>
                <p 
                  className="text-sm mt-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {currentSong ? 'Now playing...' : 'Ready to generate music'}
                </p>
              </div>
            </div>
          </div>

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
              What we're reading:
            </h2>
            <div 
              className="text-sm leading-relaxed"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {readingContent || 'Analyzing webpage content to generate personalized music based on the mood and themes detected in the text...'}
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
