"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_TYPE_VALUES } from "@/lib/business-types";
import type { Database } from "@/types/database";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const schema = z.object({
  fullName: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(120).optional(),
  businessType: z.enum(BUSINESS_TYPE_VALUES),
  location: z.string().trim().max(120).optional(),
  targetMargin: z.coerce.number().min(0).max(100),
  monthlyBudget: z.coerce.number().min(0).optional(),
  restockFrequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
});

export async function saveBusinessProfile(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect(`/business-profile?error=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  const parsed = schema.safeParse({
    fullName: str(formData, "fullName"),
    companyName: str(formData, "companyName"),
    businessType: str(formData, "businessType"),
    location: str(formData, "location"),
    targetMargin: str(formData, "targetMargin"),
    monthlyBudget: str(formData, "monthlyBudget") || undefined,
    restockFrequency: str(formData, "restockFrequency"),
  });

  if (!parsed.success) {
    redirect(
      `/business-profile?error=${encodeURIComponent("Periksa kembali isian form.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/business-profile");
  }

  const update: ProfileUpdate = {
    full_name: parsed.data.fullName || null,
    company_name: parsed.data.companyName || null,
    business_type: parsed.data.businessType,
    location: parsed.data.location || null,
    target_margin: parsed.data.targetMargin,
    monthly_raw_material_budget: parsed.data.monthlyBudget ?? null,
    restock_frequency: parsed.data.restockFrequency,
  };

  // Upsert so it works whether or not a profile row exists yet.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...update } as never, { onConflict: "id" });

  if (error) {
    redirect(
      `/business-profile?error=${encodeURIComponent("Gagal menyimpan profil: " + error.message)}`,
    );
  }

  // Profile drives personalized insights/dashboard — refresh them.
  revalidatePath("/", "layout");
  redirect(
    `/business-profile?message=${encodeURIComponent("Profil bisnis tersimpan.")}`,
  );
}

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}
