// =============================================================================
// POST /api/import/run — trigger a data import (Phase 4)
//
// Protected by ADMIN_IMPORT_TOKEN (server-only env). Intended for dev/admin and
// scheduled jobs (Vercel Cron / GitHub Actions), NOT public users.
//
// Auth: send the token via header `x-admin-token: <token>` OR
// `Authorization: Bearer <token>`.
//
// Body (JSON, optional):
//   { "sources": ["mock"], "allowFallback": true }
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { runImport, type SourceKey } from "@/lib/data-sources/run-import";
import { createAdminClient } from "@/lib/supabase/admin";

// Import touches Node APIs (Buffer, service-role client) — force Node runtime.
export const runtime = "nodejs";
// Never cache a mutation endpoint.
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sources: z
    .array(z.enum(["worldbank", "fao", "bank-indonesia", "mock"]))
    .optional(),
  allowFallback: z.boolean().optional(),
});

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_IMPORT_TOKEN;
  if (!expected) return false; // fail closed if not configured

  const headerToken = req.headers.get("x-admin-token");
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;

  return headerToken === expected || bearer === expected;
}

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_IMPORT_TOKEN) {
    return NextResponse.json(
      { error: "Import is disabled: ADMIN_IMPORT_TOKEN is not set on the server." },
      { status: 503 },
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is not set." },
      { status: 500 },
    );
  }

  // Parse body (tolerate empty body).
  let parsedBody: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.text();
    if (raw.trim()) {
      const json = JSON.parse(raw);
      const result = bodySchema.safeParse(json);
      if (!result.success) {
        return NextResponse.json(
          { error: "Invalid body", details: result.error.flatten() },
          { status: 400 },
        );
      }
      parsedBody = result.data;
    }
  } catch {
    return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
  }

  const sources: SourceKey[] = parsedBody.sources ?? ["mock"];
  const allowFallback = parsedBody.allowFallback ?? true;

  try {
    const admin = createAdminClient();
    const { results, totalImported } = await runImport({
      sources,
      allowFallback,
      admin,
    });
    const hadError = results.some((r) => r.status === "error");
    return NextResponse.json(
      { ok: !hadError, totalImported, results },
      { status: hadError ? 207 : 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
