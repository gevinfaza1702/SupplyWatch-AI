import { redirect } from "next/navigation";
import { Building2, Info } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { saveBusinessProfile } from "@/app/business-profile/actions";
import { BUSINESS_TYPE_OPTIONS } from "@/lib/business-types";
import { cn } from "@/lib/utils";
import type { ProfileRow } from "@/types/database";

export const metadata = { title: "Profil Bisnis" };

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function BusinessProfilePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  let profile: ProfileRow | null = null;

  if (envReady) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/business-profile");

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as ProfileRow | null) ?? null;
  }

  return (
    <DashboardShell
      title="Profil Bisnis"
      description="Data ini dipakai untuk mempersonalisasi risk score dan insight AI."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {!envReady && (
          <Alert tone="error">
            Supabase belum aktif. Isi `NEXT_PUBLIC_SUPABASE_URL` dan
            `NEXT_PUBLIC_SUPABASE_ANON_KEY` di `.env.local`, lalu restart server.
          </Alert>
        )}
        {params.error ? <Alert tone="error">{params.error}</Alert> : null}
        {params.message ? <Alert tone="success">{params.message}</Alert> : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Detail Bisnis
            </CardTitle>
            <CardDescription>
              Lengkapi profil agar dashboard dan AI insight sesuai dengan kondisi
              bisnis Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveBusinessProfile} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nama Pemilik"
                  name="fullName"
                  defaultValue={profile?.full_name ?? ""}
                  placeholder="cth. Bu Sari"
                />
                <Field
                  label="Nama Bisnis"
                  name="companyName"
                  defaultValue={profile?.company_name ?? ""}
                  placeholder="cth. Sari Bakery"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Jenis Bisnis"
                  name="businessType"
                  defaultValue={profile?.business_type ?? "bakery"}
                  options={BUSINESS_TYPE_OPTIONS}
                />
                <Field
                  label="Lokasi"
                  name="location"
                  defaultValue={profile?.location ?? ""}
                  placeholder="cth. Jakarta"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Target Margin (%)"
                  name="targetMargin"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  defaultValue={
                    profile?.target_margin != null
                      ? String(profile.target_margin)
                      : "30"
                  }
                  placeholder="30"
                />
                <Field
                  label="Budget Bahan Baku / Bulan (Rp)"
                  name="monthlyBudget"
                  type="number"
                  min="0"
                  step="100000"
                  defaultValue={
                    profile?.monthly_raw_material_budget != null
                      ? String(profile.monthly_raw_material_budget)
                      : ""
                  }
                  placeholder="cth. 15000000"
                />
              </div>

              <SelectField
                label="Frekuensi Restock"
                name="restockFrequency"
                defaultValue={profile?.restock_frequency ?? "weekly"}
                options={[
                  { value: "daily", label: "Harian" },
                  { value: "weekly", label: "Mingguan" },
                  { value: "biweekly", label: "Dua mingguan" },
                  { value: "monthly", label: "Bulanan" },
                ]}
              />

              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0" />
                Jenis bisnis menentukan bobot komoditas, misalnya warung makan
                lebih sensitif ke beras, telur, ayam, cabai, dan minyak.
              </div>

              <Button type="submit" className="w-full" disabled={!envReady}>
                Simpan Profil
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <input
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
        "rounded-lg border px-3 py-2 text-sm leading-6",
        tone === "error"
          ? "border-risk-high/25 bg-risk-high/5 text-risk-high"
          : "border-risk-low/25 bg-risk-low/5 text-risk-low",
      )}
    >
      {children}
    </div>
  );
}
