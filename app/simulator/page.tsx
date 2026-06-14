import { DashboardShell, DemoModeBadge } from "@/components/layout/dashboard-shell";
import { SimulatorForm } from "@/components/simulator/simulator-form";
import { SimulatorHistory } from "@/components/simulator/simulator-history";

export const metadata = { title: "Simulator" };

export default function SimulatorPage() {
  return (
    <DashboardShell
      title="Cost Impact Simulator"
      description="Simulasikan dampak perubahan harga bahan baku terhadap margin dan harga jual."
      actions={<DemoModeBadge />}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
          Simulator bisa dijalankan tanpa login untuk mode demo. Login diperlukan
          jika ingin menyimpan hasil dan melihat riwayat simulasi.
        </div>
        <SimulatorForm />
        <SimulatorHistory />
      </div>
    </DashboardShell>
  );
}
