# Reporting Boundary and Testing Policy

**Scope:** Dokumen ini berlaku **khusus untuk MVP Step 3 – Reporting**.

Dokumen ini mendefinisikan **pagar arsitektural (boundary)** dan **kebijakan pengujian (testing)** untuk memastikan bahwa modul Reporting:
- tetap **read-only**,
- tidak bocor ke domain bisnis,
- dan tidak berkembang menjadi domain terselubung.

Dokumen ini **mengikat secara implementasi** dan **bukan opsional**.

---

## 1. Tujuan Dokumen

Reporting sering menjadi titik kebocoran arsitektur karena terlihat “aman” untuk menambahkan logic kecil. Dokumen ini dibuat untuk:

- Mencegah reporting mengimpor domain atau use case mutasi
- Menjaga MVP Step 1 & 2 tetap terkunci dan tidak terpengaruh
- Memastikan reporting hanya berfungsi sebagai **lapisan observasional**
- Menyediakan dasar objektif untuk **architecture test**

Jika sebuah kebutuhan reporting melanggar dokumen ini, maka kebutuhan tersebut **BUKAN scope Step 3**.

---

## 2. Prinsip Boundary Reporting

Reporting pada Step 3 **BUKAN domain bisnis**.

Konsekuensinya:
- Tidak memiliki entity
- Tidak memiliki invariant
- Tidak memiliki business rule
- Tidak memiliki lifecycle data sendiri

Reporting hanya:
- membaca data
- mengagregasi
- memproyeksikan

Boundary terhadap Identity Migration: 
- Reporting tidak bertanggung jawab atas migrasi identity (productId → variantId).
- Jika diperlukan dual-read selama Step 4.3, maka:
  - Adaptasi dilakukan di layer query (SQL/Prisma).
  - Tidak boleh ada branching logic bisnis di application layer.
  - Tidak boleh ada conditional domain modeling di reporting.

---

## 3. Struktur Modul Reporting (Wajib)

```
src/modules/reporting/
  ├─ application/   # Orkestrasi query & mapping DTO
  ├─ queries/       # Query DB (Prisma / SQL) – read-only
  ├─ dto/           # Output contract reporting
  └─ tests/         # (opsional) integration test lokal
```

Larangan eksplisit:
- Tidak boleh ada folder `domain/`
- Tidak boleh ada entity
- Tidak boleh ada value object dengan invariant

Jika muncul kebutuhan tersebut, itu indikasi domain baru (Accounting / Fiscal), bukan Reporting.

---

## 4. Aturan Dependency (Import Rules)

### 4.1 Larangan Import Domain & Application Modul Lain

Reporting **DILARANG** mengimpor apa pun dari:

- `src/modules/sales/domain/*`
- `src/modules/sales/application/*`
- `src/modules/inventory/domain/*`
- `src/modules/inventory/application/*`
- `src/modules/catalog/domain/*`
- `src/modules/catalog/application/*`

Alasan:
- Import domain = membawa business rule
- Import application = berpotensi side effect

---

### 4.2 Larangan Reuse Use Case Mutasi

Reporting **TIDAK BOLEH** memanggil atau mengimpor use case mutasi dari Step 1 & 2, termasuk namun tidak terbatas pada:

- CreateOrder
- CancelOrder
- PayCredit
- AdjustStock
- ReceiveStock
- IssueStock

Reporting adalah consumer data, **bukan pelaku aksi**.

---

### 4.3 Penggunaan Prisma

- Prisma **BOLEH** digunakan di:
  - `src/modules/reporting/queries/*`

- Prisma **DILARANG** digunakan di:
  - `src/modules/reporting/application/*`
  - `src/modules/reporting/dto/*`

Tujuan:
- Menjaga pemisahan antara orkestrasi dan detail database
- Memudahkan refactor query tanpa memengaruhi application layer

---

### 4.4 DTO Reporting

DTO Reporting:
- Tidak boleh mengimpor tipe atau enum dari domain lain
- Menggunakan tipe primitif (string, number, boolean, date)

Contoh:
- Status order direpresentasikan sebagai `string`, bukan `OrderStatus` domain

Reporting adalah **consumer**, bukan pemilik model domain.

---

## 5. Kebijakan Testing Reporting

Testing pada Step 3 difokuskan pada **boundary dan kebenaran query**, bukan logic bisnis.

### 5.1 Jenis Test yang Wajib Ada

#### A. Architecture / Boundary Test

Lokasi:
```
src/tests/architecture/reporting-boundary.test.ts
```

Tujuan:
- Mendeteksi kebocoran dependency ke domain atau application
- Menjaga konsistensi struktur modul

Test ini **HARUS FAIL** jika:
- Reporting mengimpor domain/application modul lain
- Reporting mengimpor use case mutasi
- Prisma digunakan di luar `queries/`

---

#### B. Integration Test (Query Validation)

Tujuan:
- Memastikan query reporting mengembalikan data yang benar
- Memvalidasi agregasi dan join

Catatan:
- Integration test **BOLEH** menggunakan database nyata
- Tidak perlu mock domain

---

### 5.2 Hal yang Tidak Diuji di Step 3

Reporting test **TIDAK bertujuan** untuk:
- Menguji aturan bisnis
- Mengunci angka historis
- Menguji finalitas data

Hal-hal tersebut berada di luar scope Step 3.

---

## 6. Dampak terhadap MVP Step 1 & 2

Kebijakan ini:
- **NON-BREAKING** terhadap Step 1 & 2
- Tidak mengubah kontrak domain
- Tidak mengubah use case mutasi
- Bersifat additif sebagai pagar implementasi

---

## 7. Kapan Dokumen Ini Direvisi

Dokumen ini hanya direvisi jika:
- Sistem memasuki fase Accounting / Fiscal domain
- Ada keputusan arsitektural besar melalui ADR

Selama MVP Step 3 berlaku, dokumen ini **mengikat dan final**.

---

## 8. Penutup

Reporting yang tidak dipagari akan perlahan berubah menjadi domain tanpa disiplin.

Dokumen ini memastikan bahwa Reporting:
- tetap jujur
- tetap sederhana
- dan tidak melanggar batas tanggung jawabnya sendiri.

Jika sebuah fitur reporting terasa “butuh sedikit logic bisnis”, itu tanda bahwa fitur tersebut **bukan reporting**.

