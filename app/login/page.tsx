import Link from "next/link";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Login placeholder (Phase 1). The real Supabase Auth form is built in the
 * auth phase. For now it explains demo mode and links back.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </span>
          SupplyWatch<span className="text-primary"> AI</span>
        </Link>

        <h1 className="text-xl font-semibold">Masuk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman login akan menggunakan Supabase Auth (dibangun pada fase
          berikutnya). Untuk saat ini, jelajahi produk lewat mode demo.
        </p>

        <div className="mt-6 space-y-2">
          <Button asChild className="w-full">
            <Link href="/dashboard">Lanjut ke Demo Dashboard</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
