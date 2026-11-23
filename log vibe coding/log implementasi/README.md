# Log Implementasi — Ternakin

| | |
|---|---|
| **Proyek** | Ternakin — asisten digital peternak ayam (PWA) |
| **Branch** | `Dev-Website` |
| **Periode commit** | 19–23 November 2026 |
| **Cakupan** | 62 commit di branch ini, dari dokumen PRD/SDD sampai semua fitur wajib masuk (`4a2b568`). Commit yang hanya memperbarui log ini (`8ee78b1`, `8add65e`, `58edcbc`, dan commit log berikutnya) tidak dicatat |
| **Sumber model AI** | Trailer `Co-Authored-By` di pesan commit. Commit tanpa trailer ditulis "tidak tercatat" |

## Cara membaca

Log dipecah per fitur agar setiap berkas bisa dibaca mandiri. Setiap berkas memuat:

1. Daftar commit beserta penulis, tanggal, dan model AI yang tercatat.
2. Isi tiap commit, diringkas dari pesan commit dan berkas yang diubah.
3. Keputusan penting yang tercatat di pesan commit.
4. Detail per commit di bagian akhir: jumlah baris ditambah dan dihapus, status tiap file (baru, diubah, atau dihapus), dan isi pesan commit lengkap. Bagian ini dibuat dari `git show`, sehingga angkanya bisa diverifikasi ulang.

Log percakapan per permintaan (prompt asli, bug, dan koreksi) dulu ada di `log vibe coding/log vibe coding hasby.md`. Berkas itu dihapus di `e1e7197`, dan isinya masih bisa dibaca dari riwayat git dengan `git show f81ef84`.

## Berkas

| Berkas | Fitur | Jumlah commit |
|---|---|---|
| [01-fondasi-dan-pwa.md](01-fondasi-dan-pwa.md) | Monorepo, server Express, cangkang PWA, dokumen PRD/SDD | 9 |
| [02-ui-dan-maskot.md](02-ui-dan-maskot.md) | Token desain, komponen UI, AppShell, sidebar, maskot Kokok, animasi GSAP | 11 |
| [03-pakan.md](03-pakan.md) | Solver pakan, penyusun pakan offline-first, data referensi | 5 |
| [04-catatan-kandang.md](04-catatan-kandang.md) | Profil kandang, catatan harian, sinkronisasi outbox | 3 |
| [05-toko-rujukan.md](05-toko-rujukan.md) | Rujukan toko pakan dan antrean lead WhatsApp | 3 |
| [06-kokok.md](06-kokok.md) | Triase, obrolan AI, penjaga keselamatan, basis pengetahuan | 6 |
| [07-landing.md](07-landing.md) | Landing page, floating navbar, popup Kokok, strip kata kunci | 9 |
| [08-akun-dan-investasi.md](08-akun-dan-investasi.md) | Masuk WhatsApp/email/Google, peran, Modul 5 investasi, wajib masuk untuk semua fitur | 6 |
| [09-aplikasi-mobile.md](09-aplikasi-mobile.md) | Aplikasi Android Expo, sesi Bearer, EAS Update, unduhan APK dari website | 3 |
| [10-deploy-shared-hosting.md](10-deploy-shared-hosting.md) | Paket runtime, skrip update dari git clone, migrasi ke `node:sqlite`, build service worker di server | 6 |

Commit `f81ef84` (log percakapan Hasby) tidak masuk ke berkas fitur mana pun. Commit `bea6f2e` berjudul "setup deployv2.1" tetapi isinya perbaikan tampilan landing, sehingga dicatat di [07-landing.md](07-landing.md).

## Model AI per commit

| Model (dari trailer) | Jumlah commit | Keterangan |
|---|---|---|
| Claude Opus 5.5 | 20 | `578cbb8` dan `332fc60` sampai `658c81f` (20–21 Nov), termasuk `f81ef84`, serta `bea6f2e`, `f499ebd`, `b4d9731`, `8b0cd50`, `f7dfa72`, `76b8669`, `af0181c`, dan `4a2b568` (23 Nov) |
| Claude Sonnet 5.5 | 3 | `3252682`, `ffb10af` (dokumen PRD/SDD), dan `d426d14` (landing) |
| Claude Haiku 5.5 | 1 | `e1e7197` (aplikasi mobile) |
| Tidak tercatat | 38 | Sebagian besar commit 19 Nov (`bd2b287` sampai `76d9c4f`), `80dfe02` (revert), dan empat commit deploy (`68c80e9`, `b0cdc09`, `34d2d69`, `6c0206c`) |

Tabel ini dihitung dari trailer yang ada. Commit yang tidak mencantumkan trailer tidak diberi model tebakan. Untuk empat commit deploy, model yang dipakai saat pengerjaan dijelaskan terpisah di [10-deploy-shared-hosting.md](10-deploy-shared-hosting.md).

## Ringkasan hasil

- Fondasi monorepo, PWA offline-first, dan komponen UI aksesibel selesai pada 19 Nov.
- Lima fitur produk utama (pakan, catatan kandang, toko rujukan, Kokok, akun) dibangun offline-first, dengan API Express dan SQLite.
- Kokok berpindah dari mock ke Gemini dengan RAG berbasis embedding, dan dilindungi penjaga keselamatan tiga lapis.
- Akun mendukung WhatsApp OTP, email + sandi, dan Google, dengan pembagian peran peternak/pengguna.
- Semua fitur aplikasi wajib masuk di web dan Android (akun demo boleh), dengan server ikut menolak tamu. Setelah sekali masuk, aplikasi tetap bisa dipakai tanpa sinyal.
- Modul 5 investasi ternak berupa prototipe simulasi tanpa transaksi uang.
- Aplikasi Android (Expo) memakai `@ternakin/shared` yang sama dengan web, dengan sesi token Bearer.
- Situs berjalan di shared hosting (`https://ternakin.code-xpert.my.id`). API memakai SQLite bawaan Node agar tidak bergantung pada modul native.
- APK Android bisa diunduh dari website, dan perubahan JS/tampilan dikirim ke APK terpasang lewat EAS Update.
