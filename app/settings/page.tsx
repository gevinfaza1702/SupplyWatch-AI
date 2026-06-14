import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bot,
  Database,
  KeyRound,
  LogOut,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
import type { BusinessType, ProfileRow } from "@/types/database";

export const metadata = { title: "Pengaturan" };

const BUSINESS_LABELS: Record<BusinessType, string> = {
  bakery: "Bakery",
  coffee_shop: "Coffee Shop",
  restaurant: "Restaurant",
};

export default async function SettingsPage() {
  const env = getEnvironmentStatus();
  const account = await getAccount();

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
                  ? BUSINESS_LABELS[account.profile.business_type]
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
                <form action="/auth/sign-out" method="post">
                  <Button type="submit" variant="destructive">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </form>
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
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { userEmail: null, profile: null as ProfileRow | null };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { userEmail: null, profile: null as ProfileRow | null };
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      userEmail: user.email ?? null,
      profile: (data as ProfileRow | null) ?? null,
    };
  } catch {
    return { userEmail: null, profile: null as ProfileRow | null };
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
