const variants = {
  primary: 'bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue-dark)] text-white shadow-[var(--shadow-glow)] active:scale-[0.98] active:shadow-[var(--shadow-sm)]',
  secondary: 'bg-transparent text-[#93c5fd] border border-[var(--accent-blue-border)]',
  success: 'bg-gradient-to-br from-[var(--accent-green)] to-[var(--accent-green-dark)] text-white shadow-[var(--shadow-md)] active:scale-[0.98]',
};

export default function Button({ children, variant = 'primary', className = '', disabled, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      className={`block w-full py-4 px-4 border-none rounded-xl text-base font-bold cursor-pointer transition-all duration-200 text-center min-h-[52px] ${variants[variant] || variants.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
