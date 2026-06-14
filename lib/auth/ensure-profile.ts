import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

export async function ensureProfileForUser(
  supabase: SupabaseServerClient,
  user: User,
  fullName?: string | null,
) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Gagal membaca profil user: ${selectError.message}`);
  }

  if (existing) return;

  const profile: ProfileInsert = {
    id: user.id,
    full_name:
      fullName ??
      getStringMetadata(user, "full_name") ??
      getStringMetadata(user, "name") ??
      user.email ??
      null,
    company_name: null,
    business_type: "bakery",
    location: null,
    target_margin: 35,
    monthly_raw_material_budget: null,
    restock_frequency: "weekly",
  };

  const { error: insertError } = await supabase
    .from("profiles")
    .insert(profile as never);

  if (insertError) {
    throw new Error(`Gagal membuat profil user: ${insertError.message}`);
  }
}

function getStringMetadata(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
