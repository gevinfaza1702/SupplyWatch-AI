import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indonesian Rupiah, e.g. 16500 -> "Rp16.500". */
export function formatRupiah(value: number, opts?: { decimals?: number }) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: opts?.decimals ?? 0,
    maximumFractionDigits: opts?.decimals ?? 0,
  }).format(value);
}

/** Format a percentage change with sign, e.g. 0.082 -> "+8,2%". */
export function formatPercent(value: number, opts?: { fromRatio?: boolean }) {
  const pct = opts?.fromRatio ? value * 100 : value;
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(pct));
  const sign = pct > 0 ? "+" : pct < 0 ? "-" : "";
  return `${sign}${formatted}%`;
}
