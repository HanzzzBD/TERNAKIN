# Log Implementasi — Ternakin

| | |
|---|---|
| **Proyek** | Ternakin — asisten digital peternak ayam (PWA) |
| **Branch** | `Dev-Website` |
| **Periode commit** | 19–23 November 2026 |
| **Cakupan** | Seluruh 49 commit di branch ini, dari dokumen PRD/SDD sampai landing terbaru |
| **Sumber model AI** | Trailer `Co-Authored-By` di pesan commit. Commit tanpa trailer ditulis "tidak tercatat" |

## Cara membaca

Log dipecah per fitur agar setiap berkas bisa dibaca mandiri. Setiap berkas memuat:

1. Daftar commit beserta penulis, tanggal, dan model AI yang tercatat.
2. Isi tiap commit, diringkas dari pesan commit dan berkas yang diubah.
3. Keputusan penting yang tercatat di pesan commit.
4. Detail per commit di bagian akhir: jumlah baris ditambah dan dihapus, status tiap file (baru atau diubah), dan isi pesan commit lengkap. Bagian ini dibuat dari `git show`, sehingga angkanya bisa diverifikasi ulang.

Log percakapan per permintaan (prompt asli, bug, dan koreksi) ada di [log vibe coding hasby.md](../log%20vibe%20coding%20hasby.md).

## Berkas

| Berkas | Fitur | Jumlah commit |
|---|---|---|
| [01-fondasi-dan-pwa.md](01-fondasi-dan-pwa.md) | Monorepo, server Express, cangkang PWA, dokumen PRD/SDD | 9 |
| [02-ui-dan-maskot.md](02-ui-dan-maskot.md) | Token desain, komponen UI, AppShell, sidebar, maskot Kokok, animasi GSAP | 11 |
| [03-pakan.md](03-pakan.md) | Solver pakan, penyusun pakan offline-first, data referensi | 5 |
| [04-catatan-kandang.md](04-catatan-kandang.md) | Profil kandang, catatan harian, sinkronisasi outbox | 3 |
| [05-toko-rujukan.md](05-toko-rujukan.md) | Rujukan toko pakan dan antrean lead WhatsApp | 3 |
| [06-kokok.md](06-kokok.md) | Triase, obrolan AI, penjaga keselamatan, basis pengetahuan | 6 |
| [07-landing.md](07-landing.md) | Landing page, floating navbar, popup Kokok, strip kata kunci | 8 |
| [08-akun-dan-investasi.md](08-akun-dan-investasi.md) | Masuk WhatsApp/email/Google, peran, Modul 5 investasi | 3 |

Commit `f81ef84` (log percakapan Hasby) tidak masuk ke berkas fitur mana pun.

## Model AI per commit

| Model (dari trailer) | Jumlah commit | Keterangan |
|---|---|---|
| Claude Opus 5.5 | 12 | `578cbb8` dan `332fc60` sampai `658c81f` (20–21 Nov), termasuk `f81ef84` |
| Claude Sonnet 5.5 | 3 | `3252682`, `ffb10af` (dokumen PRD/SDD), dan `d426d14` (landing) |
| Tidak tercatat | 34 | Sebagian besar commit 19 Nov (`bd2b287` sampai `76d9c4f`) dan `80dfe02` (revert) |

Tabel ini dihitung dari trailer yang ada. Commit yang tidak mencantumkan trailer tidak diberi model tebakan.

## Ringkasan hasil

- Fondasi monorepo, PWA offline-first, dan komponen UI aksesibel selesai pada 19 Nov.
- Lima fitur produk utama (pakan, catatan kandang, toko rujukan, Kokok, akun) dibangun offline-first, dengan API Express dan SQLite.
- Kokok berpindah dari mock ke Gemini dengan RAG berbasis embedding, dan dilindungi penjaga keselamatan tiga lapis.
- Akun mendukung WhatsApp OTP, email + sandi, dan Google, dengan pembagian peran peternak/pengguna.
- Modul 5 investasi ternak berupa prototipe simulasi tanpa transaksi uang.
