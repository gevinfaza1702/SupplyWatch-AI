"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  History,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah } from "@/lib/utils";

type SimulationHistoryItem = {
  id: string;
  productName: string;
  sellingPrice: number | null;
  currentCost: number | null;
  currentMargin: number | null;
  targetMargin: number | null;
  estimatedNewCost: number | null;
  estimatedNewMargin: number | null;
  recommendedPrice: number | null;
  aiExplanation: string | null;
  createdAt: string;
};

type HistoryResponse = {
  simulations?: SimulationHistoryItem[];
  error?: string;
};

export function SimulatorHistory() {
  const [items, setItems] = useState<SimulationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/simulator/history", {
          cache: "no-store",
        });
        const json = (await response.json()) as HistoryResponse;

        if (!alive) return;
        if (response.status === 401) {
          setAuthRequired(true);
          setItems([]);
          return;
        }
        if (!response.ok) {
          throw new Error(json.error ?? "Riwayat simulasi gagal dimuat.");
        }

        setAuthRequired(false);
        setItems(json.simulations ?? []);
      } catch (err) {
        if (alive) {
          setError(
            err instanceof Error ? err.message : "Riwayat simulasi gagal dimuat.",
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4 text-primary" />
            Riwayat simulasi
          </CardTitle>
          <CardDescription>
            Simulasi yang tersimpan saat user sudah login.
          </CardDescription>
        </div>
        {authRequired && (
          <Button asChild variant="outline" size="sm">
            <Link href="/login?next=/simulator">Masuk</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat riwayat...
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-lg border border-risk-high/25 bg-risk-high/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
            <span>{error}</span>
          </div>
        ) : authRequired ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Jalankan simulator tetap bisa tanpa login. Login diperlukan hanya
              untuk menyimpan dan melihat riwayat.
            </p>
          </div>
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Produk</th>
                  <th className="py-2 pr-4 text-right font-medium">Margin awal</th>
                  <th className="py-2 pr-4 text-right font-medium">Margin baru</th>
                  <th className="py-2 pr-4 text-right font-medium">Harga saran</th>
                  <th className="py-2 pr-4 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sellingPrice == null
                          ? "-"
                          : formatRupiah(item.sellingPrice)}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatPercentNullable(item.currentMargin)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {formatPercentNullable(item.estimatedNewMargin)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {item.recommendedPrice == null
                        ? "-"
                        : formatRupiah(item.recommendedPrice)}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada simulasi tersimpan. Jalankan simulator setelah login untuk
            menyimpan hasilnya.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatPercentNullable(value: number | null) {
  if (value == null) return "-";
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
