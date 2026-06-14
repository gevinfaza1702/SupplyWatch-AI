import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  /** Optional sub-line under the value. */
  hint?: string;
  /** Optional trend ratio (0.08 = +8%) shown as a colored delta. */
  trend?: number | null;
  /** Accent tone for the icon. */
  tone?: "primary" | "low" | "medium" | "high";
}

const TONE_CLASSES: Record<NonNullable<SummaryCardProps["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  low: "bg-risk-low/10 text-risk-low",
  medium: "bg-risk-medium/10 text-risk-medium",
  high: "bg-risk-high/10 text-risk-high",
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
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 flex items-center gap-2 text-xs">
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
      <span className="inline-flex items-center gap-0.5 font-medium text-risk-high">
        <TrendingUp className="h-3.5 w-3.5" />+{pct}%
      </span>
    );
  }
  if (trend < -0.0005) {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium text-risk-low">
        <TrendingDown className="h-3.5 w-3.5" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 font-medium text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
      0,0%
    </span>
  );
}
