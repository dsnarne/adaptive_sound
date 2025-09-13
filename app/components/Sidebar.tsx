import ProfileIcon from './ProfileIcon';
import ToggleSwitch from './ToggleSwitch';

interface SidebarProps {
  autoplay: boolean;
  fade: boolean;
  autoSwitch: boolean;
  onAutoplayChange: (enabled: boolean) => void;
  onFadeChange: (enabled: boolean) => void;
  onAutoSwitchChange: (enabled: boolean) => void;
  onProfileClick?: () => void;
  isCapturing?: boolean;
  onCaptureStateChange?: () => void;
}

export default function Sidebar({
  autoplay,
  fade,
  autoSwitch,
  onAutoplayChange,
  onFadeChange,
  onAutoSwitchChange,
  onProfileClick,
  isCapturing,
  onCaptureStateChange
}: SidebarProps) {
  return (
    <div 
      className="w-80 border-l p-6 flex flex-col"
      style={{ 
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)'
      }}
    >
      {/* Profile Section */}
      <div className="flex justify-center mb-8">
        <ProfileIcon onClick={onProfileClick} />
      </div>
      
      {/* Settings Section */}
      <div className="space-y-4">
        <h3 
          className="text-lg font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Settings
        </h3>
        
        <div 
          className="rounded-lg border p-4 space-y-1"
          style={{ 
            backgroundColor: 'var(--color-background)',
            borderColor: 'var(--color-border)'
          }}
        >
          <ToggleSwitch
            label="Autoplay"
            enabled={autoplay}
            onChange={onAutoplayChange}
          />
          
          <ToggleSwitch
            label="Fade"
            enabled={fade}
            disabled={!autoplay}
            onChange={onFadeChange}
          />
          
          <ToggleSwitch
            label="Auto-switch"
            enabled={autoSwitch}
            onChange={onAutoSwitchChange}
          />
        </div>
      </div>
      
      {/* Screen Capture Section */}
      <div className="mt-6">
        <button
          onClick={() => onCaptureStateChange?.()}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            isCapturing 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'text-white'
          }`}
          style={{ 
            backgroundColor: isCapturing ? undefined : 'var(--color-primary)',
            color: isCapturing ? undefined : 'white'
          }}
        >
          {isCapturing ? 'Stop Screen Capture' : 'Start Screen Capture'}
        </button>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Capture screen content to generate adaptive music
        </p>
      </div>
      
      {/* Footer */}
      <div className="mt-auto pt-8">
        <div 
          className="text-center text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p>Adaptive Sound v1.0</p>
          <p className="mt-1">Powered by Suno AI</p>
        </div>
      </div>
    </div>
  );
}
