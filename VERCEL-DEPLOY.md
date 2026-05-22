# Deploy Dashboard ke Vercel

Dashboard ini (Next.js) di-host di Vercel, tapi **API call berjalan di browser
pengunjung** — jadi dashboard tetap memanggil backend langsung. Backend di-host
lokal oleh "host" tim dan diekspos ke internet lewat **ngrok static domain**.

> **Syarat agar situs Vercel berfungsi:** host harus menjalankan backend
> (`npm run dev`) **dan** ngrok (`npm run ngrok`) di komputernya. Kalau salah satu
> mati, login & data di situs Vercel akan gagal (Network Error).

---

## 1. Import project di Vercel

- Hubungkan repo `cbt-dashboard` ke Vercel (repo ini sudah berdiri sendiri).
- **Framework Preset:** Next.js (terdeteksi otomatis).
- **Root Directory:** biarkan default (`./`) — repo ini sudah root dashboard.
- **Build / Output:** default (`next build`). Tidak ada yang perlu diubah.

## 2. Environment Variables (Production **dan** Preview)

Tambahkan dua variabel ini di **Settings → Environment Variables**:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_HOST` | `https://crouton-boxlike-dove.ngrok-free.dev/api/` |
| `NEXT_PUBLIC_HOST_NGROK` | `https://crouton-boxlike-dove.ngrok-free.dev/api/` |

Keduanya diisi URL backend ngrok yang sama. Alasannya:
- Saat situs dibuka via domain Vercel (bukan `localhost`), kode memilih
  `NEXT_PUBLIC_HOST_NGROK` sebagai base URL API.
- `next.config.mjs` membangun CSP `connect-src` dari kedua variabel, jadi mengisi
  keduanya memastikan browser tidak memblokir request ke backend ngrok.

> Jangan lupa **redeploy** setelah mengubah env var (env `NEXT_PUBLIC_*`
> dibaca saat build, bukan runtime).

## 3. Yang sudah ditangani di kode (tidak perlu diubah)

- **Header `ngrok-skip-browser-warning`** dikirim otomatis → XHR dapat JSON, bukan
  halaman interstitial ngrok.
- **CSP `connect-src`** otomatis menyertakan origin backend dari env var di atas.
- **CORS backend** sudah mengizinkan origin `*.vercel.app`
  (`ALLOW_VERCEL_ORIGINS=true` di `.env` backend host).

## 4. Checklist verifikasi setelah deploy

1. Host: `npm run dev` jalan (backend :3000) **dan** `npm run ngrok` jalan.
2. Buka URL Vercel → buka DevTools → Network.
3. Login dengan akun admin/teacher.
4. Request ke `https://crouton-boxlike-dove.ngrok-free.dev/api/...` harus `200`,
   bukan CORS error / Network Error.

Kalau muncul **CORS error**: pastikan host sudah set `ALLOW_VERCEL_ORIGINS=true`
di `.env` backend lalu restart `npm run dev`.
Kalau **Network Error**: ngrok di sisi host kemungkinan belum jalan.

> Catatan: siswa tetap login lewat aplikasi Flutter, bukan dashboard ini.
