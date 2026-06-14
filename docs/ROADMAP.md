# Roadmap — SupplyWatch AI

Status saat ini: **MVP selesai** (Phase 0–9). Berikut arah pengembangan
selanjutnya, dikelompokkan per tema.

---

## 🔜 Near-term (polish & data real)

- **Sambungkan sumber data real** — implementasikan mapping kolom untuk World
  Bank Pink Sheet, FAO Food Price Index, dan Bank Indonesia JISDOR (saat ini
  scaffold dengan TODO + fallback mock).
- **Scheduled import** — Vercel Cron / GitHub Actions mingguan + notifikasi bila
  import gagal (`data_import_logs`).
- **Chat with data** — tanya-jawab atas data komoditas (ditunda dari MVP).
- **Riwayat insight & simulasi** — daftar dan bandingkan hasil dari waktu ke waktu.
- **Test coverage** — tambah unit test untuk data layer & API, integration test
  untuk alur auth.

## 📈 Mid-term (produk lebih dalam)

- **Notifikasi proaktif** — email/WhatsApp saat komoditas naik ke level High.
- **Multi-produk simulator** — simulasikan seluruh menu, bukan satu produk.
- **Benchmark per kota/lokasi** — sesuaikan dengan logistik regional.
- **Supplier tracking** — catat harga beli aktual vs indeks global.
- **Localization** — dukungan bahasa & mata uang tambahan.

## 🚀 Long-term (skala & monetisasi)

- **Multi-tenant & tim** — beberapa user per bisnis dengan peran.
- **Tiered plans** — free (demo + 1 bisnis) vs pro (multi-bisnis, report otomatis).
- **Forecasting hati-hati** — skenario "what-if" berbasis rentang, tetap tanpa
  klaim harga pasti.
- **Mobile app** — companion untuk owner yang sering di lapangan.
- **API publik** — ekspos risk score untuk integrasi POS/akuntansi.

---

## ⚙️ Technical Debt / Hardening

- Regenerate `types/database.ts` via Supabase CLI agar selalu sinkron dengan schema.
- Observability: structured logging + error tracking (mis. Sentry) di produksi.
- Rate limiting pada endpoint AI & import.
- E2E test (Playwright) untuk alur demo utama.
- Caching insight per periode untuk menekan biaya AI.

---

## Catatan Prinsip

Setiap fitur baru tetap mengikuti prinsip produk:
- Panduan **berbasis risiko**, bukan ramalan harga atau nasihat investasi.
- Secret **server-only**, data user dilindungi RLS.
- Sumber data dihormati Terms of Service-nya (tidak scraping agresif).
- Selalu **demo-able** (mock fallback) agar mudah dipresentasikan.
