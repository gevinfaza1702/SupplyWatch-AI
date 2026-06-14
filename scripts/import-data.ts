// =============================================================================
// SupplyWatch AI — Standalone import script (Phase 4)
//
// Run the data import from the CLI (outside Next.js). Useful for cron, CI, or
// local seeding via real/mock adapters.
//
// Usage:
//   npm run import                       # mock only (safe default)
//   npm run import -- worldbank fao      # try those sources, fall back to mock
//   npm run import -- worldbank --no-fallback
//
// Requires SUPABASE env vars in .env.local (URL + SERVICE_ROLE_KEY).
// =============================================================================

import { config } from "dotenv";
import {
  runImport,
  createImportAdminClient,
  type SourceKey,
} from "@/lib/data-sources/run-import";

// Load env from .env.local then .env (later calls don't override existing).
config({ path: ".env.local" });
config();

const VALID: SourceKey[] = ["worldbank", "fao", "bank-indonesia", "mock"];

function parseArgs(argv: string[]) {
  const args = argv.slice(2);
  const allowFallback = !args.includes("--no-fallback");
  const sources = args.filter(
    (a): a is SourceKey => (VALID as string[]).includes(a),
  );
  return {
    sources: sources.length ? sources : (["mock"] as SourceKey[]),
    allowFallback,
  };
}

async function main() {
  const { sources, allowFallback } = parseArgs(process.argv);

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error(
      "✗ Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env.local before importing.",
    );
    process.exit(1);
  }

  console.log(`→ Importing from: ${sources.join(", ")} (fallback: ${allowFallback})`);

  const admin = createImportAdminClient();
  const { results, totalImported } = await runImport({
    sources,
    allowFallback,
    admin,
  });

  for (const r of results) {
    const tag = r.status === "success" ? "✓" : "✗";
    const fb = r.usedFallback ? " (fallback→mock)" : "";
    console.log(
      `${tag} ${r.source}${fb}: ${r.recordsImported} records` +
        (r.errorMessage ? ` — ${r.errorMessage}` : ""),
    );
  }

  console.log(`\nTotal records imported: ${totalImported}`);
  const hadError = results.some((r) => r.status === "error");
  process.exit(hadError ? 1 : 0);
}

main().catch((err) => {
  console.error("✗ Import crashed:", err);
  process.exit(1);
});
