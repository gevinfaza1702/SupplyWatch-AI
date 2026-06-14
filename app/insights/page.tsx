import { DashboardShell, DemoModeBadge } from "@/components/layout/dashboard-shell";
import { InsightsPanel } from "./insights-panel";

export const metadata = { title: "AI Insights" };

export default function InsightsPage() {
  return (
    <DashboardShell
      title="AI Insights"
      description="Analisis dampak risiko harga bahan baku untuk keputusan UMKM."
      actions={<DemoModeBadge />}
    >
      <InsightsPanel />
    </DashboardShell>
  );
}
