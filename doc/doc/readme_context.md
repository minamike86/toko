# README – Project Context

Dokumen ini berfungsi sebagai **ringkasan konteks proyek** untuk membantu siapa pun (termasuk diri sendiri di masa depan atau AI baru) memahami **posisi proyek saat ini** tanpa harus membaca seluruh dokumentasi.

Dokumen ini **bukan pengganti README.md**, **bukan pengganti dokumentasi domain**, dan **bukan roadmap**. Ini adalah *briefing singkat*.

---

## Ringkasan Proyek

Proyek ini adalah **Sistem Jual Beli Terpadu** yang mendukung:
- Penjualan offline (POS)
- Penjualan online
- Manajemen stok gudang

Sistem dibangun dengan pendekatan **Domain-Driven Design (DDD)**, **Clean Architecture**, dan **pengembangan bertahap berbasis MVP**.

Fokus utama desain adalah:
- Kejujuran domain
- Boundary yang jelas antar tanggung jawab
- Kemudahan evolusi dari MVP ke enterprise

---

## Tech Stack

- Framework: Next.js (App Router)
- Language: TypeScript
- Database: MySQL
- ORM: Prisma
- Testing: Vitest

---

## Status Saat Ini

**Fase**: MVP Step 1 – Core Transaction

Yang SUDAH selesai:
- Dokumentasi fondasi (domain, use case, arsitektur, boundary, clean code)
- Penguncian scope MVP Step 1

Yang SEDANG dilakukan:
- Implementasi kode DDD (domain & application layer)

Yang BELUM dilakukan (ditunda sadar):
- Pajak
- Promo / diskon
- Multi-gudang
- Accounting
- Reporting lanjutan

---

## Sumber Kebenaran

Folder berikut adalah **single source of truth**:

```
/docs
```

Jika terdapat perbedaan antara kode, README.md, dan dokumen lain, **dokumen di `/docs` yang menang**.

---

## Cara Melanjutkan Pekerjaan

Untuk melanjutkan pengembangan:

1. Baca `implementation-lock-notes.md`
2. Pilih use case di `/docs/02-use-cases`
3. Implementasikan di application layer
4. Pastikan tidak melanggar `ddd-boundaries.md`

---

## Catatan untuk Kontributor / AI

- Jangan menambah fitur di luar MVP Step aktif
- Jangan mengubah domain tanpa justifikasi dan dokumen
- Jika ragu, rujuk ke `/docs`

---

## Penutup

Dokumen ini dibuat agar konteks proyek dapat dipahami dalam waktu singkat. Jika membutuhkan detail, lanjutkan membaca dokumentasi di folder `/docs`.

