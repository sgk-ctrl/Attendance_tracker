const variants = {
  primary: {
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    color: '#1a0a00',
    boxShadow: 'var(--shadow-amber-glow)',
    border: 'none',
    fontFamily: 'var(--font-display)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    boxShadow: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    fontFamily: 'var(--font-display)',
  },
  success: {
    background: 'linear-gradient(135deg, var(--accent-green), var(--accent-green-dark))',
    color: '#fff',
    boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
    border: 'none',
    fontFamily: 'var(--font-display)',
  },
};

export default function Button({ children, variant = 'primary', className = '', disabled, onClick, type = 'button' }) {
  const style = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      className={`block w-full py-4 px-4 rounded-[12px] text-base font-bold cursor-pointer transition-all duration-200 text-center min-h-[52px] active:scale-[0.98] ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={style}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
