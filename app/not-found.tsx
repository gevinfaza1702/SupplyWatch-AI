import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/** 404 page — keeps users in-flow with a route back to the dashboard. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
      <EmptyState
        className="max-w-md bg-card"
        icon={Compass}
        title="Halaman tidak ditemukan"
        message="Halaman yang Anda cari tidak ada atau sudah dipindahkan."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild>
              <Link href="/dashboard">Ke Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Beranda</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
