import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  /** Optional sub-line under the value. */
  hint?: string;
  /** Optional trend ratio (0.08 = +8%) shown as a colored delta. */
  trend?: number | null;
  /** Accent tone for the small status marker. */
  tone?: "primary" | "low" | "medium" | "high";
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  primary: "bg-primary",
  low: "bg-risk-low",
  medium: "bg-risk-medium",
  high: "bg-risk-high",
};

export function SummaryCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = "primary",
}: SummaryCardProps) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {label}
          </p>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", TONE_CLASSES[tone])} />
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="text-xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 flex min-h-4 items-center gap-2 text-xs">
          {trend != null && <TrendDelta trend={trend} />}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendDelta({ trend }: { trend: number }) {
  const pct = (trend * 100).toFixed(1);
  if (trend > 0.0005) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-risk-high">
        <TrendingUp className="h-3.5 w-3.5" />+{pct}%
      </span>
    );
  }
  if (trend < -0.0005) {
    return (
      <span className="inline-flex items-center gap-1 font-medium text-risk-low">
        <TrendingDown className="h-3.5 w-3.5" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      0,0%
    </span>
  );
}
