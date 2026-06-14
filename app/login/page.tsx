import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, Radar } from "lucide-react";
import { signInAction, signUpAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

interface LoginPageProps {
  searchParams: Promise<{
    mode?: string;
    next?: string;
    error?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const next = sanitizeNext(params.next ?? "");

  if (authEnvReady()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) redirect(next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-7 flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </span>
          <span>
            SupplyWatch<span className="text-primary"> AI</span>
          </span>
        </Link>

        <div className="mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">
            {mode === "signup" ? "Buat Akun" : "Masuk"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {mode === "signup"
              ? "Daftar untuk menyimpan insight, simulasi, dan laporan mingguan."
              : "Masuk untuk generate AI insight, menyimpan simulasi, dan mengunduh laporan."}
          </p>
        </div>

        {!authEnvReady() && (
          <Alert tone="error">
            Supabase belum aktif. Isi `NEXT_PUBLIC_SUPABASE_URL` dan
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`, lalu restart dev
            server.
          </Alert>
        )}

        {params.error ? <Alert tone="error">{params.error}</Alert> : null}
        {params.message ? <Alert tone="success">{params.message}</Alert> : null}

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1">
          <ModeLink
            active={mode === "signin"}
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Masuk
          </ModeLink>
          <ModeLink
            active={mode === "signup"}
            href={`/login?mode=signup&next=${encodeURIComponent(next)}`}
          >
            Daftar
          </ModeLink>
        </div>

        {mode === "signup" ? (
          <SignUpForm next={next} disabled={!authEnvReady()} />
        ) : (
          <SignInForm next={next} disabled={!authEnvReady()} />
        )}

        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Beranda
          </Link>
          <Link
            href="/dashboard"
            className="font-medium text-primary hover:underline"
          >
            Lihat demo
          </Link>
        </div>
      </div>
    </main>
  );
}

function SignInForm({
  next,
  disabled,
}: {
  next: string;
  disabled: boolean;
}) {
  return (
    <form action={signInAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        disabled={disabled}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Minimal 6 karakter"
        autoComplete="current-password"
        disabled={disabled}
      />
      <Button type="submit" className="w-full" disabled={disabled}>
        Masuk
      </Button>
    </form>
  );
}

function SignUpForm({
  next,
  disabled,
}: {
  next: string;
  disabled: boolean;
}) {
  return (
    <form action={signUpAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Nama"
        name="fullName"
        type="text"
        placeholder="Nama pemilik bisnis"
        autoComplete="name"
        disabled={disabled}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        placeholder="nama@email.com"
        autoComplete="email"
        disabled={disabled}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder="Minimal 6 karakter"
        autoComplete="new-password"
        disabled={disabled}
      />
      <Button type="submit" className="w-full" disabled={disabled}>
        Buat Akun
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  disabled,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        disabled={disabled}
      />
    </label>
  );
}

function ModeLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-lg border px-3 py-2 text-sm leading-6",
        tone === "error"
          ? "border-risk-high/25 bg-risk-high/5 text-risk-high"
          : "border-risk-low/25 bg-risk-low/5 text-risk-low",
      )}
    >
      {children}
    </div>
  );
}

function authEnvReady() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function sanitizeNext(value: string) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
