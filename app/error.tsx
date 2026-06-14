"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Root error boundary. Catches uncaught render/data errors in any route and
 * offers recovery (retry or go home) instead of a blank crash.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where you'd report to an error tracker (Sentry, etc).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <ErrorState
        className="max-w-md bg-card"
        title="Terjadi kesalahan"
        message="Maaf, terjadi masalah saat memuat halaman ini. Coba lagi atau kembali ke beranda."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={reset}>Coba lagi</Button>
            <Button asChild variant="outline">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
