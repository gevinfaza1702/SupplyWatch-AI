import "server-only";

import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatPercent, formatRupiah } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";
import type { WeeklyReportContent } from "@/types/report";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#111827",
    fontFamily: "Helvetica",
    lineHeight: 1.45,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 18,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: "#1d4ed8",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: "#6b7280",
  },
  value: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  colName: { width: "34%" },
  colSmall: { width: "16%" },
  colRecommendation: { width: "34%" },
  bullet: {
    marginBottom: 4,
  },
  disclaimer: {
    fontSize: 9,
    color: "#6b7280",
  },
});

export async function generateReportPdfDataUrl(
  report: WeeklyReportContent,
): Promise<string> {
  const buffer = await generateReportPdfBuffer(report);
  return `data:application/pdf;base64,${buffer.toString("base64")}`;
}

export async function generateReportPdfBuffer(
  report: WeeklyReportContent,
): Promise<Buffer> {
  return renderToBuffer(createReportDocument(report));
}

function createReportDocument(report: WeeklyReportContent) {
  return React.createElement(
    Document,
    {
      title: report.title,
      author: "SupplyWatch AI",
      subject: `Weekly report ${report.period}`,
      language: "id",
    },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, report.title),
      React.createElement(
        Text,
        { style: styles.subtitle },
        `Periode ${report.period} | Dibuat ${formatDate(report.generatedAt)}`,
      ),
      section(
        "Executive summary",
        React.createElement(Text, null, report.executiveSummary),
      ),
      section(
        "Risk level minggu ini",
        React.createElement(
          View,
          null,
          infoRow("Level risiko", riskLabel(report.weeklyRiskLevel)),
          infoRow(
            "Profil bisnis",
            businessLabel(report.businessProfile.businessType),
          ),
          infoRow(
            "Target margin",
            report.businessProfile.targetMargin == null
              ? "-"
              : `${report.businessProfile.targetMargin}%`,
          ),
        ),
      ),
      section("Top risky commodities", commodityTable(report)),
      section(
        "Kurs USD/IDR",
        React.createElement(
          View,
          null,
          infoRow("Pair", report.exchangeRate.pair),
          infoRow(
            "Kurs terakhir",
            report.exchangeRate.latestRate == null
              ? "-"
              : formatRupiah(report.exchangeRate.latestRate),
          ),
          infoRow("Tanggal", report.exchangeRate.latestDate ?? "-"),
          infoRow(
            "MoM",
            report.exchangeRate.momChange == null
              ? "-"
              : formatPercent(report.exchangeRate.momChange, { fromRatio: true }),
          ),
        ),
      ),
      section("Rekomendasi aksi", bulletList(report.actionRecommendations)),
      report.latestSimulation
        ? section(
            "Simulator result terakhir",
            React.createElement(
              View,
              null,
              infoRow("Produk", report.latestSimulation.productName ?? "-"),
              infoRow(
                "Estimasi margin",
                report.latestSimulation.estimatedNewMargin == null
                  ? "-"
                  : formatPercent(report.latestSimulation.estimatedNewMargin),
              ),
              infoRow(
                "Harga rekomendasi",
                report.latestSimulation.recommendedPrice == null
                  ? "-"
                  : formatRupiah(report.latestSimulation.recommendedPrice),
              ),
            ),
          )
        : null,
      section(
        "Disclaimer",
        React.createElement(Text, { style: styles.disclaimer }, report.disclaimer),
      ),
    ),
  );
}

function section(title: string, children: React.ReactNode) {
  return React.createElement(
    View,
    { style: styles.section },
    React.createElement(Text, { style: styles.sectionTitle }, title),
    children,
  );
}

function infoRow(label: string, value: string) {
  return React.createElement(
    View,
    { style: styles.row },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, value),
  );
}

function commodityTable(report: WeeklyReportContent) {
  return React.createElement(
    View,
    null,
    React.createElement(
      View,
      { style: styles.tableHeader },
      React.createElement(Text, { style: styles.colName }, "Komoditas"),
      React.createElement(Text, { style: styles.colSmall }, "Risk"),
      React.createElement(Text, { style: styles.colSmall }, "MoM"),
      React.createElement(Text, { style: styles.colRecommendation }, "Rekomendasi"),
    ),
    ...report.topRiskyCommodities.map((item) =>
      React.createElement(
        View,
        { key: item.name, style: styles.tableRow },
        React.createElement(Text, { style: styles.colName }, item.name),
        React.createElement(
          Text,
          { style: styles.colSmall },
          item.riskLevel ? riskLabel(item.riskLevel) : "-",
        ),
        React.createElement(
          Text,
          { style: styles.colSmall },
          item.momChange == null
            ? "-"
            : formatPercent(item.momChange, { fromRatio: true }),
        ),
        React.createElement(
          Text,
          { style: styles.colRecommendation },
          item.recommendation ?? "-",
        ),
      ),
    ),
  );
}

function bulletList(items: string[]) {
  return React.createElement(
    View,
    null,
    ...items.map((item, index) =>
      React.createElement(
        Text,
        { key: item, style: styles.bullet },
        `${index + 1}. ${item}`,
      ),
    ),
  );
}

function riskLabel(level: RiskLevel): string {
  if (level === "High") return "Tinggi";
  if (level === "Medium") return "Sedang";
  return "Rendah";
}

function businessLabel(value: WeeklyReportContent["businessProfile"]["businessType"]) {
  if (value === "bakery") return "Toko roti";
  if (value === "coffee_shop") return "Kedai kopi";
  if (value === "restaurant") return "Restoran";
  return "-";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
