import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";

const LABELS: Record<RiskLevel, string> = {
  Low: "Rendah",
  Medium: "Sedang",
  High: "Tinggi",
};

const STYLES: Record<RiskLevel, string> = {
  Low: "bg-risk-low/10 text-risk-low ring-risk-low/20",
  Medium: "bg-risk-medium/10 text-risk-medium ring-risk-medium/20",
  High: "bg-risk-high/10 text-risk-high ring-risk-high/20",
};

interface RiskBadgeProps {
  level: RiskLevel | null;
  className?: string;
  showDot?: boolean;
}

/** Color-coded risk badge — green (Low) / amber (Medium) / red (High). */
export function RiskBadge({ level, className, showDot = true }: RiskBadgeProps) {
  const safe: RiskLevel = level ?? "Low";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[safe],
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            safe === "Low" && "bg-risk-low",
            safe === "Medium" && "bg-risk-medium",
            safe === "High" && "bg-risk-high",
          )}
        />
      )}
      {LABELS[safe]}
    </span>
  );
}
