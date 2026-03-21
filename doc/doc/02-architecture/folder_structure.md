# Folder Structure

Dokumen ini mendefinisikan struktur folder kode untuk Sistem Jual Beli Terpadu berbasis **Next.js (App Router)** dengan pendekatan **Domain-Driven Design (DDD)**.

Struktur ini dirancang untuk:
- Memisahkan tanggung jawab dengan jelas
- Menjaga domain tetap bersih dari framework
- Mendukung evolusi dari MVP ke enterprise tanpa refactor besar

Dokumen ini bersifat **mengikat**. Perubahan struktur harus melalui diskusi dan, jika signifikan, dicatat melalui ADR.

---

## Struktur Root

```
/src
  /app
  /modules
  /shared
```

Penjelasan:
- `app` berisi seluruh kode yang spesifik ke Next.js
- `modules` berisi inti bisnis (domain, use case, dan infrastruktur)
- `shared` berisi utilitas lintas domain yang bersifat generik

---

## Folder `/app` (Next.js Layer)

```
/src/app
  /api
    /orders
      route.ts
  /dashboard
  /pos
```

Aturan utama:
- Folder ini **tidak** menyimpan aturan bisnis
- File di sini hanya menangani HTTP, UI, dan wiring ke application layer

Yang boleh ada:
- Parsing request
- Validasi input ringan (format, tipe)
- Pemanggilan use case
- handle response

Yang **dilarang**:
- Perhitungan bisnis
- Manipulasi stok
- Logic status order

---

## Folder `/modules` (DDD Core)

```
/src/modules
  /catalog
    /domain
    /application
    /infrastructure

  /inventory
    /domain
    /application
    /infrastructure

  /sales
    /domain
    /application
    /infrastructure
```

Kalau kamu lihat:
 - domain → entity + aturan
 - application → use case
 - infrastructure → Prisma, DB, IO

Ini bukan gaya. Ini pagar.

Setiap domain **wajib** memiliki struktur ini.

---

## Folder `domain`

Contoh:
```
/modules/sales/domain
  Order.ts
  OrderItem.ts
  OrderRepository.ts
```

Isi folder domain:
- Entity
- Value Object
- Interface repository
- Aturan bisnis dan invariants

Aturan keras:
- Tidak boleh import Next.js
- Tidak boleh import Prisma
- Tidak boleh ada HTTP atau UI code

File di folder ini harus bisa dipindahkan ke project lain tanpa perubahan.

---

## Folder `application`

Contoh 1:
```
/modules/sales/application
  CreateOrder.ts
  CancelOrder.ts
```

Isi folder application:
- Implementasi use case
- Orkestrasi antar domain
- Koordinasi repository

Aturan:
- Boleh mengakses lebih dari satu domain
- Tidak boleh tahu detail database
- Tidak boleh tahu Next.js

Application layer adalah tempat semua **alur bisnis** hidup.

---

Contoh2:

```
/modules/sales/application
  CreateOrder.ts 
```

Menerima input DTO
Memanggil repository interface
Mengorkestrasi:
 - baca Catalog
 - buat Order
 - minta Inventory
Mengembalikan hasil

Application layer boleh tahu banyak domain, tapi:
tidak boleh tahu database
tidak boleh tahu Next.js

Ini tempat semua **alur bisnis** hidup.

---

## Folder `infrastructure`

Contoh:
```
/modules/sales/infrastructure
  PrismaOrderRepository.ts
```

Isi folder infrastructure:
- Implementasi repository
- Mapping entity ↔ database
- Akses Prisma atau service eksternal
- Semua await prisma.xxx ada di sini

Aturan:
- Boleh tahu Prisma
- Tidak boleh menyimpan aturan bisnis

---

## Folder `/shared`

```
/src/shared
  /errors
  /types
  /utils
```

Digunakan untuk:
- Error base
- Value object umum (misalnya Money, ID)
- Helper murni tanpa dependensi domain

Larangan:
- Jangan taruh logic bisnis di sini
- Jangan jadikan shared sebagai "tempat buang sampah"

---

## Struktur Testing

```
/tests
  /sales
    CreateOrder.test.ts
  /inventory
    IssueStock.test.ts
```

Prinsip testing:
- Fokus ke application layer
- Mock repository
- Jangan test Prisma di awal

---

## Mapping Dokumen ke Kode

- `catalog-domain.md` → `/modules/catalog/domain`
- `inventory-domain.md` → `/modules/inventory/domain`
- `sales-domain.md` → `/modules/sales/domain`
- `create-order.md` → `/modules/sales/application/CreateOrder.ts`
- `cancel-order.md → /modules/sales/application/CancelOrder.ts`

Dokumen adalah blueprint, bukan formalitas.

---

## Catatan Penutup

Struktur folder ini dibuat untuk menjaga disiplin jangka panjang.
 Jika muncul kebingungan "file ini harus diletakkan di mana", maka kemungkinan besar file tersebut belum jelas tanggung jawabnya.

---


