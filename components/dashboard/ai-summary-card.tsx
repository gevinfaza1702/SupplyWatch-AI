import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/commodities/risk-badge";
import type { RiskLevel } from "@/types/database";

interface AiSummaryCardProps {
  riskLevel: RiskLevel;
  riskiestCommodity: string | null;
  recommendation: string | null;
  highCount: number;
}

export function AiSummaryCard({
  riskLevel,
  riskiestCommodity,
  recommendation,
  highCount,
}: AiSummaryCardProps) {
  const summary = buildSummary(riskLevel, riskiestCommodity, highCount);

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          Catatan operasional
        </CardTitle>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-foreground/90">{summary}</p>

        {recommendation && (
          <div className="border-l-2 border-primary pl-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Langkah minggu ini
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground/90">
              {recommendation}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Dipakai sebagai bahan cek, bukan kepastian harga pasar.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/insights">Lihat insight lengkap</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function buildSummary(
  level: RiskLevel,
  riskiest: string | null,
  highCount: number,
): string {
  const levelText =
    level === "High"
      ? "tinggi"
      : level === "Medium"
        ? "sedang"
        : "rendah";

  const lead = `Risiko bahan baku minggu ini berada di level ${levelText}.`;

  if (riskiest && highCount > 0) {
    return `${lead} ${riskiest} menjadi bahan yang paling perlu dicek, dengan ${highCount} komoditas masuk kategori tinggi. Prioritaskan cek stok, supplier alternatif, dan margin sebelum pembelian besar.`;
  }
  if (riskiest) {
    return `${lead} Perhatian utama ada pada ${riskiest}. Belum perlu aksi besar, tapi jadwalkan pengecekan harga supplier sebelum restock berikutnya.`;
  }
  return `${lead} Belum ada bahan yang perlu tindakan besar. Tetap cek tren harga secara berkala sebelum restock.`;
}
