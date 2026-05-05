// Consolidated server-side Supabase client
// This is the SINGLE source of truth for server-side Supabase — replaces both supabase.ts and supabase-server.ts
import { createServerClient as createSSRServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server client for API routes, Server Components, and Route Handlers.
 * Uses cookies() for session-based auth with httpOnly cookie handling.
 */
export function createClient() {
  const cookieStore = cookies();
  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch { /* Server Component — handled by middleware */ }
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }); } catch { /* Server Component — handled by middleware */ }
        },
      },
    }
  );
}

// Re-export as createServerClient for backward compatibility
export const createServerClient = createClient;
