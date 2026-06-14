# SupplyWatch AI

**AI Commodity & Cost Radar untuk UMKM Indonesia.**

SupplyWatch AI membantu UMKM F&B dan retail kecil seperti bakery, kedai kopi,
warung makan, katering, minuman, gorengan, dan toko sembako memahami dampak
harga komoditas global/lokal dan kurs USD/IDR terhadap biaya bahan baku mereka —
lalu menerjemahkannya menjadi **risk score**, **insight AI berbahasa Indonesia**,
dan **rekomendasi bisnis yang praktis**.

> Insight bersifat estimasi berbasis data yang tersedia, **bukan kepastian harga
> pasar** dan bukan nasihat investasi.

---

## ✨ Fitur Utama

- **Dashboard Risiko** — ringkasan risiko mingguan, komoditas paling berisiko,
  kurs USD/IDR terakhir, dan rekomendasi utama dalam satu layar.
- **Risk Engine** — skor 0–100 (Low/Medium/High) dari MoM, YoY, volatilitas 6
  bulan, pergerakan kurs, dan bobot komoditas per jenis bisnis.
- **AI Insights** — analisis dampak + action plan kontekstual (Bahasa Indonesia)
  via provider AI yang bisa diganti. Aman: parser JSON dengan fallback teks.
- **Cost Simulator** — masukkan komposisi bahan sebuah produk, lihat estimasi
  margin baru dan rekomendasi harga jual, lengkap dengan penjelasan AI.
- **Weekly Report + PDF** — ringkasan risiko & rekomendasi yang bisa diunduh.
- **Demo Mode** — data contoh yang stabil untuk demo/portofolio tanpa setup DB.
- **Data Import (adapter pattern)** — mock + scaffold World Bank / FAO / Bank
  Indonesia (JISDOR), dengan fallback aman dan audit log.

---

## 🧱 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + komponen ala shadcn/ui + Lucide icons |
| Charts | Recharts |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS) |
| AI | Abstraction layer — Sumopod (MiniMax, OpenAI-compatible) / OpenAI / Gemini |
| PDF | @react-pdf/renderer |
| Validation | Zod |
| Deploy | Vercel (app) + Supabase (DB) |

---

## 🏗️ Arsitektur Singkat

```
Browser ──► Next.js (App Router, RSC + Route Handlers) ──► Supabase (Postgres + Auth, RLS)
                     │
                     ├─ Risk Engine        lib/risk/calculate-risk.ts (pure, tested)
                     ├─ AI Provider         lib/ai/* (provider-agnostic + safe JSON parse)
                     ├─ Data Sources        lib/data-sources/* (adapter pattern + mock fallback)
                     └─ Reports/PDF         lib/reports/*
```

**Prinsip keamanan:** AI key & Supabase service-role key **hanya di server**.
Browser hanya memakai URL + anon/publishable key. Tabel user-scoped dilindungi
Row Level Security.

**Selalu bisa jalan:** jika Supabase belum dikonfigurasi atau kosong, data layer
otomatis fallback ke **mock data** sehingga UI tetap tampil (lihat Demo Mode).

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env.local      # lalu isi nilai aslinya (lihat di bawah)

# 3. Jalankan dev server
npm run dev                      # http://localhost:3000
```

Aplikasi langsung jalan dalam **Demo Mode** (mock data) meski `.env.local` belum
diisi. Untuk fitur penuh (login, simpan insight/simulasi, laporan), isi env
Supabase dan jalankan migration + seed (lihat Deployment Guide).

### Script yang tersedia

| Script | Fungsi |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Jalankan hasil build |
| `npm run typecheck` | Cek TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint (next lint) |
| `npm run seed` | Isi DB dengan mock data via import runner |
| `npm run import -- worldbank fao` | Jalankan import dari sumber tertentu |
| `npm run test:risk` | Unit test Risk Engine |
| `npm run test:simulator` | Unit test Cost Simulator |

---

## 🔑 Environment Variables

Lihat [`.env.example`](.env.example) untuk daftar lengkap dengan komentar. Ringkas:

| Variable | Sisi | Wajib | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client | ya* | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | ya* | anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | untuk import/seed | bypass RLS, jangan bocor |
| `AI_PROVIDER` | server | tidak | `sumopod` \| `openai` \| `gemini` |
| `AI_MODEL` | server | tidak | mis. `MiniMax-M2.7-highspeed` |
| `SUMOPOD_API_KEY` / `SUMOPOD_BASE_URL` | **server** | untuk AI | provider default |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | **server** | alternatif | provider lain |
| `ADMIN_IMPORT_TOKEN` | **server** | untuk import API | proteksi `/api/import/run` |
| `WORLDBANK_DATA_URL` / `FAO_DATA_URL` / `BI_JISDOR_URL` | server | tidak | sumber real; kosong = mock |
| `NEXT_PUBLIC_DEMO_MODE` | client | tidak | default demo mode (`true`/`false`) |
| `NEXT_PUBLIC_APP_URL` | client | tidak | base URL untuk link di PDF |

\* Tanpa env Supabase, aplikasi tetap berjalan dalam Demo Mode (read-only).

> **Keamanan:** jangan pernah menaruh secret di variabel berawalan
> `NEXT_PUBLIC_`. Service-role & AI key hanya dibaca di server.

---

## 🗄️ Database

Migration & seed ada di `supabase/`:

```
supabase/
  migrations/
    001_initial_schema.sql      # tabel, index, constraint, trigger updated_at
    002_rls_policies.sql        # Row Level Security
    003_ai_insight_payload_fields.sql
    004_public_read_anon.sql
    005_expand_business_types_and_commodities.sql
  seed.sql                      # 18 komoditas, ~13 bln harga, kurs, bobot bisnis
```

Jalankan migration berurutan, lalu `seed.sql`. Detail di
[Deployment Guide](docs/DEPLOYMENT.md).

> **Types:** `types/database.ts` ditulis tangan agar repo bisa di-typecheck
> tanpa koneksi DB. Setelah schema berubah, regenerate agar tetap sinkron:
> ```bash
> supabase gen types typescript --project-id <ref> --schema public > types/database.ts
> ```

---

## 📚 Dokumentasi

- [Deployment Guide](docs/DEPLOYMENT.md) — Supabase + Vercel step-by-step
- [Portfolio Case Study](docs/CASE_STUDY.md) — problem → solution → impact
- [Demo Video Script](docs/DEMO_SCRIPT.md) — naskah 1–2 menit
- [Roadmap](docs/ROADMAP.md) — pengembangan ke depan

---

## 📁 Struktur Folder (ringkas)

```
app/                  # routes (App Router) + API route handlers
  api/                # commodities, insights, simulator, reports, import
  dashboard/ commodities/ insights/ simulator/ reports/ settings/ ...
components/           # layout, dashboard, commodities, simulator, reports, ui, shared
lib/
  ai/                 # provider abstraction, prompts, safe JSON parse
  risk/               # calculate-risk.ts (Risk Engine)
  simulator/          # cost-impact calculation
  data-sources/       # adapter pattern (mock + real-source scaffolds) + import runner
  reports/            # report + PDF generation
  supabase/           # client / server / admin / middleware
  commodities/        # shared commodity data layer (Supabase + mock fallback)
types/                # database + domain types
supabase/             # migrations + seed
scripts/              # import + tests (tsx)
docs/                 # deployment, case study, demo script, roadmap
```

---

## ⚠️ Disclaimer

SupplyWatch AI memberikan **panduan berbasis risiko**, bukan ramalan harga atau
nasihat investasi. Angka pada Demo Mode adalah data sintetis untuk keperluan
demonstrasi.
