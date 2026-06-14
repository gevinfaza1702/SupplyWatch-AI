import Link from "next/link";
import { Radar } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";

interface DashboardShellProps {
  title: string;
  description?: string;
  /** Right-aligned header content (e.g. actions, a demo-mode badge). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * App layout for authenticated/in-app pages: sidebar + header + content.
 * Used by /dashboard and (later) other in-app pages.
 */
export function DashboardShell({
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top brand bar */}
        <div className="flex h-14 items-center gap-2 border-b border-border bg-card px-4 font-semibold md:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-4 w-4" />
          </span>
          <Link href="/">
            SupplyWatch<span className="text-primary"> AI</span>
          </Link>
        </div>

        {/* Page header */}
        <header className="border-b border-border bg-card">
          <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/** Small badge to indicate the dashboard is rendering demo/mock data. */
export function DemoModeBadge() {
  return (
    <Badge variant="secondary" className="gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-risk-medium" />
      Mode Demo
    </Badge>
  );
}
