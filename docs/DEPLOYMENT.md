# Deployment Guide — SupplyWatch AI

Panduan menyiapkan **Supabase** (database + auth) dan men-deploy ke **Vercel**.

Estimasi waktu: ~20–30 menit.

---

## 1. Prasyarat

- Akun [Supabase](https://supabase.com) (free tier cukup)
- Akun [Vercel](https://vercel.com)
- Repository project ini di GitHub
- (Opsional) API key provider AI: Sumopod / OpenAI / Gemini

---

## 2. Supabase Setup

### 2.1 Buat project
1. Buka Supabase Dashboard → **New project**.
2. Catat **Project URL** dan API keys (Settings → API):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**rahasia, server-only**)

### 2.2 Jalankan migration
Buka **SQL Editor** dan jalankan berurutan (copy-paste isi file):

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_ai_insight_payload_fields.sql`

> Alternatif via CLI:
> ```bash
> supabase link --project-ref <ref>
> supabase db push
> ```

### 2.3 Seed data
Pilih salah satu:

- **SQL Editor:** jalankan `supabase/seed.sql` (7 komoditas, ~13 bulan harga,
  kurs USD/IDR, bobot bisnis).
- **Programmatic:** isi `.env.local` lalu jalankan `npm run seed` (menulis mock
  data lewat import runner; butuh `SUPABASE_SERVICE_ROLE_KEY`).

### 2.4 Konfigurasi Auth
Authentication → URL Configuration:
- **Site URL:** `https://<your-app>.vercel.app` (atau `http://localhost:3000` saat lokal)
- **Redirect URLs:** tambahkan `https://<your-app>.vercel.app/auth/callback`

Email auth aktif secara default. Untuk demo cepat, matikan "Confirm email"
(Authentication → Providers → Email) agar sign-up langsung bisa login.

---

## 3. Environment Variables

Salin `.env.example` → `.env.local` (lokal) dan isi. Di Vercel, set variabel yang
sama di **Project → Settings → Environment Variables**.

| Variable | Contoh / catatan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role (server-only) |
| `AI_PROVIDER` | `sumopod` \| `openai` \| `gemini` |
| `AI_MODEL` | mis. `MiniMax-M2.7-highspeed` |
| `SUMOPOD_API_KEY` / `SUMOPOD_BASE_URL` | jika pakai Sumopod |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | jika pakai provider lain |
| `ADMIN_IMPORT_TOKEN` | string acak panjang; proteksi `/api/import/run` |
| `NEXT_PUBLIC_DEMO_MODE` | `false` untuk produksi dengan data asli |
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |

> ⚠️ Jangan menaruh secret di variabel `NEXT_PUBLIC_*`. Tanpa AI key, insight
> tetap jalan via fallback rule-based.

---

## 4. Vercel Setup

1. Vercel → **Add New → Project** → import repo GitHub.
2. Framework otomatis terdeteksi: **Next.js**. Build command & output default.
3. Tambahkan semua Environment Variables (langkah 3) untuk **Production** (dan
   Preview bila perlu).
4. **Deploy.**
5. Setelah live, update Supabase **Site URL** / **Redirect URL** ke domain Vercel.

### Verifikasi pasca-deploy
- Buka `/` → landing tampil.
- Buka `/dashboard` → kartu risiko + grafik tampil (mock bila demo mode).
- Daftar/login → simpan profil bisnis di `/business-profile`.
- `/insights`, `/simulator`, `/reports` berfungsi; PDF bisa diunduh.
- `/settings` → status env, dan toggle **Mode Demo**.

---

## 5. (Opsional) Scheduled Data Import

Endpoint `POST /api/import/run` dilindungi `ADMIN_IMPORT_TOKEN`.

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [{ "path": "/api/import/run", "schedule": "0 6 * * 1" }]
}
```
Karena cron Vercel memanggil via GET tanpa header kustom, untuk produksi
gunakan **GitHub Actions** atau panggilan manual dengan header token:

```bash
curl -X POST https://<your-app>.vercel.app/api/import/run \
  -H "x-admin-token: $ADMIN_IMPORT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sources":["worldbank","fao","bank-indonesia"],"allowFallback":true}'
```

Sumber real (`WORLDBANK_DATA_URL`, `FAO_DATA_URL`, `BI_JISDOR_URL`) bersifat
opsional; bila kosong, importer fallback ke mock dan mencatat ke
`data_import_logs`.

---

## 6. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Dashboard tampil "data demo" terus | Demo mode aktif atau DB kosong. Matikan di `/settings` & jalankan seed. |
| Login gagal redirect | Redirect URL Supabase belum di-set ke `/auth/callback`. |
| Insight selalu rule-based | AI key kosong/salah. Cek `AI_PROVIDER` + key terkait. |
| Import 401 | `ADMIN_IMPORT_TOKEN` salah / belum di-set di server. |
| Build error di Vercel | Pastikan semua env terisi & `npm run build` lolos lokal. |
