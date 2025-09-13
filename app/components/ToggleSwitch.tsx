interface ToggleSwitchProps {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

export default function ToggleSwitch({ label, enabled, disabled = false, onChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <span 
        className="text-sm font-medium"
        style={{ 
          color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'
        }}
      >
        {label}
      </span>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{
          backgroundColor: disabled 
            ? 'var(--color-border)' 
            : enabled 
              ? 'var(--color-primary)' 
              : 'var(--color-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          '--tw-ring-color': 'var(--color-primary)'
        } as React.CSSProperties}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
          style={{ opacity: disabled ? 0.5 : 1 }}
        />
      </button>
    </div>
  );
}
