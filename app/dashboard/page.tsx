import { Suspense } from "react";
import {
  Gauge,
  Flame,
  CircleDollarSign,
  ClipboardCheck,
  CalendarClock,
  PackageCheck,
} from "lucide-react";
import {
  DashboardShell,
  DemoModeBadge,
} from "@/components/layout/dashboard-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { CommodityChart } from "@/components/dashboard/commodity-chart";
import { TopRiskTable } from "@/components/dashboard/top-risk-table";
import { AiSummaryCard } from "@/components/dashboard/ai-summary-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RiskBadge } from "@/components/commodities/risk-badge";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { formatPercent, formatRupiah } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Pantauan bahan baku, kurs, dan risiko biaya untuk keputusan restock."
      actions={<DemoModeBadge />}
    >
      <Suspense fallback={<LoadingState />}>
        <DashboardContent />
      </Suspense>
    </DashboardShell>
  );
}

async function DashboardContent() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    return (
      <ErrorState message="Data dashboard tidak dapat dimuat. Coba muat ulang halaman." />
    );
  }

  if (!data.commodities.length) {
    return (
      <EmptyState
        title="Belum ada data komoditas"
        message="Jalankan import data atau seed database untuk mulai melihat risiko."
      />
    );
  }

  const { summary, exchangeRate, featured, topRisky, generatedAt } = data;
  const featuredMonthChange = featured?.history.at(-1)?.momChange ?? null;

  return (
    <div className="space-y-5">
      <DashboardBrief
        generatedAt={generatedAt}
        source={data.source}
        riskLevel={summary.weeklyRiskLevel}
        riskiestCommodity={summary.riskiestCommodity}
        exchangeRate={exchangeRate.latestRate}
        exchangeRateChange={exchangeRate.momChange}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Risiko minggu ini"
          value={<RiskBadge level={summary.weeklyRiskLevel} className="text-sm" />}
          icon={Gauge}
          tone={toneForRisk(summary.weeklyRiskLevel)}
          hint={`${summary.highCount} tinggi · ${summary.mediumCount} sedang · ${summary.lowCount} rendah`}
        />
        <SummaryCard
          label="Bahan yang perlu dicek"
          value={summary.riskiestCommodity ?? "-"}
          icon={Flame}
          tone="high"
          hint="Skor risiko tertinggi"
        />
        <SummaryCard
          label="Kurs USD/IDR"
          value={
            exchangeRate.latestRate != null
              ? formatRupiah(exchangeRate.latestRate)
              : "-"
          }
          icon={CircleDollarSign}
          tone="primary"
          trend={exchangeRate.momChange}
          hint="vs bulan lalu"
        />
        <SummaryCard
          label="Tindakan utama"
          value={
            <span className="line-clamp-2 text-base font-semibold leading-snug">
              {summary.mainRecommendation ?? "Pantau tren secara berkala."}
            </span>
          }
          icon={ClipboardCheck}
          tone="medium"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 shadow-none lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {featured ? `Tren ${featured.name}` : "Tren harga bahan baku"}
              </CardTitle>
              <CardDescription>
                Pergerakan 13 bulan terakhir
                {featured?.unit ? ` (${featured.unit})` : ""}.
              </CardDescription>
            </div>
            {featuredMonthChange != null && (
              <div className="rounded-lg border border-border px-3 py-2 text-right">
                <p className="text-xs text-muted-foreground">Bulan ini</p>
                <p className="text-sm font-semibold">
                  <DeltaText ratio={featuredMonthChange} />
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {featured && featured.history.length ? (
              <CommodityChart data={featured.history} unit={featured.unit} />
            ) : (
              <EmptyState
                title="Belum ada riwayat harga"
                message="Grafik akan muncul setelah ada data harga historis."
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AiSummaryCard
            riskLevel={summary.weeklyRiskLevel}
            riskiestCommodity={summary.riskiestCommodity}
            recommendation={summary.mainRecommendation}
            highCount={summary.highCount}
          />

          <Card className="border-border/80 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                Checklist restock
              </CardTitle>
              <CardDescription>
                Tiga hal yang sebaiknya dicek sebelum belanja bahan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm leading-6">
                <ChecklistItem>
                  Cek harga supplier untuk {summary.riskiestCommodity ?? "bahan utama"}.
                </ChecklistItem>
                <ChecklistItem>
                  Bandingkan stok sekarang dengan kebutuhan 7 hari ke depan.
                </ChecklistItem>
                <ChecklistItem>
                  Tahan diskon besar jika margin mulai turun.
                </ChecklistItem>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/80 shadow-none">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Prioritas pantauan</CardTitle>
            <CardDescription>
              Lima bahan dengan skor risiko tertinggi untuk dicek minggu ini.
            </CardDescription>
          </div>
          <p className="text-sm text-muted-foreground">
            {summary.highCount} tinggi, {summary.mediumCount} sedang
          </p>
        </CardHeader>
        <CardContent>
          <TopRiskTable rows={topRisky} />
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardBrief({
  generatedAt,
  source,
  riskLevel,
  riskiestCommodity,
  exchangeRate,
  exchangeRateChange,
}: {
  generatedAt: string;
  source: "supabase" | "mock";
  riskLevel: RiskLevel;
  riskiestCommodity: string | null;
  exchangeRate: number | null;
  exchangeRateChange: number | null;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadge level={riskLevel} />
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              Diperbarui {formatDateTime(generatedAt)}
            </span>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-foreground/85">
            Fokus hari ini: cek {riskiestCommodity ?? "bahan utama"} sebelum
            restock. Kurs USD/IDR terakhir{" "}
            <span className="font-medium">
              {exchangeRate == null ? "-" : formatRupiah(exchangeRate)}
            </span>
            {exchangeRateChange == null ? null : (
              <>
                {" "}
                (<DeltaText ratio={exchangeRateChange} /> vs bulan lalu)
              </>
            )}
            .
          </p>
        </div>

        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Sumber data:{" "}
          <span className="font-medium text-foreground">
            {source === "supabase" ? "Supabase" : "Demo"}
          </span>
        </div>
      </div>
    </section>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{children}</span>
    </li>
  );
}

function DeltaText({ ratio }: { ratio: number | null }) {
  if (ratio == null) return <span className="text-muted-foreground">-</span>;
  const cls =
    ratio > 0.0005
      ? "text-risk-high"
      : ratio < -0.0005
        ? "text-risk-low"
        : "text-muted-foreground";
  return <span className={cls}>{formatPercent(ratio, { fromRatio: true })}</span>;
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function toneForRisk(level: RiskLevel) {
  return level === "High" ? "high" : level === "Medium" ? "medium" : "low";
}
