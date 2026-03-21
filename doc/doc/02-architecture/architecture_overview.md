# Architecture Overview

Dokumen ini memberikan gambaran arsitektur tingkat tinggi untuk Sistem Jual Beli Terpadu berbasis **Next.js (App Router)** dengan pendekatan **Domain-Driven Design (DDD)**.

Tujuan dokumen ini adalah menyamakan pemahaman tentang **bagaimana sistem disusun**, **bagaimana alur data mengalir**, dan **bagaimana tanggung jawab dipisahkan**, tanpa masuk ke detail implementasi teknis rendah.

---

## Tujuan Arsitektur

Arsitektur sistem ini dirancang untuk:
- Menjaga domain bisnis tetap bersih dan independen dari framework
- Memisahkan aturan bisnis dari mekanisme delivery (UI, HTTP)
- Mendukung evolusi dari MVP ke sistem skala enterprise
- Meminimalkan refactor besar seiring pertumbuhan fitur

Arsitektur ini **bukan** microservices. Sistem dibangun sebagai **modular monolith** yang disiplin.

---

## Bentuk Sistem: Modular Monolith

Sistem ini diimplementasikan sebagai satu aplikasi Next.js dengan pemisahan modul berdasarkan domain.

Karakteristik utama:
- Satu codebase
- Satu deployment unit
- Domain terisolasi secara logis
- Komunikasi antar domain melalui application layer

Pendekatan ini dipilih karena:
- Cocok untuk MVP
- Lebih mudah diuji dan dikembangkan
- Tidak mengorbankan kesiapan enterprise

---

## Lapisan Arsitektur

Arsitektur sistem dibagi menjadi empat lapisan utama:

```
UI / HTTP (Next.js)
        ↓
Application Layer
        ↓
Domain Layer
        ↓
Infrastructure Layer
```

Setiap lapisan memiliki tanggung jawab yang jelas dan batasan ketat.

---

## UI / HTTP Layer (Next.js)

Lapisan ini direpresentasikan oleh folder `/app`.

Tanggung jawab:
- Menerima input dari user
- Parsing request HTTP
- Validasi format dasar
- Memanggil use case di application layer
- Mengembalikan response

Lapisan ini **tidak**:
- Mengandung aturan bisnis
- Mengubah status domain secara langsung

---

## Application Layer

Lapisan ini direpresentasikan oleh folder `/modules/*/application`.

Tanggung jawab:
- Mengimplementasikan use case
- Mengorkestrasi interaksi antar domain
- Mengatur urutan eksekusi bisnis

Application layer:
- Boleh bergantung pada lebih dari satu domain
- Tidak mengetahui detail database
- Tidak mengetahui Next.js

Lapisan ini adalah "sutradara" sistem.

---

## Domain Layer

Lapisan ini direpresentasikan oleh folder `/modules/*/domain`.

Tanggung jawab:
- Mendefinisikan entity dan value object
- Menegakkan aturan bisnis (invariants)
- Menyediakan perilaku domain

Domain layer:
- Tidak mengetahui application layer
- Tidak mengetahui infrastructure
- Tidak mengetahui framework

Domain adalah inti sistem dan harus paling stabil.

---

## Infrastructure Layer

Lapisan ini direpresentasikan oleh folder `/modules/*/infrastructure`.

Tanggung jawab:
- Implementasi repository
- Akses database (Prisma)
- Integrasi eksternal

Infrastructure:
- Boleh mengetahui domain
- Tidak boleh menyimpan aturan bisnis

Lapisan ini bersifat replaceable.

---

## Alur Utama Sistem (Contoh: Create Order)

1. Request masuk melalui endpoint Next.js
2. UI layer memanggil use case `CreateOrder`
3. Application layer:
   - Membaca product dari Catalog
   - Membuat Order di Sales
   - Meminta pengurangan stok ke Inventory
4. Domain layer menegakkan aturan masing-masing
5. Infrastructure layer menyimpan perubahan ke database
6. Response dikembalikan ke UI

Tidak ada domain yang berkomunikasi langsung dengan database atau UI.

---

## Penanganan Perubahan dan Evolusi

- Penambahan fitur dilakukan melalui use case baru
- Perubahan signifikan dicatat melalui ADR
- Domain baru ditambahkan sebagai modul baru
- Domain lama tidak dimodifikasi tanpa alasan bisnis yang jelas

---

## Prinsip Penting

- Domain lebih penting daripada framework
- Use case lebih penting daripada controller
- Kejujuran data lebih penting daripada kemudahan implementasi

---

## Catatan Penutup

Dokumen ini menjadi referensi utama untuk memahami bentuk sistem secara keseluruhan. Jika implementasi mulai menyimpang dari gambaran ini, maka perlu dilakukan evaluasi sebelum melanjutkan pengembangan lebih jauh.

