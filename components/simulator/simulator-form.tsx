"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimulatorResult } from "@/components/simulator/simulator-result";
import { SIMULATOR_INGREDIENTS } from "@/lib/simulator/calculate-cost-impact";
import { cn } from "@/lib/utils";
import type {
  SimulatorIngredientSlug,
  SimulatorResultView,
} from "@/types/simulator";

type IngredientPercent = Record<SimulatorIngredientSlug, number>;

type SimulatorRunResponse = {
  ok?: boolean;
  saved?: boolean;
  saveWarning?: string | null;
  simulationId?: string | null;
  result?: SimulatorResultView;
  error?: string;
  details?: string;
};

const DEFAULT_INGREDIENTS: IngredientPercent = {
  rice: 0,
  wheat: 45,
  sugar: 10,
  coffee: 0,
  dairy: 10,
  vegetable_oil: 5,
  eggs: 8,
  chicken: 0,
  beef: 0,
  soybean: 0,
  corn: 0,
  cocoa: 0,
  chili: 0,
  shallot: 0,
  garlic: 0,
  packaging: 4,
  lpg: 3,
  crude_oil: 0,
};

export function SimulatorForm() {
  const [productName, setProductName] = useState("Roti manis");
  const [sellingPrice, setSellingPrice] = useState(15000);
  const [currentCost, setCurrentCost] = useState(9000);
  const [targetMargin, setTargetMargin] = useState(35);
  const [ingredients, setIngredients] =
    useState<IngredientPercent>(DEFAULT_INGREDIENTS);
  const [result, setResult] = useState<SimulatorResultView | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  const totalPercent = useMemo(
    () => Object.values(ingredients).reduce((sum, value) => sum + value, 0),
    [ingredients],
  );
  const mixIsInvalid = totalPercent > 100;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mixIsInvalid) {
      setError("Total komposisi bahan tidak boleh lebih dari 100%.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSavedId(null);
    setSaveWarning(null);

    try {
      const response = await fetch("/api/simulator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          sellingPrice,
          currentCost,
          targetMargin,
          ingredientMix: toRatioMix(ingredients),
        }),
      });
      const json = (await response.json()) as SimulatorRunResponse;

      if (!response.ok || !json.result) {
        throw new Error(json.error ?? "Simulasi gagal dijalankan.");
      }

      setResult(json.result);
      setSavedId(json.simulationId ?? null);
      setSaveWarning(json.saveWarning ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulasi gagal dijalankan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateIngredient(slug: SimulatorIngredientSlug, value: number) {
    setIngredients((current) => ({
      ...current,
      [slug]: Number.isFinite(value) ? Math.max(0, value) : 0,
    }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-4 w-4 text-primary" />
            Input simulasi
          </CardTitle>
          <CardDescription>
            Masukkan kondisi produk saat ini dan komposisi bahan atau biaya langsung.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Nama produk">
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
              </Field>
              <NumberField
                label="Harga jual saat ini"
                value={sellingPrice}
                min={1}
                prefix="Rp"
                onChange={setSellingPrice}
              />
              <NumberField
                label="Biaya produksi saat ini"
                value={currentCost}
                min={1}
                prefix="Rp"
                onChange={setCurrentCost}
              />
              <NumberField
                label="Target margin"
                value={targetMargin}
                min={0}
                max={95}
                suffix="%"
                onChange={setTargetMargin}
              />
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Komposisi bahan dan biaya langsung</p>
                <p
                  className={cn(
                    "text-sm",
                    mixIsInvalid ? "text-risk-high" : "text-muted-foreground",
                  )}
                >
                  Total {totalPercent.toFixed(1)}%
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {SIMULATOR_INGREDIENTS.map((ingredient) => (
                  <NumberField
                    key={ingredient.slug}
                    label={`${ingredient.label} %`}
                    value={ingredients[ingredient.slug]}
                    min={0}
                    max={100}
                    suffix="%"
                    onChange={(value) => updateIngredient(ingredient.slug, value)}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                <div>
                  <p className="font-medium">Simulasi belum bisa dijalankan</p>
                  <p className="mt-1 text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Hasil simulasi disimpan ke riwayat saat user sudah login.
              </p>
              <Button type="submit" disabled={isSubmitting || mixIsInvalid}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                Jalankan simulasi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {savedId && (
        <div className="flex items-center gap-2 rounded-lg border border-risk-low/30 bg-risk-low/5 px-4 py-3 text-sm text-risk-low">
          <Save className="h-4 w-4" />
          Simulasi tersimpan.
        </div>
      )}

      {saveWarning && (
        <div className="flex items-center gap-2 rounded-lg border border-risk-medium/30 bg-risk-medium/5 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="h-4 w-4 text-risk-medium" />
          {saveWarning}
        </div>
      )}

      {result && <SimulatorResult result={result} />}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  prefix,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex h-10 items-center rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        {prefix && (
          <span className="border-r border-border px-3 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step="0.1"
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
          required
        />
        {suffix && (
          <span className="border-l border-border px-3 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

function toRatioMix(ingredients: IngredientPercent) {
  return Object.fromEntries(
    Object.entries(ingredients).map(([slug, value]) => [slug, value / 100]),
  );
}
