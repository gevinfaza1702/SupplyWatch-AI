"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { RiskBadge } from "@/components/commodities/risk-badge";
import { cn } from "@/lib/utils";
import type { BusinessType } from "@/types/database";
import type { InsightView } from "@/types/insight";

const BUSINESS_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: "bakery", label: "Toko roti" },
  { value: "coffee_shop", label: "Kedai kopi" },
  { value: "restaurant", label: "Restoran" },
];

type LatestResponse = {
  insight: InsightView | null;
  error?: string;
  details?: string;
};

type GenerateResponse = {
  ok?: boolean;
  source?: "ai" | "rule-based";
  insight?: InsightView;
  error?: string;
  details?: string;
};

export function InsightsPanel() {
  const [businessType, setBusinessType] = useState<BusinessType>("bakery");
  const [insight, setInsight] = useState<InsightView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadLatest();
  }, []);

  const selectedBusiness = useMemo(
    () =>
      BUSINESS_OPTIONS.find((option) => option.value === businessType)?.label ??
      "Toko roti",
    [businessType],
  );

  async function loadLatest() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insights/latest", {
        cache: "no-store",
      });
      const json = (await response.json()) as LatestResponse;

      if (response.status === 401) {
        setAuthRequired(true);
        setInsight(null);
        return;
      }

      if (!response.ok) {
        throw new Error(json.error ?? "Insight terbaru gagal dimuat.");
      }

      setAuthRequired(false);
      setInsight(json.insight);
      if (json.insight?.businessType && isBusinessType(json.insight.businessType)) {
        setBusinessType(json.insight.businessType);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Insight terbaru gagal dimuat.");
    } finally {
      setIsLoading(false);
    }
  }

  async function generateInsight() {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType }),
      });
      const json = (await response.json()) as GenerateResponse;

      if (response.status === 401) {
        setAuthRequired(true);
        throw new Error(json.error ?? "Login diperlukan.");
      }

      if (!response.ok || !json.insight) {
        throw new Error(json.error ?? "Insight gagal dibuat.");
      }

      setAuthRequired(false);
      setInsight(json.insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Insight gagal dibuat.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">Jenis bisnis</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {BUSINESS_OPTIONS.map((option) => {
                const active = option.value === businessType;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBusinessType(option.value)}
                    className={cn(
                      "h-10 rounded-lg border px-4 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={loadLatest}
              disabled={isLoading || isGenerating}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Muat terbaru
            </Button>
            <Button
              type="button"
              onClick={generateInsight}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Buat insight
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-4 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
          <div>
            <p className="font-medium">Terjadi kendala</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {authRequired && (
        <EmptyState
          icon={ShieldAlert}
          title="Login diperlukan"
          message="Insight AI disimpan per user, jadi session Supabase diperlukan untuk membuat atau melihat hasil terbaru."
          action={
            <Button asChild>
              <Link href="/login">Masuk</Link>
            </Button>
          }
        />
      )}

      {isLoading && !authRequired ? (
        <LoadingInsightState />
      ) : !authRequired && insight ? (
        <InsightResult insight={insight} selectedBusiness={selectedBusiness} />
      ) : !authRequired ? (
        <EmptyState
          icon={Brain}
          title="Belum ada insight"
          message="Pilih jenis bisnis lalu buat insight untuk menyimpan analisis terbaru."
          action={
            <Button onClick={generateInsight} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Buat insight
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function InsightResult({
  insight,
  selectedBusiness,
}: {
  insight: InsightView;
  selectedBusiness: string;
}) {
  const confidence = Math.round(insight.confidenceScore ?? 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={BriefcaseBusiness}
          label="Jenis bisnis"
          value={businessLabel(insight.businessType) ?? selectedBusiness}
        />
        <MetricCard
          icon={TrendingUp}
          label="Level risiko"
          value={<RiskBadge level={insight.riskLevel} className="text-sm" />}
        />
        <MetricCard
          icon={Target}
          label="Skor keyakinan"
          value={`${confidence}%`}
          hint={insight.isFallback ? "Fallback berbasis aturan" : "Dihasilkan AI"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InsightCard icon={Brain} title="Ringkasan">
          <p>{insight.summary ?? "Belum ada ringkasan."}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {insight.period && <Badge variant="secondary">{insight.period}</Badge>}
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {formatDate(insight.createdAt)}
            </span>
          </div>
        </InsightCard>

        <InsightCard icon={BadgeCheck} title="Analisis dampak">
          <p>{insight.impactAnalysis ?? "Belum ada analisis dampak."}</p>
        </InsightCard>

        <InsightCard icon={TrendingUp} title="Faktor utama">
          <ul className="space-y-3">
            {insight.mainDrivers.length ? (
              insight.mainDrivers.map((driver) => (
                <li key={driver} className="flex gap-3 text-sm">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{driver}</span>
                </li>
              ))
            ) : (
              <li>Belum ada driver utama.</li>
            )}
          </ul>
        </InsightCard>

        <InsightCard icon={Lightbulb} title="Rekomendasi">
          <p>{insight.recommendation ?? "Belum ada rekomendasi."}</p>
        </InsightCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-primary" />
            Rencana aksi
          </CardTitle>
          <CardDescription>Langkah operasional yang bisa diprioritaskan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {insight.actionPlan.length ? (
              insight.actionPlan.map((item) => (
                <div
                  key={`${item.action}-${item.priority}`}
                  className="rounded-lg border border-border bg-muted/20 p-4"
                >
                  <RiskBadge level={item.priority} showDot={false} />
                  <p className="mt-3 text-sm font-medium">{item.action}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada action plan.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Disclaimer</p>
        <p className="mt-1">
          {insight.disclaimer ??
            "Insight ini bersifat estimasi berbasis data historis dan bukan kepastian harga pasar."}
        </p>
      </div>
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
      <CardContent className="flex items-center gap-4 p-5">
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

function InsightCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-foreground/90">
        {children}
      </CardContent>
    </Card>
  );
}

function LoadingInsightState() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-5 w-32 rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function businessLabel(value: string | null): string | null {
  if (!value || !isBusinessType(value)) return null;
  return BUSINESS_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

function isBusinessType(value: string): value is BusinessType {
  return value === "bakery" || value === "coffee_shop" || value === "restaurant";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
