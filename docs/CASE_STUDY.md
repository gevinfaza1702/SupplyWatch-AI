# Case Study — SupplyWatch AI

*AI Commodity & Cost Radar untuk UMKM Indonesia*

---

## Problem

UMKM F&B Indonesia — bakery, kedai kopi, warung makan, katering, minuman,
gorengan, dan toko sembako — sangat sensitif terhadap biaya bahan baku. Harga
beras, telur, ayam, cabai, bawang, gula, tepung, kopi, susu, minyak, kemasan,
dan LPG dipengaruhi pasar global/lokal serta **kurs USD/IDR**. Tapi pemilik
UMKM jarang punya waktu atau alat untuk memantaunya.

Akibatnya:
- **Salah waktu restock** — beli saat harga sedang tinggi, atau kehabisan stok
  menjelang kenaikan.
- **Margin tergerus diam-diam** — biaya naik bertahap tapi harga jual tetap.
- **Keputusan harga reaktif** — naik harga mendadak yang mengagetkan pelanggan.

Informasi mentah (indeks komoditas, kurs) ada di mana-mana, tapi **tidak
diterjemahkan ke keputusan bisnis** yang relevan untuk skala UMKM.

---

## Solution

Dashboard yang mengubah data komoditas global + kurs menjadi **panduan berbasis
risiko berbahasa Indonesia**, dipersonalisasi per jenis bisnis:

1. **Kumpulkan** harga komoditas + kurs USD/IDR (adapter pattern; mock untuk demo,
   scaffold World Bank / FAO / Bank Indonesia untuk data real).
2. **Hitung** risk score 0–100 per komoditas — tertimbang relevansinya untuk
   bisnis tertentu.
3. **Jelaskan** dampaknya dengan AI dalam bahasa yang dimengerti pemilik UMKM.
4. **Sarankan** aksi konkret: restock lebih awal, tahan beli, evaluasi harga jual.
5. **Simulasikan** dampak ke margin produk tertentu dan beri rekomendasi harga.
6. **Laporkan** ringkasan mingguan yang bisa diunduh sebagai PDF.

---

## Tech Stack

- **Next.js 15 (App Router) + TypeScript** — Server Components, Route Handlers,
  Server Actions.
- **Supabase** — PostgreSQL, Auth, dan Row Level Security untuk data per-user.
- **Tailwind CSS + shadcn-style components + Recharts** — UI SaaS yang clean.
- **AI abstraction layer** — provider bisa diganti (Sumopod/MiniMax, OpenAI,
  Gemini) tanpa ubah kode pemanggil; parser JSON aman dengan fallback teks.
- **@react-pdf/renderer** — laporan PDF.
- **Vercel + Supabase** — deployment.

---

## Key Features

| Fitur | Nilai untuk UMKM |
|---|---|
| Dashboard Risiko | Paham kondisi biaya minggu ini dalam < 30 detik |
| Risk Engine (0–100, Low/Med/High) | Prioritas: komoditas mana yang perlu perhatian |
| AI Insights (Bahasa Indonesia) | Penjelasan + action plan, bukan sekadar angka |
| Cost Simulator | "Kalau tepung naik X%, margin roti jadi berapa?" |
| Weekly Report + PDF | Dokumen evaluasi untuk owner/purchasing |
| Demo Mode | Coba penuh tanpa setup — ideal untuk evaluasi |

---

## AI Value

AI bukan chatbot tempelan — ia menjadi **lapisan analitik inti**:

- **Kontekstual:** prompt menyertakan jenis bisnis, margin target, budget, data
  komoditas, kurs, dan risk score → output relevan untuk bisnis spesifik.
- **Terstruktur & aman:** model diminta mengembalikan JSON (summary, impact,
  main drivers, action plan, confidence, disclaimer). Parser memvalidasi; bila
  gagal, sistem **fallback ke ringkasan rule-based** sehingga tidak pernah crash.
- **Bertanggung jawab:** prompt melarang klaim harga pasti dan nasihat investasi;
  setiap output menyertakan disclaimer.
- **Provider-agnostic:** ganti provider via satu env var.

---

## Business Impact (proyeksi)

Untuk UMKM target, nilai praktisnya:
- **Keputusan restock lebih tepat waktu** → mengurangi pembelian di harga puncak.
- **Margin lebih terjaga** → kenaikan biaya terdeteksi sebelum menggerus laba.
- **Penyesuaian harga lebih halus** → rekomendasi kenaikan bertahap, bukan kejutan.
- **Hemat waktu** → tidak perlu memantau banyak sumber data secara manual.

> Angka demo bersifat sintetis; impact nyata bergantung pada data dan konteks
> bisnis masing-masing.

---

## Engineering Highlights

- **Risk Engine murni & teruji** — fungsi deterministik dengan unit test
  (`npm run test:risk`), formula tertimbang + normalisasi 0–100.
- **Adapter pattern untuk data** — sumber dapat ditukar; mock fallback memastikan
  app selalu jalan; import tercatat di `data_import_logs`.
- **Keamanan berlapis** — secret server-only, RLS pada tabel user, endpoint
  import dilindungi token.
- **Selalu demo-able** — fallback mock + Demo Mode toggle, cocok untuk presentasi
  portofolio tanpa bergantung pada koneksi DB.
