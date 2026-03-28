# Architecture Test Specification – Reporting Boundary

Dokumen ini mendefinisikan **spesifikasi test arsitektur** untuk MVP Step 3 – Reporting.

Spesifikasi ini ditulis dalam bentuk **Given / When / Then** dan dimaksudkan sebagai:
- dasar implementasi architecture test
- checklist review arsitektur
- kontrak teknis yang dapat diaudit

Dokumen ini **TIDAK berisi kode test**, hanya spesifikasi yang harus dipenuhi.

---

## 1. Prinsip Umum

- Architecture test bersifat **preventif**, bukan reaktif
- Test gagal berarti **pelanggaran desain**, bukan bug fungsional
- Semua test di sini **WAJIB PASS** sebelum Step 3 dianggap terimplementasi

---

## 2. Scope Test

Test ini berlaku untuk seluruh file di:

```
src/modules/reporting/**/*.{ts,tsx}
```

Kecuali:
- file test di dalam `__tests__` atau `tests/`

---

## 3. Test Group A – Boundary terhadap Domain & Application

### A1. Reporting Tidak Mengimpor Domain Modul Lain

**Given**  
Seluruh file TypeScript di `src/modules/reporting/`

**When**  
Sebuah file melakukan import dari path:
- `src/modules/sales/domain/*`
- `src/modules/inventory/domain/*`
- `src/modules/catalog/domain/*`

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting module must not depend on domain modules"

---

### A2. Reporting Tidak Mengimpor Application Modul Lain

**Given**  
Seluruh file TypeScript di `src/modules/reporting/`

**When**  
Sebuah file melakukan import dari path:
- `src/modules/sales/application/*`
- `src/modules/inventory/application/*`
- `src/modules/catalog/application/*`

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting module must not depend on application/use-case modules"

---

## 4. Test Group B – Larangan Use Case Mutasi

### B1. Reporting Tidak Memanggil Use Case Mutasi

**Given**  
Daftar use case mutasi yang dikunci pada Step 1 & 2:
- CreateOrder
- CancelOrder
- PayCredit
- AdjustStock
- ReceiveStock
- IssueStock

**When**  
Sebuah file di `src/modules/reporting/`:
- mengimpor salah satu use case di atas
- atau mengimpor file yang mengekspor use case tersebut

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting must be read-only and must not trigger mutations"

---

## 5. Test Group C – Penggunaan Prisma

### C1. Prisma Hanya Boleh Digunakan di queries/

**Given**  
Struktur modul reporting:
```
application/
queries/
dto/
```

**When**  
Sebuah file:
- berada di `application/` atau `dto/`
- dan mengimpor `@prisma/client` atau wrapper Prisma internal

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Prisma usage is restricted to reporting/queries layer"

---

### C2. Prisma Boleh Digunakan di queries/

**Given**  
File berada di `src/modules/reporting/queries/`

**When**  
File tersebut mengimpor Prisma client

**Then**  
Test **HARUS PASS**

---

## 6. Test Group D – DTO Independence

### D1. DTO Tidak Bergantung pada Domain Types

**Given**  
File berada di `src/modules/reporting/dto/`

**When**  
File tersebut mengimpor:
- enum
- type
- interface

Dari domain lain (misalnya `OrderStatus`, `StockStatus`)

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting DTO must not depend on domain types"

---

### D2. DTO Menggunakan Tipe Primitif

**Given**  
File DTO reporting

**When**  
Output DTO hanya menggunakan:
- string
- number
- boolean
- Date

**Then**  
Test **HARUS PASS**

---

## 7. Test Group E – Struktur Modul

### E1. Tidak Ada Domain Folder di Reporting

**Given**  
Struktur `src/modules/reporting/`

**When**  
Ditemukan folder bernama:
- `domain/`

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting must not define its own domain"

---

### E2. Tidak Ada Entity atau Invariant

**Given**  
File di `src/modules/reporting/`

**When**  
Terdeteksi:
- class bernama `*Entity`
- atau logic invariant (validasi state, rule bisnis)

**Then**  
Test **HARUS FAIL**

Catatan:
- Test ini bersifat heuristik
- Digunakan sebagai alarm awal, bukan pembuktian formal

---

## 8. Test Group F – Read-Only Guarantee

### F1. Reporting Tidak Menulis ke Database

**Given**  
Seluruh query reporting

**When**  
Ditemukan:
- INSERT
- UPDATE
- DELETE

Dalam query SQL atau Prisma

**Then**  
Test **HARUS FAIL** dengan pesan:
> "Reporting must be strictly read-only"

---

## 9. Status dan Konsekuensi

- Seluruh test di dokumen ini **WAJIB PASS** sebelum implementasi Step 3 dianggap valid
- Kegagalan test berarti:
  - pelanggaran boundary
  - bukan bug bisnis

---

## 10. Penutup

Architecture test ini adalah **pagar terakhir** sebelum reporting berubah menjadi domain terselubung.

Jika test ini terasa mengganggu, itu tanda pagar bekerja dengan benar.

