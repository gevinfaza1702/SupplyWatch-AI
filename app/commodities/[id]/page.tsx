import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, LineChart, Scale } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommodityChart } from "@/components/dashboard/commodity-chart";
import { RiskBadge } from "@/components/commodities/risk-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCommodityDetail } from "@/lib/commodities/get-commodities";
import { formatPercent } from "@/lib/utils";

interface CommodityDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CommodityDetailPageProps) {
  const { id } = await params;
  const result = await getCommodityDetail(id);

  return {
    title: result?.detail.name ? `${result.detail.name} | Komoditas` : "Komoditas",
  };
}

export default async function CommodityDetailPage({
  params,
}: CommodityDetailPageProps) {
  const { id } = await params;
  const result = await getCommodityDetail(id);

  if (!result) notFound();

  const commodity = result.detail;

  return (
    <DashboardShell
      title={commodity.name}
      description="Detail tren harga, perubahan bulanan, dan rekomendasi pemantauan risiko."
      actions={
        <Button asChild variant="outline" size="sm">
          <Link href="/commodities">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {result.source === "mock" && (
          <p className="rounded-lg border border-risk-medium/30 bg-risk-medium/5 px-4 py-2 text-sm text-foreground/80">
            Menampilkan <strong>data demo</strong> karena Supabase belum
            terhubung atau tabel komoditas belum berisi data.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard
            icon={<Scale className="h-4 w-4" />}
            label="Level risiko"
            value={<RiskBadge level={commodity.riskLevel} className="text-sm" />}
          />
          <InfoCard
            icon={<LineChart className="h-4 w-4" />}
            label="Perubahan MoM"
            value={<DeltaText ratio={commodity.momChange} />}
          />
          <InfoCard
            icon={<LineChart className="h-4 w-4" />}
            label="Perubahan YoY"
            value={<DeltaText ratio={commodity.yoyChange} />}
          />
          <InfoCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Data terakhir"
            value={commodity.latestDate ?? "-"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tren Harga</CardTitle>
              <CardDescription>
                Riwayat harga 13 bulan terakhir
                {commodity.unit ? ` (${commodity.unit})` : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {commodity.history.length ? (
                <CommodityChart
                  data={commodity.history}
                  unit={commodity.unit}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat harga untuk komoditas ini.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analisis Risiko</CardTitle>
              <CardDescription>
                Ringkasan praktis untuk keputusan operasional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Nilai terakhir</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatNumber(commodity.latestValue)}
                  {commodity.unit ? (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {commodity.unit}
                    </span>
                  ) : null}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Skor risiko</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {commodity.riskScore == null
                    ? "-"
                    : Math.round(commodity.riskScore)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Rekomendasi</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {commodity.recommendation ??
                    "Pantau tren harga dan evaluasi supplier secara berkala."}
                </p>
              </div>

              {commodity.description ? (
                <div>
                  <p className="text-sm font-medium">Catatan komoditas</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {commodity.description}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-1 truncate text-lg font-semibold">{value}</div>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
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

function formatNumber(value: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}
