import Link from "next/link";
import {
  ArrowRight,
  Radar,
  TrendingUp,
  TrendingDown,
  Brain,
  Calculator,
  FileText,
  ShieldCheck,
  Coffee,
  Croissant,
  UtensilsCrossed,
  Store,
  Gauge,
  CircleDollarSign,
  Sparkles,
  LineChart,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Gauge,
    title: "Risk Score Otomatis",
    desc: "Tiap komoditas dinilai Rendah / Sedang / Tinggi dari perubahan harga, kurs, dan volatilitas — disesuaikan dengan jenis bisnis Anda.",
    featured: true,
  },
  {
    icon: Brain,
    title: "Insight AI Bahasa Indonesia",
    desc: "AI menjelaskan dampak harga global ke biaya bahan baku Anda, lengkap rekomendasi praktis berbasis risiko.",
  },
  {
    icon: Calculator,
    title: "Simulator Dampak Biaya",
    desc: "Masukkan komposisi bahan produk Anda, lihat estimasi margin baru dan rekomendasi harga jual.",
  },
  {
    icon: LineChart,
    title: "Tren Harga & Kurs Nyata",
    desc: "Grafik historis komoditas (data World Bank) dan kurs USD/IDR yang mudah dibaca, dengan perubahan MoM & YoY.",
  },
  {
    icon: FileText,
    title: "Laporan Mingguan",
    desc: "Ringkasan risiko dan rekomendasi dalam laporan rapi yang bisa diunduh sebagai PDF.",
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
    desc: "Pakai insight AI & simulator untuk memutuskan restock, harga jual, atau langkah lain.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-20 hero-aurora" />
          <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_72%)]" />

          <div className="container relative py-16 md:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              {/* Left: copy */}
              <div>
                <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                  <span className="relative flex h-2 w-2">
                    <span className="live-dot absolute inline-flex h-2 w-2" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-risk-low" />
                  </span>
                  Data harga komoditas World Bank + kurs USD/IDR live
                </span>

                <h1 className="mt-6 animate-fade-up text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
                  Pantau harga global,{" "}
                  <span className="relative whitespace-nowrap text-primary">
                    pahami dampaknya
                    <svg
                      aria-hidden
                      viewBox="0 0 300 12"
                      className="absolute -bottom-1 left-0 h-2.5 w-full text-primary/30"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M2 9 C 80 2, 220 2, 298 9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{" "}
                  ke bisnis Anda
                </h1>

                <p className="mt-6 max-w-xl animate-fade-up delay-1 text-pretty text-lg text-muted-foreground">
                  SupplyWatch AI membantu UMKM Indonesia membaca tren harga
                  komoditas, kurs USD/IDR, dan risiko biaya bahan baku dengan
                  insight AI yang praktis.
                </p>

                <div className="mt-9 flex animate-fade-up delay-2 flex-col items-start gap-3 sm:flex-row">
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

                <div className="mt-6 flex animate-fade-up delay-3 flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-risk-low" /> Tanpa daftar untuk demo
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-risk-low" /> Bahasa Indonesia
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-risk-low" /> Data sumber resmi
                  </span>
                </div>
              </div>

              {/* Right: product preview */}
              <div className="animate-fade-up delay-2">
                <HeroPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────── Trust / stat strip ──────────────────── */}
        <section className="border-y border-border/60 bg-card/40">
          <div className="container grid grid-cols-2 gap-px py-0 md:grid-cols-4">
            <Stat value="18" label="Komoditas dipantau" />
            <Stat value="65thn" label="Riwayat harga World Bank" />
            <Stat value="8" label="Tipe bisnis didukung" />
            <Stat value="USD/IDR" label="Kurs diperbarui berkala" />
          </div>
        </section>

        {/* ──────────────────── Problem statement ──────────────────── */}
        <section className="py-20">
          <div className="container max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Masalahnya
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Biaya bahan baku naik diam-diam.
              <br className="hidden sm:block" /> Margin Anda yang menanggung.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground">
              Harga beras, telur, ayam, cabai, bawang, gula, tepung, kopi,
              minyak, kemasan, dan LPG bergerak dengan pola yang berbeda.
              Tanpa pemantauan, UMKM sering terlambat restock, salah waktu beli,
              atau lupa menyesuaikan harga jual. SupplyWatch AI menerjemahkan
              data itu menjadi keputusan yang jelas.
            </p>
          </div>
        </section>

        {/* ───────────────────────── Features ───────────────────────── */}
        <section id="fitur" className="border-t border-border/60 bg-muted/30 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Fitur
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Bukan sekadar dashboard data
              </h2>
              <p className="mt-3 text-muted-foreground">
                AI menjadi inti produk: menganalisis, menjelaskan, dan
                merekomendasikan — bukan hanya menampilkan angka.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={[
                    "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
                    f.featured ? "sm:col-span-2 lg:col-span-1 lg:row-span-1" : "",
                  ].join(" ")}
                >
                  {f.featured && (
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                  )}
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="relative mt-4 font-semibold">{f.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-muted-foreground">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Use cases ───────────────────────── */}
        <section id="use-case" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Use Case
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Dibuat untuk bisnis Anda
              </h2>
              <p className="mt-3 text-muted-foreground">
                Bobot komoditas disesuaikan dengan jenis usaha, jadi insight-nya
                relevan.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
              <UseCaseCard
                icon={Croissant}
                title="Bakery"
                drivers="Tepung · Gula · Telur"
                points={[
                  "Pantau tepung, gula, telur, butter/dairy, dan kemasan",
                  "Simulasi dampak ke harga roti & kue",
                  "Tahu kapan restock tepung lebih awal",
                ]}
              />
              <UseCaseCard
                icon={Coffee}
                title="Kedai Kopi"
                drivers="Kopi · Susu · Gula"
                points={[
                  "Fokus pada kopi & susu sebagai cost driver",
                  "Cek margin es kopi susu saat harga naik",
                  "Rekomendasi harga jual bertahap",
                ]}
                highlight
              />
              <UseCaseCard
                icon={UtensilsCrossed}
                title="Warung & Katering"
                drivers="Beras · Ayam · Minyak"
                points={[
                  "Pantau beras, telur, ayam, cabai, bawang, dan LPG",
                  "Prioritaskan menu yang marginnya mulai tertekan",
                  "Siapkan keputusan belanja mingguan lebih awal",
                ]}
              />
              <UseCaseCard
                icon={Store}
                title="Toko Sembako"
                drivers="Beras · Minyak · Telur"
                points={[
                  "Lihat bahan pokok mana yang bergerak paling cepat",
                  "Bantu atur stok beras, minyak, gula, telur, dan kopi",
                  "Baca risiko harga tanpa membuka banyak sumber data",
                ]}
              />
            </div>
          </div>
        </section>

        {/* ───────────────────────── How it works ───────────────────────── */}
        <section id="cara-kerja" className="border-t border-border/60 bg-muted/30 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">
                Cara Kerja
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Tiga langkah dari data ke keputusan
              </h2>
            </div>

            <div className="relative mt-14 grid gap-8 md:grid-cols-3">
              {/* connector line */}
              <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" />
              {steps.map((s) => (
                <div key={s.no} className="relative text-center md:text-left">
                  <span className="relative z-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-lg font-bold text-primary shadow-sm">
                    {s.no}
                  </span>
                  <h3 className="mt-5 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── CTA ───────────────────────── */}
        <section className="py-20">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-grid opacity-[0.12]" />
              <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Mulai pantau biaya bahan baku Anda hari ini
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
                  Coba mode demo gratis, atau buat profil bisnis untuk insight
                  yang dipersonalisasi.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radar className="h-4 w-4" />
            </span>
            <span>
              SupplyWatch<span className="text-primary"> AI</span> · Radar
              komoditas & biaya untuk UMKM Indonesia
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

/** A realistic mini dashboard preview to make the hero feel like the product. */
function HeroPreview() {
  const rows = [
    { name: "Cabai (Chili)", mom: "+18,2%", up: true, risk: "Tinggi", tone: "high" as const },
    { name: "Telur Ayam", mom: "+7,4%", up: true, risk: "Sedang", tone: "medium" as const },
    { name: "Minyak Nabati", mom: "+3,9%", up: true, risk: "Sedang", tone: "medium" as const },
    { name: "Beras (Rice)", mom: "+1,8%", up: true, risk: "Rendah", tone: "low" as const },
  ];

  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-risk-high/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-medium/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-low/60" />
          <span className="ml-2 text-xs font-medium text-muted-foreground">
            Dashboard · Warung Makan
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-risk-low/10 px-2 py-0.5 text-[10px] font-medium text-risk-low">
            <span className="h-1.5 w-1.5 rounded-full bg-risk-low" />
            LIVE
          </span>
        </div>

        <div className="space-y-4 p-4">
          {/* top mini stats */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              icon={Gauge}
              label="Risk minggu ini"
              value="Sedang"
              tone="medium"
            />
            <MiniStat
              icon={CircleDollarSign}
              label="USD/IDR"
              value="Rp17.788"
              tone="primary"
            />
          </div>

          {/* AI note */}
          <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Ringkasan AI
            </div>
            <p className="mt-1 text-[13px] leading-5 text-foreground/80">
              Cabai dan telur mulai menekan biaya menu harian. Cek harga supplier,
              atur porsi stok, dan hitung ulang margin menu andalan.
            </p>
          </div>

          {/* risk rows */}
          <div className="overflow-hidden rounded-xl border border-border">
            {rows.map((r, i) => (
              <div
                key={r.name}
                className={[
                  "flex items-center justify-between px-3 py-2.5 text-sm",
                  i !== rows.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <span className="font-medium">{r.name}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "nums inline-flex items-center gap-1 text-xs font-medium",
                      r.up ? "text-risk-high" : "text-risk-low",
                    ].join(" ")}
                  >
                    {r.up ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {r.mom}
                  </span>
                  <RiskPill tone={r.tone}>{r.risk}</RiskPill>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* floating badge */}
      <div className="animate-float absolute -bottom-5 -left-5 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-lg sm:block">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Komoditas paling berisiko
        </p>
        <p className="mt-0.5 text-sm font-semibold">Cabai · +18,2% MoM</p>
      </div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: "primary" | "low" | "medium" | "high";
}) {
  const dot = {
    primary: "bg-primary",
    low: "bg-risk-low",
    medium: "bg-risk-medium",
    high: "bg-risk-high",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1.5 text-lg font-semibold">{value}</p>
    </div>
  );
}

function RiskPill({
  tone,
  children,
}: {
  tone: "low" | "medium" | "high";
  children: React.ReactNode;
}) {
  const cls = {
    low: "bg-risk-low/10 text-risk-low",
    medium: "bg-risk-medium/10 text-risk-medium",
    high: "bg-risk-high/10 text-risk-high",
  }[tone];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-background px-6 py-8 text-center">
      <p className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function UseCaseCard({
  icon: Icon,
  title,
  drivers,
  points,
  highlight = false,
}: {
  icon: React.ElementType;
  title: string;
  drivers: string;
  points: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg",
        highlight ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{drivers}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-risk-low" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
