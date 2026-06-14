"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runImport, type SourceKey } from "@/lib/data-sources/run-import";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const VALID_SOURCES: SourceKey[] = [
  "mock",
  "worldbank",
  "fao",
  "bank-indonesia",
];

export async function runManualImport(formData: FormData) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect(`/data?error=${encodeURIComponent("Supabase belum dikonfigurasi.")}`);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect(
      `/data?error=${encodeURIComponent(
        "SUPABASE_SERVICE_ROLE_KEY belum tersedia, import manual tidak bisa dijalankan.",
      )}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/data");
  }

  const requested = formData.getAll("sources").filter(
    (value): value is SourceKey =>
      typeof value === "string" && VALID_SOURCES.includes(value as SourceKey),
  );
  const sources = requested.length ? requested : (["mock"] as SourceKey[]);

  let totalImported = 0;
  try {
    const admin = createAdminClient();
    const result = await runImport({
      admin,
      sources,
      allowFallback: true,
    });
    totalImported = result.totalImported;
  } catch (error) {
    redirect(
      `/data?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Import gagal dijalankan.",
      )}`,
    );
  }

  revalidatePath("/", "layout");
  redirect(
    `/data?message=${encodeURIComponent(
      `Import selesai. ${totalImported} record diproses.`,
    )}`,
  );
}
