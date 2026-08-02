import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// A render error used to unmount the whole tree to a silent blank <div> —
// "app shows blank screen" is a documented recurring failure in the RUNBOOK.
// The boundary turns that dead end into a one-tap reload, and stashes the
// message locally: a volunteer reading it out is this app's only diagnostic
// channel (no Sentry, on purpose — proportionate for 8 users).
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info);
    try {
      localStorage.setItem('hnps_last_error', JSON.stringify({
        message: String(error?.message || error),
        at: new Date().toISOString(),
      }));
    } catch { /* storage full — nothing else to do */ }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: 20, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
              Your attendance data is safe. Tap below to reload.
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--accent-blue)', color: 'var(--on-accent-fill)', border: 'none',
                borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Log-only handlers. The old window.onerror RETURNED TRUE, which marks the
// error as handled and suppresses default reporting — it actively hid the
// failures it existed to record. Never return true here.
window.onerror = function (msg, source, lineno, colno, error) {
  console.error('Global error:', msg, source, lineno, colno, error);
};

window.onunhandledrejection = function (event) {
  console.error('Unhandled promise rejection:', event.reason);
};

// Handle Supabase auth callback BEFORE React renders.
// Magic link redirects put auth tokens in the URL hash (#access_token=...),
// which conflicts with HashRouter (also uses hash for routing).
// Detect auth tokens, move them to a temp location for Supabase to process,
// then let the router take over with a clean hash.
const hash = window.location.hash;
if (hash && hash.includes('access_token=')) {
  // Extract the auth params from the hash
  const params = hash.substring(1); // remove the #
  // Store in sessionStorage so AuthContext can pick them up
  sessionStorage.setItem('supabase_auth_params', params);
  // Clean the URL for HashRouter
  window.location.hash = '#/';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
