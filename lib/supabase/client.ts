import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Passkeys (registerPasskey/signInWithPasskey) are an experimental API —
    // must opt in explicitly. Browser-only: the WebAuthn ceremony itself
    // runs via navigator.credentials, so this has no effect on the server
    // client in lib/supabase/server.ts.
    { auth: { experimental: { passkey: true } } }
  );
}
