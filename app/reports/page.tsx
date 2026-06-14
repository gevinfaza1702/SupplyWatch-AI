import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReportPreview } from "@/components/reports/report-preview";

export const metadata = { title: "Laporan" };

export default function ReportsPage() {
  return (
    <DashboardShell
      title="Laporan Mingguan"
      description="Generate, preview, dan download PDF laporan risiko biaya bahan baku."
    >
      <ReportPreview />
    </DashboardShell>
  );
}
