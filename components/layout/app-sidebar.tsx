"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  LayoutDashboard,
  Boxes,
  Brain,
  Calculator,
  Database,
  FileText,
  Settings,
  UserCog,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/commodities", label: "Komoditas", icon: Boxes },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/simulator", label: "Simulator", icon: Calculator },
  { href: "/reports", label: "Laporan", icon: FileText },
  { href: "/data", label: "Data", icon: Database },
  { href: "/business-profile", label: "Profil Bisnis", icon: UserCog },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

const mobileNav = nav.filter((item) =>
  ["/dashboard", "/commodities", "/insights", "/simulator", "/reports"].includes(
    item.href,
  ),
);

interface AppSidebarProps {
  userEmail?: string | null;
}

/** Persistent in-app sidebar. Hidden on mobile (DashboardShell adds a top bar). */
export function AppSidebar({ userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radar className="h-4 w-4" />
        </span>
        <Link href="/">
          SupplyWatch<span className="text-primary"> AI</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        {userEmail ? (
          <div className="space-y-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Login sebagai</p>
              <p className="truncate text-sm font-medium">{userEmail}</p>
            </div>
            <LogoutConfirmDialog variant="sidebar" />
          </div>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            Masuk
          </Link>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Insight bersifat estimasi, bukan kepastian harga pasar.
        </p>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}