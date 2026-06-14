import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Calculator,
  ClipboardCheck,
  Coffee,
  Croissant,
  FileText,
  Gauge,
  PackageCheck,
  Radar,
  ReceiptText,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

const dailyChecks = [
  {
    label: "Bahan yang perlu dicek",
    value: "Tepung",
    note: "+8,4% bulan ini",
    tone: "high",
  },
  {
    label: "Kurs USD/IDR",
    value: "Rp16.230",
    note: "+1,2% vs bulan lalu",
    tone: "medium",
  },
  {
    label: "Saran restock",
    value: "Cek supplier",
    note: "Sebelum pembelian besar",
    tone: "low",
  },
];

const features = [
  {
    icon: Gauge,
    title: "Prioritas risiko",
    desc: "Komoditas disusun dari yang paling perlu dipantau, lengkap dengan skor dan perubahan harga.",
  },
  {
    icon: Calculator,
    title: "Simulasi margin",
    desc: "Coba skenario harga bahan naik, lalu lihat estimasi margin dan harga jual yang disarankan.",
  },
  {
    icon: ClipboardCheck,
    title: "Catatan operasional",
    desc: "Ringkasan praktis untuk restock, cek supplier, dan evaluasi harga jual.",
  },
  {
    icon: FileText,
    title: "Laporan mingguan",
    desc: "Report risiko bahan baku dalam Bahasa Indonesia, bisa dipreview dan diunduh sebagai PDF.",
  },
];

const useCases = [
  {
    icon: Croissant,
    title: "Bakery",
    desc: "Pantau tepung, gula, dairy, dan minyak sebelum produksi mingguan.",
  },
  {
    icon: Coffee,
    title: "Coffee Shop",
    desc: "Cek dampak kopi, susu, dan gula ke menu minuman yang margin-nya tipis.",
  },
  {
    icon: ReceiptText,
    title: "Restoran kecil",
    desc: "Bantu lihat bahan yang sedang menekan biaya operasional harian.",
  },
];

const steps = [
  "Isi profil bisnis dan target margin.",
  "Pantau bahan baku yang risikonya naik.",
  "Jalankan simulasi sebelum ubah harga jual.",
  "Simpan insight dan laporan mingguan.",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="container py-14 md:py-20">
            <div className="mx-auto max-w-5xl">
              <div className="max-w-3xl">
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Radar className="h-4 w-4 text-primary" />
                  Radar biaya bahan baku untuk UMKM Indonesia
                </p>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                  Jangan beli bahan baku hanya dari feeling.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  SupplyWatch membantu pemilik bakery, coffee shop, dan restoran
                  kecil melihat bahan mana yang perlu dicek sebelum restock,
                  lengkap dengan dampaknya ke margin.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link href="/dashboard">
                      Buka Dashboard Demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Link href="/login?mode=signup">Buat Akun</Link>
                  </Button>
                </div>
              </div>

              <div className="mt-12 rounded-lg border border-border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Ringkasan pagi ini</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contoh tampilan yang dipakai sebelum belanja bahan.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Diperbarui 08.30
                  </span>
                </div>

                <div className="grid gap-3 py-4 md:grid-cols-3">
                  {dailyChecks.map((item) => (
                    <DailyCheckCard key={item.label} {...item} />
                  ))}
                </div>

                <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-medium">Prioritas pantauan</p>
                      <span className="text-xs text-muted-foreground">
                        5 bahan teratas
                      </span>
                    </div>
                    <div className="space-y-3">
                      <PreviewRow name="Tepung" change="+8,4%" risk="Tinggi" />
                      <PreviewRow name="Gula" change="+4,1%" risk="Sedang" />
                      <PreviewRow name="Susu" change="+2,7%" risk="Sedang" />
                    </div>
                  </div>

                  <div className="rounded-md border border-border bg-card p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Saran operasional</p>
                    </div>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      <li>Cek dua supplier tepung sebelum restock besar.</li>
                      <li>Tunda promo jika margin produk utama turun.</li>
                      <li>Simpan laporan mingguan untuk evaluasi harga.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30 py-14">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <div>
                <p className="text-sm font-medium text-primary">
                  Masalah yang sering kejadian
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                  Harga bahan berubah duluan, keputusan bisnis sering belakangan.
                </h2>
              </div>
              <p className="text-base leading-7 text-muted-foreground">
                Banyak UMKM baru sadar biaya naik setelah margin menipis.
                SupplyWatch merapikan sinyal dari harga komoditas dan kurs
                USD/IDR menjadi daftar cek yang lebih mudah dipakai: bahan mana
                yang naik, seberapa besar dampaknya, dan apa yang sebaiknya
                dilakukan minggu ini.
              </p>
            </div>
          </div>
        </section>

        <section id="fitur" className="py-16">
          <div className="container">
            <SectionHeader
              eyebrow="Fitur utama"
              title="Dibuat untuk keputusan operasional, bukan sekadar grafik."
              desc="Angka tetap penting, tapi yang dibutuhkan pemilik bisnis adalah prioritas dan tindakan."
            />

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="use-case" className="border-y border-border bg-card py-16">
          <div className="container">
            <SectionHeader
              eyebrow="Use case"
              title="Mulai dari bisnis yang bahan bakunya sensitif harga."
              desc="Bobot risiko bisa disesuaikan dengan jenis bisnis supaya hasilnya tidak terlalu umum."
            />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <UseCaseCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="py-16">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-medium text-primary">Alur kerja</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                  Dari data harga ke keputusan restock.
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Cocok dipakai sebagai rutinitas mingguan sebelum belanja bahan
                  atau evaluasi harga jual.
                </p>
              </div>

              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {steps.map((step, index) => (
                  <div key={step} className="flex gap-4 p-5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container">
            <div className="rounded-lg border border-border bg-card p-6 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Coba dashboard dengan data demo.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Tidak perlu daftar untuk melihat alur monitoring. Login
                    dipakai saat kamu ingin menyimpan insight, simulasi, dan
                    laporan.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/dashboard">
                      Buka Demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login">Masuk</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <span>SupplyWatch AI</span>
          </div>
          <p className="text-xs">
            Insight bersifat estimasi berbasis data, bukan kepastian harga pasar.
          </p>
        </div>
      </footer>
    </div>
  );
}

function DailyCheckCard({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  const toneClass =
    tone === "high"
      ? "bg-risk-high"
      : tone === "medium"
        ? "bg-risk-medium"
        : "bg-risk-low";

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          {label}
        </p>
        <span className={`h-2 w-2 rounded-full ${toneClass}`} />
      </div>
      <p className="mt-3 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function PreviewRow({
  name,
  change,
  risk,
}: {
  name: string;
  change: string;
  risk: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
      <span className="font-medium">{name}</span>
      <span className="tabular-nums text-risk-high">{change}</span>
      <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
        {risk}
      </span>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
    </div>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{desc}</p>
    </div>
  );
}
