"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radar,
  LayoutDashboard,
  Boxes,
  Brain,
  Calculator,
  FileText,
  Settings,
  UserCog,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/commodities", label: "Komoditas", icon: Boxes },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/simulator", label: "Simulator", icon: Calculator },
  { href: "/reports", label: "Laporan", icon: FileText },
  { href: "/business-profile", label: "Profil Bisnis", icon: UserCog },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

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
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
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
