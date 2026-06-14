"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { DEMO_COOKIE } from "@/lib/demo-mode";

/**
 * Toggle demo mode. Writes a 1-year cookie ("1" = on, "0" = off) and
 * revalidates the app so data-driven pages re-render against the new source.
 */
export async function setDemoMode(formData: FormData) {
  const enabled = formData.get("enabled") === "true";
  const store = await cookies();

  store.set(DEMO_COOKIE, enabled ? "1" : "0", {
    httpOnly: false, // readable client-side too; not a secret
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // Re-render every data-driven page with the new source.
  revalidatePath("/", "layout");
}
