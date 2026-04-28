# Testing Boundary & Integration Policy

Dokumen ini menjelaskan **kebijakan resmi pengujian (testing)** pada proyek Sistem Jual Beli Terpadu.
Tujuannya adalah memastikan **logic bisnis benar, mudah dilacak, dan tidak tercemar oleh detail teknis**, sambil tetap realistis terhadap kebutuhan bisnis asli.

Dokumen ini dibuat setelah seluruh test berjalan hijau dan boundary arsitektur tervalidasi.

---

## Prinsip Utama

1. **Logic bisnis lebih penting daripada framework**  
   Framework bisa diganti. Database bisa diganti. Aturan bisnis tidak boleh ikut rusak.

2. **Setiap jenis test punya tujuan berbeda**  
   Mencampur tujuan test akan menghasilkan test yang hijau tapi bohong.

3. **Integration test mensimulasikan dunia nyata**  
   Dunia nyata selalu punya database. Melarang database di integration test adalah ilusi.

---

## Klasifikasi Test

### 1. Domain Test

**Tujuan**  
Memastikan aturan bisnis (invariants) selalu benar.

**Contoh skenario bisnis nyata**:

- Stok tidak boleh negatif
- Quantity tidak boleh nol atau negatif

**Aturan**:

- ❌ Tidak boleh import Prisma
- ❌ Tidak boleh import repository implementation
- ❌ Tidak boleh menyentuh database
- ✅ Hanya entity & value object

**Analogi bisnis**:
Kepala toko memutuskan aturan tanpa peduli pakai buku tulis atau komputer.

---

### 2. Application / Use Case Test

**Tujuan**  
Memastikan alur bisnis berjalan benar dan dependency digunakan sesuai kontrak.

**Contoh skenario bisnis nyata**:

- Create order mengurangi stok
- Cancel order mengembalikan stok

**Aturan**:

- ❌ Tidak boleh import Prisma
- ❌ Tidak boleh akses database
- ✅ Repository di-mock
- ✅ Fokus ke orkestrasi

**Analogi bisnis**:
SOP operasional kasir, tanpa melihat gudang fisik.

---

### 3. Integration Test

**Tujuan**  
Memastikan seluruh sistem bekerja sebagai satu kesatuan nyata.

**Contoh skenario bisnis nyata**:

- Order PAID → stok berkurang
- Cancel order → stok kembali
- Concurrent stock adjustment

**Aturan**:

- ✅ Boleh menggunakan Prisma
- ✅ Boleh menggunakan database test
- ❌ Tidak boleh menambahkan aturan bisnis baru

**Catatan penting**:
Integration test **bukan** tempat menulis logic bisnis.

**Analogi bisnis**:
Simulasi toko sungguhan dengan gudang, kasir, dan stok nyata.

**Catatan khusus MVP Step 3 (Reporting)**  
Modul Reporting memiliki kebijakan boundary dan architecture test yang lebih ketat dan
terdokumentasi terpisah pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

---

### 4. Architecture / Boundary Test

**Tujuan**  
 Menjaga disiplin arsitektur dan boundary antar modul agar tidak rusak seiring bertambahnya fitur.

**Yang diuji**:

- Domain tidak boleh import Prisma
- Application tidak boleh import Prisma
- Repository implementation sesuai kontrak

**Yang TIDAK diuji**:

- Integration test tidak menjadi target boundary

**Contoh boundary test yang benar**:

- Application layer tidak import PrismaClient

**Analogi bisnis**:
Audit internal untuk memastikan SOP masih dipatuhi.

**Karakteristik**

- Tidak menguji aturan bisnis
- Tidak menguji alur use case
- Kegagalan test menandakan pelanggaran desain, bukan bug fungsional

**Catatan penting**
Untuk MVP Step 3 (Reporting), aturan dan spesifikasi architecture test didefinisikan secara khusus pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

# Dependency Wiring Boundary Test Specification

**File target:** `src/tests/architecture/dependency-wiring-boundary.test.ts`  
**Type:** Architecture / Boundary Test  
**Status:** PROPOSED – NON-BREAKING  
**Scope:** Seluruh codebase production, kecuali test files

---

## 1. Tujuan

Test ini bertujuan untuk memastikan bahwa aturan wiring dependency dan container tetap konsisten dan tidak dilanggar seiring pertumbuhan fitur.

Test ini **tidak** menguji:

- aturan bisnis
- alur use case
- hasil query
- perilaku database

Test ini hanya menguji:

- lokasi instansiasi dependency
- import boundary
- kepatuhan terhadap container wiring

---

## 2. Prinsip

Architecture test ini bersifat:

- preventif
- fail-fast
- berbasis struktur import / source scanning

Kegagalan test berarti:

- pelanggaran arsitektur
- bukan bug fungsional biasa

---

## 3. Scope File yang Diperiksa

Semua file production TypeScript di:

- `src/app/**/*.{ts,tsx}`
- `src/modules/**/*.{ts,tsx}`
- `src/shared/**/*.{ts,tsx}`
- `src/wiring/**/*.{ts,tsx}`

Kecuali:

- `**/*.test.ts`
- `**/*.spec.ts`
- `**/__tests__/**`
- `**/tests/**`

---

## 4. Rule Group A — Prisma Instantiation Boundary

### A1. PrismaClient tidak boleh diinstansiasi di application layer

**Given**  
Seluruh file di `src/modules/*/application/**`

**When**  
Ditemukan pattern:

- `new PrismaClient(`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Application layer must not instantiate PrismaClient"

---

### A2. PrismaClient tidak boleh diinstansiasi di domain layer

**Given**  
Seluruh file di `src/modules/*/domain/**`

**When**  
Ditemukan pattern:

- `new PrismaClient(`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Domain layer must not instantiate PrismaClient"

---

### A3. PrismaClient tidak boleh diinstansiasi di UI / HTTP layer

**Given**  
Seluruh file di `src/app/**`

**When**  
Ditemukan pattern:

- `new PrismaClient(`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "UI / HTTP layer must not instantiate PrismaClient"

---

### A4. PrismaClient boleh ada di wiring / infrastructure yang sah

**Given**  
File berada di:

- `src/wiring/**`
- atau infrastructure yang memang menjadi lokasi implementasi teknis sah

**When**  
Ditemukan instansiasi Prisma

**Then**  
Test **HARUS PASS**

**Catatan:**  
Rule ini tidak membatalkan aturan reporting yang lebih spesifik. Jika file reporting query diwajibkan memakai shared Prisma client, rule reporting tetap menang. :contentReference[oaicite:2]{index=2}

---

## 5. Rule Group B — Repository Implementation Instantiation

### B1. Application layer tidak boleh instantiate repository implementation sendiri

**Given**  
Seluruh file di `src/modules/*/application/**`

**When**  
Ditemukan pattern seperti:

- `new Prisma...Repository(`
- `new .*Repository(` untuk implementation class dari infrastructure

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Application layer must not instantiate repository implementations"

---

### B2. Application layer tidak boleh import repository implementation dari infrastructure

**Given**  
Seluruh file di `src/modules/*/application/**`

**When**  
Ditemukan import dari path yang mengandung:

- `/infrastructure/`

dan target import adalah repository implementation

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Application layer must not depend on infrastructure repository implementations"

---

## 6. Rule Group C — UI / HTTP Layer Anti-Bypass

### C1. UI / HTTP layer tidak boleh import repository implementation

**Given**  
Seluruh file di `src/app/**`

**When**  
Ditemukan import dari path:

- `src/modules/*/infrastructure/*`
- atau alias setara yang menuju implementation repository / adapter write-side

**Then**  
Test **HARUS FAIL** dengan pesan:

> "UI / HTTP layer must not import infrastructure implementations directly"

---

### C2. UI / HTTP layer tidak boleh instantiate use case produksi langsung

**Given**  
Seluruh file di `src/app/**`

**When**  
Ditemukan pattern:

- `new CreateOrder(`
- `new CancelOrder(`
- `new PayCredit(`
- `new ReceiveStock(`
- `new AdjustStock(`
- `new IssueStock(`
- `new CreatePurchaseOrder(`
- `new CancelPurchaseOrder(`
- `new ReceivePurchaseOrder(`
- `new CreateSupplier(`
- `new UpdateSupplierStatus(`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "UI / HTTP layer must use pre-wired use cases, not instantiate them directly"

---

### C3. UI / HTTP layer tidak boleh instantiate Prisma repository

**Given**  
Seluruh file di `src/app/**`

**When**  
Ditemukan pattern:

- `new Prisma.*Repository(`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "UI / HTTP layer must not instantiate Prisma repositories"

---

## 7. Rule Group D — Cross-Module Repository Bypass

### D1. Sales application tidak boleh import Inventory infrastructure langsung

**Given**  
Seluruh file di `src/modules/sales/application/**`

**When**  
Ditemukan import dari:

- `src/modules/inventory/infrastructure/*`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Sales application must not depend directly on Inventory infrastructure"

---

### D2. Procurement application tidak boleh import Inventory infrastructure langsung

**Given**  
Seluruh file di `src/modules/procurement/application/**`

**When**  
Ditemukan import dari:

- `src/modules/inventory/infrastructure/*`

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Procurement application must not depend directly on Inventory infrastructure"

---

### D3. Dashboard dan Reporting tidak boleh import mutation-side infrastructure

**Given**  
Seluruh file di:

- `src/modules/dashboard/**`
- `src/modules/reporting/**`

**When**  
Ditemukan import repository implementation write-side dari:

- sales infrastructure
- inventory infrastructure
- procurement infrastructure

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Dashboard / Reporting must not depend on write-side infrastructure implementations"

---

## 8. Rule Group E — Container as Composition Root

### E1. Container boleh instantiate use case dan repository

**Given**  
File berada di `src/wiring/container.ts`

**When**  
Ditemukan:

- instansiasi repository implementation
- instansiasi adapter
- instansiasi use case

**Then**  
Test **HARUS PASS**

---

### E2. Container menjadi referensi komposisi utama

**Given**  
Sistem memakai dependency injection eksplisit

**When**  
Developer menambahkan wiring baru

**Then**  
Perubahan tersebut **harus** terjadi di container atau composition root yang sah, bukan tersebar ke UI atau application internals

**Catatan:**  
Ini rule governance. Implementasi test dapat berupa allowlist file untuk composition root.

---

## 9. Rule Group F — Reporting Special Case

### F1. Reporting query tetap tunduk pada rule khusus shared Prisma

**Given**  
File berada di `src/modules/reporting/queries/**`

**When**  
Ditemukan import Prisma yang tidak berasal dari shared client yang telah dikunci

**Then**  
Test **HARUS FAIL** dengan pesan:

> "Reporting queries must use the designated shared Prisma client"

**Reference:**  
Rule ini mengikuti kebijakan reporting yang lebih spesifik. :contentReference[oaicite:3]{index=3} :contentReference[oaicite:4]{index=4}

---

## 10. Teknik Implementasi yang Direkomendasikan

Test dapat diimplementasikan dengan pendekatan berikut:

1. Enumerasi file production berdasarkan glob
2. Baca source file sebagai string
3. Gunakan:
   - regex sederhana untuk pattern instansiasi
   - atau parser AST jika ingin lebih ketat
4. Fail dengan pesan yang spesifik per rule

Pendekatan minimum yang cukup untuk MVP:

- source scanning + regex
- tanpa AST penuh

Karena tujuan test ini adalah **alarm boundary**, bukan compiler replacement.

---

## 11. Contoh Pseudo-Test Skeleton

### Helper

- `listProductionFiles()`
- `readFile(filePath)`
- `expectNoMatch(files, regex, errorMessage)`
- `expectNoImportFrom(files, importPattern, errorMessage)`

---

### Pseudo Test Cases

#### test: application layer must not instantiate PrismaClient

- collect files under `src/modules/*/application/**`
- search `new PrismaClient(`
- expect no match

#### test: domain layer must not instantiate PrismaClient

- collect files under `src/modules/*/domain/**`
- search `new PrismaClient(`
- expect no match

#### test: app layer must not import infrastructure implementations

- collect files under `src/app/**`
- search imports containing `/infrastructure/`
- fail if found

#### test: procurement application must not import inventory infrastructure directly

- collect files under `src/modules/procurement/application/**`
- search imports containing `modules/inventory/infrastructure`
- fail if found

#### test: application layer must not instantiate Prisma repositories

- collect files under `src/modules/*/application/**`
- search `new Prisma.*Repository(`
- expect no match

#### test: UI must not instantiate production use cases directly

- collect files under `src/app/**`
- search `new (CreateOrder|CancelOrder|PayCredit|ReceiveStock|AdjustStock|IssueStock|CreatePurchaseOrder|CancelPurchaseOrder|ReceivePurchaseOrder|CreateSupplier|UpdateSupplierStatus)\(`
- expect no match

#### test: container may instantiate repositories and use cases

- read `src/wiring/container.ts`
- allow instantiation patterns there
- no failure

#### test: reporting queries must use designated shared Prisma client

- collect files under `src/modules/reporting/queries/**`
- verify import source equals allowed shared Prisma module
- fail otherwise

---

## 12. Kriteria Lulus

Architecture test ini dianggap lulus jika:

- tidak ada Prisma instantiation di domain/application/UI
- tidak ada repository implementation instantiation di application/UI
- tidak ada import infrastructure langsung lintas modul pada application layer
- tidak ada use case production yang diinstansiasi langsung dari UI
- reporting tetap mengikuti shared Prisma rule
- container tetap menjadi composition root yang sah

---

## 13. Kriteria Gagal

Test ini harus gagal jika ditemukan salah satu berikut:

- bypass container
- bypass port / adapter lintas modul
- Prisma bocor ke layer yang salah
- UI membangun use case sendiri
- application layer mengimpor implementation infra secara langsung

Kegagalan tersebut harus diperlakukan sebagai:

- **architecture violation**
- bukan sekadar peringatan opsional

---

## 14. Catatan Penutup

Spec ini bersifat:

- additive
- NON-BREAKING
- konsisten dengan `architecture_overview.md`
- konsisten dengan `testing_boundary_integration_policy.md`

Test ini ada untuk menjaga sistem tetap jujur terhadap boundary-nya saat codebase bertumbuh.

---

## Aturan Import Prisma (Ringkasan)

| Layer | Prisma |
|------|--------|
| Domain | ❌ |
| Application | ❌ |
| Infrastructure | ✅ |
| Integration Test | ✅ |
| Architecture Test | ❌ |

---

## Kenapa Integration Test Boleh Prisma

Karena:

- Tanpa database, concurrency bug tidak pernah muncul
- Tanpa DB nyata, rollback dan consistency tidak teruji
- Tanpa Prisma, integration test hanyalah unit test yang menyamar

**Dalam bisnis asli**:
Bug stok hampir selalu muncul karena interaksi sistem, bukan karena satu fungsi salah.

---

## Kesalahan Umum yang Sengaja Dihindari

- ❌ Melarang Prisma di semua test
- ❌ Menguji compiler (TypeScript) dengan runtime test
- ❌ Boundary test yang tidak tahu konteks layer
- ❌ Test hijau tapi tidak mencerminkan realita bisnis

---

## Prinsip Review Test

Saat mereview test, tanyakan:

1. Ini menguji **aturan bisnis**, **alur**, atau **integrasi nyata**?
2. Apakah layer yang diuji sesuai dengan dependensi yang digunakan?
3. Kalau test ini hijau, apakah aku lebih percaya sistem di production?

Kalau jawabannya tidak, test tersebut perlu diperbaiki atau dihapus.

---

## Lokasi & Referensi Dokumen

Dokumen ini **wajib direferensikan** agar keputusan arsitektural tidak hilang seiring waktu.

**Lokasi yang direkomendasikan:**

1. Salin atau pindahkan dokumen ini ke:

   ```
   /docs/testing/testing-boundary-and-integration-policy.md
   ```

2. Tambahkan referensi singkat di `README.md` proyek:

   ```md
   ### Testing Policy
   Proyek ini menerapkan kebijakan testing berlapis (domain, application, integration, dan architecture).
   Detail lengkap dapat dibaca di:
   /docs/testing/testing-boundary-and-integration-policy.md
   ```

3. Jadikan dokumen ini **acuan wajib** saat:
   - menambah jenis test baru
   - memperkenalkan database / ORM baru
   - menambah anggota tim atau AI baru

4. Untuk MVP Step 3 (Reporting), boundary dan architecture test **WAJIB** mengacu pada:
    `/docs/03-mvp/reporting-boundary-and-testing.md`

Tanpa referensi eksplisit, keputusan ini akan dianggap "opsional" dan rawan dilanggar.

---

## Penutup

Dokumen ini bukan untuk membuat sistem terlihat "bersih" di atas kertas.  
Dokumen ini ada supaya:

- Bug mudah dilacak
- Logika bisnis tidak bocor
- Sistem bisa tumbuh tanpa refactor panik

Test yang baik tidak hanya gagal saat ada bug.  
Test yang baik memberi **kepercayaan diri bisnis**.
