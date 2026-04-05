import { useNavigate } from 'react-router-dom';

export default function Header({ title = 'HNPS Junior Band', subtitle = 'Attendance', showBack = false, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[var(--blue-900)] to-[var(--blue-700)] text-white px-5 py-4 sticky top-0 z-[100] shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBack && (
            <button
              className="bg-white/15 border-none text-white w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-xl cursor-pointer flex items-center justify-center transition-colors duration-200 flex-shrink-0 mr-3 active:bg-white/30"
              onClick={handleBack}
              aria-label="Go back"
            >
              &#8249;
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">{title}</h1>
            <div className="text-[13px] opacity-85 mt-0.5">{subtitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
