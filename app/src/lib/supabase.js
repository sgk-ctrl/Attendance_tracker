import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dirdanwihxwfuqldruoy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcmRhbndpaHh3ZnVxbGRydW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDQzMzcsImV4cCI6MjA5MDgyMDMzN30.k6r0ttZPvXWDr4gTBtP__fPYMX6DorpZjjMlXD5JfbE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
