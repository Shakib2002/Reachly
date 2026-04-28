import { createBrowserClient } from '@supabase/ssr';

// Browser client - for Client Components and Zustand stores ('use client' files)
// Does NOT use cookies() - safe to call in browser context
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
