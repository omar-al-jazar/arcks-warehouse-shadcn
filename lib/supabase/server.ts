import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

// Server-side code runs inside the `app` container, so it must reach
// Supabase via the internal Docker network address (SUPABASE_URL=http://kong:8000),
// not the browser-facing NEXT_PUBLIC_SUPABASE_URL (http://localhost:8000).
// Falls back to NEXT_PUBLIC_SUPABASE_URL for non-Docker local dev.
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;

// NEXT_PUBLIC_SUPABASE_ANON_KEY is inlined into the JS bundle at `next build`
// time (it's a Next.js "public" env var), so the docker-compose runtime value
// never reaches code that only reads NEXT_PUBLIC_SUPABASE_ANON_KEY — the
// Dockerfile bakes in a placeholder there since the real key isn't known at
// build time. SUPABASE_ANON_KEY is a plain env var, read live at runtime.
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a new server client per request — it configures fetch calls using
// that request's cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore because the
            // proxy refreshes the session on every request.
          }
        },
      },
    }
  );
}

// Admin client using the service_role key. Server-only — never import this
// from a Client Component. Bypasses RLS, so use sparingly (seeding, and
// creating auth users from the owner's "add manager" flow later).
export function createAdminClient() {
  return createServerClient<Database>(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
