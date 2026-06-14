// =============================================================================
// SupplyWatch AI — Demo mode (Phase 9)
//
// Demo mode forces the app to render synthetic seed/mock data even when Supabase
// is configured. Useful for portfolio demos and screenshots with clean, stable
// numbers. It is controlled by a cookie so it persists across navigation and is
// readable in Server Components and the data layer.
//
// Precedence in the data layer:
//   1) demo cookie ON           -> always mock
//   2) NEXT_PUBLIC_DEMO_MODE    -> default when no cookie is set
//   3) otherwise                -> Supabase first, mock fallback
// =============================================================================

import { cookies } from "next/headers";

export const DEMO_COOKIE = "swai_demo";

/** Read the effective demo-mode state for the current request. */
export async function isDemoMode(): Promise<boolean> {
  const store = await cookies();
  const cookie = store.get(DEMO_COOKIE)?.value;
  if (cookie === "1") return true;
  if (cookie === "0") return false;
  // No explicit choice yet — fall back to the env default.
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
