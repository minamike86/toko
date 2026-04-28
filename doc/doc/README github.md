# Sistem Jual Beli Terpadu

Sistem jual beli terpadu untuk mendukung transaksi **offline (POS)**, **online**, dan **manajemen stok gudang**, dibangun dengan pendekatan **Domain-Driven Design (DDD)** dan arsitektur modular monolith.

Proyek ini dirancang untuk berkembang bertahap dari **MVP** menuju **kebutuhan skala enterprise**, dengan fokus pada kejujuran domain, batas tanggung jawab yang jelas, dan kemudahan evolusi sistem.

---

## Tujuan Proyek

- Menyediakan sistem transaksi yang konsisten dan dapat diaudit
- Memisahkan aturan bisnis dari framework dan UI
- Menghindari desain yang rapuh saat fitur bertambah
- Mendukung pengembangan bertahap (MVP-based development)

Proyek ini **bukan** bertujuan menjadi solusi lengkap sejak awal. Fitur ditambahkan secara sadar dan terkontrol.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: MySQL
- **ORM**: Prisma
- **Testing**: Vitest

---

## Arsitektur Singkat

Sistem ini menggunakan pendekatan **Modular Monolith** dengan lapisan:

- UI / HTTP (Next.js)
- Application Layer (Use Case)
- Domain Layer (Business Rules)
- Infrastructure Layer (Database & IO)

Detail lengkap dapat dilihat di:
/docs/03-architecture/architecture-overview.md

---

## Struktur Folder Utama


/src
/app -> UI dan HTTP boundary (Next.js)
/modules -> Domain, use case, dan infrastructure (DDD core)
/shared -> Util lintas domain (tanpa logic bisnis)
/docs -> Dokumentasi desain dan use case
/tests -> Test use case dan domain

Penjelasan detail ada di:
/docs/03-architecture/folder-structure.md


---

## Status Proyek

**Current Phase**: MVP Step 1 – Core Transaction System  
**Status**: Dokumentasi fondasi selesai, implementasi sedang berjalan

Fitur yang dicakup pada tahap ini:
- Manajemen produk dasar
- Manajemen stok satu gudang
- Transaksi penjualan (cash & credit)
- Pembatalan transaksi dan koreksi stok

Fitur lanjutan direncanakan pada MVP Step berikutnya.

---

## Dokumentasi

Seluruh keputusan desain, domain, dan use case berada di folder:

/docs


Folder ini adalah **single source of truth**.  
Jika terjadi perbedaan antara kode dan dokumen, **dokumen yang menang**.

---

## Cara Menjalankan (Development)

```bash
npm install
npm run dev
```

Konfigurasi database dan environment akan dijelaskan lebih lanjut pada tahap implementasi.

Aturan Kontribusi (Ringkas):
 - Ikuti struktur folder yang sudah ditentukan
 - Jangan menambahkan logic bisnis di UI layer
 - Perubahan domain atau alur bisnis wajib merujuk ke dokumen di /docs
Gunakan commit message yang deskriptif

Pedoman penulisan kode lengkap ada di:
/docs/03-architecture/clean-code-guidelines.md

---

## Catatan

Proyek ini dikembangkan secara bertahap.
Kecepatan bukan prioritas utama; kejelasan dan konsistensi adalah fondasi.

Jika kamu baru bergabung atau kembali setelah jeda, baca:
/docs/implementation-lock-notes.md

---

### Kenapa README ini sengaja “tidak heboh”?

Karena:
- README **bukan** tempat menaruh seluruh pengetahuan
- README **bukan** pengganti dokumentasi
- README hanya memastikan orang **tidak salah mulai**

Dengan template ini:
- repo kamu kelihatan profesional
- tapi tidak berbohong soal status
- dan tidak mengundang orang untuk “sekalian nambah fitur”

Kalau kamu mau, langkah kecil berikutnya bisa:
- template **CONTRIBUTING.md**, atau
- template **commit & PR guideline**, atau
- langsung **mulai implementasi kode pertama** (Order entity / CreateOrder use case)

Tinggal pilih.
