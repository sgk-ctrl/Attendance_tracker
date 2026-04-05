import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title = 'HNPS Junior Band', subtitle = 'Attendance', showBack = false, onBack }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white px-5 py-4 sticky top-0 z-[100] shadow-[var(--shadow-md)] border-b border-[rgba(59,130,246,0.1)]">
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
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <div className="text-[13px] text-white/80 mt-0.5">{subtitle}</div>
          </div>
        </div>

        {user && (
          <div className="relative">
            <button
              className="bg-white/15 border-none text-white w-9 h-9 min-w-[36px] min-h-[36px] rounded-full text-sm cursor-pointer flex items-center justify-center transition-colors duration-200 active:bg-white/30"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
              title={user.email}
            >
              {user.email?.charAt(0).toUpperCase() || '?'}
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-[101]"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl shadow-[var(--shadow-md)] z-[102] min-w-[220px] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border-card)]">
                    <div className="text-xs text-[var(--text-muted)]">Signed in as</div>
                    <div className="text-sm text-[var(--text-primary)] font-medium truncate mt-0.5">{user.email}</div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-[var(--accent-red)] bg-transparent border-none cursor-pointer hover:bg-[var(--accent-red-bg)] transition-colors"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
