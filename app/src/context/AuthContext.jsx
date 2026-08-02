import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { purgeLocalData } from '../lib/utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // allowed_users verdict, keyed by the email it was computed for so a
  // sign-out/sign-in never reuses a stale verdict.
  const [verdict, setVerdict] = useState({ email: null, allowed: null });

  useEffect(() => {
    // Check if we have auth params stored from a magic link redirect
    const storedParams = sessionStorage.getItem('supabase_auth_params');
    if (storedParams) {
      sessionStorage.removeItem('supabase_auth_params');
      // Parse the auth params and set the session
      const params = new URLSearchParams(storedParams);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }).catch(() => {
          setLoading(false);
        });
        return;
      }
    }

    // Normal flow: check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Authorization check: is this signed-in email in allowed_users?
  const userEmail = user?.email || null;
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    supabase
      .from('allowed_users')
      .select('id')
      .ilike('email', userEmail) // case-insensitive, matching is_allowed_user()
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) setVerdict({ email: userEmail, allowed: !error && !!data });
      });
    return () => { cancelled = true; };
  }, [userEmail]);

  // null = no user, or the check for THIS email hasn't finished yet.
  // Routes must treat null as "still loading", never as authorized —
  // redirecting before the verdict lands lets any authenticated email in.
  const authorized = userEmail && verdict.email === userEmail ? verdict.allowed : null;

  const signOut = async () => {
    // Children's names must not outlive the session on this device.
    purgeLocalData();
    await supabase.auth.signOut();
    setUser(null);
    setVerdict({ email: null, allowed: null });
  };

  return (
    <AuthContext.Provider value={{ user, loading, authorized, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
