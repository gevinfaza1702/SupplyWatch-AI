import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Lightbulb,
  LineChart,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPercent, formatRupiah } from "@/lib/utils";
import type { SimulatorResultView, SimulatorStatus } from "@/types/simulator";

interface SimulatorResultProps {
  result: SimulatorResultView;
}

const STATUS_STYLES: Record<SimulatorStatus, string> = {
  Aman: "border-risk-low/30 bg-risk-low/5 text-risk-low",
  "Perlu Monitor": "border-risk-medium/30 bg-risk-medium/5 text-risk-medium",
  "Perlu Evaluasi Harga": "border-risk-high/30 bg-risk-high/5 text-risk-high",
};

export function SimulatorResult({ result }: SimulatorResultProps) {
  const suggestions = result.ai?.operational_suggestions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={LineChart}
          label="Margin sekarang"
          value={`${result.currentMargin.toFixed(1)}%`}
          hint={`${formatRupiah(result.sellingPrice)} harga jual`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Estimasi margin baru"
          value={`${result.estimatedNewMargin.toFixed(1)}%`}
          hint={`${formatRupiah(result.estimatedNewCost)} estimasi biaya`}
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Rekomendasi harga jual"
          value={formatRupiah(result.recommendedPrice)}
          hint={`Target margin ${result.targetMargin.toFixed(1)}%`}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Status"
          value={
            <Badge
              variant="outline"
              className={cn("border px-2.5 py-1", STATUS_STYLES[result.status])}
            >
              {result.status}
            </Badge>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              AI explanation
            </CardTitle>
            <CardDescription>
              Penjelasan dampak biaya bahan ke margin produk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>{result.aiExplanationText ?? result.ai?.ai_explanation}</p>
            {result.ai?.pricing_recommendation && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-medium text-foreground">Rekomendasi harga</p>
                <p className="mt-1 text-muted-foreground">
                  {result.ai.pricing_recommendation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Operational suggestions
            </CardTitle>
            <CardDescription>
              Aksi operasional yang bisa dilakukan setelah simulasi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {suggestions.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {result.ai?.customer_communication_tip && (
              <div className="mt-4 rounded-lg border border-border bg-card p-3 text-sm">
                <p className="font-medium">Komunikasi pelanggan</p>
                <p className="mt-1 text-muted-foreground">
                  {result.ai.customer_communication_tip}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="h-4 w-4 text-primary" />
            Breakdown bahan
          </CardTitle>
          <CardDescription>
            Perubahan biaya berdasarkan komposisi dan perubahan harga terbaru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Bahan</th>
                  <th className="py-2 pr-4 font-medium">Komposisi</th>
                  <th className="py-2 pr-4 font-medium">Price change</th>
                  <th className="py-2 pr-4 font-medium">Tambahan biaya</th>
                  <th className="py-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((item) => (
                  <tr key={item.slug} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{item.name}</td>
                    <td className="py-3 pr-4">{formatPercent(item.share, { fromRatio: true })}</td>
                    <td className="py-3 pr-4">
                      {formatPercent(item.appliedChange, { fromRatio: true })}
                    </td>
                    <td className="py-3 pr-4">{formatRupiah(item.addedCost)}</td>
                    <td className="py-3">{item.riskLevel ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex h-full items-center gap-4 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="mt-1 text-lg font-semibold">{value}</div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
