import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bot,
  Database,
  KeyRound,
  MonitorPlay,
  ReceiptText,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DemoModeToggle } from "@/components/settings/demo-mode-toggle";
import { SettingsLogoutButton } from "@/components/settings/settings-logout-button";
import { isDemoMode } from "@/lib/demo-mode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { BUSINESS_TYPE_LABELS } from "@/lib/business-types";
import type { ProfileRow } from "@/types/database";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const env = getEnvironmentStatus();
  const account = await getAccount();
  const demoEnabled = await isDemoMode();

  if (env.supabaseReady && !account.userEmail) {
    redirect("/login?next=/settings");
  }

  return (
    <DashboardShell
      title="Pengaturan"
      description="Status akun, koneksi Supabase, dan konfigurasi AI server-side."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              Akun
            </CardTitle>
            <CardDescription>
              Informasi session dan profil yang dipakai untuk personalisasi
              insight.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              label="Status login"
              value={
                account.userEmail ? (
                  <StatusBadge tone="ready">Aktif</StatusBadge>
                ) : (
                  <StatusBadge tone="missing">Belum login</StatusBadge>
                )
              }
            />
            <StatusRow label="Email" value={account.userEmail ?? "-"} />
            <StatusRow
              label="Nama"
              value={account.profile?.full_name ?? "-"}
            />
            <StatusRow
              label="Bisnis"
              value={
                account.profile?.business_type
                  ? BUSINESS_TYPE_LABELS[account.profile.business_type]
                  : "-"
              }
            />
            <StatusRow
              label="Target margin"
              value={
                account.profile?.target_margin == null
                  ? "-"
                  : `${account.profile.target_margin}%`
              }
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href="/business-profile">Edit Profil Bisnis</Link>
              </Button>
              {account.userEmail ? (
                <SettingsLogoutButton />
              ) : (
                <Button asChild>
                  <Link href="/login?next=/settings">Masuk</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Keamanan
            </CardTitle>
            <CardDescription>
              Secret hanya dipakai server dan tidak dikirim ke client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              label="Auth"
              value={
                env.supabaseReady ? (
                  <StatusBadge tone="ready">Siap</StatusBadge>
                ) : (
                  <StatusBadge tone="missing">Belum siap</StatusBadge>
                )
              }
            />
            <StatusRow
              label="Service role"
              value={
                env.serviceRoleReady ? (
                  <StatusBadge tone="ready">Server only</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Belum diisi</StatusBadge>
                )
              }
            />
            <p className="text-sm leading-6 text-muted-foreground">
              Jangan pernah menaruh service role key di env yang diawali
              `NEXT_PUBLIC_`.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Supabase
            </CardTitle>
            <CardDescription>
              Koneksi database dan API key publik untuk browser/server session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              label="Project URL"
              value={
                env.supabaseUrlReady ? (
                  <StatusBadge tone="ready">Terisi</StatusBadge>
                ) : (
                  <StatusBadge tone="missing">Kosong</StatusBadge>
                )
              }
            />
            <StatusRow
              label="Publishable key"
              value={
                env.supabaseAnonReady ? (
                  <StatusBadge tone="ready">Terisi</StatusBadge>
                ) : (
                  <StatusBadge tone="missing">Kosong</StatusBadge>
                )
              }
            />
            <StatusRow
              label="Database mode"
              value={
                env.supabaseReady ? (
                  <StatusBadge tone="ready">Supabase</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Demo fallback</StatusBadge>
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              Aktivitas Tersimpan
            </CardTitle>
            <CardDescription>
              Jumlah data user yang sudah tersimpan di Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow
              label="AI insights"
              value={String(account.stats.insights)}
            />
            <StatusRow
              label="Simulasi"
              value={String(account.stats.simulations)}
            />
            <StatusRow
              label="Laporan"
              value={String(account.stats.reports)}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/insights">Buka Insights</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/simulator">Buka Simulator</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4" />
              Mode Demo
            </CardTitle>
            <CardDescription>
              Pakai data contoh yang stabil untuk demo dan portofolio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DemoModeToggle enabled={demoEnabled} />
            <p className="text-sm leading-6 text-muted-foreground">
              Saat aktif, dashboard dan komoditas memakai seed data demo. Saat
              nonaktif, aplikasi membaca data asli dari Supabase (jika tersedia).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Provider
            </CardTitle>
            <CardDescription>
              Provider AI bisa diganti lewat `.env.local` tanpa ubah kode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusRow label="Provider" value={env.aiProvider} />
            <StatusRow label="Model" value={env.aiModel} />
            <StatusRow
              label="API key"
              value={
                env.aiKeyReady ? (
                  <StatusBadge tone="ready">Terisi</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Fallback rule-based</StatusBadge>
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Catatan Setup
            </CardTitle>
            <CardDescription>
              Checklist singkat supaya fitur simpan dan laporan berjalan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Jalankan migration `001`, `002`, `003`, lalu `seed.sql`.</li>
              <li>Isi URL, publishable key, dan service role key di `.env.local`.</li>
              <li>Set Auth Site URL Supabase ke `http://localhost:3000`.</li>
              <li>Set Redirect URL ke `http://localhost:3000/auth/callback`.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

async function getAccount() {
  const emptyStats = { insights: 0, simulations: 0, reports: 0 };
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {
      userEmail: null,
      profile: null as ProfileRow | null,
      stats: emptyStats,
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        userEmail: null,
        profile: null as ProfileRow | null,
        stats: emptyStats,
      };
    }

    const [profileResult, insightsResult, simulationsResult, reportsResult] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase
          .from("ai_insights")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("simulation_results")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("reports")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

    return {
      userEmail: user.email ?? null,
      profile: (profileResult.data as ProfileRow | null) ?? null,
      stats: {
        insights: insightsResult.count ?? 0,
        simulations: simulationsResult.count ?? 0,
        reports: reportsResult.count ?? 0,
      },
    };
  } catch {
    return {
      userEmail: null,
      profile: null as ProfileRow | null,
      stats: emptyStats,
    };
  }
}

function getEnvironmentStatus() {
  const aiProvider = process.env.AI_PROVIDER || "sumopod";
  return {
    supabaseUrlReady: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonReady: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseReady: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    serviceRoleReady: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    aiProvider,
    aiModel: process.env.AI_MODEL || defaultModel(aiProvider),
    aiKeyReady: hasAiKey(aiProvider),
  };
}

function hasAiKey(provider: string) {
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  return Boolean(process.env.SUMOPOD_API_KEY);
}

function defaultModel(provider: string) {
  if (provider === "openai") return "gpt-4o-mini";
  if (provider === "gemini") return "gemini-1.5-flash";
  return "MiniMax-M2.7-highspeed";
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "ready" | "warning" | "missing";
  children: React.ReactNode;
}) {
  const className =
    tone === "ready"
      ? "border-risk-low/20 bg-risk-low/10 text-risk-low"
      : tone === "warning"
        ? "border-risk-medium/20 bg-risk-medium/10 text-risk-medium"
        : "border-risk-high/20 bg-risk-high/10 text-risk-high";

  return (
    <Badge variant="outline" className={className}>
      {children}
    </Badge>
  );
}
