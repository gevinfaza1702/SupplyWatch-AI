import Link from "next/link";
import {
  ArrowRight,
  Radar,
  TrendingUp,
  Brain,
  Calculator,
  FileText,
  ShieldCheck,
  Coffee,
  Croissant,
  Gauge,
  CircleDollarSign,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Gauge,
    title: "Risk Score Otomatis",
    desc: "Setiap komoditas dinilai Low / Medium / High berdasarkan perubahan harga, kurs, dan volatilitas — disesuaikan dengan jenis bisnis Anda.",
  },
  {
    icon: Brain,
    title: "Insight AI Bahasa Indonesia",
    desc: "AI menjelaskan dampak harga global ke biaya bahan baku Anda, lengkap dengan rekomendasi praktis berbasis risiko.",
  },
  {
    icon: Calculator,
    title: "Simulator Dampak Biaya",
    desc: "Masukkan komposisi bahan produk Anda dan lihat estimasi margin baru serta rekomendasi harga jual.",
  },
  {
    icon: TrendingUp,
    title: "Tren Harga & Kurs",
    desc: "Grafik historis komoditas dan kurs USD/IDR yang mudah dibaca, dengan perubahan MoM dan YoY.",
  },
  {
    icon: FileText,
    title: "Laporan Mingguan",
    desc: "Ringkasan risiko dan rekomendasi dalam bentuk laporan rapi yang bisa diunduh sebagai PDF.",
  },
  {
    icon: ShieldCheck,
    title: "Berbasis Risiko, Bukan Ramalan",
    desc: "Kami tidak menjanjikan harga pasti. Semua insight bersifat estimasi untuk membantu keputusan Anda.",
  },
];

const steps = [
  {
    no: "01",
    title: "Buat profil bisnis",
    desc: "Pilih jenis bisnis, lokasi, margin target, dan budget bahan baku bulanan.",
  },
  {
    no: "02",
    title: "Lihat radar risiko",
    desc: "Dashboard menampilkan komoditas paling berisiko untuk bisnis Anda minggu ini.",
  },
  {
    no: "03",
    title: "Ambil keputusan",
    desc: "Pakai insight AI dan simulator untuk memutuskan restock, harga jual, atau langkah lain.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
          <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="container relative py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-6 animate-fade-up gap-1.5 px-3 py-1">
                <Radar className="h-3.5 w-3.5" />
                AI Commodity & Cost Radar untuk UMKM Indonesia
              </Badge>

              <h1 className="animate-fade-up text-balance text-4xl font-bold tracking-tight md:text-6xl">
                Pantau Harga Global,{" "}
                <span className="text-primary">Pahami Dampaknya</span> ke Bisnis
                Anda
              </h1>

              <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-pretty text-lg text-muted-foreground">
                SupplyWatch AI membantu UMKM Indonesia membaca tren harga
                komoditas, kurs USD/IDR, dan risiko biaya bahan baku dengan
                insight AI yang praktis.
              </p>

              <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    Coba Demo Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Link href="/business-profile">Buat Profil Bisnis</Link>
                </Button>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Mode demo aktif — coba tanpa perlu mendaftar.
              </p>
            </div>

            {/* Floating stat preview */}
            <div className="mx-auto mt-16 grid max-w-4xl animate-fade-up grid-cols-1 gap-4 sm:grid-cols-3">
              <PreviewStat
                icon={Gauge}
                label="Risk Minggu Ini"
                value="Medium"
                tone="medium"
              />
              <PreviewStat
                icon={TrendingUp}
                label="Komoditas Paling Berisiko"
                value="Tepung (Wheat)"
                tone="high"
              />
              <PreviewStat
                icon={CircleDollarSign}
                label="USD/IDR Terakhir"
                value="Rp16.230"
                tone="low"
              />
            </div>
          </div>
        </section>

        {/* ──────────────────── Problem statement ──────────────────── */}
        <section className="border-y border-border/60 bg-muted/30 py-16">
          <div className="container max-w-3xl text-center">
            <h2 className="text-2xl font-semibold md:text-3xl">
              Biaya bahan baku naik diam-diam. Margin Anda yang menanggung.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground">
              Harga gula, tepung, kopi, minyak, dan susu dipengaruhi pasar global
              dan kurs USD/IDR. Tanpa pemantauan, UMKM sering terlambat restock,
              salah waktu beli, atau lupa menyesuaikan harga jual. SupplyWatch AI
              menerjemahkan data itu menjadi keputusan yang jelas.
            </p>
          </div>
        </section>

        {/* ───────────────────────── Features ───────────────────────── */}
        <section id="fitur" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">
                Bukan sekadar dashboard data
              </h2>
              <p className="mt-3 text-muted-foreground">
                AI menjadi inti produk: menganalisis, menjelaskan, dan
                merekomendasikan — bukan hanya menampilkan angka.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Use cases ───────────────────────── */}
        <section id="use-case" className="border-t border-border/60 bg-muted/30 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Dibuat untuk bisnis Anda</h2>
              <p className="mt-3 text-muted-foreground">
                Bobot komoditas disesuaikan dengan jenis usaha, jadi insight-nya
                relevan.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              <UseCaseCard
                icon={Croissant}
                title="Bakery"
                points={[
                  "Pantau tepung, gula, minyak, dan dairy",
                  "Simulasi dampak ke harga roti & kue",
                  "Tahu kapan restock tepung lebih awal",
                ]}
              />
              <UseCaseCard
                icon={Coffee}
                title="Coffee Shop"
                points={[
                  "Fokus pada kopi & susu sebagai cost driver utama",
                  "Cek margin es kopi susu saat harga naik",
                  "Rekomendasi harga jual bertahap",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ───────────────────────── How it works ───────────────────────── */}
        <section id="cara-kerja" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold">Cara kerjanya</h2>
              <p className="mt-3 text-muted-foreground">
                Tiga langkah dari data global ke keputusan bisnis.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.no} className="relative rounded-xl border border-border bg-card p-6">
                  <span className="text-3xl font-bold text-primary/20">
                    {s.no}
                  </span>
                  <h3 className="mt-2 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── CTA ───────────────────────── */}
        <section className="py-20">
          <div className="container">
            <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-grid opacity-10" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-3xl font-semibold">
                  Mulai pantau biaya bahan baku Anda hari ini
                </h2>
                <p className="mt-3 text-primary-foreground/80">
                  Coba mode demo gratis, atau buat profil bisnis untuk insight
                  yang dipersonalisasi.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/dashboard">
                      Coba Demo Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <Link href="/business-profile">Buat Profil Bisnis</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <span>
              SupplyWatch AI · Radar komoditas & biaya untuk UMKM Indonesia
            </span>
          </div>
          <p className="text-xs">
            Insight bersifat estimasi berbasis data, bukan kepastian harga pasar.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Helper components ───────────────────────── */

function PreviewStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "low" | "medium" | "high";
}) {
  const toneClasses = {
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card/80 p-5 text-left shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-4 w-4 ${toneClasses}`} />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  points,
}: {
  icon: React.ElementType;
  title: string;
  points: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <ul className="mt-4 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
