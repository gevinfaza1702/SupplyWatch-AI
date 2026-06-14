import { Suspense } from "react";
import {
  Gauge,
  Flame,
  CircleDollarSign,
  Lightbulb,
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
import { formatRupiah } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Radar risiko biaya bahan baku berdasarkan harga komoditas global dan kurs USD/IDR."
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

  const { summary, exchangeRate, featured, topRisky } = data;

  return (
    <div className="space-y-6">
      {data.source === "mock" && (
        <p className="rounded-lg border border-risk-medium/30 bg-risk-medium/5 px-4 py-2 text-sm text-foreground/80">
          Menampilkan <strong>data demo</strong> — Supabase belum terkonfigurasi
          atau belum berisi data. Jalankan <code>seed.sql</code> untuk data asli.
        </p>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Risk Level Minggu Ini"
          value={<RiskBadge level={summary.weeklyRiskLevel} className="text-sm" />}
          icon={Gauge}
          tone={toneForRisk(summary.weeklyRiskLevel)}
          hint={`${summary.highCount} tinggi · ${summary.mediumCount} sedang · ${summary.lowCount} rendah`}
        />
        <SummaryCard
          label="Komoditas Paling Berisiko"
          value={summary.riskiestCommodity ?? "-"}
          icon={Flame}
          tone="high"
          hint="Berdasarkan skor risiko tertinggi"
        />
        <SummaryCard
          label="USD/IDR Terakhir"
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
          label="Rekomendasi Utama"
          value={
            <span className="line-clamp-2 text-base font-medium leading-snug">
              {summary.mainRecommendation ?? "Pantau tren secara berkala."}
            </span>
          }
          icon={Lightbulb}
          tone="medium"
        />
      </div>

      {/* Chart + AI summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Tren Harga {featured ? `· ${featured.name}` : ""}
            </CardTitle>
            <CardDescription>
              Komoditas dengan risiko tertinggi, 13 bulan terakhir
              {featured?.unit ? ` (${featured.unit})` : ""}.
            </CardDescription>
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

        <AiSummaryCard
          riskLevel={summary.weeklyRiskLevel}
          riskiestCommodity={summary.riskiestCommodity}
          recommendation={summary.mainRecommendation}
          highCount={summary.highCount}
        />
      </div>

      {/* Top risk table */}
      <Card>
        <CardHeader>
          <CardTitle>Komoditas Paling Berisiko</CardTitle>
          <CardDescription>
            Lima komoditas dengan skor risiko tertinggi untuk dipantau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopRiskTable rows={topRisky} />
        </CardContent>
      </Card>
    </div>
  );
}

function toneForRisk(level: "Low" | "Medium" | "High") {
  return level === "High" ? "high" : level === "Medium" ? "medium" : "low";
}
