import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/login?message=Kamu sudah logout.", request.url), {
    status: 303,
  });
}

// Note: only POST is supported on purpose. A GET handler would let a logout be
// triggered via <img>/prefetch (logout CSRF). All sign-out UI uses POST forms.
