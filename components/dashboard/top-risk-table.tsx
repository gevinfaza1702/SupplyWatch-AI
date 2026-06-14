import Link from "next/link";
import { ArrowUpRight, Circle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RiskBadge } from "@/components/commodities/risk-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPercent } from "@/lib/utils";
import type { CommoditySummary } from "@/types/commodity";

interface TopRiskTableProps {
  rows: CommoditySummary[];
}

export function TopRiskTable({ rows }: TopRiskTableProps) {
  if (!rows.length) {
    return (
      <EmptyState
        title="Belum ada komoditas"
        message="Data komoditas akan muncul setelah import dijalankan."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Komoditas</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="text-right">MoM</TableHead>
          <TableHead className="text-right">YoY</TableHead>
          <TableHead className="text-right">Skor</TableHead>
          <TableHead>Risiko</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.id} className="hover:bg-muted/30">
            <TableCell>
              <div className="flex items-center gap-2">
                <Circle className="h-2.5 w-2.5 fill-muted-foreground/30 text-muted-foreground/30" />
                <span className="font-medium">{c.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {c.category ?? "-"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <DeltaText ratio={c.momChange} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <DeltaText ratio={c.yoyChange} />
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {c.riskScore == null ? "-" : Math.round(c.riskScore)}
            </TableCell>
            <TableCell>
              <RiskBadge level={c.riskLevel} />
            </TableCell>
            <TableCell>
              <Link
                href={`/commodities/${c.slug}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-primary"
                aria-label={`Detail ${c.name}`}
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
