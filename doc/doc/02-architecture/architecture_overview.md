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

## UI / API Delivery Boundary

Section ini mendefinisikan boundary eksplisit untuk layer delivery
(UI, route handler, dan HTTP adapter) agar perilaku entry point sistem
tetap konsisten dan tidak bocor ke domain atau infrastructure.

Tujuannya adalah:

- menjaga agar request handling tetap tipis dan terkontrol
- memastikan mapping request → use case bersifat konsisten
- mencegah UI / route menjadi tempat business rule tersembunyi
- memperjelas kontrak actor, input, output, dan error di boundary awal sistem

---

### Tanggung Jawab Delivery Layer

Delivery layer boleh:

- menerima request dari user atau HTTP client
- parsing request
- validasi format dasar input
- membentuk input DTO ke use case
- meneruskan actor context ke application layer
- memetakan hasil use case ke response
- memetakan error application ke response transport

Delivery layer tidak boleh:

- membuat atau mengubah invariant domain
- memutuskan rule bisnis inti
- mengakses Prisma secara langsung
- mengakses repository implementation secara langsung
- menginstansiasi use case produksi secara langsung
- melakukan mutation ke sistem tanpa melalui use case

---

### Actor & Authorization Boundary

Jika sebuah use case membutuhkan actor context:

- actor context dibawa dari boundary awal
- delivery layer hanya meneruskan context tersebut
- authorization tetap diputuskan di application layer

Delivery layer tidak boleh memindahkan rule authorization ke UI logic.

---

### Request / Response Mapping Rule

Mapping input/output di delivery layer harus mengikuti aturan berikut:

1. Request body, params, dan query diparsing di delivery layer.
2. Input ke use case harus berbentuk DTO eksplisit.
3. Response transport boleh berbeda dari bentuk internal domain.
4. Domain entity tidak boleh diekspos mentah sebagai kontrak HTTP.

Tujuannya adalah menjaga agar kontrak HTTP tidak menjadi source of truth domain.

---

### Error Mapping Rule

Delivery layer bertanggung jawab untuk:

- menangkap error dari application layer
- memetakan error ke bentuk response yang sesuai

Delivery layer tidak boleh:

- menciptakan error bisnis baru
- mengganti makna error domain / application
- membocorkan detail teknis mentah dari ORM / framework jika sudah tersedia error bermakna

---

### Delivery Helper Standardization

Untuk menjaga konsistensi implementasi delivery boundary (terutama pada POS dan API route),
digunakan helper terstandarisasi berikut:

- `src/shared/delivery/parse-actor-context.ts`
- `src/shared/delivery/map-http-error.ts`

#### Tujuan

- Menstandarkan cara actor context diambil dari request
- Menstandarkan mapping error dari application layer ke HTTP response
- Mencegah duplikasi logic parsing dan error mapping di setiap route
- Menjaga route handler tetap tipis dan konsisten

#### Aturan

- Route / UI **wajib** menggunakan helper ini untuk:
  - parsing actor context
  - mapping error ke response HTTP
- Route tidak boleh:
  - membuat ulang logic parsing actor
  - membuat ulang mapping error manual
  - melakukan `instanceof` error secara langsung di route
- Helper ini bersifat:
  - **stateless**
  - **non-domain**
  - **non-business-rule**

#### Boundary Constraint

- Helper ini tidak boleh:
  - mengandung rule bisnis
  - mengakses repository
  - mengakses Prisma
  - mengubah hasil use case

Helper hanya bertindak sebagai adapter teknis antara HTTP dan application layer.

#### Scope

- Berlaku untuk seluruh route POS dan API delivery layer
- Tidak berlaku untuk domain atau application layer

---

### Container Access Rule

Delivery layer hanya boleh mengakses dependency yang sudah di-wire secara sah.

Artinya:

- route / UI boleh memanggil use case yang sudah disediakan container
- route / UI tidak boleh menjadi composition root baru
- route / UI tidak boleh membuat repository, adapter, atau Prisma client sendiri

Jika rule ini dilanggar, maka boundary delivery dianggap bocor.

---

### Verification Rule

Delivery boundary dianggap **VALID** jika:

- request hanya diparsing di UI / route layer
- actor context diteruskan, bukan diputuskan sebagai rule bisnis
- use case dipanggil melalui dependency yang sudah di-wire
- response hanya merupakan mapping hasil use case
- tidak ada Prisma / repository instantiation di layer delivery
- tidak ada business rule inti di route, page, atau component

Jika salah satu dilanggar:

→ dianggap **pelanggaran boundary arsitektur**

---

### Inventory Listing UI (Read-Only)

UI inventory listing disediakan sebagai delivery layer untuk menampilkan
snapshot stok yang sudah tersedia di reporting.

Karakteristik:

- Read-only (tidak melakukan mutation)
- Menggunakan data dari reporting / query layer
- Tidak menggunakan use case mutation inventory
- Tidak mengakses Prisma secara langsung

Tujuan:

- Menyediakan visibilitas stok per variant
- Menampilkan low stock indicator
- Mendukung operasional harian (warehouse / owner)

Batasan:

- Tidak mengubah stok
- Tidak melakukan adjustment
- Tidak mengandung rule bisnis
- Tidak menjadi source of truth

Jika UI membutuhkan data tambahan:

→ harus berasal dari reporting layer, bukan domain mutation

---

### Status

- Section ini bersifat **NON-BREAKING**
- Tidak menambah domain baru
- Tidak mengubah use case yang ada
- Hanya memperjelas kontrak delivery sebagai entry point resmi sistem

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

## Dependency Wiring & Container Verification

Section ini mendefinisikan aturan eksplisit mengenai **wiring dependency dan container** sebagai bagian dari kontrak arsitektur.

Tujuannya adalah:

- memastikan dependency antar layer dan antar modul **terkontrol dan dapat diaudit**
- mencegah instansiasi dependency secara liar
- menjadikan wiring sebagai bagian dari **arsitektur yang terverifikasi**, bukan hanya implementasi

### Enforcement Coverage Reference

Seluruh rule wiring, dependency boundary, dan container discipline pada section ini
wajib dijaga melalui architecture / boundary test.

Checklist enforcement resminya berada di:

- `Testing Strategy.md`
  - section `Architecture / Boundary Test Checklist (MANDATORY)`

Konsekuensinya:

- pelanggaran rule pada section ini harus dianggap sebagai architecture violation
- pelanggaran tidak boleh diperlakukan sebagai warning atau code smell biasa
- perubahan tidak boleh dianggap final jika architecture / boundary test masih gagal

Section ini tidak memperkenalkan rule baru.
Section ini hanya mengunci bahwa rule arsitektur harus memiliki enforcement aktif,
bukan sekadar deklarasi dokumentasi.

### Enforcement Requirement (MANDATORY)

- Architecture rule WAJIB dijaga oleh architecture test
- Pelanggaran = architecture violation (bukan warning)
- Tidak boleh merge jika violation ada

Klasifikasi:

- NON-BREAKING
- Clarification
- Mengunci rule yang sudah implied

---

### Prinsip Utama

1. **Seluruh dependency utama HARUS di-wire melalui container**

   - Repository
   - Use case
   - Service adapter (port implementation)

   Tidak diperbolehkan melakukan instansiasi langsung di UI layer atau di dalam use case.

---

1. **Container menjadi entry point komposisi sistem**

   Container bertanggung jawab untuk:

   - membuat instance repository (Prisma-based)
   - menghubungkan use case dengan dependency
   - menghubungkan antar modul melalui port / adapter

   Contoh referensi implementasi:

   - `src/wiring/container.ts`

---

1. **Application layer tidak boleh membuat dependency sendiri**

   Use case hanya menerima dependency melalui constructor.

   Dilarang:

   - `new PrismaClient()` di application layer
   - instansiasi repository di dalam use case

---

1. **Cross-module interaction wajib melalui abstraction (port / adapter)**

   Contoh:

   - Sales tidak langsung mengakses InventoryRepository
   - Procurement tidak langsung mengakses InventoryRepository
   - Interaksi dilakukan melalui adapter seperti `InventoryServiceAdapter` atau port yang setara

---

1. **Infrastructure hanya di-instantiate di container**

   Prisma dan implementation repository:

   - hanya boleh dibuat di layer wiring/container
   - tidak boleh tersebar di module lain

---

1. **UI / HTTP layer hanya boleh mengakses use case yang sudah di-wire**

   UI tidak boleh:

   - membuat use case sendiri
   - mengakses repository langsung
   - mengakses Prisma

---

### Verification Rule

Wiring dianggap **VALID** jika:

- seluruh use case menerima dependency via constructor
- tidak ada instansiasi Prisma di luar infrastructure/container
- tidak ada akses repository langsung antar modul
- seluruh interaksi lintas domain melalui application layer atau port

Jika salah satu dilanggar:

→ dianggap **pelanggaran arsitektur**, bukan sekadar issue implementasi

---

### Architecture Test Enforcement

Aturan wiring di section ini **wajib** dijaga melalui architecture / boundary test.

Tujuannya:

- mencegah bypass container
- mencegah instansiasi Prisma di layer yang salah
- mencegah coupling langsung antar modul melalui repository implementation
- memastikan dependency graph tetap konsisten seiring pertumbuhan fitur

#### Rule A — Prisma instantiation hanya boleh di infrastructure/container

Test **HARUS FAIL** jika ditemukan:

- `new PrismaClient()` di:
  - `src/modules/*/application/**`
  - `src/modules/*/domain/**`
  - `src/app/**`
  - file UI / route lain di luar layer wiring yang sah

Test **BOLEH PASS** jika Prisma diinstansiasi pada:

- `src/wiring/container.ts`
- layer infrastructure yang memang menjadi bagian dari komposisi teknis yang sah
- lokasi shared Prisma yang secara eksplisit dikunci oleh dokumen arsitektur lain

#### Rule B — Application layer tidak boleh instantiate repository implementation

Test **HARUS FAIL** jika file di:

- `src/modules/*/application/**`

melakukan:

- `new Prisma*Repository(...)`
- import repository implementation dari `infrastructure/`

Application layer hanya boleh menerima dependency melalui constructor / injection.

#### Rule C — UI / HTTP layer tidak boleh bypass container

Test **HARUS FAIL** jika file di:

- `src/app/**`

melakukan salah satu dari berikut:

- `new PrismaClient()`
- `new Prisma*Repository(...)`
- `new <UseCase>(...)` secara langsung untuk use case produksi
- import repository implementation dari `infrastructure/`

UI / HTTP layer hanya boleh:

- memanggil use case yang sudah di-wire
- membawa request context
- melakukan parsing input dan mapping response

#### Rule D — Cross-module interaction tidak boleh memakai repository implementation langsung

Test **HARUS FAIL** jika ditemukan use case pada satu modul mengimpor repository implementation milik modul lain.

Contoh pelanggaran:

- Sales application mengimpor `PrismaInventoryRepository`
- Procurement application mengimpor `PrismaInventoryRepository`
- Dashboard / Reporting mengimpor repository implementation write-side

Interaksi lintas modul wajib melalui:

- application layer
- port / adapter
- contract yang eksplisit

#### Rule E — Kegagalan test dianggap pelanggaran arsitektur

Jika salah satu rule di atas gagal:

- statusnya adalah **architecture violation**
- bukan sekadar code smell
- wajib diperbaiki sebelum perubahan dianggap final

#### Lokasi Test yang Direkomendasikan

Architecture test untuk rule ini direkomendasikan berada di:

- `src/tests/architecture/dependency-wiring-boundary.test.ts`

Test tersebut bersifat:

- preventif
- non-fungsional
- tidak menguji rule bisnis
- tidak menggantikan application test atau integration test

---

### Phase-2 Enforcement Note

Beberapa aspek enforcement boundary, terutama pada delivery layer (UI / route),
belum sepenuhnya machine-checkable pada fase saat ini.

Detail blind spot dan rencana penutupannya didefinisikan di:

- Testing Strategy.md
  - section `Phase-2 Blind Spots (MANDATORY FOLLOW-UP)`

Bagian ini tidak mengubah rule arsitektur, hanya mencatat bahwa
coverage enforcement wajib diperketat pada fase berikutnya

---

### Status

- Section ini bersifat **NON-BREAKING**
- Tidak mengubah domain, use case, maupun flow
- Mengikat sebagai aturan arsitektur untuk seluruh modul (Sales, Inventory, Procurement, Reporting, Dashboard)

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
