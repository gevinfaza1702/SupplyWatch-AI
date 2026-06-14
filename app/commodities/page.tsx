import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight, Boxes, TrendingUp } from "lucide-react";
import {
  DashboardShell,
  DemoModeBadge,
} from "@/components/layout/dashboard-shell";
import { RiskBadge } from "@/components/commodities/risk-badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommodities } from "@/lib/commodities/get-commodities";
import { formatPercent } from "@/lib/utils";
import type { CommoditySummary } from "@/types/commodity";

export const metadata = { title: "Komoditas" };

export default function CommoditiesPage() {
  return (
    <DashboardShell
      title="Komoditas"
      description="Daftar harga komoditas utama, perubahan harga, dan level risiko untuk UMKM."
      actions={<DemoModeBadge />}
    >
      <Suspense fallback={<LoadingState />}>
        <CommoditiesContent />
      </Suspense>
    </DashboardShell>
  );
}

async function CommoditiesContent() {
  let data;
  try {
    data = await getCommodities();
  } catch {
    return (
      <ErrorState message="Data komoditas tidak dapat dimuat. Coba muat ulang halaman." />
    );
  }

  if (!data.commodities.length) {
    return (
      <EmptyState
        title="Belum ada data komoditas"
        message="Jalankan seed database untuk mulai melihat daftar komoditas."
      />
    );
  }

  const ranked = [...data.commodities].sort(
    (a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0),
  );
  const highRisk = ranked.filter((item) => item.riskLevel === "High").length;
  const mediumRisk = ranked.filter((item) => item.riskLevel === "Medium").length;

  return (
    <div className="space-y-6">
      {data.source === "mock" && (
        <p className="rounded-lg border border-risk-medium/30 bg-risk-medium/5 px-4 py-2 text-sm text-foreground/80">
          Menampilkan <strong>data demo</strong> karena Supabase belum
          terhubung atau tabel komoditas belum berisi data.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Boxes className="h-4 w-4" />}
          label="Total komoditas"
          value={String(ranked.length)}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Risiko tinggi"
          value={String(highRisk)}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Perlu monitor"
          value={String(mediumRisk)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Radar Komoditas</CardTitle>
          <CardDescription>
            Diurutkan dari skor risiko tertinggi untuk membantu prioritas
            pemantauan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommodityTable rows={ranked} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

function CommodityTable({ rows }: { rows: CommoditySummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Komoditas</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">Harga terakhir</TableHead>
          <TableHead className="text-right">MoM</TableHead>
          <TableHead className="text-right">YoY</TableHead>
          <TableHead>Risiko</TableHead>
          <TableHead className="text-right">Skor</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.latestDate ?? "-"}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {item.category ?? "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(item.latestValue)}
              {item.unit ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  {item.unit}
                </span>
              ) : null}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <DeltaText ratio={item.momChange} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <DeltaText ratio={item.yoyChange} />
            </TableCell>
            <TableCell>
              <RiskBadge level={item.riskLevel} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {item.riskScore == null ? "-" : Math.round(item.riskScore)}
            </TableCell>
            <TableCell>
              <Link
                href={`/commodities/${item.slug}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                aria-label={`Lihat detail ${item.name}`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
