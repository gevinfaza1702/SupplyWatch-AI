"use client";

import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";

/** Client wrapper so Server-Component pages can render the logout dialog. */
export function SettingsLogoutButton() {
  return <LogoutConfirmDialog variant="destructive" />;
}