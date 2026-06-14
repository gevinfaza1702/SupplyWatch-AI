import { NextResponse } from "next/server";
import { generateReportPdfDataUrl } from "@/lib/reports/generate-pdf";
import {
  generateWeeklyReportContent,
  mapReportRow,
  reportContentToJson,
} from "@/lib/reports/generate-report";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, ReportRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export async function POST() {
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
      { error: "Login diperlukan untuk generate laporan." },
      { status: 401 },
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum diset untuk menyimpan laporan." },
      { status: 500 },
    );
  }

  try {
    const content = await generateWeeklyReportContent(user.id);
    const pdfUrl = await generateReportPdfDataUrl(content);
    const insertPayload: ReportInsert = {
      user_id: user.id,
      title: content.title,
      period: content.period,
      content: reportContentToJson(content),
      pdf_url: pdfUrl,
    };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("reports")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Laporan gagal disimpan.", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      report: mapReportRow(data as ReportRow),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Laporan gagal dibuat.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
