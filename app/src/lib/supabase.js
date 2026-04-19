import { createClient } from '@supabase/supabase-js';

// Prefer env vars (set in Vercel dashboard or .env.local) with hardcoded fallback.
// The anon key is public-safe — RLS is enforced on all tables.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dirdanwihxwfuqldruoy.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcmRhbndpaHh3ZnVxbGRydW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDQzMzcsImV4cCI6MjA5MDgyMDMzN30.k6r0ttZPvXWDr4gTBtP__fPYMX6DorpZjjMlXD5JfbE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
