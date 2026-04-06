import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handlers
window.onerror = function(msg, source, lineno, colno, error) {
  console.error('Global error:', msg, source, lineno, colno, error);
  return true;
};

window.onunhandledrejection = function(event) {
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
    <App />
  </StrictMode>
);
