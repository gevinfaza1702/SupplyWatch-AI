import { NextResponse } from "next/server";
import { mapReportRow } from "@/lib/reports/generate-report";
import { createClient } from "@/lib/supabase/server";
import type { ReportRow } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi di environment server." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Login diperlukan untuk melihat laporan." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: "Daftar laporan gagal dimuat.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    reports: ((data ?? []) as ReportRow[]).map(mapReportRow),
  });
}
