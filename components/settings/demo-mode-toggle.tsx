"use client";

import { useTransition } from "react";
import { MonitorPlay } from "lucide-react";
import { setDemoMode } from "@/app/settings/demo-actions";
import { cn } from "@/lib/utils";

/**
 * Demo-mode switch. Submits a server action that flips the `swai_demo` cookie
 * and revalidates the app, so data-driven pages re-render against mock data
 * (on) or Supabase (off). Optimistic-feeling via useTransition.
 */
export function DemoModeToggle({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const form = new FormData();
    form.set("enabled", String(!enabled));
    startTransition(() => {
      void setDemoMode(form);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MonitorPlay className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">Mode Demo</p>
          <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
            Tampilkan data contoh yang stabil untuk demo/portofolio, meskipun
            Supabase sudah terkonfigurasi.
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Aktifkan mode demo"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
          enabled ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform",
            enabled ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
