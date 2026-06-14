import { DashboardShell, DemoModeBadge } from "@/components/layout/dashboard-shell";
import { SimulatorForm } from "@/components/simulator/simulator-form";

export const metadata = { title: "Simulator" };

export default function SimulatorPage() {
  return (
    <DashboardShell
      title="Cost Impact Simulator"
      description="Simulasikan dampak perubahan harga bahan baku terhadap margin dan harga jual."
      actions={<DemoModeBadge />}
    >
      <SimulatorForm />
    </DashboardShell>
  );
}
