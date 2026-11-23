# Ternakin Mobile (Android)

Aplikasi Android Ternakin dengan **Expo SDK 58 + Expo Router + TypeScript**. API, skema, solver pakan,
dan penyaring Kokok sama dengan web karena memakai `@ternakin/shared`.

## Yang dibutuhkan

| Kebutuhan | Keterangan |
| --- | --- |
| Node.js + npm | Sudah dipakai monorepo ini |
| Akun Expo | Proyek `@hadrianrangga/ternakin` (sudah ditautkan, lihat `app.json` → `extra.eas.projectId`) |
| EAS CLI | `npm i -g eas-cli`, lalu `eas login` |
| cloudflared | Untuk tunnel pengembangan (`npm run tunnel`) |
| HP Android | Pasang APK development build dari EAS |

Android Studio **tidak wajib**: APK dibangun di cloud oleh EAS.

## Alamat

| Hostname | Diteruskan ke | Dipakai untuk |
| --- | --- | --- |
| `https://ternakin-api.orbit4.my.id` | `localhost:3000` | API (`npm run dev`) |
| `https://ternakin-dev.orbit4.my.id` | `localhost:8081` | Metro / hot reload (`npm run mobile`) |
| `https://ternakin.code-xpert.my.id` | Server produksi (shared hosting) | API untuk APK `preview` dan build `production` |

Profil `development` memakai tunnel di laptop, jadi hanya jalan saat `npm run dev` dan `npm run tunnel`
menyala. APK `preview` dan `production` memakai server produksi, jadi bisa dipakai tanpa laptop.

Konfigurasi tunnel ada di `~/.cloudflared/ternakin-dev.yml` (contoh: `deploy/cloudflared/ternakin-dev.example.yml`).

## Alur pengembangan harian

Jalankan dari akar repo, masing-masing di terminal terpisah:

```bash
npm run dev       # API + web
npm run tunnel    # Cloudflare Tunnel (API + Metro)
npm run mobile    # Metro, diiklankan lewat https://ternakin-dev.orbit4.my.id
```

Buka aplikasi **Ternakin (development build)** di HP. Aplikasi memuat kode dari Metro lewat tunnel, jadi
HP tidak perlu satu WiFi dengan laptop. Simpan file dan HP otomatis memuat ulang.

Kalau HP dan laptop satu WiFi dan tanpa tunnel: `npm run dev -w @ternakin/mobile -- --lan`.

## Masuk dengan Google

Memakai `@react-native-google-signin/google-signin` (modul native) dengan `webClientId` = `GOOGLE_CLIENT_ID`
server, sehingga ID token punya audiens yang sama dengan tombol Google di web dan server **tidak perlu diubah**.

1. Bangun ulang APK development (`eas build --profile development --platform android`). APK lama tidak
   memiliki modulnya; tombol Google otomatis disembunyikan di sana.
2. Ambil SHA-1 keystore EAS: `eas credentials` → Android → `id.ternakin.app`.
3. Di Google Cloud Console (proyek yang sama dengan `GOOGLE_CLIENT_ID`), buat **OAuth client ID tipe Android**
   dengan nama paket `id.ternakin.app` dan SHA-1 tadi. Client Android ini tidak dipakai di kode; Google hanya
   memakainya untuk mengizinkan aplikasi meminta token untuk client web.
4. Pastikan server mengisi `GOOGLE_CLIENT_ID` (tombol muncul bila `/v1/auth/konfigurasi` mengembalikannya).

Tanpa Firebase, config plugin paket ini **tidak** dipasang di `app.json` (plugin hanya untuk skema URL iOS;
versi tanpa opsi justru menuntut `google-services.json`).

## Build APK lewat EAS

```bash
cd apps/mobile
eas build --profile development --platform android   # APK dev client (sekali, ulang bila menambah modul native)
eas build --profile preview --platform android       # APK uji coba untuk dibagikan (tanpa Metro)
eas build --profile production --platform android    # AAB untuk Play Store
```

Build pertama akan menanyakan pembuatan keystore Android; pilih **ya** (disimpan aman di EAS).
`EXPO_PUBLIC_API_URL` per profil diatur di `eas.json`.

## Update tanpa pasang ulang APK (EAS Update)

APK `preview` dan `production` memakai `expo-updates`. Perubahan JavaScript, tampilan, dan teks bisa dikirim
ke HP yang sudah memasang APK tanpa build dan pasang ulang.

**Sekali saja (setelah `expo-updates` ditambahkan):**

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build --profile preview --platform android   # APK baru; semua orang pasang sekali
```

**Setiap ada perubahan JS/tampilan:**

```bash
npm run update -w @ternakin/mobile -- "Pesan singkat perubahan"                # channel preview
npm run update -w @ternakin/mobile -- --production "Pesan singkat perubahan"   # channel production
```

- Aplikasi memeriksa update saat dibuka. Update diunduh di latar belakang dan **tampil saat aplikasi
  dibuka berikutnya** (tutup penuh lalu buka lagi).
- `scripts/update.mjs` memaksa `EXPO_PUBLIC_API_URL` ke server produksi agar alamat tunnel dari `.env`
  lokal tidak ikut terkirim.
- `runtimeVersion` memakai kebijakan `fingerprint`. Bila ada perubahan native (menambah modul native,
  mengubah konfigurasi native di `app.json`, atau upgrade Expo SDK), runtime berubah dan update **tidak**
  dikirim ke APK lama. Build dan pasang APK baru untuk perubahan seperti itu.
- Update hanya untuk APK `preview`/`production`. APK `development` tetap memakai Metro (hot reload).

## Sesi akun di mobile

Web memakai cookie HttpOnly. Aplikasi mobile mengirim header `X-Ternakin-Klien: mobile` saat masuk,
menerima `token` di body, menyimpannya di **SecureStore** (Android Keystore), lalu mengirimnya sebagai
`Authorization: Bearer <token>`. ID perangkat mode tamu dikirim lewat `X-Device-Id`.

## Status fitur

| Fitur | Status |
| --- | --- |
| Navigasi tab, tema, splash, ikon | Selesai |
| Desain baru: latar krem, kartu putih, aksen peach, bilah tab gelap + tombol Kokok di tengah | Selesai |
| Layar sambutan (3 slide, tampil sekali per pemasangan) | Selesai |
| Beranda: gauge busur produksi telur hari ini, peringatan dini, catatan terakhir | Selesai |
| Masuk seperti web: email (masuk/daftar, verifikasi kode, lupa sandi), WhatsApp OTP, akun demo, pilih peran, tautan mitra | Selesai |
| Masuk dengan Google (native, butuh APK baru + klien OAuth Android) | Selesai |
| Kokok (obrolan AI) | Selesai |
| Catatan harian + profil kandang (offline, antrean `/v1/sinkron`) | Selesai |
| Hitung pakan (solver LP di HP, offline; data referensi server → simpanan → bawaan) | Selesai |
| Hitung pakan: urai teks bebas dan penjelasan AI | Berikutnya |
| Triase gejala Kokok + ringkasan WhatsApp | Berikutnya |
| Profil kandang, toko pakan, investasi | Berikutnya |
