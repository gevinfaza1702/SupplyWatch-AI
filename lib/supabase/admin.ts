import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin Supabase client using the SERVICE ROLE key.
 *
 * ⚠️ SERVER-ONLY. This client BYPASSES Row Level Security and has full database
 * access. The `server-only` import above makes the build fail if this file is
 * ever imported into client code.
 *
 * Use it strictly for trusted server tasks: data imports, seeding, scheduled
 * jobs, and writes to shared/public tables. Never for handling untrusted user
 * input without explicit authorization checks.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. The admin client requires it.",
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
