import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key for RLS-bypassing operations
// Ensure these environment variables are set:
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY (server-only)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

// Do NOT throw during module evaluation to avoid HTML error responses in API routes.
// Instead, export null and let route handlers respond with JSON errors.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : (null as any);