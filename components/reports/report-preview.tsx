"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/commodities/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPercent, formatRupiah } from "@/lib/utils";
import type { ReportView } from "@/types/report";

type ReportsResponse = {
  reports?: ReportView[];
  error?: string;
  details?: string;
};

type GenerateResponse = {
  ok?: boolean;
  report?: ReportView;
  error?: string;
  details?: string;
};

export function ReportPreview() {
  const [reports, setReports] = useState<ReportView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadReports();
  }, []);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? reports[0] ?? null,
    [reports, selectedId],
  );

  async function loadReports() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const json = (await response.json()) as ReportsResponse;

      if (response.status === 401) {
        setAuthRequired(true);
        setReports([]);
        return;
      }

      if (!response.ok) {
        throw new Error(json.error ?? "Daftar laporan gagal dimuat.");
      }

      setAuthRequired(false);
      setReports(json.reports ?? []);
      setSelectedId((current) => current ?? json.reports?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Daftar laporan gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function generateReport() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
      });
      const json = (await response.json()) as GenerateResponse;

      if (response.status === 401) {
        setAuthRequired(true);
        throw new Error(json.error ?? "Login diperlukan untuk generate laporan.");
      }

      if (!response.ok || !json.report) {
        throw new Error(json.error ?? "Laporan gagal dibuat.");
      }

      setAuthRequired(false);
      setReports((current) => [json.report!, ...current]);
      setSelectedId(json.report.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laporan gagal dibuat.");
    } finally {
      setIsGenerating(false);
    }
  }

  if (authRequired) {
    return (
      <EmptyState
        icon={FileText}
        title="Login diperlukan"
        message="Laporan mingguan disimpan per user, jadi session Supabase diperlukan untuk melihat, generate, dan download PDF."
        action={
          <Button asChild>
            <Link href="/login">Masuk</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Weekly report generator</p>
          <p className="text-sm text-muted-foreground">
            Generate laporan dari profil bisnis, risiko komoditas, kurs, AI insight,
            dan hasil simulator terbaru.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadReports}
            disabled={isLoading || isGenerating}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Muat ulang
          </Button>
          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Generate report
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
          <div>
            <p className="font-medium">Terjadi kendala</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <ReportsLoading />
      ) : reports.length ? (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar report</CardTitle>
              <CardDescription>{reports.length} laporan tersimpan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className={cn(
                    "w-full rounded-lg border p-3 text-left transition-colors",
                    selectedReport?.id === report.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <p className="line-clamp-2 text-sm font-medium">
                    {report.title ?? "Laporan Mingguan"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {report.period && <Badge variant="secondary">{report.period}</Badge>}
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedReport && <ReportDetail report={selectedReport} />}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Belum ada report"
          message="Generate laporan mingguan pertama untuk melihat preview dan download PDF."
          action={
            <Button onClick={generateReport} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Generate report
            </Button>
          }
        />
      )}
    </div>
  );
}

function ReportDetail({ report }: { report: ReportView }) {
  const content = report.content;

  if (!content) {
    return (
      <EmptyState
        icon={FileText}
        title="Konten report tidak valid"
        message="Report tersimpan, tetapi format JSON tidak dapat dipreview."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>{content.title}</CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{content.period}</Badge>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                {formatDate(content.generatedAt)}
              </span>
            </CardDescription>
          </div>
          {report.pdfUrl && (
            <Button asChild>
              <a href={report.pdfUrl} download={`${content.period}-supplywatch-report.pdf`}>
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <ReportSection title="Executive summary">
            <p>{content.executiveSummary}</p>
          </ReportSection>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Risk level minggu ini">
              <RiskBadge level={content.weeklyRiskLevel} className="text-sm" />
            </Metric>
            <Metric label="Kurs USD/IDR">
              {content.exchangeRate.latestRate == null
                ? "-"
                : formatRupiah(content.exchangeRate.latestRate)}
            </Metric>
            <Metric label="Perubahan kurs MoM">
              {content.exchangeRate.momChange == null
                ? "-"
                : formatPercent(content.exchangeRate.momChange, { fromRatio: true })}
            </Metric>
          </div>

          <ReportSection title="Top risky commodities">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Komoditas</th>
                    <th className="py-2 pr-4 font-medium">Risk</th>
                    <th className="py-2 pr-4 font-medium">Score</th>
                    <th className="py-2 pr-4 font-medium">MoM</th>
                    <th className="py-2 font-medium">Rekomendasi</th>
                  </tr>
                </thead>
                <tbody>
                  {content.topRiskyCommodities.map((item) => (
                    <tr key={item.name} className="border-b border-border/60">
                      <td className="py-3 pr-4 font-medium">{item.name}</td>
                      <td className="py-3 pr-4">
                        <RiskBadge level={item.riskLevel} />
                      </td>
                      <td className="py-3 pr-4">{item.riskScore ?? "-"}</td>
                      <td className="py-3 pr-4">
                        {item.momChange == null
                          ? "-"
                          : formatPercent(item.momChange, { fromRatio: true })}
                      </td>
                      <td className="py-3">{item.recommendation ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ReportSection>

          <ReportSection title="Rekomendasi aksi">
            <ul className="space-y-3">
              {content.actionRecommendations.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ReportSection>

          {content.latestAiInsight && (
            <ReportSection title="Latest AI insight">
              <p>{content.latestAiInsight.summary}</p>
              {content.latestAiInsight.recommendation && (
                <p className="mt-2 text-muted-foreground">
                  {content.latestAiInsight.recommendation}
                </p>
              )}
            </ReportSection>
          )}

          {content.latestSimulation && (
            <ReportSection title="Simulator result">
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Produk">
                  {content.latestSimulation.productName ?? "-"}
                </Metric>
                <Metric label="Estimasi margin">
                  {content.latestSimulation.estimatedNewMargin == null
                    ? "-"
                    : formatPercent(content.latestSimulation.estimatedNewMargin)}
                </Metric>
                <Metric label="Harga rekomendasi">
                  {content.latestSimulation.recommendedPrice == null
                    ? "-"
                    : formatRupiah(content.latestSimulation.recommendedPrice)}
                </Metric>
              </div>
            </ReportSection>
          )}

          <ReportSection title="Disclaimer">
            <p className="text-muted-foreground">{content.disclaimer}</p>
          </ReportSection>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-base font-semibold">{children}</div>
    </div>
  );
}

function ReportsLoading() {
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 w-64 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
