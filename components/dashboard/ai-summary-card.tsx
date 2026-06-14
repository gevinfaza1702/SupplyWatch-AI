import Link from "next/link";
import { Brain, Sparkles } from "lucide-react";
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

/**
 * Dummy AI summary for Phase 3. The text is templated from the computed
 * dashboard summary — NOT a real model call. The live AI generator and the
 * /insights page arrive in Phase 6.
 */
export function AiSummaryCard({
  riskLevel,
  riskiestCommodity,
  recommendation,
  highCount,
}: AiSummaryCardProps) {
  const summary = buildSummary(riskLevel, riskiestCommodity, highCount);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          Ringkasan AI
        </CardTitle>
        <RiskBadge level={riskLevel} />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>

        {recommendation && (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Rekomendasi utama
            </div>
            <p className="mt-1 text-sm text-foreground/90">{recommendation}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Estimasi berbasis data, bukan kepastian harga pasar.
          </p>
          <Button asChild variant="ghost" size="sm">
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

  const lead = `Tingkat risiko biaya bahan baku minggu ini tergolong ${levelText}.`;

  if (riskiest && highCount > 0) {
    return `${lead} ${riskiest} menjadi komoditas paling berisiko, dan total ${highCount} komoditas berada di level tinggi. Pergerakan harga global dan kurs USD/IDR perlu dipantau lebih dekat untuk menjaga margin.`;
  }
  if (riskiest) {
    return `${lead} Perhatian utama saat ini ada pada ${riskiest}. Belum ada lonjakan ekstrem, namun tetap pantau supplier dan tren harga.`;
  }
  return `${lead} Belum ada komoditas yang memerlukan aksi besar — cukup pantau tren secara berkala.`;
}
