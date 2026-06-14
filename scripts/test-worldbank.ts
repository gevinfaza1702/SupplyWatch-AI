// Quick functional check of the World Bank adapter's normalize() against a
// tidy long-format CSV. Run: npx tsx scripts/test-worldbank.ts
import { WorldBankSource } from "@/lib/data-sources/worldbank";

const csv = `date,series,value
2025-04,Sugar,0.21
2025-05,Sugar,0.22
2025-06,Coffee,2.10
2025-06,Unmapped Thing,99`;

async function main() {
  const adapter = new WorldBankSource();
  const records = await adapter.normalize({
    payload: Buffer.from(csv),
    fetchedFrom: "test",
    fetchedAt: new Date().toISOString(),
  });

  console.log("records:", records.length, "(expected 3 — Unmapped skipped)");
  console.log(JSON.stringify(records, null, 2));

  const ok =
    records.length === 3 &&
    records.every((r) =>
      r.kind === "commodity_price"
        ? ["sugar", "coffee"].includes(r.commoditySlug)
        : false,
    ) &&
    records.every((r) =>
      r.kind === "commodity_price" ? /^\d{4}-\d{2}-\d{2}$/.test(r.date) : false,
    );

  console.log(ok ? "\n✓ World Bank CSV mapping works" : "\n✗ mapping FAILED");
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
