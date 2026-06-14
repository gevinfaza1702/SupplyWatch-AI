import { NextResponse, type NextRequest } from "next/server";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNext(requestUrl.searchParams.get("next") ?? "");

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return redirectToLogin(requestUrl, "Supabase belum dikonfigurasi.", next);
  }

  if (!code) {
    return redirectToLogin(requestUrl, "Kode auth tidak ditemukan.", next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToLogin(
      requestUrl,
      "Sesi login gagal dibuat. Coba login ulang.",
      next,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureProfileForUser(supabase, user);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

function redirectToLogin(originUrl: URL, message: string, next: string) {
  const url = new URL("/login", originUrl.origin);
  url.searchParams.set("error", message);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

function sanitizeNext(value: string) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
