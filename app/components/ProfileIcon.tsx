interface ProfileIconProps {
  onClick?: () => void;
}

export default function ProfileIcon({ onClick }: ProfileIconProps) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        background: `linear-gradient(to bottom right, var(--color-primary), var(--color-secondary))`,
        '--tw-ring-color': 'var(--color-primary)'
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      U
    </button>
  );
}
