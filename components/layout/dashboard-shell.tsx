import Link from "next/link";
import { LogIn, Radar } from "lucide-react";
import { AppSidebar, MobileBottomNav } from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

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
export async function DashboardShell({
  title,
  description,
  actions,
  children,
}: DashboardShellProps) {
  const userEmail = await getUserEmail();

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AppSidebar userEmail={userEmail} />

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
            <div className="flex items-center gap-2">
              {actions}
              {!userEmail && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">
                    <LogIn className="h-4 w-4" />
                    Masuk
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
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

async function getUserEmail() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}
