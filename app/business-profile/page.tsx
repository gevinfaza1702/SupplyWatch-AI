import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Business profile placeholder (Phase 1). The full setup form (business type,
 * location, margin target, budget, main commodities) is built in a later phase.
 */
export default function BusinessProfilePage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h1 className="text-2xl font-semibold">Profil Bisnis</h1>
        <p className="mt-3 text-muted-foreground">
          Form profil bisnis (jenis bisnis, lokasi, margin target, budget bahan
          baku) akan dibangun pada fase berikutnya untuk mempersonalisasi
          insight.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </div>
  );
}
