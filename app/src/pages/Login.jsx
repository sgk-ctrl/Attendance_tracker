import { useState } from 'react';
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

  // If already logged in, check authorization then redirect
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-circle mx-auto mb-3" />
          <div className="text-sm text-[var(--text-secondary)]">Signing you in...</div>
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
        if (signInError.message?.includes('rate')) {
          setError('Too many requests. Please wait a moment and try again.');
        } else {
          setError(signInError.message);
        }
      } else {
        setSent(true);
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
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header gradient matching the app */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white px-5 py-6 text-center border-b border-[rgba(59,130,246,0.1)]">
        <h1 className="text-2xl font-bold tracking-tight">HNPS Junior Band</h1>
        <div className="text-sm text-white/80 mt-1">Attendance Tracker</div>
      </div>

      <main className="p-5 max-w-[400px] mx-auto mt-8 animate-fadeIn">
        <div className="bg-[var(--bg-card)] rounded-[16px] p-6 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px]">
          {notAuthorized ? (
            <div className="text-center">
              <div className="text-3xl mb-3">&#128683;</div>
              <div className="text-base font-bold text-[var(--text-primary)] mb-2">Not Authorized</div>
              <div className="text-sm text-[var(--text-secondary)] mb-4">
                Your email is not authorized to use this app. Please contact the band coordinator.
              </div>
              <button
                onClick={handleSignOut}
                className="bg-[var(--accent-blue)] text-white border-none rounded-xl px-5 py-3 text-sm font-semibold cursor-pointer w-full shadow-[var(--shadow-glow)] active:scale-[0.98] transition-transform duration-200"
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
                  disabled={sending}
                  className="bg-[var(--accent-blue)] text-white border-none rounded-xl px-5 py-3 text-sm font-semibold cursor-pointer w-full shadow-[var(--shadow-glow)] active:scale-[0.98] transition-transform duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
