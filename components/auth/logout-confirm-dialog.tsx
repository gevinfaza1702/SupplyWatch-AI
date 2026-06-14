"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { LogOut, X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoutConfirmDialogProps {
  /** Visual variant for the trigger button */
  variant?: "sidebar" | "destructive";
}

/**
 * Logout button with a confirmation modal.
 *
 * Renders a trigger button that opens an animated dialog asking the user to
 * confirm sign-out. On confirm it submits a POST form to /auth/sign-out
 * (matching the existing server route). Escape key and backdrop click dismiss.
 */
export function LogoutConfirmDialog({
  variant = "sidebar",
}: LogoutConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when modal opens
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    },
    [],
  );

  const handleConfirm = () => {
    setSubmitting(true);
    // Submit via a hidden form to POST /auth/sign-out
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/sign-out";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <>
      {/* Trigger button */}
      {variant === "destructive" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-10 px-4 py-2 [&_svg]:size-4 [&_svg]:shrink-0"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      )}

      {/* Modal overlay + dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="presentation"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

          {/* Dialog */}
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            className={cn(
              "relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl",
              "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200",
            )}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-7 w-7 text-destructive" />
            </div>

            {/* Content */}
            <h2
              id="logout-dialog-title"
              className="text-center text-lg font-semibold"
            >
              Yakin ingin keluar?
            </h2>
            <p
              id="logout-dialog-desc"
              className="mt-2 text-center text-sm text-muted-foreground"
            >
              Kamu akan keluar dari akun ini. Data yang belum disimpan mungkin
              hilang.
            </p>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Keluar...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Ya, Keluar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}