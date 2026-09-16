import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/lib/env";

// Server-side client — safe to use in Server Components, Route Handlers,
// and Server Actions. Uses the anon key + the user's session cookie,
// so Row Level Security still applies. Never import the service-role
// key here or anywhere that ships to the client.
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabasePublicEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component with no writable cookie store —
            // safe to ignore because middleware refreshes the session instead.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // see note above
          }
        },
      },
    }
  );
}

// Admin-only client. ONLY import this inside server-only code paths
// (route handlers / server actions gated by an is_admin() check) —
// never inside a file that could be bundled for the client.
export function createServiceRoleClient() {
  const { createClient } = require("@supabase/supabase-js");
  const { url } = getSupabasePublicEnv();

  return createClient(
    url,
    getSupabaseServiceRoleKey(),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
