"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { PricePoint } from "@/types/commodity";

interface CommodityChartProps {
  data: PricePoint[];
  unit?: string | null;
}

/** Historical price/index area chart for a single commodity. */
export function CommodityChart({ data, unit }: CommodityChartProps) {
  const chartData = data.map((p) => ({
    date: p.date,
    label: safeMonth(p.date),
    value: p.value,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={56}
            domain={["auto", "auto"]}
            tickFormatter={(v) => compact(Number(v))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(var(--border))",
              fontSize: 13,
              boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.date
                ? safeFull(payload[0].payload.date as string)
                : ""
            }
            formatter={(value: number) => [
              `${compact(value)}${unit ? ` ${unit}` : ""}`,
              "Nilai",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function safeMonth(iso: string): string {
  try {
    return format(parseISO(iso), "MMM yy", { locale: localeId });
  } catch {
    return iso;
  }
}

function safeFull(iso: string): string {
  try {
    return format(parseISO(iso), "MMMM yyyy", { locale: localeId });
  } catch {
    return iso;
  }
}

function compact(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(n);
}
