import { redirect } from "next/navigation";
import {
  Activity,
  Database,
  FileClock,
  Play,
  ShieldAlert,
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
import { runManualImport } from "@/app/data/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { DataImportLogRow } from "@/types/database";

export const metadata = { title: "Data" };

type DataStatus = {
  envReady: boolean;
  serviceRoleReady: boolean;
  commodities: number | null;
  commodityPrices: number | null;
  exchangeRates: number | null;
  importLogs: DataImportLogRow[];
};

interface DataPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function DataPage({ searchParams }: DataPageProps) {
  const params = await searchParams;
  const status = await getDataStatus();

  if (status.envReady) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/data");
  }

  return (
    <DashboardShell
      title="Data"
      description="Status data komoditas, kurs, dan import log untuk kebutuhan demo/admin."
    >
      <div className="space-y-6">
        {params.error ? <Alert tone="error">{params.error}</Alert> : null}
        {params.message ? <Alert tone="success">{params.message}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={Database}
            label="Komoditas"
            value={formatCount(status.commodities)}
          />
          <MetricCard
            icon={Activity}
            label="Harga komoditas"
            value={formatCount(status.commodityPrices)}
          />
          <MetricCard
            icon={Activity}
            label="Kurs USD/IDR"
            value={formatCount(status.exchangeRates)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileClock className="h-4 w-4 text-primary" />
                Import log terakhir
              </CardTitle>
              <CardDescription>
                Log hanya tersedia jika service role key aktif.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.importLogs.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="border-b border-border text-left text-muted-foreground">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Source</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 text-right font-medium">
                          Records
                        </th>
                        <th className="py-2 pr-4 font-medium">Mulai</th>
                        <th className="py-2 pr-4 font-medium">Selesai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {status.importLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border/60">
                          <td className="py-3 pr-4 font-medium">{log.source}</td>
                          <td className="py-3 pr-4">
                            <ImportStatusBadge status={log.status} />
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {log.records_imported ?? "-"}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {formatDate(log.started_at)}
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {log.finished_at ? formatDate(log.finished_at) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada log import, atau service role key belum tersedia.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="h-4 w-4 text-primary" />
                Import manual
              </CardTitle>
              <CardDescription>
                Untuk dev/demo. Import memakai service role di server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <StatusRow
                  label="Supabase"
                  ready={status.envReady}
                  readyText="Aktif"
                  missingText="Belum aktif"
                />
                <StatusRow
                  label="Service role"
                  ready={status.serviceRoleReady}
                  readyText="Aktif"
                  missingText="Belum diisi"
                />
              </div>

              <form action={runManualImport} className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="sources"
                    value="mock"
                    defaultChecked
                    className="h-4 w-4 rounded border-border"
                  />
                  Seed/demo data
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="sources"
                    value="bank-indonesia"
                    className="h-4 w-4 rounded border-border"
                  />
                  Kurs Bank Indonesia
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="sources"
                    value="worldbank"
                    className="h-4 w-4 rounded border-border"
                  />
                  World Bank commodities
                </label>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!status.envReady || !status.serviceRoleReady}
                >
                  <Play className="h-4 w-4" />
                  Jalankan import
                </Button>
              </form>

              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Halaman ini tidak menampilkan secret key. Semua import berjalan
                dari server.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

async function getDataStatus(): Promise<DataStatus> {
  const envReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const serviceRoleReady = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!envReady) {
    return {
      envReady,
      serviceRoleReady,
      commodities: null,
      commodityPrices: null,
      exchangeRates: null,
      importLogs: [],
    };
  }

  try {
    if (serviceRoleReady) {
      const admin = createAdminClient();
      const [{ count: commodities }, { count: commodityPrices }, { count: exchangeRates }, logs] =
        await Promise.all([
          admin.from("commodities").select("*", { count: "exact", head: true }),
          admin
            .from("commodity_prices")
            .select("*", { count: "exact", head: true }),
          admin.from("exchange_rates").select("*", { count: "exact", head: true }),
          admin
            .from("data_import_logs")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(8),
        ]);

      return {
        envReady,
        serviceRoleReady,
        commodities: commodities ?? 0,
        commodityPrices: commodityPrices ?? 0,
        exchangeRates: exchangeRates ?? 0,
        importLogs: ((logs.data ?? []) as DataImportLogRow[]) ?? [],
      };
    }

    const supabase = await createClient();
    const [{ count: commodities }, { count: commodityPrices }, { count: exchangeRates }] =
      await Promise.all([
        supabase.from("commodities").select("*", { count: "exact", head: true }),
        supabase
          .from("commodity_prices")
          .select("*", { count: "exact", head: true }),
        supabase.from("exchange_rates").select("*", { count: "exact", head: true }),
      ]);

    return {
      envReady,
      serviceRoleReady,
      commodities: commodities ?? 0,
      commodityPrices: commodityPrices ?? 0,
      exchangeRates: exchangeRates ?? 0,
      importLogs: [],
    };
  } catch {
    return {
      envReady,
      serviceRoleReady,
      commodities: null,
      commodityPrices: null,
      exchangeRates: null,
      importLogs: [],
    };
  }
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({
  label,
  ready,
  readyText,
  missingText,
}: {
  label: string;
  ready: boolean;
  readyText: string;
  missingText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge
        variant="outline"
        className={
          ready
            ? "border-risk-low/20 bg-risk-low/10 text-risk-low"
            : "border-risk-medium/20 bg-risk-medium/10 text-risk-medium"
        }
      >
        {ready ? readyText : missingText}
      </Badge>
    </div>
  );
}

function ImportStatusBadge({ status }: { status: DataImportLogRow["status"] }) {
  const className =
    status === "success"
      ? "border-risk-low/20 bg-risk-low/10 text-risk-low"
      : status === "running"
        ? "border-risk-medium/20 bg-risk-medium/10 text-risk-medium"
        : "border-risk-high/20 bg-risk-high/10 text-risk-high";

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
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
      className={
        tone === "error"
          ? "rounded-lg border border-risk-high/25 bg-risk-high/5 px-3 py-2 text-sm text-risk-high"
          : "rounded-lg border border-risk-low/25 bg-risk-low/5 px-3 py-2 text-sm text-risk-low"
      }
    >
      {children}
    </div>
  );
}

function formatCount(value: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
