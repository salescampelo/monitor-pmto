import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar configurados no .env.local');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Auth] Token refreshed automatically');
  }
  // SIGNED_OUT é tratado pelo listener da Root component — sem redirect aqui
});
