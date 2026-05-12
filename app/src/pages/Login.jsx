import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [notAuthorized, setNotAuthorized] = useState(false);

  // Cooldown timer — prevents rate-limit errors by disabling the button
  // for 60 seconds after each magic link send
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const startCooldown = useCallback(() => {
    setCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);
  useEffect(() => () => clearInterval(cooldownRef.current), []);

  // If already logged in, check authorization then redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-gradient)' }}>
        <div className="text-center">
          <div className="spinner-circle mx-auto mb-3" />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Signing you in...</div>
        </div>
      </div>
    );
  }

  if (user && !notAuthorized) {
    // Check if user is in allowed_users
    const checkAuth = async () => {
      const { data, error: fetchError } = await supabase
        .from('allowed_users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (fetchError || !data) {
        setNotAuthorized(true);
        return;
      }
    };
    checkAuth();

    if (!notAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      setSending(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname,
        },
      });

      if (signInError) {
        if (signInError.message?.includes('rate') || signInError.status === 429) {
          setError('Too many attempts. Please wait 60 seconds before trying again.');
          startCooldown();
        } else {
          setError(signInError.message);
        }
      } else {
        setSent(true);
        startCooldown(); // Prevent immediate re-send even after success
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setNotAuthorized(false);
    setSent(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient)' }}>
      <div
        className="text-white px-5 py-6 text-center"
        style={{
          background: 'linear-gradient(160deg, #0f0c29 0%, #1e1b4b 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}
        >
          Bandroll
        </h1>
        <div className="text-sm mt-1" style={{ color: 'rgba(240,238,255,0.5)' }}>HNPS Band Attendance</div>
      </div>

      <main className="p-5 max-w-[400px] mx-auto mt-8 animate-fadeIn">
        <div className="p-6" style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-card)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          {notAuthorized ? (
            <div className="text-center">
              <div className="text-3xl mb-3">&#128683;</div>
              <div className="text-base font-bold text-[var(--text-primary)] mb-2">Not Authorized</div>
              <div className="text-sm text-[var(--text-secondary)] mb-4">
                Your email is not authorized to use this app. Please contact the band coordinator.
              </div>
              <button
                onClick={handleSignOut}
                className="text-[#1a0a00] border-none rounded-xl px-5 py-3 text-sm font-bold cursor-pointer w-full active:scale-[0.98] transition-transform duration-200"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: 'var(--shadow-amber-glow)', fontFamily: 'var(--font-display)' }}
              >
                Sign in with a different account
              </button>
            </div>
          ) : sent ? (
            <div className="text-center">
              <div className="text-3xl mb-3">&#9993;</div>
              <div className="text-base font-bold text-[var(--text-primary)] mb-2">Check your email!</div>
              <div className="text-sm text-[var(--text-secondary)] mb-4">
                We've sent a sign-in link to <span className="font-semibold text-[var(--text-primary)]">{email}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Click the link in the email to sign in. You can close this page.
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="mt-4 text-sm text-[var(--accent-blue-light)] font-semibold underline cursor-pointer bg-transparent border-none"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <div className="text-base font-bold text-[var(--text-primary)] mb-1">Sign in to continue</div>
                <div className="text-sm text-[var(--text-secondary)]">Enter your email to receive a magic link</div>
              </div>

              <form onSubmit={handleSignIn}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  className="w-full px-4 py-3 border border-[var(--accent-blue-border)] rounded-xl text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] mb-3 outline-none focus:border-[var(--accent-blue)] transition-colors"
                />

                {error && (
                  <div className="text-[var(--accent-red)] text-sm mb-3 p-2.5 bg-[var(--accent-red-bg)] border border-[var(--accent-red-border)] rounded-lg">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || cooldown > 0}
                  className="text-[#1a0a00] border-none rounded-xl px-5 py-3 text-sm font-bold cursor-pointer w-full active:scale-[0.98] transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: 'var(--shadow-amber-glow)', fontFamily: 'var(--font-display)' }}
                >
                  {sending ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
