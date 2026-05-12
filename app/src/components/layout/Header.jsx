import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title = 'Bandroll', subtitle = 'Attendance', showBack = false, onBack }) {
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
    <div
      className="text-white px-5 py-4 sticky top-0 z-[100]"
      style={{
        background: 'linear-gradient(160deg, #0f0c29 0%, #1e1b4b 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        position: 'relative',
      }}
    >
      {/* Music staff texture */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '20px',
          background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 4px, rgba(255,255,255,0.035) 4px, rgba(255,255,255,0.035) 5px)',
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center justify-between relative">
        <div className="flex items-center">
          {showBack && (
            <button
              className="border-none text-white w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-xl cursor-pointer flex items-center justify-center transition-colors duration-200 flex-shrink-0 mr-3 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)' }}
              onClick={handleBack}
              aria-label="Go back"
            >
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 22 }}>‹</span>
            </button>
          )}
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px', color: '#f0eeff' }}
            >
              {title}
            </h1>
            <div className="text-[12px] mt-0.5" style={{ color: 'rgba(240,238,255,0.45)' }}>{subtitle}</div>
          </div>
        </div>

        {user && (
          <div className="relative">
            <button
              className="border-none text-white w-11 h-11 min-w-[44px] min-h-[44px] rounded-full text-base font-semibold cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-display)' }}
              onClick={() => setShowMenu(!showMenu)}
              aria-label="User menu"
              aria-expanded={showMenu}
              title={user.email}
            >
              {user.email?.charAt(0).toUpperCase() || '?'}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-[101]"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 rounded-[16px] shadow-[var(--shadow-md)] z-[102] min-w-[220px] overflow-hidden"
                  style={{
                    background: 'rgba(30,27,75,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Signed in as</div>
                    <div className="text-sm font-medium truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{user.email}</div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 text-sm bg-transparent border-none cursor-pointer transition-colors"
                    style={{ color: 'var(--accent-red)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--accent-red-bg)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
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
