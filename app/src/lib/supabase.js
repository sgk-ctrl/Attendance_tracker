import { createClient } from '@supabase/supabase-js';

// Prefer env vars (set in Vercel dashboard or .env.local) with hardcoded fallback.
// The anon key is public-safe — RLS is enforced on all tables.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dirdanwihxwfuqldruoy.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcmRhbndpaHh3ZnVxbGRydW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDQzMzcsImV4cCI6MjA5MDgyMDMzN30.k6r0ttZPvXWDr4gTBtP__fPYMX6DorpZjjMlXD5JfbE';

// Requests are made from a school hall on patchy reception, which produces
// STALLED connections rather than fast failures. Without a timeout a stalled
// request never rejects: the save spinner runs forever, the catch block that
// stashes attendance locally never fires, and the volunteer force-quits losing
// the whole roll call. An AbortController turns a stall into a rejection, which
// the existing offline path already knows how to handle.
export const REQUEST_TIMEOUT_MS = 10000;

function fetchWithTimeout(input, init = {}) {
  // Respect a caller-supplied signal (supabase-js passes one for realtime).
  if (init.signal) return fetch(input, init);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: fetchWithTimeout },
});
