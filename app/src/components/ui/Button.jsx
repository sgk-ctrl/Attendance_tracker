const variants = {
  primary: 'bg-gradient-to-br from-[var(--blue-600)] to-[var(--blue-700)] text-white shadow-[var(--shadow-md)] active:scale-[0.98] active:shadow-[var(--shadow-sm)]',
  secondary: 'bg-white text-[var(--blue-700)] border-2 border-[var(--blue-600)]',
  success: 'bg-gradient-to-br from-[var(--green-500)] to-[var(--green-600)] text-white shadow-[var(--shadow-md)] active:scale-[0.98]',
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
